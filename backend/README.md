# Backend - CRM & Gestion Financière (Node.js + Express + Sequelize)

## Démarrage rapide

```bash
cd backend
npm install
cp .env.example .env   # puis remplis avec tes vraies infos (Supabase notamment)
npm run dev
```

Le serveur tourne sur http://localhost:4000

Au démarrage, `sequelize.sync()` crée/adapte automatiquement les tables
dans ta base selon les modèles définis (pas besoin de migration manuelle
pour cette phase de démo).

## Connexion à Supabase

Dans `.env`, remplis avec les infos de ton projet Supabase (Project Settings > Database) :
```
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=xxx
DB_HOST=db.xxxx.supabase.co
DB_PORT=5432
DB_SSL=true
```

## Endpoints Phase 1

| Endpoint | Description |
|---|---|
| `POST /api/auth/inscription` | Créer un compte (nom, email, mot_de_passe, role) |
| `POST /api/auth/connexion` | Login → renvoie un token JWT |
| `GET /api/entreprises` | Liste des entreprises (filtrable par `?statut=PROSPECT`) |
| `POST /api/entreprises` | Créer une fiche entreprise (prospect) |
| `POST /api/entreprises/:id/convertir` | Faire avancer le pipeline (PROSPECT → DEVIS_ENVOYE → SIGNE → CLIENT_ACTIF) |
| `GET /api/factures` | Liste des factures avec montants calculés (HT, TVA, TTC, solde dû) |
| `POST /api/factures` | Créer une facture avec ses lignes en une requête |
| `POST /api/factures/:id/paiements` | Enregistrer un paiement (partiel ou total) — met à jour le statut automatiquement |

Toutes les routes (sauf auth) nécessitent le header `Authorization: Bearer <token>`.

## Logique métier clé

- **Pipeline CRM** : le statut d'une `Entreprise` évolue via `/convertir`, jamais en modifiant le champ directement ailleurs — ça centralise la règle métier.
- **Paiements partiels** : `Facture.controller.js` recalcule le solde dû à chaque paiement et met à jour le statut (`PARTIELLEMENT_PAYEE` / `PAYEE`) automatiquement.
- **Numérotation auto** : chaque facture/devis reçoit un numéro généré (`FAC-2026-0001`, `DEV-2026-0001`).
