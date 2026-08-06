"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Plus, X, ChevronRight } from "lucide-react";

type Entreprise = {
  id: number;
  nom: string;
  siret: string | null;
  statut: string;
  notes: string | null;
};

const ETAPES: { cle: string; label: string }[] = [
  { cle: "PROSPECT", label: "Prospect" },
  { cle: "DEVIS_ENVOYE", label: "Devis envoyé" },
  { cle: "SIGNE", label: "Signé" },
  { cle: "CLIENT_ACTIF", label: "Client actif" },
];

const COULEUR_STATUT: Record<string, string> = {
  PROSPECT: "text-text-muted bg-surface-raised",
  DEVIS_ENVOYE: "text-warning bg-warning/10",
  SIGNE: "text-accent bg-accent-soft",
  CLIENT_ACTIF: "text-success bg-success/10",
};

export default function PageEntreprises() {
  const { utilisateur } = useAuth();
  const router = useRouter();
  const estStaff = utilisateur?.role !== "CLIENT";
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [chargement, setChargement] = useState(true);
  const [modalOuverte, setModalOuverte] = useState(false);

  function recharger() {
    api.entreprises.lister().then(setEntreprises).finally(() => setChargement(false));
  }

  useEffect(recharger, []);

  async function gererConversion(id: number, statut: string) {
    setEntreprises((prev) => prev.map((e) => (e.id === id ? { ...e, statut } : e)));
    await api.entreprises.convertir(id, statut).catch(() => recharger());
  }

  return (
    <div className="p-8 max-w-6xl">
      <header className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl text-text">
            {estStaff ? "Entreprises" : "Mon entreprise"}
          </h1>
          <p className="text-text-muted text-sm mt-1">
            {estStaff ? "Prospects et clients, du premier contact au client actif" : "Votre espace de suivi"}
          </p>
        </div>
        {estStaff && (
          <button
            onClick={() => setModalOuverte(true)}
            className="flex items-center gap-1.5 bg-accent text-accent-contrast text-sm font-medium px-3.5 py-2 rounded-md hover:opacity-90 transition-opacity"
          >
            <Plus size={15} /> Nouvelle entreprise
          </button>
        )}
      </header>

      {chargement ? (
        <p className="text-text-muted text-sm">Chargement...</p>
      ) : entreprises.length === 0 ? (
        <p className="text-text-muted text-sm">Aucune entreprise pour le moment.</p>
      ) : (
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-text-muted text-xs uppercase tracking-wide">
                <th className="text-left px-5 py-3 font-medium">Nom</th>
                <th className="text-left px-5 py-3 font-medium">SIRET</th>
                <th className="text-left px-5 py-3 font-medium">Statut</th>
                {estStaff && <th className="text-left px-5 py-3 font-medium">Avancer</th>}
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {entreprises.map((e) => (
                <tr
                  key={e.id}
                  onClick={() => router.push(`/entreprises/${e.id}`)}
                  className="border-b border-border last:border-0 cursor-pointer hover:bg-surface-raised transition-colors group"
                >
                  <td className="px-5 py-3 text-text font-medium">{e.nom}</td>
                  <td className="px-5 py-3 text-text-muted">{e.siret || "—"}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${COULEUR_STATUT[e.statut]}`}>
                      {ETAPES.find((s) => s.cle === e.statut)?.label}
                    </span>
                  </td>
                  {estStaff && (
                    <td className="px-5 py-3" onClick={(ev) => ev.stopPropagation()}>
                      <select
                        value={e.statut}
                        onChange={(ev) => gererConversion(e.id, ev.target.value)}
                        className="bg-surface-raised border border-border rounded-md text-xs px-2 py-1.5 text-text focus:outline-none focus:ring-1 focus:ring-accent"
                      >
                        {ETAPES.map((s) => (
                          <option key={s.cle} value={s.cle}>{s.label}</option>
                        ))}
                      </select>
                    </td>
                  )}
                  <td className="px-3 text-text-muted group-hover:text-accent transition-colors">
                    <ChevronRight size={16} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOuverte && (
        <ModalNouvelleEntreprise onFerme={() => setModalOuverte(false)} onCree={() => { setModalOuverte(false); recharger(); }} />
      )}
    </div>
  );
}

function ModalNouvelleEntreprise({ onFerme, onCree }: { onFerme: () => void; onCree: () => void }) {
  const [nom, setNom] = useState("");
  const [siret, setSiret] = useState("");
  const [erreur, setErreur] = useState("");

  async function gererSoumission(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.entreprises.creer({ nom, siret, statut: "PROSPECT" });
      onCree();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onFerme}>
      <div
        className="bg-surface border border-border rounded-lg p-6 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-text font-medium">Nouvelle entreprise</h2>
          <button onClick={onFerme} className="text-text-muted hover:text-text">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={gererSoumission} className="space-y-3">
          <div>
            <label className="block text-xs text-text-muted mb-1.5">Nom</label>
            <input
              required
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="w-full bg-surface-raised border border-border rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1.5">SIRET (optionnel)</label>
            <input
              value={siret}
              onChange={(e) => setSiret(e.target.value)}
              className="w-full bg-surface-raised border border-border rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          {erreur && <p className="text-danger text-xs">{erreur}</p>}
          <button
            type="submit"
            className="w-full bg-accent text-accent-contrast font-medium rounded-md py-2 text-sm hover:opacity-90 transition-opacity"
          >
            Créer
          </button>
        </form>
      </div>
    </div>
  );
}