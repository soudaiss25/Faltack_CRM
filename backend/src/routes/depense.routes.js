const express = require("express");
const router = express.Router();
const { verifierToken, appliquerPortee, reserveSuperAdmin } = require("../middleware/auth");
const ctrl = require("../controllers/depense.controller");

router.use(verifierToken);
router.use(appliquerPortee);

router.get("/depenses-cabinet", ctrl.listerCabinet);
router.post("/depenses-cabinet", reserveSuperAdmin, ctrl.creerCabinet);

router.get("/entreprises/:entrepriseId/depenses", ctrl.lister);
router.post("/entreprises/:entrepriseId/depenses", ctrl.creer);
router.delete("/depenses/:id", ctrl.supprimer);

module.exports = router;