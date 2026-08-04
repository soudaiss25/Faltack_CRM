const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Facture = sequelize.define("Facture", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  numero: { type: DataTypes.STRING, allowNull: false, unique: true },
  type: {
    type: DataTypes.ENUM("DEVIS", "FACTURE"),
    defaultValue: "FACTURE",
  },
  statut: {
    type: DataTypes.ENUM("BROUILLON", "ENVOYEE", "PARTIELLEMENT_PAYEE", "PAYEE", "EN_RETARD"),
    defaultValue: "BROUILLON",
  },
  date_emission: { type: DataTypes.DATEONLY, allowNull: false },
  date_echeance: { type: DataTypes.DATEONLY, allowNull: true },
  taux_tva: { type: DataTypes.DECIMAL(5, 2), defaultValue: 20.0 },
});

module.exports = Facture;
