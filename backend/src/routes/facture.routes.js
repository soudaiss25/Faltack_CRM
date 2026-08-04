const express = require("express");
const router = express.Router();
const { verifierToken, appliquerPortee } = require("../middleware/auth");
const ctrl = require("../controllers/facture.controller");

router.use(verifierToken);
router.use(appliquerPortee);

router.get("/", ctrl.lister);
router.get("/:id", ctrl.obtenirUne);
router.post("/", ctrl.creer);
router.post("/:id/paiements", ctrl.enregistrerPaiement);

module.exports = router;
