const { Document, Entreprise, Utilisateur } = require("../models");
const supabase = require("../config/storage");

const BUCKET = "documents";

// Bug classique de multer : un nom de fichier avec accents arrive souvent mal
// décodé (lu en "latin1" au lieu d'"utf8"). Cette fonction corrige ça avant
// qu'on utilise le nom, que ce soit pour l'affichage ou le stockage.
function corrigerEncodageNom(nom) {
  return Buffer.from(nom, "latin1").toString("utf8");
}

// Supabase Storage refuse les accents et caractères spéciaux dans les chemins.
// On nettoie uniquement le chemin technique — le nom affiché à l'écran
// (nom_fichier, en base) garde lui les accents et espaces d'origine.
function nettoyerNomPourStockage(nom) {
  return nom
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // enlève les accents (é -> e)
    .replace(/[^a-zA-Z0-9.\-_]/g, "_"); // remplace tout le reste (espaces, &, etc.) par _
}

async function verifierAcces(req, res, entrepriseId) {
  if (req.portee && Number(entrepriseId) !== req.portee.entreprise_id) {
    res.status(403).json({ erreur: "Accès non autorisé à cette entreprise" });
    return null;
  }
  const entreprise = await Entreprise.findByPk(entrepriseId);
  if (!entreprise) {
    res.status(404).json({ erreur: "Entreprise introuvable" });
    return null;
  }
  return entreprise;
}

async function lister(req, res) {
  const entreprise = await verifierAcces(req, res, req.params.entrepriseId);
  if (!entreprise) return;

  const tousLesDocuments = await Document.findAll({
    where: { entreprise_id: entreprise.id },
    include: [{ model: Utilisateur, as: "televerse_par", attributes: ["id", "nom"] }],
    order: [["createdAt", "DESC"]],
  });

  const dernieresVersions = new Map();
  for (const doc of tousLesDocuments) {
    const existant = dernieresVersions.get(doc.nom_fichier);
    if (!existant || doc.version > existant.version) {
      dernieresVersions.set(doc.nom_fichier, doc);
    }
  }

  res.json(Array.from(dernieresVersions.values()));
}

async function listerVersions(req, res) {
  const entreprise = await verifierAcces(req, res, req.params.entrepriseId);
  if (!entreprise) return;

  const versions = await Document.findAll({
    where: { entreprise_id: entreprise.id, nom_fichier: req.params.nomFichier },
    include: [{ model: Utilisateur, as: "televerse_par", attributes: ["id", "nom"] }],
    order: [["version", "DESC"]],
  });
  res.json(versions);
}

async function televerser(req, res) {
  const entreprise = await verifierAcces(req, res, req.params.entrepriseId);
  if (!entreprise) return;

  if (!req.file) {
    return res.status(400).json({ erreur: "Aucun fichier reçu" });
  }

  try {
    const nomOriginal = corrigerEncodageNom(req.file.originalname);

    const versionPrecedente = await Document.findOne({
      where: { entreprise_id: entreprise.id, nom_fichier: nomOriginal },
      order: [["version", "DESC"]],
    });
    const nouvelleVersion = versionPrecedente ? versionPrecedente.version + 1 : 1;

    const nomFichierPropre = nettoyerNomPourStockage(nomOriginal);
    const cheminStockage = `entreprise_${entreprise.id}/${Date.now()}_${nomFichierPropre}`;

    const { error } = await supabase.storage.from(BUCKET).upload(cheminStockage, req.file.buffer, {
      contentType: req.file.mimetype,
    });
    if (error) throw error;

    const document = await Document.create({
      entreprise_id: entreprise.id,
      nom_fichier: nomOriginal,
      chemin_stockage: cheminStockage,
      taille: req.file.size,
      type_mime: req.file.mimetype,
      categorie: req.body.categorie || "AUTRE",
      version: nouvelleVersion,
      televerse_par_id: req.utilisateur.id,
    });

    res.status(201).json(document);
  } catch (err) {
    console.error("Erreur téléversement document :", err.message);
    res.status(500).json({ erreur: "Échec du téléversement : " + err.message });
  }
}

async function telecharger(req, res) {
  const document = await Document.findByPk(req.params.id);
  if (!document) return res.status(404).json({ erreur: "Document introuvable" });

  if (req.portee && document.entreprise_id !== req.portee.entreprise_id) {
    return res.status(403).json({ erreur: "Accès non autorisé" });
  }

  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(document.chemin_stockage, 60);
  if (error) return res.status(500).json({ erreur: "Impossible de générer le lien de téléchargement" });

  res.json({ url: data.signedUrl });
}

async function supprimer(req, res) {
  if (req.portee) {
    return res.status(403).json({ erreur: "Action réservée au staff du cabinet" });
  }
  const document = await Document.findByPk(req.params.id);
  if (!document) return res.status(404).json({ erreur: "Document introuvable" });

  await supabase.storage.from(BUCKET).remove([document.chemin_stockage]);
  await document.destroy();
  res.status(204).send();
}

module.exports = { lister, listerVersions, televerser, telecharger, supprimer };