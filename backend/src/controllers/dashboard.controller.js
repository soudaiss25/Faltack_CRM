const { Entreprise, Facture, LigneFacture, Paiement } = require("../models");
const { Op } = require("sequelize");

async function statistiques(req, res) {
  const whereEntreprise = req.portee ? { id: req.portee.entreprise_id } : {};
  const whereFacture = req.portee ? { entreprise_id: req.portee.entreprise_id } : {};

  const entreprises = await Entreprise.findAll({ where: whereEntreprise });
  const factures = await Facture.findAll({
    where: whereFacture,
    include: ["lignes", "paiements"],
  });

  // Répartition du pipeline CRM (nombre d'entreprises par statut)
  const pipeline = { PROSPECT: 0, DEVIS_ENVOYE: 0, SIGNE: 0, CLIENT_ACTIF: 0 };
  entreprises.forEach((e) => { pipeline[e.statut] = (pipeline[e.statut] || 0) + 1; });

  // CA facturé (TTC) et encaissé, + solde total dû (impayés)
  let caFacture = 0, caEncaisse = 0;
  factures.forEach((f) => {
    const ht = f.lignes.reduce((t, l) => t + Number(l.quantite) * Number(l.prix_unitaire), 0);
    const ttc = ht * (1 + Number(f.taux_tva) / 100);
    const paye = f.paiements.reduce((t, p) => t + Number(p.montant), 0);
    caFacture += ttc;
    caEncaisse += paye;
  });

  const facturesEnRetard = factures.filter(
    (f) => f.statut !== "PAYEE" && f.date_echeance && new Date(f.date_echeance) < new Date()
  ).length;

  res.json({
    pipeline,
    ca_facture: caFacture,
    ca_encaisse: caEncaisse,
    solde_du: caFacture - caEncaisse,
    nb_entreprises: entreprises.length,
    nb_factures: factures.length,
    factures_en_retard: facturesEnRetard,
  });
}

module.exports = { statistiques };
