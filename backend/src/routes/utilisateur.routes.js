const express = require("express");
const router = express.Router();
const { verifierToken, reserveSuperAdmin } = require("../middleware/auth");
const ctrl = require("../controllers/utilisateur.controller");

router.use(verifierToken);
router.use(reserveSuperAdmin);

router.get("/", ctrl.lister);
router.post("/", ctrl.creer);
router.put("/:id", ctrl.mettreAJour);
router.delete("/:id", ctrl.supprimer);

module.exports = router;