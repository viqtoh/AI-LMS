const fs = require("fs");
const path = require("path");
const { Sequelize } = require("sequelize");
const { sequelize } = require("../db");

// Create a container for models
const db = {
  sequelize,
  Sequelize
};

// Dynamically import all models in the folder
fs.readdirSync(__dirname)
  .filter((file) => file !== "index.js" && file.endsWith(".js"))
  .forEach((file) => {
    const model = require(path.join(__dirname, file));
    const name = model.name || path.basename(file, ".js");
    db[name] = model;
    sequelize.models[name] = model;
  });

// Define junction tables manually (if needed separately)
const LearningPathCategory = sequelize.define("LearningPathCategory", {}, { timestamps: false });
const CourseCategory = sequelize.define("CourseCategory", {}, { timestamps: false });

db.LearningPathCategory = LearningPathCategory;
db.CourseCategory = CourseCategory;

// Associations
const {
  User,
  Category,
  LearningPath,
  Course,
  Module,
  UserProgress,
  LearningPathCourse,
  UserModuleProgress,
  Assessment,
  Question,
  Option,
  AttemptQuestion,
  AssessmentAttempt,
  UserAnswer,
  LoginActivity
} = db;

// Many-to-Many
Category.belongsToMany(LearningPath, { through: LearningPathCategory, foreignKey: "categoryId" });
LearningPath.belongsToMany(Category, {
  through: LearningPathCategory,
  foreignKey: "learningPathId"
});

Category.belongsToMany(Course, { through: CourseCategory, foreignKey: "categoryId" });
Course.belongsToMany(Category, { through: CourseCategory, foreignKey: "courseId" });

LearningPath.belongsToMany(Course, { through: LearningPathCourse, foreignKey: "learningPathId" });
Course.belongsToMany(LearningPath, { through: LearningPathCourse, foreignKey: "courseId" });

// One-to-Many, One-to-One
UserModuleProgress.belongsTo(User, { foreignKey: "userId", onDelete: "CASCADE" });
User.hasMany(UserModuleProgress, { foreignKey: "userId" });

UserModuleProgress.belongsTo(Module, { foreignKey: "moduleId", onDelete: "CASCADE" });
Module.hasMany(UserModuleProgress, { foreignKey: "moduleId" });

Assessment.hasMany(AssessmentAttempt);
User.hasMany(AssessmentAttempt);

Module.hasOne(Assessment, { foreignKey: "moduleId", onDelete: "CASCADE" });

Question.hasMany(Option);
Assessment.hasMany(Question);

AssessmentAttempt.hasMany(UserAnswer);
AttemptQuestion.hasMany(UserAnswer);
Option.hasMany(UserAnswer);

Question.belongsToMany(AssessmentAttempt, { through: AttemptQuestion, foreignKey: "questionId" });
AssessmentAttempt.belongsToMany(Question, { through: AttemptQuestion, foreignKey: "AttemptId" });

AttemptQuestion.belongsTo(Question, { foreignKey: "QuestionId" });
Question.hasMany(AttemptQuestion, { foreignKey: "QuestionId" });

LoginActivity.belongsTo(User, { foreignKey: "userId", onDelete: "CASCADE" });
User.hasMany(LoginActivity, { foreignKey: "userId" });

// Final sync
sequelize
  .sync({ alter: true })
  .then(() => {
    console.log("✅ Database synchronized successfully.");
    console.log("Models:", Object.keys(db));
  })
  .catch((error) => {
    console.log("❌ Database synchronization failed:", error);
  });

module.exports = db;
