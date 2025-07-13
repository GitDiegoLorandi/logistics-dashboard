const Deliverer = require('../models/delivererModel');
const Delivery = require('../models/deliveryModel');

// Create Deliverer (Admin Only)
const createDeliverer = async (req, res) => {
  try {
    console.log('Creating deliverer:', req.body.email);

    // Check if deliverer already exists
    const existingDeliverer = await Deliverer.findOne({
      email: req.body.email,
      isActive: true,
    });

    if (existingDeliverer) {
      return res
        .status(400)
        .json({ message: 'Deliverer already exists with this email' });
    }

    const deliverer = await Deliverer.create({
      ...req.body,
      createdBy: req.user.userId,
    });

    console.log('Deliverer created successfully:', deliverer._id);

    res.status(201).json({
      message: 'Deliverer created successfully',
      deliverer,
    });
  } catch (error) {
    console.error('Error creating deliverer:', error);

    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: 'Deliverer already exists with this email' });
    }

    res.status(500).json({
      message: 'Error creating deliverer',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Get All Deliverers with Pagination (Admin Only)
const getAllDeliverers = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, vehicleType, search } = req.query;

    // Build filter object
    const filter = { isActive: true };
    if (status) filter.status = status;
    if (vehicleType) filter.vehicleType = vehicleType;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: [
        {
          path: 'deliveries',
          select: 'orderId status customer createdAt',
          options: { sort: { createdAt: -1 }, limit: 5 },
        },
        { path: 'createdBy', select: 'email' },
      ],
    };

    const deliverers = await Deliverer.paginate(filter, options);
    res.status(200).json(deliverers);
  } catch (error) {
    console.error('Error fetching deliverers:', error);
    res.status(500).json({ message: 'Error fetching deliverers' });
  }
};

// Get Available Deliverers (for assignment)
const getAvailableDeliverers = async (req, res) => {
  try {
    const availableDeliverers = await Deliverer.find({
      status: 'Available',
      isActive: true,
    }).select('name email phone vehicleType status');

    res.status(200).json(availableDeliverers);
  } catch (error) {
    console.error('Error fetching available deliverers:', error);
    res.status(500).json({ message: 'Error fetching available deliverers' });
  }
};

// Get Single Deliverer
const getDelivererById = async (req, res) => {
  try {
    const deliverer = await Deliverer.findOne({
      _id: req.params.id,
      isActive: true,
    })
      .populate(
        'deliveries',
        'orderId status customer createdAt actualDeliveryDate'
      )
      .populate('createdBy', 'email');

    if (!deliverer) {
      return res.status(404).json({ message: 'Deliverer not found' });
    }

    // Add performance metrics
    const totalDeliveries = deliverer.deliveries.length;
    const completedDeliveries = deliverer.deliveries.filter(
      d => d.status === 'Delivered'
    ).length;
    const successRate =
      totalDeliveries > 0
        ? ((completedDeliveries / totalDeliveries) * 100).toFixed(2)
        : 0;

    res.status(200).json({
      ...deliverer.toObject(),
      performance: {
        totalDeliveries,
        completedDeliveries,
        successRate: parseFloat(successRate),
      },
    });
  } catch (error) {
    console.error('Error fetching deliverer:', error);
    res.status(500).json({ message: 'Error fetching deliverer' });
  }
};

// Update Deliverer (Admin Only)
const updateDeliverer = async (req, res) => {
  try {
    const updatedDeliverer = await Deliverer.findOneAndUpdate(
      { _id: req.params.id, isActive: true },
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('deliveries', 'orderId status customer');

    if (!updatedDeliverer) {
      return res.status(404).json({ message: 'Deliverer not found' });
    }

    console.log('Deliverer updated:', updatedDeliverer._id);

    res.status(200).json({
      message: 'Deliverer updated successfully',
      deliverer: updatedDeliverer,
    });
  } catch (error) {
    console.error('Error updating deliverer:', error);

    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    res.status(500).json({ message: 'Error updating deliverer' });
  }
};

// Delete Deliverer (Admin Only)
const deleteDeliverer = async (req, res) => {
  try {
    const deliverer = await Deliverer.findOne({
      _id: req.params.id,
      isActive: true,
    });

    if (!deliverer) {
      return res.status(404).json({ message: 'Deliverer not found' });
    }

    // Check if deliverer has active deliveries
    const activeDeliveries = await Delivery.countDocuments({
      deliverer: req.params.id,
      status: { $in: ['Pending', 'In Transit'] },
    });

    if (activeDeliveries > 0) {
      return res.status(400).json({
        message: `Cannot delete deliverer with ${activeDeliveries} active deliveries. Please reassign or complete them first.`,
      });
    }

    // Soft delete - mark as inactive
    await Deliverer.findByIdAndUpdate(req.params.id, {
      isActive: false,
      deletedAt: new Date(),
      email: `deleted_${Date.now()}_${deliverer.email}`, // Prevent email conflicts
    });

    // Remove deliverer reference from completed deliveries
    await Delivery.updateMany(
      { deliverer: req.params.id },
      { $unset: { deliverer: 1 } }
    );

    console.log('Deliverer deleted:', req.params.id);

    res.status(200).json({ message: 'Deliverer deleted successfully' });
  } catch (error) {
    console.error('Error deleting deliverer:', error);
    res.status(500).json({ message: 'Error deleting deliverer' });
  }
};

// Get Deliverer Performance Stats (Admin Only)
const getDelivererStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const matchCondition = { deliverer: req.params.id };
    if (startDate || endDate) {
      matchCondition.createdAt = {};
      if (startDate) matchCondition.createdAt.$gte = new Date(startDate);
      if (endDate) matchCondition.createdAt.$lte = new Date(endDate);
    }

    const stats = await Delivery.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: null,
          totalDeliveries: { $sum: 1 },
          delivered: {
            $sum: { $cond: [{ $eq: ['$status', 'Delivered'] }, 1, 0] },
          },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } },
          inTransit: {
            $sum: { $cond: [{ $eq: ['$status', 'In Transit'] }, 1, 0] },
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] },
          },
          avgDeliveryTime: {
            $avg: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$actualDeliveryDate', null] },
                    { $ne: ['$createdAt', null] },
                  ],
                },
                {
                  $divide: [
                    { $subtract: ['$actualDeliveryDate', '$createdAt'] },
                    1000 * 60 * 60 * 24, // Convert to days
                  ],
                },
                null,
              ],
            },
          },
        },
      },
    ]);

    const delivererStats = stats[0] || {
      totalDeliveries: 0,
      delivered: 0,
      pending: 0,
      inTransit: 0,
      cancelled: 0,
      avgDeliveryTime: 0,
    };

    const successRate =
      delivererStats.totalDeliveries > 0
        ? (
            (delivererStats.delivered / delivererStats.totalDeliveries) *
            100
          ).toFixed(2)
        : 0;

    res.status(200).json({
      ...delivererStats,
      successRate: parseFloat(successRate),
      avgDeliveryTime: delivererStats.avgDeliveryTime
        ? delivererStats.avgDeliveryTime.toFixed(2)
        : 0,
    });
  } catch (error) {
    console.error('Error fetching deliverer stats:', error);
    res.status(500).json({ message: 'Error fetching deliverer stats' });
  }
};

// Assign Delivery to Deliverer
const assignDeliveryToDeliverer = async (req, res) => {
  try {
    const { id: delivererId } = req.params;
    const { deliveryId } = req.body;

    if (!deliveryId) {
      return res.status(400).json({ message: 'Delivery ID is required' });
    }

    // Check if deliverer exists and is available
    const deliverer = await Deliverer.findOne({
      _id: delivererId,
      isActive: true,
    });

    if (!deliverer) {
      return res.status(404).json({ message: 'Deliverer not found' });
    }

    if (deliverer.status !== 'Available') {
      return res.status(400).json({
        message: `Deliverer is ${deliverer.status.toLowerCase()}, not available for assignment`,
      });
    }

    // Check if delivery exists and is unassigned
    const delivery = await Delivery.findOne({
      _id: deliveryId,
      status: 'Pending',
    });

    if (!delivery) {
      return res.status(404).json({
        message: 'Delivery not found or not in pending status',
      });
    }

    if (delivery.deliverer) {
      return res.status(400).json({
        message: 'Delivery is already assigned to a deliverer',
      });
    }

    // Update delivery with deliverer
    delivery.deliverer = delivererId;
    await delivery.save();

    // Update deliverer status to Busy
    deliverer.status = 'Busy';
    await deliverer.save();

    res.status(200).json({
      message: 'Delivery assigned successfully',
      deliverer: deliverer.name,
      deliveryId: delivery._id,
      orderId: delivery.orderId,
    });
  } catch (error) {
    console.error('Error assigning delivery to deliverer:', error);
    res.status(500).json({
      message: 'Error assigning delivery to deliverer',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

module.exports = {
  createDeliverer,
  getAllDeliverers,
  getAvailableDeliverers,
  getDelivererById,
  updateDeliverer,
  deleteDeliverer,
  getDelivererStats,
  assignDeliveryToDeliverer,
};
