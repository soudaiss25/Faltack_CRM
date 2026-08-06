const express = require("express");
const router = express.Router();
const { verifierToken, appliquerPortee } = require("../middleware/auth");
const ctrl = require("../controllers/contact.controller");

router.use(verifierToken);
router.use(appliquerPortee);

router.get("/entreprises/:entrepriseId/contacts", ctrl.lister);
router.post("/entreprises/:entrepriseId/contacts", ctrl.creer);

router.delete("/contacts/:id", ctrl.supprimer);


module.exports = router;