const express = require("express");
const router = express.Router();
const { verifierToken, appliquerPortee } = require("../middleware/auth");
const { analyse } = require("../controllers/analyse.controller");

router.use(verifierToken);
router.use(appliquerPortee);

router.get("/entreprises/:id/analyse", analyse);

module.exports = router;