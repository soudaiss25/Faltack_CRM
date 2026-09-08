// ============================================================================
// ENVOI D'EMAILS AUTOMATIQUE — DÉSACTIVÉ POUR L'INSTANT
// ============================================================================
//
// Ce fichier prépare l'envoi automatique de relances par email via Gmail,
// avec la librairie "nodemailer". Il n'est branché nulle part dans
// l'application pour le moment (aucune route ne l'appelle) — c'est un bloc
// prêt à activer quand le projet passera en production réelle.
//
// --- CE QU'IL FAUDRA FAIRE POUR L'ACTIVER PLUS TARD ---
//
// 1. Installer la librairie (une seule fois, dans le dossier backend) :
//      npm install nodemailer
//
// 2. Créer un "mot de passe d'application" Gmail :
//      - Aller sur https://myaccount.google.com/apppasswords
//      - Nécessite la validation en 2 étapes activée sur le compte Google
//      - Choisir "Autre", nommer par ex. "Faltack CRM", copier le mot de passe généré
//      - Ce n'est PAS le mot de passe Gmail habituel, c'est un mot de passe dédié
//
// 3. Ajouter ces 2 lignes dans le fichier .env du backend :
//      GMAIL_USER=ton.adresse@gmail.com
//      GMAIL_APP_PASSWORD=le mot de passe généré à l'étape 2 (16 caractères, sans espaces)
//
// 4. Supprimer le "stub temporaire" tout en bas de ce fichier, et remplacer
//    tout le fichier par le bloc "VERSION À ACTIVER" ci-dessous (retirer les //).
//
// 5. Dans le controller concerné (ex: facture.controller.js), importer et
//    appeler cette fonction :
//      const { envoyerEmail } = require("../utils/email");
//      await envoyerEmail({ destinataire, objet, corps });
//
// 6. Côté frontend (impayes/page.tsx), remplacer le bouton "Ouvrir dans ma
//    messagerie" par un bouton "Envoyer" qui appelle une nouvelle route API
//    au lieu de générer un lien mailto.
//
// ============================================================================
// VERSION À ACTIVER PLUS TARD (actuellement en commentaire, ne fait rien) :
// ============================================================================
//
// const nodemailer = require("nodemailer");
//
// const transporteur = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.GMAIL_USER,
//     pass: process.env.GMAIL_APP_PASSWORD,
//   },
// });
//
// async function envoyerEmail({ destinataire, objet, corps }) {
//   if (!destinataire) {
//     throw new Error("Aucune adresse email de destinataire fournie");
//   }
//
//   await transporteur.sendMail({
//     from: `"Faltack — Cabinet comptable" <${process.env.GMAIL_USER}>`,
//     to: destinataire,
//     subject: objet,
//     text: corps,
//   });
// }
//
// module.exports = { envoyerEmail };
//
// ============================================================================

// Stub temporaire actif : tant que le bloc ci-dessus n'est pas activé, cette
// fonction ne fait rien de réel. Elle existe juste pour que le reste du code
// puisse déjà être écrit sans planter si jamais on l'appelle par erreur.
async function envoyerEmail() {
  throw new Error("L'envoi automatique d'emails n'est pas encore activé — voir les instructions en haut de backend/src/utils/email.js");
}

module.exports = { envoyerEmail };