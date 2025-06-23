const Delivery = require('../models/deliveryModel');
const Deliverer = require('../models/delivererModel');

// Create Delivery
const createDelivery = async (req, res) => {
  try {
    const deliveryData = {
      ...req.body,
      createdBy: req.user.userId,
    };

    const newDelivery = await Delivery.create(deliveryData);
    await newDelivery.populate('deliverer', 'name email');
    await newDelivery.populate('createdBy', 'email');

    res.status(201).json({
      message: 'Delivery created successfully',
      delivery: newDelivery,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Order ID already exists' });
    }
    console.error('Error creating delivery:', error);
    res.status(500).json({ message: 'Error creating delivery' });
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
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (deliverer) filter.deliverer = deliverer;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

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

module.exports = {
  createDelivery,
  getAllDeliveries,
  getDeliveryById,
  updateDelivery,
  deleteDelivery,
  assignDeliverer,
  unassignDeliverer,
};
