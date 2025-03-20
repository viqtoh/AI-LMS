const { Sequelize } = require("sequelize");
const sequelize = require("../db"); // Import DB connection

// Import models
const User = require("./user");

// Sync all models (creates tables if they don't exist)
sequelize
  .sync()
  .then(() => console.log("✅ Database & tables created!"))
  .catch((err) => console.error("❌ Error syncing database:", err));

module.exports = { sequelize, User }; // Export Sequelize instance & models
