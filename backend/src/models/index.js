const sequelize = require("../config/database");
const Utilisateur = require("./Utilisateur");
const Entreprise = require("./Entreprise");
const Contact = require("./Contact");
const Facture = require("./Facture");
const LigneFacture = require("./LigneFacture");
const Paiement = require("./Paiement");

// --- Entreprise <-> Contact : une entreprise a plusieurs interlocuteurs ---
Entreprise.hasMany(Contact, { foreignKey: "entreprise_id", as: "contacts" });
Contact.belongsTo(Entreprise, { foreignKey: "entreprise_id" });

// --- Entreprise <-> Facture : une entreprise a plusieurs devis/factures ---
Entreprise.hasMany(Facture, { foreignKey: "entreprise_id", as: "factures" });
Facture.belongsTo(Entreprise, { foreignKey: "entreprise_id" });

// --- Facture <-> LigneFacture : une facture a plusieurs lignes ---
Facture.hasMany(LigneFacture, { foreignKey: "facture_id", as: "lignes" });
LigneFacture.belongsTo(Facture, { foreignKey: "facture_id" });

// --- Facture <-> Paiement : une facture peut avoir plusieurs paiements (partiels) ---
Facture.hasMany(Paiement, { foreignKey: "facture_id", as: "paiements" });
Paiement.belongsTo(Facture, { foreignKey: "facture_id" });

// --- Utilisateur <-> Entreprise : qui gère/a créé cette fiche (staff cabinet) ---
Utilisateur.hasMany(Entreprise, { foreignKey: "cree_par_id", as: "entreprises_creees" });
Entreprise.belongsTo(Utilisateur, { foreignKey: "cree_par_id", as: "cree_par" });

// --- Utilisateur (role CLIENT) <-> Entreprise : l'entreprise à laquelle ce compte a accès ---
Entreprise.hasMany(Utilisateur, { foreignKey: "entreprise_id", as: "utilisateurs_client" });
Utilisateur.belongsTo(Entreprise, { foreignKey: "entreprise_id", as: "entreprise" });

module.exports = {
  sequelize,
  Utilisateur,
  Entreprise,
  Contact,
  Facture,
  LigneFacture,
  Paiement,
};
