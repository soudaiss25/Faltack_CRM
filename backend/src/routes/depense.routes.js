const express = require("express");
const router = express.Router();
const { verifierToken, appliquerPortee } = require("../middleware/auth");
const ctrl = require("../controllers/depense.controller");
router.get("/depenses-cabinet", ctrl.listerCabinet);
router.post("/depenses-cabinet", ctrl.creerCabinet);

router.use(verifierToken);
router.use(appliquerPortee);

router.get("/entreprises/:entrepriseId/depenses", ctrl.lister);
router.post("/entreprises/:entrepriseId/depenses", ctrl.creer);
router.delete("/depenses/:id", ctrl.supprimer);

module.exports = router;