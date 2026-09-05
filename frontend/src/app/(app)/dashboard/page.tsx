"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { formaterMontant } from "@/lib/format";
import { TrendingUp, TrendingDown, AlertTriangle, Building2, Wallet } from "lucide-react";

type Stats = {
  pipeline: Record<string, number>;
  ca_facture: number;
  ca_encaisse: number;
  total_depenses: number;
  marge: number;
  solde_du: number;
  nb_entreprises: number;
  nb_factures: number;
  factures_en_retard: number;
};

type Entreprise = { id: number; nom: string };

const ETAPES_PIPELINE = [
  { cle: "PROSPECT", label: "Prospects" },
  { cle: "DEVIS_ENVOYE", label: "Devis envoyés" },
  { cle: "SIGNE", label: "Signés" },
  { cle: "CLIENT_ACTIF", label: "Clients actifs" },
];

type PresetId = "mois" | "mois_dernier" | "trimestre" | "annee" | "tout" | "personnalise";

const PRESETS: { id: PresetId; label: string }[] = [
  { id: "mois", label: "Ce mois-ci" },
  { id: "mois_dernier", label: "Mois dernier" },
  { id: "trimestre", label: "Ce trimestre" },
  { id: "annee", label: "Cette année" },
  { id: "tout", label: "Tout" },
  { id: "personnalise", label: "Personnalisé" },
];

function formaterDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function calculerBornes(preset: PresetId): { debut: string; fin: string } | null {
  const maintenant = new Date();
  const annee = maintenant.getFullYear();
  const mois = maintenant.getMonth();

  switch (preset) {
    case "mois":
      return { debut: formaterDate(new Date(annee, mois, 1)), fin: formaterDate(maintenant) };
    case "mois_dernier": {
      const debut = new Date(annee, mois - 1, 1);
      const fin = new Date(annee, mois, 0);
      return { debut: formaterDate(debut), fin: formaterDate(fin) };
    }
    case "trimestre": {
      const debutTrimestre = Math.floor(mois / 3) * 3;
      return { debut: formaterDate(new Date(annee, debutTrimestre, 1)), fin: formaterDate(maintenant) };
    }
    case "annee":
      return { debut: formaterDate(new Date(annee, 0, 1)), fin: formaterDate(maintenant) };
    case "tout":
      return null;
    default:
      return null;
  }
}

export default function PageDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [erreur, setErreur] = useState("");
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [entrepriseId, setEntrepriseId] = useState<string>("");
  const [preset, setPreset] = useState<PresetId>("tout");
  const [dateDebutPerso, setDateDebutPerso] = useState("");
  const [dateFinPerso, setDateFinPerso] = useState("");

  useEffect(() => {
    api.entreprises.lister().then(setEntreprises).catch(() => {});
  }, []);

  const charger = useCallback(() => {
    const bornes = preset === "personnalise"
      ? (dateDebutPerso && dateFinPerso ? { debut: dateDebutPerso, fin: dateFinPerso } : null)
      : calculerBornes(preset);

    api.dashboard
      .stats({
        entreprise_id: entrepriseId ? Number(entrepriseId) : undefined,
        date_debut: bornes?.debut,
        date_fin: bornes?.fin,
      })
      .then(setStats)
      .catch((e) => setErreur(e.message));
  }, [entrepriseId, preset, dateDebutPerso, dateFinPerso]);

  useEffect(() => { charger(); }, [charger]);

  if (erreur) return <div className="p-8 text-danger text-sm">{erreur}</div>;

  const maxPipeline = stats ? Math.max(...ETAPES_PIPELINE.map((e) => stats.pipeline[e.cle] || 0), 1) : 1;

  return (
    <div className="p-8 max-w-6xl">
      <header className="mb-6">
        <h1 className="font-[family-name:var(--font-display)] text-2xl text-text">Vue d&apos;ensemble</h1>
        <p className="text-text-muted text-sm mt-1">Le pouls financier du cabinet, en un coup d&apos;œil</p>
      </header>

      <div className="flex flex-wrap items-center gap-3 mb-8 bg-surface border border-border rounded-lg p-3">
        <select
          value={entrepriseId}
          onChange={(e) => setEntrepriseId(e.target.value)}
          className="bg-surface-raised border border-border rounded-md px-3 py-1.5 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="">Toutes les entreprises</option>
          {entreprises.map((e) => (
            <option key={e.id} value={e.id}>{e.nom}</option>
          ))}
        </select>

        <div className="flex gap-1">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPreset(p.id)}
              className={`px-3 py-1.5 rounded-md text-xs transition-colors ${
                preset === p.id ? "bg-accent text-accent-contrast" : "text-text-muted hover:bg-surface-raised"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {preset === "personnalise" && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateDebutPerso}
              onChange={(e) => setDateDebutPerso(e.target.value)}
              className="bg-surface-raised border border-border rounded-md px-2 py-1.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <span className="text-text-muted text-xs">→</span>
            <input
              type="date"
              value={dateFinPerso}
              onChange={(e) => setDateFinPerso(e.target.value)}
              className="bg-surface-raised border border-border rounded-md px-2 py-1.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        )}
      </div>

      {!stats ? (
        <p className="text-text-muted text-sm">Chargement...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <CarteStat icone={<TrendingUp size={16} className="text-success" />} label="CA facturé" valeur={formaterMontant(stats.ca_facture)} />
            <CarteStat icone={<TrendingUp size={16} className="text-accent" />} label="CA encaissé" valeur={formaterMontant(stats.ca_encaisse)} />
            <CarteStat icone={<TrendingDown size={16} className="text-danger" />} label="Dépenses" valeur={formaterMontant(stats.total_depenses)} />
            <CarteStat
              icone={<Wallet size={16} className={stats.marge >= 0 ? "text-success" : "text-danger"} />}
              label="Marge"
              valeur={formaterMontant(stats.marge)}
              accent={stats.marge >= 0 ? "success" : "danger"}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  <span className="text-text-muted">Factures émises (période)</span>
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
        </>
      )}
    </div>
  );
}

function CarteStat({ icone, label, valeur, accent }: { icone: React.ReactNode; label: string; valeur: string; accent?: "success" | "danger" }) {
  const couleurTexte = accent === "success" ? "text-success" : accent === "danger" ? "text-danger" : "text-text";
  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <div className="flex items-center gap-1.5 text-text-muted text-xs mb-1.5">
        {icone}
        {label}
      </div>
      <p className={`font-[family-name:var(--font-display)] text-lg ${couleurTexte}`}>{valeur}</p>
    </div>
  );
}