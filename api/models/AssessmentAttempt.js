const { DataTypes } = require("sequelize");
const sequelize = require("../db");
const User = require("./user");
const Assessment = require("./Assessment");

const AssessmentAttempt = sequelize.define("AssessmentAttempt", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  }
});

AssessmentAttempt.belongsTo(User, { foreignKey: "UserId", onDelete: "CASCADE" });
AssessmentAttempt.belongsTo(Assessment, { foreignKey: "AssessmentId", onDelete: "CASCADE" });

module.exports = AssessmentAttempt;
