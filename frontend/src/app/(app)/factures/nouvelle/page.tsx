"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { formaterMontant } from "@/lib/format";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

type Entreprise = { id: number; nom: string };
type Ligne = { designation: string; quantite: number; prix_unitaire: number };

function FormulaireNouvelleFacture() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const entrepriseParDefaut = searchParams.get("entreprise");

  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [entrepriseId, setEntrepriseId] = useState(entrepriseParDefaut || "");
  const [type, setType] = useState<"DEVIS" | "FACTURE">("FACTURE");
  const [dateEmission, setDateEmission] = useState(new Date().toISOString().slice(0, 10));
  const [dateEcheance, setDateEcheance] = useState("");
  const [tauxTva, setTauxTva] = useState(20);
  const [lignes, setLignes] = useState<Ligne[]>([{ designation: "", quantite: 1, prix_unitaire: 0 }]);
  const [erreur, setErreur] = useState("");
  const [enCours, setEnCours] = useState(false);

  const lienRetour = entrepriseParDefaut ? `/entreprises/${entrepriseParDefaut}` : "/factures";
  const labelRetour = entrepriseParDefaut ? "Retour à l'entreprise" : "Retour aux factures";

  useEffect(() => {
    api.entreprises.lister().then(setEntreprises);
  }, []);

  const totalHT = lignes.reduce((t, l) => t + l.quantite * l.prix_unitaire, 0);
  const totalTTC = totalHT * (1 + tauxTva / 100);

  function mettreAJourLigne(index: number, champ: keyof Ligne, valeur: string) {
    setLignes((prev) =>
      prev.map((l, i) =>
        i === index ? { ...l, [champ]: champ === "designation" ? valeur : Number(valeur) } : l
      )
    );
  }

  function ajouterLigne() {
    setLignes((prev) => [...prev, { designation: "", quantite: 1, prix_unitaire: 0 }]);
  }

  function retirerLigne(index: number) {
    setLignes((prev) => prev.filter((_, i) => i !== index));
  }

  async function gererSoumission(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");
    setEnCours(true);
    try {
      const facture = await api.factures.creer({
        entreprise_id: Number(entrepriseId),
        type,
        date_emission: dateEmission,
        date_echeance: dateEcheance || null,
        taux_tva: tauxTva,
        lignes,
      });
      router.push(`/factures/${facture.id}`);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <Link href={lienRetour} className="inline-flex items-center gap-1.5 text-text-muted hover:text-text text-sm mb-6 transition-colors">
        <ArrowLeft size={14} /> {labelRetour}
      </Link>

      <h1 className="font-[family-name:var(--font-display)] text-2xl text-text mb-6">Nouvelle facture</h1>

      <form onSubmit={gererSoumission} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-text-muted mb-1.5">Entreprise</label>
            <select
              required
              value={entrepriseId}
              onChange={(e) => setEntrepriseId(e.target.value)}
              className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">Sélectionner...</option>
              {entreprises.map((e) => (
                <option key={e.id} value={e.id}>{e.nom}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1.5">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "DEVIS" | "FACTURE")}
              className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="FACTURE">Facture</option>
              <option value="DEVIS">Devis</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-text-muted mb-1.5">Date d&apos;émission</label>
            <input type="date" required value={dateEmission} onChange={(e) => setDateEmission(e.target.value)}
              className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent" />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1.5">Échéance</label>
            <input type="date" value={dateEcheance} onChange={(e) => setDateEcheance(e.target.value)}
              className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent" />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1.5">TVA (%)</label>
            <input type="number" step="0.1" value={tauxTva} onChange={(e) => setTauxTva(Number(e.target.value))}
              className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent" />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-text-muted">Lignes</label>
            <button type="button" onClick={ajouterLigne} className="flex items-center gap-1 text-xs text-accent hover:opacity-80">
              <Plus size={13} /> Ajouter une ligne
            </button>
          </div>
          <div className="space-y-2">
            {lignes.map((ligne, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  required
                  placeholder="Désignation"
                  value={ligne.designation}
                  onChange={(e) => mettreAJourLigne(i, "designation", e.target.value)}
                  className="flex-1 bg-surface border border-border rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={ligne.quantite}
                  onChange={(e) => mettreAJourLigne(i, "quantite", e.target.value)}
                  className="w-20 bg-surface border border-border rounded-md px-2 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent"
                  title="Quantité"
                />
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={ligne.prix_unitaire}
                  onChange={(e) => mettreAJourLigne(i, "prix_unitaire", e.target.value)}
                  className="w-28 bg-surface border border-border rounded-md px-2 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent"
                  title="Prix unitaire"
                />
                {lignes.length > 1 && (
                  <button type="button" onClick={() => retirerLigne(i)} className="text-text-muted hover:text-danger transition-colors">
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface border border-border rounded-lg p-4 flex justify-between text-sm">
          <div className="text-text-muted">
            <p>Total HT : {formaterMontant(totalHT)}</p>
            <p>TVA ({tauxTva}%) : {formaterMontant(totalTTC - totalHT)}</p>
          </div>
          <p className="text-text font-[family-name:var(--font-display)] text-xl self-center">{formaterMontant(totalTTC)}</p>
        </div>

        {erreur && <p className="text-danger text-sm bg-danger/10 border border-danger/30 rounded-md px-3 py-2">{erreur}</p>}

        <button
          type="submit"
          disabled={enCours}
          className="bg-accent text-accent-contrast font-medium rounded-md px-5 py-2.5 text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {enCours ? "Création..." : "Créer la facture"}
        </button>
      </form>
    </div>
  );
}

export default function PageNouvelleFacture() {
  return (
    <Suspense fallback={<div className="p-8 text-text-muted text-sm">Chargement...</div>}>
      <FormulaireNouvelleFacture />
    </Suspense>
  );
}