const { Honoraire, Entreprise } = require("../models");

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
  const honoraires = await Honoraire.findAll({
    where: { entreprise_id: entreprise.id },
    order: [["date_facturation", "DESC"]],
  });
  res.json(honoraires);
}

async function creer(req, res) {
  if (req.portee) {
    return res.status(403).json({ erreur: "Action réservée au staff du cabinet" });
  }
  const entreprise = await verifierAcces(req, res, req.params.entrepriseId);
  if (!entreprise) return;
  try {
    const honoraire = await Honoraire.create({ ...req.body, entreprise_id: entreprise.id });
    res.status(201).json(honoraire);
  } catch (err) {
    console.error("Erreur création prestation :", err.message);
    res.status(400).json({ erreur: err.message });
  }
}

async function creerOccasionnel(req, res) {
  if (req.portee) {
    return res.status(403).json({ erreur: "Action réservée au staff du cabinet" });
  }
  const { nom_client_libre } = req.body;
  if (!nom_client_libre || !nom_client_libre.trim()) {
    return res.status(400).json({ erreur: "Le nom du client est obligatoire" });
  }
  try {
    const honoraire = await Honoraire.create({ ...req.body, entreprise_id: null });
    res.status(201).json(honoraire);
  } catch (err) {
    console.error("Erreur création prestation occasionnelle :", err.message);
    res.status(400).json({ erreur: err.message });
  }
}

async function listerPaiements(req, res) {
  if (req.portee) {
    return res.status(403).json({ erreur: "Accès réservé au staff du cabinet" });
  }

  const { type, montant_min, montant_max, date_debut, date_fin } = req.query;

  try {
    const tousLesHonoraires = await Honoraire.findAll({
      include: [{ model: Entreprise, attributes: ["id", "nom"] }],
      order: [["date_paiement", "DESC"]],
    });

    let resultats = tousLesHonoraires.filter((h) => h.date_paiement);

    if (type === "suivi") {
      resultats = resultats.filter((h) => h.entreprise_id !== null);
    } else if (type === "occasionnel") {
      resultats = resultats.filter((h) => h.entreprise_id === null);
    }

    if (montant_min) {
      resultats = resultats.filter((h) => Number(h.montant) >= Number(montant_min));
    }
    if (montant_max) {
      resultats = resultats.filter((h) => Number(h.montant) <= Number(montant_max));
    }
    if (date_debut) {
      resultats = resultats.filter((h) => h.date_paiement >= date_debut);
    }
    if (date_fin) {
      resultats = resultats.filter((h) => h.date_paiement <= date_fin);
    }

    const donnees = resultats.map((h) => ({
      id: h.id,
      libelle: h.libelle,
      montant: h.montant,
      date_paiement: h.date_paiement,
      nom_client: h.Entreprise?.nom || h.nom_client_libre || "Client occasionnel",
      type_client: h.entreprise_id !== null ? "suivi" : "occasionnel",
    }));

    res.json(donnees);
  } catch (err) {
    console.error("Erreur liste paiements :", err.message);
    res.status(500).json({ erreur: err.message });
  }
}

async function marquerPaye(req, res) {
  if (req.portee) {
    return res.status(403).json({ erreur: "Action réservée au staff du cabinet" });
  }
  try {
    const honoraire = await Honoraire.findByPk(req.params.id);
    if (!honoraire) return res.status(404).json({ erreur: "Prestation introuvable" });
    honoraire.date_paiement = req.body.date_paiement || new Date().toISOString().slice(0, 10);
    await honoraire.save();
    console.log(`✅ Prestation #${honoraire.id} marquée payée le ${honoraire.date_paiement}`);
    res.json(honoraire);
  } catch (err) {
    console.error("❌ Erreur marquerPaye :", err.message);
    res.status(500).json({ erreur: err.message });
  }
}

async function supprimer(req, res) {
  if (req.portee) {
    return res.status(403).json({ erreur: "Action réservée au staff du cabinet" });
  }
  try {
    const honoraire = await Honoraire.findByPk(req.params.id);
    if (!honoraire) return res.status(404).json({ erreur: "Prestation introuvable" });
    await honoraire.destroy();
    res.status(204).send();
  } catch (err) {
    console.error("❌ Erreur suppression prestation :", err.message);
    res.status(500).json({ erreur: err.message });
  }
}

module.exports = { lister, creer, creerOccasionnel, listerPaiements, marquerPaye, supprimer };