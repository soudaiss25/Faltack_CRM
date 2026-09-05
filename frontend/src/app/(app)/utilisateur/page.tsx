"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Plus, X, Trash2, ShieldCheck } from "lucide-react";

type Utilisateur = { id: number; nom: string; email: string; role: string };

export default function PageUtilisateurs() {
  const { utilisateur: moi } = useAuth();
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [modalOuverte, setModalOuverte] = useState(false);

  function recharger() {
    api.utilisateurs.lister().then(setUtilisateurs).catch((e) => setErreur(e.message)).finally(() => setChargement(false));
  }

  useEffect(recharger, []);

  async function changerRole(id: number, role: string) {
    setUtilisateurs((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
    await api.utilisateurs.mettreAJour(id, { role }).catch((e) => { setErreur(e.message); recharger(); });
  }

  async function supprimer(id: number) {
    await api.utilisateurs.supprimer(id).then(recharger).catch((e) => setErreur(e.message));
  }

  if (moi?.role !== "SUPER_ADMIN") {
    return (
      <div className="p-8">
        <p className="text-text-muted text-sm">Cette page est réservée aux super administrateurs du cabinet.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl">
      <header className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl text-text">Utilisateurs</h1>
          <p className="text-text-muted text-sm mt-1">Qui a accès au cabinet, et avec quel rôle</p>
        </div>
        <button
          onClick={() => setModalOuverte(true)}
          className="flex items-center gap-1.5 bg-accent text-accent-contrast text-sm font-medium px-3.5 py-2 rounded-md hover:opacity-90 transition-opacity"
        >
          <Plus size={15} /> Nouveau collaborateur
        </button>
      </header>

      {erreur && <p className="text-danger text-sm bg-danger/10 border border-danger/30 rounded-md px-3 py-2 mb-4">{erreur}</p>}

      {chargement ? (
        <p className="text-text-muted text-sm">Chargement...</p>
      ) : (
        <div className="bg-surface border border-border rounded-lg divide-y divide-border">
          {utilisateurs.map((u) => (
            <div key={u.id} className="px-5 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm text-text flex items-center gap-1.5">
                  {u.nom}
                  {u.role === "SUPER_ADMIN" && <ShieldCheck size={13} className="text-accent" />}
                </p>
                <p className="text-xs text-text-muted">{u.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={u.role}
                  onChange={(e) => changerRole(u.id, e.target.value)}
                  disabled={u.id === moi.id}
                  className="bg-surface-raised border border-border rounded-md text-xs px-2 py-1.5 text-text focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
                >
                  <option value="SUPER_ADMIN">Super admin</option>
                  <option value="COLLABORATEUR">Collaborateur</option>
                </select>
                {u.id !== moi.id && (
                  <button onClick={() => supprimer(u.id)} className="text-text-muted hover:text-danger transition-colors">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOuverte && (
        <ModalNouvelUtilisateur onFerme={() => setModalOuverte(false)} onCree={() => { setModalOuverte(false); recharger(); }} />
      )}
    </div>
  );
}

function ModalNouvelUtilisateur({ onFerme, onCree }: { onFerme: () => void; onCree: () => void }) {
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [role, setRole] = useState("COLLABORATEUR");
  const [erreur, setErreur] = useState("");

  async function gererSoumission(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.utilisateurs.creer({ nom, email, mot_de_passe: motDePasse, role });
      onCree();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onFerme}>
      <div className="bg-surface border border-border rounded-lg p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-text font-medium">Nouveau collaborateur</h2>
          <button onClick={onFerme} className="text-text-muted hover:text-text">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={gererSoumission} className="space-y-3">
          <div>
            <label className="block text-xs text-text-muted mb-1.5">Nom</label>
            <input required value={nom} onChange={(e) => setNom(e.target.value)}
              className="w-full bg-surface-raised border border-border rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent" />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1.5">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface-raised border border-border rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent" />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1.5">Mot de passe provisoire</label>
            <input type="password" required value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)}
              className="w-full bg-surface-raised border border-border rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent" />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1.5">Rôle</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}
              className="w-full bg-surface-raised border border-border rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent">
              <option value="COLLABORATEUR">Collaborateur</option>
              <option value="SUPER_ADMIN">Super admin</option>
            </select>
          </div>
          {erreur && <p className="text-danger text-xs">{erreur}</p>}
          <button type="submit" className="w-full bg-accent text-accent-contrast font-medium rounded-md py-2 text-sm hover:opacity-90 transition-opacity">
            Créer
          </button>
        </form>
      </div>
    </div>
  );
}