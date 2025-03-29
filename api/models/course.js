const { DataTypes } = require("sequelize");
const sequelize = require("../db");
const LearningPath = require("./learningPath");
const Category = require("./category");

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

Course.associate = (models) => {
  Course.belongsTo(models.LearningPath, { foreignKey: "learningPathId", onDelete: "CASCADE" });
  Course.belongsToMany(Category, { through: "CourseCategory", foreignKey: "courseId" });
};

module.exports = Course;
