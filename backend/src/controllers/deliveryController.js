const deliveries = []; // Temporary in-memory storage for deliveries

// Get all deliveries
const getDeliveries = (req, res) => {
  res.status(200).json(deliveries); // Return all deliveries
};

// Add a new delivery
const addDelivery = (req, res) => {
  const { orderId, status, customer } = req.body; // Extract data from request body
  const newDelivery = { orderId, status, customer, id: deliveries.length + 1 };
  deliveries.push(newDelivery); // Save the new delivery
  res.status(201).json(newDelivery); // Respond with the new delivery
};

module.exports = { getDeliveries, addDelivery };
