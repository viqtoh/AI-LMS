const User = require("./user");
const Course = require("./course");
const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const UserProgress = sequelize.define(
  "UserProgress",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    progress: {
      type: DataTypes.INTEGER, // Example: 50% completion
      allowNull: false,
      defaultValue: 0
    }
  },
  { timestamps: true }
);

UserProgress.belongsTo(User, { foreignKey: "userId", onDelete: "CASCADE" });
UserProgress.belongsTo(Course, { foreignKey: "courseId", onDelete: "CASCADE" });

module.exports = UserProgress;
