const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Utilisateur } = require("../models");

async function inscription(req, res) {
  try {
    const { nom, email, mot_de_passe, role } = req.body;
    const hash = await bcrypt.hash(mot_de_passe, 10);
    const utilisateur = await Utilisateur.create({
      nom,
      email,
      mot_de_passe_hash: hash,
      role: role || "COLLABORATEUR",
    });
    res.status(201).json({ id: utilisateur.id, nom: utilisateur.nom, email: utilisateur.email });
  } catch (err) {
    res.status(400).json({ erreur: err.message });
  }
}

async function connexion(req, res) {
  try {
    const { email, mot_de_passe } = req.body;
    const utilisateur = await Utilisateur.findOne({ where: { email } });
    if (!utilisateur) {
      return res.status(401).json({ erreur: "Identifiants invalides" });
    }
    const motDePasseValide = await bcrypt.compare(mot_de_passe, utilisateur.mot_de_passe_hash);
    if (!motDePasseValide) {
      return res.status(401).json({ erreur: "Identifiants invalides" });
    }
    const token = jwt.sign(
      {
        id: utilisateur.id,
        email: utilisateur.email,
        role: utilisateur.role,
        entreprise_id: utilisateur.entreprise_id, // null pour le staff cabinet, rempli pour un CLIENT
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );
    res.json({
      token,
      utilisateur: { id: utilisateur.id, nom: utilisateur.nom, role: utilisateur.role, entreprise_id: utilisateur.entreprise_id },
    });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
}

module.exports = { inscription, connexion };
