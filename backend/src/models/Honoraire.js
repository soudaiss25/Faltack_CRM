const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

/**
 * Ce que LE CABINET facture à SES clients pour ses propres prestations.
 * À ne pas confondre avec Facture (= l'activité commerciale du client lui-même).
 */
const Honoraire = sequelize.define("Honoraire", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  libelle: { type: DataTypes.STRING, allowNull: false },
  montant: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  date_facturation: { type: DataTypes.DATEONLY, allowNull: false },
  date_paiement: { type: DataTypes.DATEONLY, allowNull: true },
});

module.exports = Honoraire;