const { Entreprise, Facture, LigneFacture, Paiement, Depense } = require("../models");
const { Op } = require("sequelize");

function construireFiltres(req) {
  const entrepriseId = req.portee ? req.portee.entreprise_id : req.query.entreprise_id;
  const { date_debut, date_fin } = req.query;

  const whereEntreprise = entrepriseId ? { id: entrepriseId } : {};
  const whereFactureBase = entrepriseId ? { entreprise_id: entrepriseId } : {};

  const bornesDate = {};
  if (date_debut) bornesDate[Op.gte] = date_debut;
  if (date_fin) bornesDate[Op.lte] = date_fin;
  const aUneBorne = Boolean(date_debut || date_fin);

  return { entrepriseId, whereEntreprise, whereFactureBase, bornesDate, aUneBorne };
}

async function statistiques(req, res) {
  const { whereEntreprise, whereFactureBase, bornesDate, aUneBorne } = construireFiltres(req);

  const entreprises = await Entreprise.findAll({ where: whereEntreprise });
  const pipeline = { PROSPECT: 0, DEVIS_ENVOYE: 0, SIGNE: 0, CLIENT_ACTIF: 0 };
  entreprises.forEach((e) => { pipeline[e.statut] = (pipeline[e.statut] || 0) + 1; });

  const facturesEmises = await Facture.findAll({
    where: { ...whereFactureBase, ...(aUneBorne ? { date_emission: bornesDate } : {}) },
    include: ["lignes"],
  });
  const caFacture = facturesEmises.reduce((total, f) => {
    const ht = f.lignes.reduce((t, l) => t + Number(l.quantite) * Number(l.prix_unitaire), 0);
    return total + ht * (1 + Number(f.taux_tva) / 100);
  }, 0);

  const paiementsPeriode = await Paiement.findAll({
    where: aUneBorne ? { date_paiement: bornesDate } : {},
    include: [{ model: Facture, where: whereFactureBase, attributes: [] }],
  });
  const caEncaisse = paiementsPeriode.reduce((t, p) => t + Number(p.montant), 0);

  const whereDepense = whereFactureBase.entreprise_id ? { entreprise_id: whereFactureBase.entreprise_id } : {};
  const depensesPeriode = await Depense.findAll({
    where: { ...whereDepense, ...(aUneBorne ? { date_depense: bornesDate } : {}) },
  });
  const totalDepenses = depensesPeriode.reduce((t, d) => t + Number(d.montant), 0);

  const toutesFactures = await Facture.findAll({ where: whereFactureBase, include: ["lignes", "paiements"] });
  const facturesEnRetard = toutesFactures.filter((f) => {
    const ht = f.lignes.reduce((t, l) => t + Number(l.quantite) * Number(l.prix_unitaire), 0);
    const ttc = ht * (1 + Number(f.taux_tva) / 100);
    const paye = f.paiements.reduce((t, p) => t + Number(p.montant), 0);
    return paye < ttc && f.date_echeance && new Date(f.date_echeance) < new Date();
  }).length;

  res.json({
    pipeline,
    ca_facture: caFacture,
    ca_encaisse: caEncaisse,
    total_depenses: totalDepenses,
    marge: caEncaisse - totalDepenses,
    solde_du: caFacture - caEncaisse,
    nb_entreprises: entreprises.length,
    nb_factures: facturesEmises.length,
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