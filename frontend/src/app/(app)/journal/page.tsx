"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formaterMontant } from "@/lib/format";

type LigneJournal = {
  id: number;
  montant: number;
  date_paiement: string;
  moyen: string;
  facture_numero: string;
  entreprise_nom: string;
};

const LABEL_MOYEN: Record<string, string> = {
  VIREMENT: "Virement", CHEQUE: "Chèque", ESPECES: "Espèces", CARTE: "Carte bancaire", PRELEVEMENT: "Prélèvement",
};

export default function PageJournal() {
  const [lignes, setLignes] = useState<LigneJournal[]>([]);
  const [total, setTotal] = useState(0);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    api.journal.obtenir().then((data) => {
      setLignes(data.lignes);
      setTotal(data.total);
    }).finally(() => setChargement(false));
  }, []);

  return (
    <div className="p-8 max-w-4xl">
      <header className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl text-text">Journal de caisse</h1>
          <p className="text-text-muted text-sm mt-1">Toutes les entrées de fonds, tous clients confondus</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-text-muted">Total encaissé</p>
          <p className="font-[family-name:var(--font-display)] text-xl text-success">{formaterMontant(total)}</p>
        </div>
      </header>

      {chargement ? (
        <p className="text-text-muted text-sm">Chargement...</p>
      ) : lignes.length === 0 ? (
        <p className="text-text-muted text-sm">Aucun paiement enregistré pour le moment.</p>
      ) : (
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-text-muted text-xs uppercase tracking-wide">
                <th className="text-left px-5 py-3 font-medium">Date</th>
                <th className="text-left px-5 py-3 font-medium">Entreprise</th>
                <th className="text-left px-5 py-3 font-medium">Facture</th>
                <th className="text-left px-5 py-3 font-medium">Moyen</th>
                <th className="text-right px-5 py-3 font-medium">Montant</th>
              </tr>
            </thead>
            <tbody>
              {lignes.map((l) => (
                <tr key={l.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 text-text-muted">{new Date(l.date_paiement).toLocaleDateString("fr-FR")}</td>
                  <td className="px-5 py-3 text-text">{l.entreprise_nom}</td>
                  <td className="px-5 py-3 text-text-muted font-mono text-xs">{l.facture_numero}</td>
                  <td className="px-5 py-3 text-text-muted">{LABEL_MOYEN[l.moyen]}</td>
                  <td className="px-5 py-3 text-right text-success">{formaterMontant(l.montant)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}