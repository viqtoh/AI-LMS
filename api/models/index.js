const { Sequelize } = require("sequelize");
const sequelize = require("../db");

// Import models
const User = require("./user");
const Category = require("./category");
const LearningPath = require("./learningpath");
const Course = require("./course");
const Module = require("./module");
const UserProgress = require("./userProgress");

// Define junction tables (before associations)
const LearningPathCategory = sequelize.define("LearningPathCategory", {}, { timestamps: false });
const CourseCategory = sequelize.define("CourseCategory", {}, { timestamps: false });

// Define associations AFTER defining all models
Category.belongsToMany(LearningPath, { through: LearningPathCategory, foreignKey: "categoryId" });
Category.belongsToMany(Course, { through: CourseCategory, foreignKey: "categoryId" });

LearningPath.belongsToMany(Category, {
  through: LearningPathCategory,
  foreignKey: "learningPathId"
});

Course.belongsToMany(Category, { through: CourseCategory, foreignKey: "courseId" });

// Define Many-to-Many relationships
Category.belongsToMany(LearningPath, {
  through: LearningPathCategory,
  foreignKey: "categoryId"
});
Category.belongsToMany(Course, {
  through: CourseCategory,
  foreignKey: "categoryId"
});

Course.belongsToMany(Category, {
  through: CourseCategory,
  foreignKey: "courseId"
});

// Create an object to store models
const db = {
  sequelize,
  Sequelize,
  User,
  LearningPath,
  Course,
  UserProgress,
  Module,
  Category,
  LearningPathCategory,
  CourseCategory
};

// Sync database
sequelize
  .sync({ alter: true })
  .then(() => {
    console.log("Database synchronized successfully.");
  })
  .catch((error) => {
    console.error("Error synchronizing the database:", error);
  });

module.exports = db;
