"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formaterMontant } from "@/lib/format";
import { Plus, ChevronRight } from "lucide-react";

type Facture = {
  id: number;
  numero: string;
  type: string;
  statut: string;
  date_emission: string;
  Entreprise?: { nom: string };
  montants: { montantHT: number; montantTTC: number; totalPaye: number; soldeDu: number };
};

const COULEUR_STATUT: Record<string, string> = {
  BROUILLON: "text-text-muted bg-surface-raised",
  ENVOYEE: "text-warning bg-warning/10",
  PARTIELLEMENT_PAYEE: "text-accent bg-accent-soft",
  PAYEE: "text-success bg-success/10",
  EN_RETARD: "text-danger bg-danger/10",
};

const LABEL_STATUT: Record<string, string> = {
  BROUILLON: "Brouillon",
  ENVOYEE: "Envoyée",
  PARTIELLEMENT_PAYEE: "Partiellement payée",
  PAYEE: "Payée",
  EN_RETARD: "En retard",
};

export default function PageFactures() {
  const { utilisateur } = useAuth();
  const router = useRouter();
  const estStaff = utilisateur?.role !== "CLIENT";
  const [factures, setFactures] = useState<Facture[]>([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    api.factures.lister().then(setFactures).finally(() => setChargement(false));
  }, []);

  return (
    <div className="p-8 max-w-6xl">
      <header className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl text-text">Factures</h1>
          <p className="text-text-muted text-sm mt-1">Devis et factures, avec le solde restant dû</p>
        </div>
        {estStaff && (
          <Link
            href="/factures/nouvelle"
            className="flex items-center gap-1.5 bg-accent text-accent-contrast text-sm font-medium px-3.5 py-2 rounded-md hover:opacity-90 transition-opacity"
          >
            <Plus size={15} /> Nouvelle facture
          </Link>
        )}
      </header>

      {chargement ? (
        <p className="text-text-muted text-sm">Chargement...</p>
      ) : factures.length === 0 ? (
        <p className="text-text-muted text-sm">Aucune facture pour le moment.</p>
      ) : (
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-text-muted text-xs uppercase tracking-wide">
                <th className="text-left px-5 py-3 font-medium">Numéro</th>
                <th className="text-left px-5 py-3 font-medium">Entreprise</th>
                <th className="text-left px-5 py-3 font-medium">Date</th>
                <th className="text-left px-5 py-3 font-medium">Statut</th>
                <th className="text-right px-5 py-3 font-medium">TTC</th>
                <th className="text-right px-5 py-3 font-medium">Solde dû</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {factures.map((f) => (
                <tr
                  key={f.id}
                  onClick={() => router.push(`/factures/${f.id}`)}
                  className="border-b border-border last:border-0 cursor-pointer hover:bg-surface-raised transition-colors group"
                >
                  <td className="px-5 py-3 text-text font-mono text-xs">{f.numero}</td>
                  <td className="px-5 py-3 text-text-muted">{f.Entreprise?.nom || "—"}</td>
                  <td className="px-5 py-3 text-text-muted">
                    {new Date(f.date_emission).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${COULEUR_STATUT[f.statut]}`}>
                      {LABEL_STATUT[f.statut]}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-text">{formaterMontant(f.montants.montantTTC)}</td>
                  <td className={`px-5 py-3 text-right ${f.montants.soldeDu > 0 ? "text-danger" : "text-success"}`}>
                    {formaterMontant(f.montants.soldeDu)}
                  </td>
                  <td className="px-3 text-text-muted group-hover:text-accent transition-colors">
                    <ChevronRight size={16} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}