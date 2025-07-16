const Delivery = require('../models/deliveryModel');
const Deliverer = require('../models/delivererModel');

// Create Delivery
const createDelivery = async (req, res) => {
  try {
    console.log('Creating delivery - Request body:', req.body);
    console.log('Creating delivery - User info:', req.user);
    console.log('Creating delivery - Headers:', req.headers);
    
    // Generate a unique Order ID
    const today = new Date();
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const randomPart = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
    const orderId = `ORD-${dateStr}-${randomPart}`;
    console.log('Generated orderId:', orderId);

    // Force status to be "Pending" for new deliveries
    const deliveryData = {
      ...req.body,
      orderId,
      status: 'Pending', // Always set status to Pending for new deliveries
    };
    
    // Handle createdBy field - only add if it's a valid MongoDB ObjectId
    if (req.user && (req.user.userId || req.user.id)) {
      const userId = req.user.userId || req.user.id;
      if (/^[0-9a-fA-F]{24}$/.test(userId)) {
        deliveryData.createdBy = userId;
      } else {
        console.log('Warning: User ID is not a valid MongoDB ObjectId, skipping createdBy field');
      }
    } else {
      console.log('Warning: No user info in request, skipping createdBy field');
    }

    console.log('Final delivery data to be created:', deliveryData);

    // Validate required fields
    if (!deliveryData.customer) {
      console.log('Validation error: Customer name is required');
      return res.status(400).json({
        message: 'Validation failed',
        errors: [{ field: 'customer', message: 'Customer name is required' }],
      });
    }

    if (!deliveryData.deliveryAddress) {
      console.log('Validation error: Delivery address is required');
      return res.status(400).json({
        message: 'Validation failed',
        errors: [
          { field: 'deliveryAddress', message: 'Delivery address is required' },
        ],
      });
    }

    // Validate estimated delivery date is in the future
    if (deliveryData.estimatedDeliveryDate) {
      const estimatedDate = new Date(deliveryData.estimatedDeliveryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison

      if (estimatedDate < today) {
        console.log('Validation error: Estimated delivery date must be in the future');
        return res.status(400).json({
          message: 'Validation failed',
          errors: [
            {
              field: 'estimatedDeliveryDate',
              message: 'Estimated delivery date must be in the future',
            },
          ],
        });
      }
    }

    console.log('Creating delivery with data:', deliveryData);

    try {
      const newDelivery = await Delivery.create(deliveryData);
      console.log('Created delivery:', newDelivery);

      await newDelivery.populate('deliverer', 'name email');
      await newDelivery.populate('createdBy', 'email');

      res.status(201).json({
        message: 'Delivery created successfully',
        delivery: newDelivery,
      });
    } catch (validationError) {
      console.error('Validation error creating delivery:', validationError);

      if (validationError.name === 'ValidationError') {
        // Handle mongoose validation errors
        const errors = [];

        // Format validation errors
        Object.keys(validationError.errors).forEach(field => {
          errors.push({
            field,
            message:
              validationError.errors[field].message ||
              `Invalid value for ${field}`,
          });
          console.log(`Validation error for field ${field}:`, validationError.errors[field].message);
        });

        return res.status(400).json({
          message: 'Validation failed',
          errors,
        });
      }

      if (validationError.code === 11000) {
        // Handle duplicate key error (likely duplicate orderId)
        console.log('Duplicate key error:', validationError);
        return res.status(400).json({
          message: 'A delivery with this Order ID already exists',
          errors: [{ field: 'orderId', message: 'Order ID must be unique' }],
        });
      }

      throw validationError; // Re-throw for the outer catch
    }
  } catch (error) {
    console.error('Error creating delivery:', error);
    res.status(500).json({
      message: 'Error creating delivery',
      errors: [
        { field: 'general', message: error.message || 'Unknown server error' },
      ],
    });
  }
};

// Get All Deliveries with pagination and filtering
const getAllDeliveries = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      deliverer,
      startDate,
      endDate,
    } = req.query;

    // Build filter object
    const filter = {};

    // Add role-based filtering
    if (req.user.role === 'user') {
      // Regular users can only see their own deliveries
      // Handle both possible field names for user ID
      const userId = req.user.userId || req.user.id;
      filter.createdBy = userId;
      console.log(
        `Filtering deliveries for user ${userId}, role: ${req.user.role}`
      );
    }

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (deliverer) filter.deliverer = deliverer;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    console.log('Fetching deliveries with filter:', filter);

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: [
        { path: 'deliverer', select: 'name email' },
        { path: 'createdBy', select: 'email' },
      ],
    };

    const deliveries = await Delivery.paginate(filter, options);
    console.log(
      `Found ${deliveries.docs.length} deliveries out of ${deliveries.totalDocs} total`
    );

    res.status(200).json(deliveries);
  } catch (error) {
    console.error('Error fetching deliveries:', error);
    res.status(500).json({ message: 'Error fetching deliveries' });
  }
};

// Get single delivery by ID
const getDeliveryById = async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id)
      .populate('deliverer', 'name email phone')
      .populate('createdBy', 'email');

    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    res.status(200).json(delivery);
  } catch (error) {
    console.error('Error fetching delivery:', error);
    res.status(500).json({ message: 'Error fetching delivery' });
  }
};

// Update a Delivery by ID
const updateDelivery = async (req, res) => {
  try {
    // Auto-set actual delivery date when status changes to "Delivered"
    if (req.body.status === 'Delivered' && !req.body.actualDeliveryDate) {
      req.body.actualDeliveryDate = new Date();
    }

    const updatedDelivery = await Delivery.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('deliverer', 'name email')
      .populate('createdBy', 'email');

    if (!updatedDelivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    res.status(200).json({
      message: 'Delivery updated successfully',
      delivery: updatedDelivery,
    });
  } catch (error) {
    console.error('Error updating delivery:', error);
    res.status(500).json({ message: 'Error updating delivery' });
  }
};

// Delete a Delivery by ID
const deleteDelivery = async (req, res) => {
  try {
    const deletedDelivery = await Delivery.findByIdAndDelete(req.params.id);
    if (!deletedDelivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    // Remove delivery reference from deliverer
    if (deletedDelivery.deliverer) {
      await Deliverer.findByIdAndUpdate(deletedDelivery.deliverer, {
        $pull: { deliveries: req.params.id },
      });
    }

    res.status(200).json({ message: 'Delivery deleted successfully' });
  } catch (error) {
    console.error('Error deleting delivery:', error);
    res.status(500).json({ message: 'Error deleting delivery' });
  }
};

// Get available (unassigned) deliveries
const getAvailableDeliveries = async (req, res) => {
  try {
    // Find deliveries that are in Pending status and have no deliverer assigned
    const availableDeliveries = await Delivery.find({
      status: 'Pending',
      deliverer: { $exists: false },
    })
      .select(
        'orderId status priority customer deliveryAddress estimatedDeliveryDate createdAt'
      )
      .sort({ createdAt: -1 });

    console.log(`Found ${availableDeliveries.length} available deliveries`);

    res.status(200).json(availableDeliveries);
  } catch (error) {
    console.error('Error fetching available deliveries:', error);
    res.status(500).json({ message: 'Error fetching available deliveries' });
  }
};

// Assign deliverer to delivery
const assignDeliverer = async (req, res) => {
  try {
    const { delivererId } = req.body;

    // Find and validate deliverer
    const deliverer = await Deliverer.findOne({
      _id: delivererId,
      isActive: true,
    });

    if (!deliverer) {
      return res.status(404).json({ message: 'Deliverer not found' });
    }

    // Check if deliverer is available
    if (deliverer.status !== 'Available') {
      return res.status(400).json({
        message: `Deliverer is currently ${deliverer.status.toLowerCase()}. Only available deliverers can be assigned.`,
      });
    }

    // Find the delivery
    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    // Check if delivery is already assigned
    if (delivery.deliverer) {
      return res.status(400).json({
        message:
          'Delivery is already assigned to a deliverer. Please unassign first if you want to reassign.',
      });
    }

    // Update delivery with deliverer and change status
    const updatedDelivery = await Delivery.findByIdAndUpdate(
      req.params.id,
      {
        deliverer: delivererId,
        // Change status from "Pending" to "In Transit" when assigned
        ...(delivery.status === 'Pending' && { status: 'In Transit' }),
      },
      { new: true }
    ).populate('deliverer', 'name email phone status');

    // Update deliverer status to "Busy" and add delivery to their array
    if (!deliverer.deliveries.includes(delivery._id)) {
      deliverer.deliveries.push(delivery._id);
    }
    deliverer.status = 'Busy';
    await deliverer.save();

    console.log(
      `✅ Deliverer ${deliverer.name} assigned to delivery ${delivery.orderId}`
    );
    console.log(
      `📦 Delivery status: ${delivery.status} → ${updatedDelivery.status}`
    );
    console.log(`🚚 Deliverer status: Available → ${deliverer.status}`);

    res.status(200).json({
      message: 'Deliverer assigned successfully',
      delivery: updatedDelivery,
      statusChanges: {
        delivery: {
          from: delivery.status,
          to: updatedDelivery.status,
        },
        deliverer: {
          from: 'Available',
          to: deliverer.status,
        },
      },
    });
  } catch (error) {
    console.error('Error assigning deliverer:', error);
    res.status(500).json({ message: 'Error assigning deliverer' });
  }
};

// Remove deliverer from delivery
const unassignDeliverer = async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id).populate(
      'deliverer',
      'name'
    );
    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    if (!delivery.deliverer) {
      return res
        .status(400)
        .json({ message: 'Delivery is not assigned to any deliverer' });
    }

    const previousDelivererId = delivery.deliverer._id;
    const delivererName = delivery.deliverer.name;

    // Update delivery: remove deliverer and revert status if needed
    const updatedDelivery = await Delivery.findByIdAndUpdate(
      req.params.id,
      {
        $unset: { deliverer: 1 },
        // Change status back to "Pending" if it was "In Transit"
        ...(delivery.status === 'In Transit' && { status: 'Pending' }),
      },
      { new: true }
    );

    // Update deliverer: remove delivery from array and check if should be available
    const deliverer = await Deliverer.findById(previousDelivererId);
    if (deliverer) {
      // Remove this delivery from deliverer's array
      deliverer.deliveries = deliverer.deliveries.filter(
        d => d.toString() !== delivery._id.toString()
      );

      // Check if deliverer has other active deliveries
      const activeDeliveries = await Delivery.countDocuments({
        deliverer: previousDelivererId,
        status: { $in: ['Pending', 'In Transit'] },
      });

      // If no active deliveries, set status back to Available
      if (activeDeliveries === 0) {
        deliverer.status = 'Available';
      }

      await deliverer.save();

      console.log(
        `❌ Deliverer ${delivererName} unassigned from delivery ${delivery.orderId}`
      );
      console.log(
        `📦 Delivery status: ${delivery.status} → ${updatedDelivery.status}`
      );
      console.log(
        `🚚 Deliverer status: Busy → ${deliverer.status} (${activeDeliveries} active deliveries remaining)`
      );
    }

    res.status(200).json({
      message: 'Deliverer unassigned successfully',
      delivery: updatedDelivery,
      statusChanges: {
        delivery: {
          from: delivery.status,
          to: updatedDelivery.status,
        },
        deliverer: {
          from: 'Busy',
          to: deliverer?.status || 'Unknown',
        },
      },
    });
  } catch (error) {
    console.error('Error unassigning deliverer:', error);
    res.status(500).json({ message: 'Error unassigning deliverer' });
  }
};

// Update delivery status
const updateDeliveryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Find the delivery
    const delivery = await Delivery.findById(id).populate('deliverer', 'name');

    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    // Check if user has permission (admin or creator of the delivery)
    if (
      req.user.role !== 'admin' &&
      delivery.createdBy.toString() !== req.user.id
    ) {
      return res
        .status(403)
        .json({
          message: 'You do not have permission to update this delivery',
        });
    }

    // Prevent changing status to In Transit or Delivered if no deliverer assigned
    if (
      (status === 'In Transit' || status === 'Delivered') &&
      !delivery.deliverer
    ) {
      return res.status(400).json({
        message: `Cannot change status to ${status}. A deliverer must be assigned first.`,
        currentStatus: delivery.status,
      });
    }

    // Auto-set actual delivery date when status changes to "Delivered"
    const updateData = {
      status,
      ...(status === 'Delivered' &&
        !delivery.actualDeliveryDate && { actualDeliveryDate: new Date() }),
    };

    // Update the delivery
    const updatedDelivery = await Delivery.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate('deliverer', 'name email status');

    // If delivery is marked as delivered and has a deliverer, update deliverer status
    if (status === 'Delivered' && updatedDelivery.deliverer) {
      const Deliverer = require('../models/delivererModel');
      await Deliverer.findByIdAndUpdate(updatedDelivery.deliverer._id, {
        status: 'Available',
      });
      console.log(
        `Updated deliverer ${updatedDelivery.deliverer.name} status to Available`
      );
    }

    console.log(
      `Updated delivery ${delivery.orderId} status from ${delivery.status} to ${status}`
    );

    res.status(200).json({
      message: 'Delivery status updated successfully',
      delivery: updatedDelivery,
    });
  } catch (error) {
    console.error('Error updating delivery status:', error);
    res.status(500).json({ message: 'Error updating delivery status' });
  }
};

module.exports = {
  createDelivery,
  getAllDeliveries,
  getDeliveryById,
  updateDelivery,
  deleteDelivery,
  assignDeliverer,
  unassignDeliverer,
  updateDeliveryStatus,
  getAvailableDeliveries,
};
