const { Sequelize } = require("sequelize");
const sequelize = require("../db");

// Import models
const User = require("./user");
const Category = require("./category");
const LearningPath = require("./learningpath");
const Course = require("./course");
const Module = require("./module");
const UserProgress = require("./userProgress");
const LearningPathCourse = require("./learningpathcourse");

// Define junction tables (before associations)
const LearningPathCategory = sequelize.define("LearningPathCategory", {}, { timestamps: false });
const CourseCategory = sequelize.define("CourseCategory", {}, { timestamps: false });

// Define Many-to-Many associations (Only Once)
Category.belongsToMany(LearningPath, { through: LearningPathCategory, foreignKey: "categoryId" });
LearningPath.belongsToMany(Category, {
  through: LearningPathCategory,
  foreignKey: "learningPathId"
});

Category.belongsToMany(Course, { through: CourseCategory, foreignKey: "categoryId" });
Course.belongsToMany(Category, { through: CourseCategory, foreignKey: "courseId" });

LearningPath.belongsToMany(Course, {
  through: LearningPathCourse,
  foreignKey: "learningPathId"
});

Course.belongsToMany(LearningPath, {
  through: LearningPathCourse,
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
    console.log("✅ Database synchronized successfully.");
  })
  .catch((error) => {
    console.log("❌ Database synchronization failed:", error);
  });

module.exports = db;
