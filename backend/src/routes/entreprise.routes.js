const express = require("express");
const router = express.Router();
const { verifierToken, appliquerPortee } = require("../middleware/auth");
const ctrl = require("../controllers/entreprise.controller");

router.use(verifierToken); // toutes les routes CRM nécessitent d'être connecté
router.use(appliquerPortee); // calcule si l'utilisateur est restreint à une seule entreprise

router.get("/", ctrl.lister);
router.get("/:id", ctrl.obtenirUne);
router.post("/", ctrl.creer);
router.put("/:id", ctrl.mettreAJour);
router.post("/:id/convertir", ctrl.convertir);

module.exports = router;
