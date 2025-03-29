const { Sequelize } = require("sequelize");
const sequelize = require("../db"); // Import DB connection

// Import models
const User = require("./user");
const Category = require("./category");
const LearningPath = require("./learningPath");
const Course = require("./course");
const Module = require("./module");
const UserProgress = require("./userProgress");

// Create an object to store models
const db = {
  sequelize,
  Sequelize,
  User,
  LearningPath,
  Course,
  UserProgress,
  Module,
  Category
};

// Run associations if they exist
Object.values(db).forEach((model) => {
  if (model.associate) {
    model.associate(db);
  }
});

sequelize
  .sync({ alter: true })
  .then(() => {
    console.log("Database synchronized successfully.");
  })
  .catch((error) => {
    console.error("Error synchronizing the database:", error);
  });

module.exports = db;
// Sync all models with the database
