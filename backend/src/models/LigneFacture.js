const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const LigneFacture = sequelize.define("LigneFacture", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  designation: { type: DataTypes.STRING, allowNull: false },
  quantite: { type: DataTypes.DECIMAL(10, 2), defaultValue: 1 },
  prix_unitaire: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
});

module.exports = LigneFacture;
