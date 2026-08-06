"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formaterMontant } from "@/lib/format";
import { ArrowLeft, Plus, Download } from "lucide-react";

type Ligne = { id: number; designation: string; quantite: number; prix_unitaire: number };
type Paiement = { id: number; montant: number; date_paiement: string; moyen: string };
type Facture = {
  id: number; numero: string; type: string; statut: string;
  date_emission: string; date_echeance: string | null; taux_tva: number;
  Entreprise?: { id: number; nom: string };
  lignes: Ligne[]; paiements: Paiement[];
  montants: { montantHT: number; montantTVA: number; montantTTC: number; totalPaye: number; soldeDu: number };
};

const LABEL_STATUT: Record<string, string> = {
  BROUILLON: "Brouillon", ENVOYEE: "Envoyée", PARTIELLEMENT_PAYEE: "Partiellement payée",
  PAYEE: "Payée", EN_RETARD: "En retard",
};

const LABEL_MOYEN: Record<string, string> = {
  VIREMENT: "Virement", CHEQUE: "Chèque", ESPECES: "Espèces", CARTE: "Carte bancaire", PRELEVEMENT: "Prélèvement",
};

export default function PageDetailFacture({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { utilisateur } = useAuth();
  const estStaff = utilisateur?.role !== "CLIENT";
  const [facture, setFacture] = useState<Facture | null>(null);
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);

  function recharger() {
    api.factures.obtenir(Number(id)).then(setFacture);
  }

  useEffect(recharger, [id]);

  if (!facture) return <div className="p-8 text-text-muted text-sm">Chargement...</div>;

  return (
    <div className="p-8 max-w-2xl">
      <Link href="/factures" className="inline-flex items-center gap-1.5 text-text-muted hover:text-text text-sm mb-6 transition-colors">
        <ArrowLeft size={14} /> Retour aux factures
      </Link>

      <header className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl text-text font-mono">{facture.numero}</h1>
          <p className="text-text-muted text-sm mt-1">
            {facture.Entreprise?.nom} · émise le {new Date(facture.date_emission).toLocaleDateString("fr-FR")}
            {facture.date_echeance ? ` · échéance ${new Date(facture.date_echeance).toLocaleDateString("fr-FR")}` : ""}
          </p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-accent-soft text-accent">{LABEL_STATUT[facture.statut]}</span>
      </header>

                <button
        onClick={() => api.factures.telechargerPDF(facture.id, facture.numero)}
        className="flex items-center gap-1.5 text-sm text-text-muted hover:text-accent border border-border rounded-md px-3 py-1.5 mb-6 transition-colors"
        >
        <Download size={14} /> Télécharger le PDF
        </button>

      <div className="bg-surface border border-border rounded-lg overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-text-muted text-xs uppercase tracking-wide">
              <th className="text-left px-4 py-2.5 font-medium">Désignation</th>
              <th className="text-right px-4 py-2.5 font-medium">Qté</th>
              <th className="text-right px-4 py-2.5 font-medium">P.U.</th>
              <th className="text-right px-4 py-2.5 font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {facture.lignes.map((l) => (
              <tr key={l.id} className="border-b border-border last:border-0">
                <td className="px-4 py-2.5 text-text">{l.designation}</td>
                <td className="px-4 py-2.5 text-right text-text-muted">{l.quantite}</td>
                <td className="px-4 py-2.5 text-right text-text-muted">{formaterMontant(l.prix_unitaire)}</td>
                <td className="px-4 py-2.5 text-right text-text">{formaterMontant(l.quantite * l.prix_unitaire)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-3 bg-surface-raised text-sm space-y-1">
          <div className="flex justify-between text-text-muted">
            <span>Total HT</span><span>{formaterMontant(facture.montants.montantHT)}</span>
          </div>
          <div className="flex justify-between text-text-muted">
            <span>TVA ({facture.taux_tva}%)</span><span>{formaterMontant(facture.montants.montantTVA)}</span>
          </div>
          <div className="flex justify-between text-text font-medium pt-1 border-t border-border">
            <span>Total TTC</span><span>{formaterMontant(facture.montants.montantTTC)}</span>
          </div>
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm text-text-muted">
            Paiements — solde dû :{" "}
            <span className={facture.montants.soldeDu > 0 ? "text-danger" : "text-success"}>
              {formaterMontant(facture.montants.soldeDu)}
            </span>
          </h2>
          {estStaff && facture.montants.soldeDu > 0 && (
            <button onClick={() => setFormulaireOuvert(!formulaireOuvert)} className="flex items-center gap-1.5 text-xs text-accent hover:opacity-80">
              <Plus size={14} /> Enregistrer un paiement
            </button>
          )}
        </div>

        {formulaireOuvert && (
          <FormulairePaiement
            factureId={facture.id}
            soldeDu={facture.montants.soldeDu}
            onCree={() => { setFormulaireOuvert(false); recharger(); }}
          />
        )}

        {facture.paiements.length === 0 ? (
          <p className="text-text-muted text-sm">Aucun paiement enregistré.</p>
        ) : (
          <div className="bg-surface border border-border rounded-lg divide-y divide-border">
            {facture.paiements.map((p) => (
              <div key={p.id} className="px-4 py-3 flex items-center justify-between text-sm">
                <span className="text-text-muted">
                  {new Date(p.date_paiement).toLocaleDateString("fr-FR")} · {LABEL_MOYEN[p.moyen]}
                </span>
                <span className="text-success">{formaterMontant(p.montant)}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function FormulairePaiement({ factureId, soldeDu, onCree }: { factureId: number; soldeDu: number; onCree: () => void }) {
  const [montant, setMontant] = useState(soldeDu);
  const [datePaiement, setDatePaiement] = useState(new Date().toISOString().slice(0, 10));
  const [moyen, setMoyen] = useState("VIREMENT");
  const [erreur, setErreur] = useState("");

  async function gererSoumission(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.factures.ajouterPaiement(factureId, { montant, date_paiement: datePaiement, moyen });
      onCree();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur");
    }
  }

  return (
    <form onSubmit={gererSoumission} className="bg-surface border border-border rounded-lg p-4 mb-3 space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-text-muted mb-1.5">Montant</label>
          <input type="number" step="0.01" max={soldeDu} required value={montant} onChange={(e) => setMontant(Number(e.target.value))}
            className="w-full bg-surface-raised border border-border rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent" />
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1.5">Date</label>
          <input type="date" required value={datePaiement} onChange={(e) => setDatePaiement(e.target.value)}
            className="w-full bg-surface-raised border border-border rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent" />
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1.5">Moyen</label>
          <select value={moyen} onChange={(e) => setMoyen(e.target.value)}
            className="w-full bg-surface-raised border border-border rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent">
            <option value="VIREMENT">Virement</option>
            <option value="CHEQUE">Chèque</option>
            <option value="ESPECES">Espèces</option>
            <option value="CARTE">Carte bancaire</option>
            <option value="PRELEVEMENT">Prélèvement</option>
          </select>
        </div>
      </div>
      {erreur && <p className="text-danger text-xs">{erreur}</p>}
      <button type="submit" className="bg-accent text-accent-contrast text-sm font-medium rounded-md px-4 py-2 hover:opacity-90 transition-opacity">
        Enregistrer
      </button>
    </form>
  );
}