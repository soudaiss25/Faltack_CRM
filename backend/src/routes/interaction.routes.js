const express = require("express");
const router = express.Router();
const { verifierToken, appliquerPortee } = require("../middleware/auth");
const ctrl = require("../controllers/interaction.controller");

router.use(verifierToken);
router.use(appliquerPortee);

router.get("/entreprises/:entrepriseId/interactions", ctrl.lister);
router.post("/entreprises/:entrepriseId/interactions", ctrl.creer);

module.exports = router;