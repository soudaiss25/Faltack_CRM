const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Depense = sequelize.define("Depense", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  libelle: { type: DataTypes.STRING, allowNull: false },
  categorie: {
    type: DataTypes.ENUM("LOYER", "SALAIRES", "ACHATS", "MARKETING", "FOURNITURES", "TRANSPORT", "AUTRE"),
    defaultValue: "AUTRE",
  },
  montant: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  date_depense: { type: DataTypes.DATEONLY, allowNull: false },
});

module.exports = Depense;