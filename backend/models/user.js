const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false
    }
  },
  {
    timestamps: true // Adds createdAt and updatedAt columns
  }
);

// Sync model with database (creates table if not exists)
sequelize
  .sync()
  .then(() => console.log("✅ Users table created or already exists."))
  .catch((err) => console.error("❌ Error syncing database:", err));

module.exports = User;
