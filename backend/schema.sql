-- ============================================================
-- CRM & Gestion Financière — Script de création des tables
-- À exécuter dans Supabase : SQL Editor > New query > coller > Run
-- ============================================================

-- On active l'extension pour les UUID si jamais on en a besoin plus tard
create extension if not exists "uuid-ossp";

-- ---------- ENUMS ----------
-- Les ENUM en Postgres sont des types à part : on les déclare avant les tables qui les utilisent
create type role_utilisateur as enum ('SUPER_ADMIN', 'COLLABORATEUR', 'CLIENT');
create type statut_entreprise as enum ('PROSPECT', 'DEVIS_ENVOYE', 'SIGNE', 'CLIENT_ACTIF');
create type type_facture as enum ('DEVIS', 'FACTURE');
create type statut_facture as enum ('BROUILLON', 'ENVOYEE', 'PARTIELLEMENT_PAYEE', 'PAYEE', 'EN_RETARD');
create type moyen_paiement as enum ('VIREMENT', 'CHEQUE', 'ESPECES', 'CARTE', 'PRELEVEMENT');

-- ---------- UTILISATEUR (staff du cabinet) ----------
-- Note : la colonne entreprise_id (pour les utilisateurs CLIENT) est ajoutée
-- plus bas via ALTER TABLE, car elle référence entreprises qui n'existe pas encore
-- (référence circulaire : entreprises référence aussi utilisateurs via cree_par_id)
create table utilisateurs (
    id serial primary key,
    nom varchar(255) not null,
    email varchar(255) not null unique,
    mot_de_passe_hash varchar(255) not null,
    role role_utilisateur not null default 'COLLABORATEUR',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- ---------- ENTREPRISE (le coeur du CRM : prospect -> client) ----------
create table entreprises (
    id serial primary key,
    nom varchar(255) not null,
    siret varchar(50),
    adresse varchar(255),
    statut statut_entreprise not null default 'PROSPECT',
    notes text,
    cree_par_id integer references utilisateurs(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create type type_client_entreprise as enum ('MORALE', 'PHYSIQUE');

alter table entreprises add column type_client type_client_entreprise not null default 'MORALE';

-- ---------- Lien Utilisateur CLIENT -> Entreprise (accès restreint) ----------
-- NULL pour le staff du cabinet (ils voient tout).
-- Rempli uniquement pour un utilisateur role='CLIENT' : il ne verra que CETTE entreprise.
alter table utilisateurs
    add column entreprise_id integer references entreprises(id) on delete cascade;

create index idx_utilisateurs_entreprise on utilisateurs(entreprise_id);

-- ---------- CONTACT (interlocuteurs chez une entreprise) ----------
create table contacts (
    id serial primary key,
    nom varchar(255) not null,
    fonction varchar(255),
    email varchar(255),
    telephone varchar(50),
    entreprise_id integer not null references entreprises(id) on delete cascade,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- ---------- FACTURE (devis ou facture) ----------
create table factures (
    id serial primary key,
    numero varchar(50) not null unique,
    type type_facture not null default 'FACTURE',
    statut statut_facture not null default 'BROUILLON',
    date_emission date not null,
    date_echeance date,
    taux_tva numeric(5, 2) not null default 20.0,
    entreprise_id integer not null references entreprises(id) on delete restrict,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- ---------- LIGNE FACTURE (le détail : produit/prestation, quantité, prix) ----------
create table lignes_facture (
    id serial primary key,
    designation varchar(255) not null,
    quantite numeric(10, 2) not null default 1,
    prix_unitaire numeric(10, 2) not null,
    facture_id integer not null references factures(id) on delete cascade,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- ---------- PAIEMENT (peut être partiel, plusieurs par facture) ----------
create table paiements (
    id serial primary key,
    montant numeric(10, 2) not null,
    date_paiement date not null,
    moyen moyen_paiement not null,
    facture_id integer not null references factures(id) on delete cascade,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- ---------- INDEX (accélèrent les recherches les plus fréquentes) ----------
create index idx_entreprises_statut on entreprises(statut);
create index idx_contacts_entreprise on contacts(entreprise_id);
create index idx_factures_entreprise on factures(entreprise_id);
create index idx_factures_statut on factures(statut);
create index idx_lignes_facture on lignes_facture(facture_id);
create index idx_paiements_facture on paiements(facture_id);
