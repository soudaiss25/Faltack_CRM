const { Entreprise, Facture, Depense } = require("../models");
const { calculerMontants } = require("../utils/facturation");
const { genererDiagnostic } = require("../utils/diagnostic");

async function analyse(req, res) {
  const entrepriseId = req.params.id;

  if (req.portee && Number(entrepriseId) !== req.portee.entreprise_id) {
    return res.status(403).json({ erreur: "Accès non autorisé à cette entreprise" });
  }

  const entreprise = await Entreprise.findByPk(entrepriseId);
  if (!entreprise) return res.status(404).json({ erreur: "Entreprise introuvable" });

  const factures = await Facture.findAll({
    where: { entreprise_id: entrepriseId },
    include: ["lignes", "paiements"],
  });
  const depenses = await Depense.findAll({ where: { entreprise_id: entrepriseId } });

  let caFacture = 0, caEncaisse = 0;
  factures.forEach((f) => {
    const montants = calculerMontants(f);
    caFacture += montants.montantTTC;
    caEncaisse += montants.totalPaye;
  });

  const totalDepenses = depenses.reduce((t, d) => t + Number(d.montant), 0);
  const marge = caEncaisse - totalDepenses;
  const soldeDu = caFacture - caEncaisse;

  const depensesParCategorie = {};
  depenses.forEach((d) => {
    depensesParCategorie[d.categorie] = (depensesParCategorie[d.categorie] || 0) + Number(d.montant);
  });

  const evolutionMensuelle = construireEvolutionMensuelle(factures, depenses);

  const delaisPaiement = [];
  factures.forEach((f) => {
    f.paiements.forEach((p) => {
      const delai = (new Date(p.date_paiement) - new Date(f.date_emission)) / (1000 * 60 * 60 * 24);
      if (!Number.isNaN(delai)) delaisPaiement.push(delai);
    });
  });
  const delaiMoyenPaiementJours = delaisPaiement.length
    ? delaisPaiement.reduce((t, d) => t + d, 0) / delaisPaiement.length
    : null;

  let tauxMarge = null;
  if (caEncaisse > 0) tauxMarge = (marge / caEncaisse) * 100;
  else if (totalDepenses > 0) tauxMarge = -100;

  const tauxImpaye = caFacture > 0 ? (soldeDu / caFacture) * 100 : null;

  const derniersMois = evolutionMensuelle.slice(-2);
  let evolutionCaPct = null;
  if (derniersMois.length === 2 && derniersMois[0].encaisse > 0) {
    evolutionCaPct = ((derniersMois[1].encaisse - derniersMois[0].encaisse) / derniersMois[0].encaisse) * 100;
  }

  let categorieDominante = null;
  const entreesCategories = Object.entries(depensesParCategorie);
  if (entreesCategories.length > 0 && totalDepenses > 0) {
    const [cle, montant] = entreesCategories.sort((a, b) => b[1] - a[1])[0];
    categorieDominante = { label: cle, part: (montant / totalDepenses) * 100 };
  }

  const diagnostic = genererDiagnostic({ tauxMarge, tauxImpaye, delaiMoyenPaiementJours, evolutionCaPct, categorieDominante });

  res.json({
    ca_facture: caFacture,
    ca_encaisse: caEncaisse,
    solde_du: soldeDu,
    total_depenses: totalDepenses,
    marge,
    depenses_par_categorie: depensesParCategorie,
    evolution_mensuelle: evolutionMensuelle,
    nb_factures: factures.length,
    nb_depenses: depenses.length,
    taux_marge: tauxMarge,
    taux_impaye: tauxImpaye,
    delai_moyen_paiement_jours: delaiMoyenPaiementJours,
    evolution_ca_pct: evolutionCaPct,
    diagnostic,
  });
}

function construireEvolutionMensuelle(factures, depenses) {
  const mois = [];
  const maintenant = new Date();

  for (let i = 5; i >= 0; i--) {
    const date = new Date(maintenant.getFullYear(), maintenant.getMonth() - i, 1);
    mois.push({
      cle: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      label: date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }),
      encaisse: 0,
      depenses: 0,
    });
  }

  const trouverMois = (dateStr) => {
    const d = new Date(dateStr);
    const cle = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return mois.find((m) => m.cle === cle);
  };

  factures.forEach((f) => {
    f.paiements.forEach((p) => {
      const m = trouverMois(p.date_paiement);
      if (m) m.encaisse += Number(p.montant);
    });
  });

  depenses.forEach((d) => {
    const m = trouverMois(d.date_depense);
    if (m) m.depenses += Number(d.montant);
  });

  return mois;
}

module.exports = { analyse };