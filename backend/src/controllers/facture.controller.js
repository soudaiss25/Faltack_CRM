const { Facture, LigneFacture, Paiement, Entreprise } = require("../models");
const PDFDocument = require("pdfkit");
const { calculerMontants, determinerStatutAffiche } = require("../utils/facturation");

async function genererNumero(type) {
  const annee = new Date().getFullYear();
  const prefixe = type === "DEVIS" ? "DEV" : "FAC";
  const count = await Facture.count({ where: { type } });
  return `${prefixe}-${annee}-${String(count + 1).padStart(4, "0")}`;
}

async function lister(req, res) {
  const where = req.portee ? { entreprise_id: req.portee.entreprise_id } : {};

  const factures = await Facture.findAll({
    where,
    include: ["lignes", "paiements", { model: Entreprise }],
    order: [["date_emission", "DESC"]],
  });
  const resultat = factures.map((f) => {
    const montants = calculerMontants(f);
    return { ...f.toJSON(), statut: determinerStatutAffiche(f, montants), montants };
  });
  res.json(resultat);
}

/**
 * Tableau des impayés : toutes les factures dont le solde dû est encore > 0,
 * hors brouillons, avec le nombre de jours de retard calculé par rapport à
 * la date d'échéance. Utilisé pour les relances (section 8 du cahier des charges).
 */
async function listerImpayes(req, res) {
  const where = req.portee ? { entreprise_id: req.portee.entreprise_id } : {};

  const factures = await Facture.findAll({
    where,
    include: ["lignes", "paiements", { model: Entreprise, include: ["contacts"] }],
    order: [["date_echeance", "ASC"]],
  });

  const aujourdhui = new Date();

  const impayes = factures
    .map((f) => {
      const montants = calculerMontants(f);
      const statutAffiche = determinerStatutAffiche(f, montants);
      let joursRetard = null;
      if (f.date_echeance) {
        joursRetard = Math.floor((aujourdhui - new Date(f.date_echeance)) / (1000 * 60 * 60 * 24));
      }
      return {
        id: f.id,
        numero: f.numero,
        entreprise: f.Entreprise ? { id: f.Entreprise.id, nom: f.Entreprise.nom } : null,
        contacts: f.Entreprise?.contacts?.map((c) => ({ nom: c.nom, email: c.email })) || [],
        date_emission: f.date_emission,
        date_echeance: f.date_echeance,
        montant_ttc: montants.montantTTC,
        solde_du: montants.soldeDu,
        statut: statutAffiche,
        jours_retard: joursRetard,
      };
    })
    .filter((f) => f.solde_du > 0.01 && f.statut !== "BROUILLON");

  res.json(impayes);
}

async function obtenirUne(req, res) {
  const facture = await Facture.findByPk(req.params.id, {
    include: ["lignes", "paiements", { model: Entreprise }],
  });
  if (!facture) return res.status(404).json({ erreur: "Facture introuvable" });

  if (req.portee && facture.entreprise_id !== req.portee.entreprise_id) {
    return res.status(403).json({ erreur: "Accès non autorisé à cette facture" });
  }

  const montants = calculerMontants(facture);
  res.json({ ...facture.toJSON(), statut: determinerStatutAffiche(facture, montants), montants });
}

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

async function genererPDF(req, res) {
  const facture = await Facture.findByPk(req.params.id, {
    include: ["lignes", "paiements", { model: Entreprise }],
  });
  if (!facture) return res.status(404).json({ erreur: "Facture introuvable" });

  if (req.portee && facture.entreprise_id !== req.portee.entreprise_id) {
    return res.status(403).json({ erreur: "Accès non autorisé à cette facture" });
  }

  const montants = calculerMontants(facture);
  const statutAffiche = determinerStatutAffiche(facture, montants);

  const doc = new PDFDocument({ margin: 50 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${facture.numero}.pdf"`);
  doc.pipe(res);

  const formater = (n) => `${Number(n).toFixed(2)} €`;

  doc.fontSize(20).text(facture.type === "DEVIS" ? "DEVIS" : "FACTURE", { align: "left" });
  doc.fontSize(10).fillColor("#555").text(facture.numero, { align: "left" });
  doc.moveDown(1.5);

  doc.fillColor("#000").fontSize(10);
  doc.text(`Date d'émission : ${new Date(facture.date_emission).toLocaleDateString("fr-FR")}`);
  if (facture.date_echeance) {
    doc.text(`Échéance : ${new Date(facture.date_echeance).toLocaleDateString("fr-FR")}`);
  }
  doc.text(`Client : ${facture.Entreprise?.nom || "—"}`);
  doc.moveDown(1.5);

  const startX = 50;
  let y = doc.y;
  doc.font("Helvetica-Bold");
  doc.text("Désignation", startX, y, { width: 220 });
  doc.text("Qté", startX + 220, y, { width: 60, align: "right" });
  doc.text("P.U.", startX + 280, y, { width: 80, align: "right" });
  doc.text("Total", startX + 360, y, { width: 90, align: "right" });
  doc.font("Helvetica");
  y += 18;
  doc.moveTo(startX, y).lineTo(startX + 450, y).strokeColor("#ccc").stroke();
  y += 8;

  facture.lignes.forEach((ligne) => {
    const totalLigne = Number(ligne.quantite) * Number(ligne.prix_unitaire);
    doc.text(ligne.designation, startX, y, { width: 220 });
    doc.text(String(ligne.quantite), startX + 220, y, { width: 60, align: "right" });
    doc.text(formater(ligne.prix_unitaire), startX + 280, y, { width: 80, align: "right" });
    doc.text(formater(totalLigne), startX + 360, y, { width: 90, align: "right" });
    y += 20;
  });

  y += 10;
  doc.moveTo(startX + 280, y).lineTo(startX + 450, y).strokeColor("#ccc").stroke();
  y += 10;

  doc.text(`Total HT`, startX + 280, y, { width: 80, align: "right" });
  doc.text(formater(montants.montantHT), startX + 360, y, { width: 90, align: "right" });
  y += 16;
  doc.text(`TVA (${facture.taux_tva}%)`, startX + 280, y, { width: 80, align: "right" });
  doc.text(formater(montants.montantTVA), startX + 360, y, { width: 90, align: "right" });
  y += 16;
  doc.font("Helvetica-Bold");
  doc.text(`Total TTC`, startX + 280, y, { width: 80, align: "right" });
  doc.text(formater(montants.montantTTC), startX + 360, y, { width: 90, align: "right" });
  doc.font("Helvetica");
  y += 30;

  doc.fontSize(10).fillColor("#333");
  doc.text(`Statut : ${statutAffiche.replace(/_/g, " ")}`, startX, y);
  y += 16;
  doc.text(`Payé : ${formater(montants.totalPaye)}  —  Solde dû : ${formater(montants.soldeDu)}`, startX, y);

  doc.end();
}

module.exports = { lister, listerImpayes, obtenirUne, creer, enregistrerPaiement, genererPDF };