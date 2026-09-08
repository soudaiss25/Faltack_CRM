const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Utilisateur = sequelize.define("Utilisateur", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nom: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  mot_de_passe_hash: { type: DataTypes.STRING, allowNull: false },
  telephone: { type: DataTypes.STRING, allowNull: true },
  adresse: { type: DataTypes.STRING, allowNull: true },
  role: {
    type: DataTypes.ENUM("SUPER_ADMIN", "COLLABORATEUR", "CLIENT"),
    defaultValue: "COLLABORATEUR",
  },
  entreprise_id: {
    // Rempli uniquement si role = CLIENT : cet utilisateur ne verra que cette entreprise
    type: DataTypes.INTEGER,
    allowNull: true,
  },
});

module.exports = Utilisateur;