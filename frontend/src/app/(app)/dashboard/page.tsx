"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formaterMontant } from "@/lib/format";
import { TrendingUp, TrendingDown, AlertTriangle, Building2 } from "lucide-react";

type Stats = {
  pipeline: Record<string, number>;
  ca_facture: number;
  ca_encaisse: number;
  solde_du: number;
  nb_entreprises: number;
  nb_factures: number;
  factures_en_retard: number;
};

const ETAPES_PIPELINE = [
  { cle: "PROSPECT", label: "Prospects" },
  { cle: "DEVIS_ENVOYE", label: "Devis envoyés" },
  { cle: "SIGNE", label: "Signés" },
  { cle: "CLIENT_ACTIF", label: "Clients actifs" },
];

export default function PageDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    api.dashboard
      .stats()
      .then(setStats)
      .catch((e) => setErreur(e.message));
  }, []);

  if (erreur) return <div className="p-8 text-danger text-sm">{erreur}</div>;
  if (!stats) return <div className="p-8 text-text-muted text-sm">Chargement...</div>;

  const maxPipeline = Math.max(...ETAPES_PIPELINE.map((e) => stats.pipeline[e.cle] || 0), 1);

  return (
    <div className="p-8 max-w-6xl">
      <header className="mb-8">
        <h1 className="font-[family-name:var(--font-display)] text-2xl text-text">Vue d&apos;ensemble</h1>
        <p className="text-text-muted text-sm mt-1">Le pouls financier du cabinet, en un coup d&apos;œil</p>
      </header>

      {/* Cartes chiffres clés */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <CarteStat
          icone={<TrendingUp size={16} className="text-success" />}
          label="CA facturé"
          valeur={formaterMontant(stats.ca_facture)}
        />
        <CarteStat
          icone={<TrendingUp size={16} className="text-accent" />}
          label="CA encaissé"
          valeur={formaterMontant(stats.ca_encaisse)}
        />
        <CarteStat
          icone={<TrendingDown size={16} className="text-danger" />}
          label="Solde restant dû"
          valeur={formaterMontant(stats.solde_du)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline CRM */}
        <div className="bg-surface border border-border rounded-lg p-5">
          <h2 className="text-sm text-text-muted mb-4 flex items-center gap-2">
            <Building2 size={15} /> Pipeline commercial
          </h2>
          <div className="space-y-3">
            {ETAPES_PIPELINE.map(({ cle, label }) => {
              const valeur = stats.pipeline[cle] || 0;
              return (
                <div key={cle}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-text-muted">{label}</span>
                    <span className="text-text">{valeur}</span>
                  </div>
                  <div className="h-1.5 bg-surface-raised rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all"
                      style={{ width: `${(valeur / maxPipeline) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Alertes */}
        <div className="bg-surface border border-border rounded-lg p-5">
          <h2 className="text-sm text-text-muted mb-4 flex items-center gap-2">
            <AlertTriangle size={15} /> À surveiller
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-text-muted">Entreprises suivies</span>
              <span className="text-text">{stats.nb_entreprises}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-text-muted">Factures émises</span>
              <span className="text-text">{stats.nb_factures}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-text-muted">Factures en retard</span>
              <span className={stats.factures_en_retard > 0 ? "text-danger" : "text-text"}>
                {stats.factures_en_retard}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CarteStat({ icone, label, valeur }: { icone: React.ReactNode; label: string; valeur: string }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-5">
      <div className="flex items-center gap-2 text-text-muted text-xs mb-2">
        {icone}
        {label}
      </div>
      <p className="font-[family-name:var(--font-display)] text-2xl text-text">{valeur}</p>
    </div>
  );
}
