const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

/**
 * C'est le pivot du CRM : une Entreprise commence en PROSPECT
 * et avance dans le pipeline jusqu'à CLIENT_ACTIF.
 * Le statut, c'est littéralement le "tunnel de vente" du cahier des charges.
 */
const Entreprise = sequelize.define("Entreprise", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nom: { type: DataTypes.STRING, allowNull: false },
  siret: { type: DataTypes.STRING, allowNull: true },
  adresse: { type: DataTypes.STRING, allowNull: true },
  statut: {
    type: DataTypes.ENUM("PROSPECT", "DEVIS_ENVOYE", "SIGNE", "CLIENT_ACTIF"),
    defaultValue: "PROSPECT",
  },
  notes: { type: DataTypes.TEXT, allowNull: true },
});

module.exports = Entreprise;
