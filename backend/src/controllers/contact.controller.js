const { Contact, Entreprise } = require("../models");

/**
 * Vérifie que l'entreprise ciblée existe, et que si l'utilisateur est un CLIENT,
 * il ne peut agir que sur SA propre entreprise (même logique que les autres controllers).
 */
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
  const contacts = await Contact.findAll({ where: { entreprise_id: entreprise.id } });
  res.json(contacts);
}

async function creer(req, res) {
  const entreprise = await verifierAcces(req, res, req.params.entrepriseId);
  if (!entreprise) return;
  try {
    const contact = await Contact.create({ ...req.body, entreprise_id: entreprise.id });
    res.status(201).json(contact);
  } catch (err) {
    res.status(400).json({ erreur: err.message });
  }
}

async function supprimer(req, res) {
  const contact = await Contact.findByPk(req.params.id);
  if (!contact) return res.status(404).json({ erreur: "Contact introuvable" });

  if (req.portee && contact.entreprise_id !== req.portee.entreprise_id) {
    return res.status(403).json({ erreur: "Accès non autorisé" });
  }
  await contact.destroy();
  res.status(204).send();
}

module.exports = { lister, creer, supprimer };