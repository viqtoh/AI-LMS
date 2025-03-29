const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Category = sequelize.define(
  "Category",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    }
  },
  {
    timestamps: true // Adds createdAt and updatedAt columns
  }
);

Category.associate = (models) => {
  Category.belongsToMany(require("./learningPath"), {
    through: "LearningPathCategory",
    foreignKey: "categoryId"
  });
  Category.belongsToMany(require("./course"), {
    through: "CourseCategory",
    foreignKey: "categoryId"
  });
};

module.exports = Category;
