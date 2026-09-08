const sequelize = require("../config/database");
const Utilisateur = require("./Utilisateur");
const Entreprise = require("./Entreprise");
const Contact = require("./Contact");
const Facture = require("./Facture");
const LigneFacture = require("./LigneFacture");
const Paiement = require("./Paiement");
const Interaction = require("./Interaction");
const Depense = require("./Depense");
const Honoraire = require("./Honoraire");
const Document = require("./Document");

Entreprise.hasMany(Contact, { foreignKey: "entreprise_id", as: "contacts" });
Contact.belongsTo(Entreprise, { foreignKey: "entreprise_id" });

Entreprise.hasMany(Facture, { foreignKey: "entreprise_id", as: "factures" });
Facture.belongsTo(Entreprise, { foreignKey: "entreprise_id" });

Facture.hasMany(LigneFacture, { foreignKey: "facture_id", as: "lignes" });
LigneFacture.belongsTo(Facture, { foreignKey: "facture_id" });

Facture.hasMany(Paiement, { foreignKey: "facture_id", as: "paiements" });
Paiement.belongsTo(Facture, { foreignKey: "facture_id" });

Utilisateur.hasMany(Entreprise, { foreignKey: "cree_par_id", as: "entreprises_creees" });
Entreprise.belongsTo(Utilisateur, { foreignKey: "cree_par_id", as: "cree_par" });

Entreprise.hasMany(Utilisateur, { foreignKey: "entreprise_id", as: "utilisateurs_client" });
Utilisateur.belongsTo(Entreprise, { foreignKey: "entreprise_id", as: "entreprise" });

Entreprise.hasMany(Interaction, { foreignKey: "entreprise_id", as: "interactions" });
Interaction.belongsTo(Entreprise, { foreignKey: "entreprise_id" });

Utilisateur.hasMany(Interaction, { foreignKey: "cree_par_id", as: "interactions_creees" });
Interaction.belongsTo(Utilisateur, { foreignKey: "cree_par_id", as: "cree_par" });

Entreprise.hasMany(Depense, { foreignKey: "entreprise_id", as: "depenses" });
Depense.belongsTo(Entreprise, { foreignKey: "entreprise_id" });

Entreprise.hasMany(Honoraire, { foreignKey: "entreprise_id", as: "honoraires" });
Honoraire.belongsTo(Entreprise, { foreignKey: "entreprise_id" });

Entreprise.hasMany(Document, { foreignKey: "entreprise_id", as: "documents" });
Document.belongsTo(Entreprise, { foreignKey: "entreprise_id" });

Utilisateur.hasMany(Document, { foreignKey: "televerse_par_id", as: "documents_televerses" });
Document.belongsTo(Utilisateur, { foreignKey: "televerse_par_id", as: "televerse_par" });

module.exports = {
  sequelize,
  Utilisateur,
  Entreprise,
  Contact,
  Facture,
  LigneFacture,
  Paiement,
  Interaction,
  Depense,
  Honoraire,
  Document,
};