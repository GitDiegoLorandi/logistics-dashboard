const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const deliveryRoutes = require("./routes/deliveryRoutes"); // Import delivery routes

dotenv.config();  // Load environment variables

connectDB();  // Connect to MongoDB

const app = express();
app.use(express.json());

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong" });
});

// Use the routes
app.use("/api/deliveries", deliveryRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

