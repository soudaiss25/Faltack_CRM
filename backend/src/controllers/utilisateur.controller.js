const bcrypt = require("bcryptjs");
const { Utilisateur } = require("../models");

function messageErreur(err) {
  // Sequelize renvoie souvent un message générique ("Validation error") et cache
  // le vrai détail dans err.errors[] — on va chercher le message précis là-dedans.
  if (err.name === "SequelizeUniqueConstraintError") {
    return "Cet email est déjà utilisé par un autre compte.";
  }
  return err.errors?.[0]?.message || err.message;
}

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
    console.error("Erreur création utilisateur :", err.message);
    res.status(400).json({ erreur: messageErreur(err) });
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

  try {
    await utilisateur.update({ ...(nom && { nom }), ...(role && { role }) });
    res.json({ id: utilisateur.id, nom: utilisateur.nom, email: utilisateur.email, role: utilisateur.role });
  } catch (err) {
    console.error("Erreur mise à jour utilisateur :", err.message);
    res.status(400).json({ erreur: messageErreur(err) });
  }
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