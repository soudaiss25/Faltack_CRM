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

  const pipeline = { PROSPECT: 0, DEVIS_ENVOYE: 0, SIGNE: 0, CLIENT_ACTIF: 0 };
  entreprises.forEach((e) => { pipeline[e.statut] = (pipeline[e.statut] || 0) + 1; });

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

async function journal(req, res) {
  const whereFacture = req.portee ? { entreprise_id: req.portee.entreprise_id } : {};

  const factures = await Facture.findAll({
    where: whereFacture,
    include: [
      { model: Entreprise, attributes: ["id", "nom"] },
      { association: "paiements" },
    ],
  });

  const lignes = factures.flatMap((f) =>
    f.paiements.map((p) => ({
      id: p.id,
      montant: Number(p.montant),
      date_paiement: p.date_paiement,
      moyen: p.moyen,
      facture_numero: f.numero,
      entreprise_nom: f.Entreprise?.nom || "—",
    }))
  );

  lignes.sort((a, b) => new Date(b.date_paiement) - new Date(a.date_paiement));

  const total = lignes.reduce((t, l) => t + l.montant, 0);

  res.json({ lignes, total });
}

module.exports = { statistiques, journal };