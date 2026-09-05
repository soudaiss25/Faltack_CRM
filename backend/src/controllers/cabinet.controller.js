const { Entreprise, Honoraire, Depense } = require("../models");

async function statistiques(req, res) {
  if (req.portee) {
    return res.status(403).json({ erreur: "Accès réservé au staff du cabinet" });
  }

  const { date_debut, date_fin } = req.query;
  const dansPeriode = (date) => (!date_debut || date >= date_debut) && (!date_fin || date <= date_fin);

  const tousLesHonoraires = await Honoraire.findAll({
    include: [{ model: Entreprise, attributes: ["id", "nom"] }],
  });

  const honorairesFactures = tousLesHonoraires.filter((h) => dansPeriode(h.date_facturation));
  const totalFactures = honorairesFactures.reduce((t, h) => t + Number(h.montant), 0);

  const honorairesEncaisses = tousLesHonoraires.filter((h) => h.date_paiement && dansPeriode(h.date_paiement));
  const totalEncaisses = honorairesEncaisses.reduce((t, h) => t + Number(h.montant), 0);

  // Client suivi (fiche entreprise existante) vs client occasionnel (nom libre, sans suivi CRM)
  const totalHonorairesSuivis = honorairesFactures
    .filter((h) => h.entreprise_id !== null)
    .reduce((t, h) => t + Number(h.montant), 0);
  const totalHonorairesOccasionnels = honorairesFactures
    .filter((h) => h.entreprise_id === null)
    .reduce((t, h) => t + Number(h.montant), 0);

  const toutesLesDepenses = await Depense.findAll({ where: { entreprise_id: null } });
  const depensesPeriode = toutesLesDepenses.filter((d) => dansPeriode(d.date_depense));
  const totalDepensesInternes = depensesPeriode.reduce((t, d) => t + Number(d.montant), 0);

  const parClient = {};
  honorairesFactures.forEach((h) => {
    const nom = h.Entreprise?.nom || h.nom_client_libre || "Client occasionnel";
    parClient[nom] = (parClient[nom] || 0) + Number(h.montant);
  });
  const topClients = Object.entries(parClient)
    .map(([nom, montant]) => ({ nom, montant }))
    .sort((a, b) => b.montant - a.montant)
    .slice(0, 5);

  const parCategorie = {};
  depensesPeriode.forEach((d) => {
    parCategorie[d.categorie] = (parCategorie[d.categorie] || 0) + Number(d.montant);
  });

  res.json({
    honoraires_factures: totalFactures,
    honoraires_encaisses: totalEncaisses,
    honoraires_suivis: totalHonorairesSuivis,
    honoraires_occasionnels: totalHonorairesOccasionnels,
    total_depenses_internes: totalDepensesInternes,
    marge_cabinet: totalEncaisses - totalDepensesInternes,
    top_clients: topClients,
    depenses_par_categorie: parCategorie,
    nb_honoraires: honorairesFactures.length,
  });
}

module.exports = { statistiques };