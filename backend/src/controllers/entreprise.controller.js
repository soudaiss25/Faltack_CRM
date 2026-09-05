const { Entreprise, Contact, Facture } = require("../models");
const { calculerMontants, determinerStatutAffiche } = require("../utils/facturation");

async function lister(req, res) {
  const { statut } = req.query;
  const where = statut ? { statut } : {};

  if (req.portee) {
    where.id = req.portee.entreprise_id;
  }

  const entreprises = await Entreprise.findAll({ where, include: ["contacts"] });
  res.json(entreprises);
}

async function obtenirUne(req, res) {
  if (!/^\d+$/.test(req.params.id)) {
    return res.status(400).json({ erreur: "Identifiant d'entreprise invalide" });
  }
  if (req.portee && Number(req.params.id) !== req.portee.entreprise_id) {
    return res.status(403).json({ erreur: "Accès non autorisé à cette entreprise" });
  }

  try {
    const entreprise = await Entreprise.findByPk(req.params.id, {
      include: ["contacts", "interactions"],
    });
    if (!entreprise) return res.status(404).json({ erreur: "Entreprise introuvable" });

    const factures = await Facture.findAll({
      where: { entreprise_id: entreprise.id },
      include: ["lignes", "paiements"],
      order: [["date_emission", "DESC"]],
    });

    const facturesAvecMontants = factures.map((f) => {
      const montants = calculerMontants(f);
      return { ...f.toJSON(), statut: determinerStatutAffiche(f, montants), montants };
    });

    res.json({ ...entreprise.toJSON(), factures: facturesAvecMontants });
  } catch (err) {
    console.error("Erreur obtenirUne (entreprise) :", err.message);
    if (err.original) console.error("   cause originale :", err.original.message);
    res.status(500).json({ erreur: err.message || "Erreur lors du chargement de l'entreprise" });
  }
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