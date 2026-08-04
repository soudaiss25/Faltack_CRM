# Frontend - CRM Financier (Next.js)

## Démarrage

```bash
cd frontend
npm install
cp .env.local.example .env.local   # inchangé si le backend tourne sur localhost:4000
npm run dev
```

Ouvre http://localhost:3000 — tu seras redirigé vers `/login`.

## Pour te connecter

Le frontend ne crée pas de compte tout seul. Il faut d'abord créer un utilisateur
côté backend via `POST http://localhost:4000/api/auth/inscription` (avec Postman,
curl, ou même juste un `fetch` dans la console du navigateur) :

```json
{
  "nom": "Admin Cabinet",
  "email": "admin@cabinet.fr",
  "mot_de_passe": "motdepasse123",
  "role": "SUPER_ADMIN"
}
```

Ensuite connecte-toi avec ces identifiants sur `/login`.

## Structure

- `src/lib/api.ts` — client API centralisé (ajoute automatiquement le token JWT)
- `src/lib/auth.tsx` — contexte de session (connexion/déconnexion/qui est connecté)
- `src/app/login/` — page de connexion
- `src/app/(app)/` — zone protégée avec sidebar : dashboard, entreprises, factures

## Ce qui reste à faire (au-delà de la Phase 1)

- Formulaire de création de facture (actuellement lecture seule côté front)
- Enregistrement de paiement depuis l'interface
- Gestion des contacts par entreprise
- Vue détail d'une entreprise (historique, factures liées)
