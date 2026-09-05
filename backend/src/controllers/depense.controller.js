const { Depense, Entreprise } = require("../models");

async function verifierAcces(req, res, entrepriseId) {
  if (req.portee && Number(entrepriseId) !== req.portee.entreprise_id) {
    res.status(403).json({ erreur: "Accès non autorisé à cette entreprise" });
    return null;
  }
  const entreprise = await Entreprise.findByPk(entrepriseId);
  if (!entreprise) {
    res.status(404).json({ erreur: "Entreprise introuvable" });
    return null;
  }
  return entreprise;
}

async function lister(req, res) {
  const entreprise = await verifierAcces(req, res, req.params.entrepriseId);
  if (!entreprise) return;
  const depenses = await Depense.findAll({
    where: { entreprise_id: entreprise.id },
    order: [["date_depense", "DESC"]],
  });
  res.json(depenses);
}

async function creer(req, res) {
  const entreprise = await verifierAcces(req, res, req.params.entrepriseId);
  if (!entreprise) return;
  try {
    const depense = await Depense.create({ ...req.body, entreprise_id: entreprise.id });
    res.status(201).json(depense);
  } catch (err) {
    res.status(400).json({ erreur: err.message });
  }
}

async function supprimer(req, res) {
  const depense = await Depense.findByPk(req.params.id);
  if (!depense) return res.status(404).json({ erreur: "Dépense introuvable" });

  if (req.portee && depense.entreprise_id !== req.portee.entreprise_id) {
    return res.status(403).json({ erreur: "Accès non autorisé" });
  }
  await depense.destroy();
  res.status(204).send();
}

async function listerCabinet(req, res) {
  if (req.portee) {
    return res.status(403).json({ erreur: "Accès réservé au staff du cabinet" });
  }
  const depenses = await Depense.findAll({
    where: { entreprise_id: null },
    order: [["date_depense", "DESC"]],
  });
  res.json(depenses);
}

async function creerCabinet(req, res) {
  if (req.portee) {
    return res.status(403).json({ erreur: "Accès réservé au staff du cabinet" });
  }
  try {
    const depense = await Depense.create({ ...req.body, entreprise_id: null });
    res.status(201).json(depense);
  } catch (err) {
    res.status(400).json({ erreur: err.message });
  }
}

module.exports = { lister, creer, supprimer, listerCabinet, creerCabinet };