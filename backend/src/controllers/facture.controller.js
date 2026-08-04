const { Facture, LigneFacture, Paiement, Entreprise } = require("../models");

/**
 * Génère un numéro de facture auto (ex: FAC-2026-0001).
 * Simple mais suffisant pour la démo : compte les factures de l'année en cours.
 */
async function genererNumero(type) {
  const annee = new Date().getFullYear();
  const prefixe = type === "DEVIS" ? "DEV" : "FAC";
  const count = await Facture.count({ where: { type } });
  return `${prefixe}-${annee}-${String(count + 1).padStart(4, "0")}`;
}

// Calcule montant HT, TVA, TTC et solde restant dû à partir des lignes + paiements
function calculerMontants(facture) {
  const montantHT = facture.lignes.reduce(
    (total, ligne) => total + Number(ligne.quantite) * Number(ligne.prix_unitaire),
    0
  );
  const montantTVA = montantHT * (Number(facture.taux_tva) / 100);
  const montantTTC = montantHT + montantTVA;
  const totalPaye = facture.paiements.reduce((total, p) => total + Number(p.montant), 0);
  const soldeDu = montantTTC - totalPaye;

  return { montantHT, montantTVA, montantTTC, totalPaye, soldeDu };
}

async function lister(req, res) {
  const where = req.portee ? { entreprise_id: req.portee.entreprise_id } : {};

  const factures = await Facture.findAll({
    where,
    include: ["lignes", "paiements", { model: Entreprise }],
    order: [["date_emission", "DESC"]],
  });
  const resultat = factures.map((f) => ({ ...f.toJSON(), montants: calculerMontants(f) }));
  res.json(resultat);
}

async function obtenirUne(req, res) {
  const facture = await Facture.findByPk(req.params.id, {
    include: ["lignes", "paiements", { model: Entreprise }],
  });
  if (!facture) return res.status(404).json({ erreur: "Facture introuvable" });

  // Un client ne peut consulter que les factures de SA propre entreprise
  if (req.portee && facture.entreprise_id !== req.portee.entreprise_id) {
    return res.status(403).json({ erreur: "Accès non autorisé à cette facture" });
  }

  res.json({ ...facture.toJSON(), montants: calculerMontants(facture) });
}

/**
 * Création "imbriquée", même principe que pour la pharmacie :
 * on envoie la facture + ses lignes en un seul appel API.
 * Body attendu: { entreprise_id, type, date_emission, date_echeance, taux_tva, lignes: [...] }
 */
async function creer(req, res) {
  if (req.portee) {
    return res.status(403).json({ erreur: "Action réservée au staff du cabinet" });
  }
  try {
    const { lignes, ...donneesFacture } = req.body;
    const numero = await genererNumero(donneesFacture.type || "FACTURE");

    const facture = await Facture.create({ ...donneesFacture, numero });

    if (lignes && lignes.length) {
      const lignesAvecFactureId = lignes.map((l) => ({ ...l, facture_id: facture.id }));
      await LigneFacture.bulkCreate(lignesAvecFactureId);
    }

    const factureComplete = await Facture.findByPk(facture.id, { include: ["lignes", "paiements"] });
    res.status(201).json({ ...factureComplete.toJSON(), montants: calculerMontants(factureComplete) });
  } catch (err) {
    res.status(400).json({ erreur: err.message });
  }
}

/**
 * Enregistre un paiement (potentiellement partiel) et met à jour
 * automatiquement le statut de la facture en fonction du solde restant.
 */
async function enregistrerPaiement(req, res) {
  if (req.portee) {
    return res.status(403).json({ erreur: "Action réservée au staff du cabinet" });
  }
  try {
    const facture = await Facture.findByPk(req.params.id, { include: ["lignes", "paiements"] });
    if (!facture) return res.status(404).json({ erreur: "Facture introuvable" });

    await Paiement.create({ ...req.body, facture_id: facture.id });

    const factureMaj = await Facture.findByPk(facture.id, { include: ["lignes", "paiements"] });
    const montants = calculerMontants(factureMaj);

    // Mise à jour automatique du statut selon le solde restant dû
    if (montants.soldeDu <= 0) {
      factureMaj.statut = "PAYEE";
    } else if (montants.totalPaye > 0) {
      factureMaj.statut = "PARTIELLEMENT_PAYEE";
    }
    await factureMaj.save();

    res.status(201).json({ ...factureMaj.toJSON(), montants });
  } catch (err) {
    res.status(400).json({ erreur: err.message });
  }
}

module.exports = { lister, obtenirUne, creer, enregistrerPaiement };
