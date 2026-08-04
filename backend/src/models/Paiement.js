const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

/**
 * Le paiement peut être PARTIEL : une facture de 1000€ peut recevoir
 * plusieurs paiements de 400€ + 600€. C'est en additionnant tous les
 * paiements liés à une facture qu'on sait si elle est soldée ou non
 * (logique dans facture.controller.js, pas ici).
 */
const Paiement = sequelize.define("Paiement", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  montant: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  date_paiement: { type: DataTypes.DATEONLY, allowNull: false },
  moyen: {
    type: DataTypes.ENUM("VIREMENT", "CHEQUE", "ESPECES", "CARTE", "PRELEVEMENT"),
    allowNull: false,
  },
});

module.exports = Paiement;
