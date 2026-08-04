const jwt = require("jsonwebtoken");

function verifierToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ erreur: "Token manquant" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.utilisateur = payload; // { id, email, role }
    next();
  } catch (err) {
    return res.status(401).json({ erreur: "Token invalide ou expiré" });
  }
}

// Réservé aux super admins (ex: gestion des utilisateurs du cabinet)
function reserveSuperAdmin(req, res, next) {
  if (req.utilisateur?.role !== "SUPER_ADMIN") {
    return res.status(403).json({ erreur: "Accès réservé au super administrateur" });
  }
  next();
}

/**
 * Le coeur du multi-tenant : calcule ce que l'utilisateur connecté a le droit
 * de voir, et l'attache à req.portee pour que les controllers l'utilisent.
 *
 * - Staff cabinet (SUPER_ADMIN / COLLABORATEUR) -> portee = null -> voit tout
 * - CLIENT -> portee = { entreprise_id: X } -> restreint à SA SEULE entreprise
 *
 * On calcule ça une seule fois ici plutôt que de réécrire le "if role === CLIENT"
 * dans chaque controller : si demain on ajoute un nouveau rôle restreint,
 * on ne modifie qu'un seul endroit.
 */
function appliquerPortee(req, res, next) {
  const { role, entreprise_id } = req.utilisateur;

  if (role === "CLIENT") {
    if (!entreprise_id) {
      return res.status(403).json({ erreur: "Ce compte client n'est rattaché à aucune entreprise" });
    }
    req.portee = { entreprise_id };
  } else {
    req.portee = null; // pas de restriction : vue globale du cabinet
  }
  next();
}

module.exports = { verifierToken, reserveSuperAdmin, appliquerPortee };
