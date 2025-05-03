const { DataTypes } = require("sequelize");
const sequelize = require("../db");
const Module = require("./module");

const Assessment = sequelize.define("Assessment", {
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
    type: DataTypes.STRING,
    allowNull: true
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
});

Assessment.belongsTo(Module, { foreignKey: "ModuleId", onDelete: "CASCADE" });

module.exports = Assessment;
