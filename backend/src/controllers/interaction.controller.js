const { Interaction, Entreprise } = require("../models");

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
  const interactions = await Interaction.findAll({
    where: { entreprise_id: entreprise.id },
    include: [{ association: "cree_par", attributes: ["id", "nom"] }],
    order: [["fait_le", "DESC"], ["id", "DESC"]],
  });
  res.json(interactions);
}

async function creer(req, res) {
  if (req.portee) {
    return res.status(403).json({ erreur: "Action réservée au staff du cabinet" });
  }
  const entreprise = await verifierAcces(req, res, req.params.entrepriseId);
  if (!entreprise) return;
  try {
    const interaction = await Interaction.create({
      ...req.body,
      entreprise_id: entreprise.id,
      cree_par_id: req.utilisateur.id,
    });
    res.status(201).json(interaction);
  } catch (err) {
    res.status(400).json({ erreur: err.message });
  }
}

module.exports = { lister, creer };