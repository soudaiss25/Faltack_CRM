const { Entreprise, Contact } = require("../models");

async function lister(req, res) {
  const { statut } = req.query; // permet de filtrer /entreprises?statut=PROSPECT
  const where = statut ? { statut } : {};

  // Portée client : on force le filtre sur sa seule entreprise, quoi qu'il demande
  if (req.portee) {
    where.id = req.portee.entreprise_id;
  }

  const entreprises = await Entreprise.findAll({ where, include: ["contacts"] });
  res.json(entreprises);
}

async function obtenirUne(req, res) {
  // Un client qui tente d'appeler /entreprises/<un autre id> se fait bloquer ici
  if (req.portee && Number(req.params.id) !== req.portee.entreprise_id) {
    return res.status(403).json({ erreur: "Accès non autorisé à cette entreprise" });
  }

  const entreprise = await Entreprise.findByPk(req.params.id, {
    include: ["contacts", "factures"],
  });
  if (!entreprise) return res.status(404).json({ erreur: "Entreprise introuvable" });
  res.json(entreprise);
}

async function creer(req, res) {
  if (req.portee) {
    return res.status(403).json({ erreur: "Action réservée au staff du cabinet" });
  }
  try {
    const entreprise = await Entreprise.create({
      ...req.body,
      cree_par_id: req.utilisateur.id,
    });
    res.status(201).json(entreprise);
  } catch (err) {
    res.status(400).json({ erreur: err.message });
  }
}

async function mettreAJour(req, res) {
  if (req.portee) {
    return res.status(403).json({ erreur: "Action réservée au staff du cabinet" });
  }
  const entreprise = await Entreprise.findByPk(req.params.id);
  if (!entreprise) return res.status(404).json({ erreur: "Entreprise introuvable" });
  await entreprise.update(req.body);
  res.json(entreprise);
}

/**
 * L'action "un clic" demandée dans le cahier des charges :
 * fait avancer une entreprise dans le pipeline commercial.
 * POST /entreprises/:id/convertir  { statut: "SIGNE" }
 */
async function convertir(req, res) {
  if (req.portee) {
    return res.status(403).json({ erreur: "Action réservée au staff du cabinet" });
  }
  const entreprise = await Entreprise.findByPk(req.params.id);
  if (!entreprise) return res.status(404).json({ erreur: "Entreprise introuvable" });

  const ordrePipeline = ["PROSPECT", "DEVIS_ENVOYE", "SIGNE", "CLIENT_ACTIF"];
  const { statut } = req.body;
  if (!ordrePipeline.includes(statut)) {
    return res.status(400).json({ erreur: "Statut invalide" });
  }
  entreprise.statut = statut;
  await entreprise.save();
  res.json(entreprise);
}

module.exports = { lister, obtenirUne, creer, mettreAJour, convertir };
