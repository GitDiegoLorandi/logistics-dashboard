const deliveries = []; // Mock in-memory storage for deliveries

// GET /api/deliveries
const getDeliveries = (req, res) => {
  res.status(200).json(deliveries);
};

// POST /api/deliveries
const addDelivery = (req, res) => {
  const { orderId, status, customer } = req.body;
  const newDelivery = { orderId, status, customer, id: deliveries.length + 1 };
  deliveries.push(newDelivery);
  res.status(201).json(newDelivery);
};

module.exports = { getDeliveries, addDelivery };
