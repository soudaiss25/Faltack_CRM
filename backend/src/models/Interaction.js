const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Interaction = sequelize.define("Interaction", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  type: {
    type: DataTypes.ENUM("NOTE", "APPEL", "EMAIL", "TACHE"),
    defaultValue: "NOTE",
  },
  contenu: { type: DataTypes.TEXT, allowNull: false },
  fait_le: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
});

module.exports = Interaction;