const express = require("express");
const router = express.Router();
const { verifierToken, appliquerPortee } = require("../middleware/auth");
const { statistiques } = require("../controllers/cabinet.controller");

router.use(verifierToken);
router.use(appliquerPortee);
router.get("/stats", statistiques);

module.exports = router;