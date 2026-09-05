const bcrypt = require("bcryptjs");
const { Utilisateur } = require("../models");

async function lister(req, res) {
  const utilisateurs = await Utilisateur.findAll({
    attributes: { exclude: ["mot_de_passe_hash"] },
    order: [["nom", "ASC"]],
  });
  res.json(utilisateurs);
}

async function creer(req, res) {
  try {
    const { nom, email, mot_de_passe, role } = req.body;
    if (!["SUPER_ADMIN", "COLLABORATEUR"].includes(role)) {
      return res.status(400).json({ erreur: "Rôle invalide pour un compte du cabinet" });
    }
    const hash = await bcrypt.hash(mot_de_passe, 10);
    const utilisateur = await Utilisateur.create({ nom, email, mot_de_passe_hash: hash, role });
    res.status(201).json({ id: utilisateur.id, nom: utilisateur.nom, email: utilisateur.email, role: utilisateur.role });
  } catch (err) {
    res.status(400).json({ erreur: err.message });
  }
}

async function mettreAJour(req, res) {
  const utilisateur = await Utilisateur.findByPk(req.params.id);
  if (!utilisateur) return res.status(404).json({ erreur: "Utilisateur introuvable" });

  const { nom, role } = req.body;
  if (role && !["SUPER_ADMIN", "COLLABORATEUR"].includes(role)) {
    return res.status(400).json({ erreur: "Rôle invalide" });
  }
  if (utilisateur.id === req.utilisateur.id && role && role !== "SUPER_ADMIN") {
    return res.status(400).json({ erreur: "Vous ne pouvez pas retirer vos propres droits de super admin" });
  }

  await utilisateur.update({ ...(nom && { nom }), ...(role && { role }) });
  res.json({ id: utilisateur.id, nom: utilisateur.nom, email: utilisateur.email, role: utilisateur.role });
}

async function supprimer(req, res) {
  if (Number(req.params.id) === req.utilisateur.id) {
    return res.status(400).json({ erreur: "Vous ne pouvez pas supprimer votre propre compte" });
  }
  const utilisateur = await Utilisateur.findByPk(req.params.id);
  if (!utilisateur) return res.status(404).json({ erreur: "Utilisateur introuvable" });
  await utilisateur.destroy();
  res.status(204).send();
}

module.exports = { lister, creer, mettreAJour, supprimer };