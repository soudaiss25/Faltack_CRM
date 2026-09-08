const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

/**
 * Un document administratif lié à une entreprise (contrat, justificatif...).
 * Le fichier lui-même n'est PAS stocké en base : seul son chemin dans le
 * Storage Supabase (`chemin_stockage`) l'est. Historique des versions géré
 * simplement : un nouvel envoi du même nom_fichier incrémente `version`,
 * l'ancienne version reste en base (pas supprimée).
 */
const Document = sequelize.define("Document", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nom_fichier: { type: DataTypes.STRING, allowNull: false },
  chemin_stockage: { type: DataTypes.STRING, allowNull: false },
  taille: { type: DataTypes.INTEGER, allowNull: false },
  type_mime: { type: DataTypes.STRING, allowNull: true },
  categorie: {
    type: DataTypes.ENUM("CONTRAT", "JUSTIFICATIF", "COURRIER", "AUTRE"),
    defaultValue: "AUTRE",
  },
  version: { type: DataTypes.INTEGER, defaultValue: 1 },
});

module.exports = Document;