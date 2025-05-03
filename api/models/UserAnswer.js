const { DataTypes } = require("sequelize");
const sequelize = require("../db");
const AssessmentAttempt = require("./AssessmentAttempt");
const Question = require("./Question");
const Option = require("./Option");

const UserAnswer = sequelize.define("UserAnswer", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  }
});

UserAnswer.belongsTo(AssessmentAttempt, { foreignKey: "AttemptId", onDelete: "CASCADE" });
UserAnswer.belongsTo(Question, { foreignKey: "QuestionId", onDelete: "CASCADE" });
UserAnswer.belongsTo(Option, { foreignKey: "OptionId", onDelete: "CASCADE" });

module.exports = UserAnswer;
