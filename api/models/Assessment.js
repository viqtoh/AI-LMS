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
  }
});

Assessment.belongsTo(Module, { foreignKey: "ModuleId", onDelete: "CASCADE" });

module.exports = Assessment;
