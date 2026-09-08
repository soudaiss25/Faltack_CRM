const express = require("express");
const router = express.Router();
const multer = require("multer");
const { verifierToken, appliquerPortee } = require("../middleware/auth");
const ctrl = require("../controllers/document.controller");

// Fichiers gardés en mémoire (pas sur disque) le temps de les transférer vers Supabase
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } }); // 15 Mo max

router.use(verifierToken);
router.use(appliquerPortee);

router.get("/entreprises/:entrepriseId/documents", ctrl.lister);
router.get("/entreprises/:entrepriseId/documents/:nomFichier/versions", ctrl.listerVersions);
router.post("/entreprises/:entrepriseId/documents", upload.single("fichier"), ctrl.televerser);
router.get("/documents/:id/telecharger", ctrl.telecharger);
router.delete("/documents/:id", ctrl.supprimer);

module.exports = router;