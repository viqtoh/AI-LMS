const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Course = sequelize.define(
  "Course",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    order: {
      type: DataTypes.INTEGER, // Order in the learning path
      allowNull: false
    }
  },
  { timestamps: true }
);

module.exports = Course;
