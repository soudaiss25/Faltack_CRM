const express = require("express");
const router = express.Router();
const { verifierToken, appliquerPortee } = require("../middleware/auth");
const ctrl = require("../controllers/honoraire.controller");

router.use(verifierToken);
router.use(appliquerPortee);

router.get("/entreprises/:entrepriseId/honoraires", ctrl.lister);
router.post("/entreprises/:entrepriseId/honoraires", ctrl.creer);
router.post("/honoraires/occasionnel", ctrl.creerOccasionnel);
router.get("/honoraires/paiements", ctrl.listerPaiements);
router.post("/honoraires/:id/marquer-paye", ctrl.marquerPaye);
router.delete("/honoraires/:id", ctrl.supprimer);

module.exports = router;