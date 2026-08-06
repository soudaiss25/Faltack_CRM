"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formaterMontant } from "@/lib/format";
import { ArrowLeft, Plus, Trash2, FileText } from "lucide-react";

type Contact = { id: number; nom: string; fonction: string | null; email: string | null; telephone: string | null };
type Facture = { id: number; numero: string; statut: string; date_emission: string; montants: { montantTTC: number; soldeDu: number } };
type Entreprise = { id: number; nom: string; siret: string | null; adresse: string | null; statut: string; contacts: Contact[]; factures: Facture[] };

const LABEL_STATUT: Record<string, string> = {
  PROSPECT: "Prospect", DEVIS_ENVOYE: "Devis envoyé", SIGNE: "Signé", CLIENT_ACTIF: "Client actif",
};

export default function PageDetailEntreprise({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { utilisateur } = useAuth();
  const estStaff = utilisateur?.role !== "CLIENT";
  const [entreprise, setEntreprise] = useState<Entreprise | null>(null);
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);

  function recharger() {
    api.entreprises.obtenir(Number(id)).then(setEntreprise);
  }

  useEffect(recharger, [id]);

  if (!entreprise) return <div className="p-8 text-text-muted text-sm">Chargement...</div>;

  return (
    <div className="p-8 max-w-4xl">
      <Link href="/entreprises" className="inline-flex items-center gap-1.5 text-text-muted hover:text-text text-sm mb-6 transition-colors">
        <ArrowLeft size={14} /> Retour aux entreprises
      </Link>

      <header className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl text-text">{entreprise.nom}</h1>
          <p className="text-text-muted text-sm mt-1">
            {entreprise.siret ? `SIRET ${entreprise.siret}` : "SIRET non renseigné"}
            {entreprise.adresse ? ` · ${entreprise.adresse}` : ""}
          </p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-accent-soft text-accent">
          {LABEL_STATUT[entreprise.statut]}
        </span>
      </header>

      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm text-text-muted">Contacts</h2>
          {estStaff && (
            <button
              onClick={() => setFormulaireOuvert(!formulaireOuvert)}
              className="flex items-center gap-1.5 text-xs text-accent hover:opacity-80"
            >
              <Plus size={14} /> Ajouter un contact
            </button>
          )}
        </div>

        {formulaireOuvert && (
          <FormulaireContact
            entrepriseId={entreprise.id}
            onCree={() => { setFormulaireOuvert(false); recharger(); }}
          />
        )}

        {entreprise.contacts.length === 0 ? (
          <p className="text-text-muted text-sm">Aucun contact enregistré.</p>
        ) : (
          <div className="bg-surface border border-border rounded-lg divide-y divide-border">
            {entreprise.contacts.map((c) => (
              <div key={c.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-text">{c.nom}{c.fonction ? ` — ${c.fonction}` : ""}</p>
                  <p className="text-xs text-text-muted">{[c.email, c.telephone].filter(Boolean).join(" · ") || "—"}</p>
                </div>
                {estStaff && (
                  <button
                    onClick={() => api.contacts.supprimer(c.id).then(recharger)}
                    className="text-text-muted hover:text-danger transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm text-text-muted">Factures</h2>
          {estStaff && (
            <Link href={`/factures/nouvelle?entreprise=${entreprise.id}`} className="flex items-center gap-1.5 text-xs text-accent hover:opacity-80">
              <Plus size={14} /> Nouvelle facture
            </Link>
          )}
        </div>

        {entreprise.factures.length === 0 ? (
          <p className="text-text-muted text-sm">Aucune facture pour cette entreprise.</p>
        ) : (
          <div className="bg-surface border border-border rounded-lg divide-y divide-border">
            {entreprise.factures.map((f) => (
              <Link
                key={f.id}
                href={`/factures/${f.id}`}
                className="px-4 py-3 flex items-center justify-between hover:bg-surface-raised transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <FileText size={14} className="text-text-muted" />
                  <span className="text-sm text-text font-mono text-xs">{f.numero}</span>
                </div>
                <span className={f.montants.soldeDu > 0 ? "text-danger text-sm" : "text-success text-sm"}>
                  {formaterMontant(f.montants.soldeDu)} dû
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function FormulaireContact({ entrepriseId, onCree }: { entrepriseId: number; onCree: () => void }) {
  const [nom, setNom] = useState("");
  const [fonction, setFonction] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");

  async function gererSoumission(e: React.FormEvent) {
    e.preventDefault();
    await api.contacts.creer(entrepriseId, { nom, fonction, email, telephone });
    onCree();
  }

  return (
    <form onSubmit={gererSoumission} className="bg-surface border border-border rounded-lg p-4 mb-3 grid grid-cols-2 gap-3">
      <input required placeholder="Nom" value={nom} onChange={(e) => setNom(e.target.value)}
        className="bg-surface-raised border border-border rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent" />
      <input placeholder="Fonction" value={fonction} onChange={(e) => setFonction(e.target.value)}
        className="bg-surface-raised border border-border rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent" />
      <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
        className="bg-surface-raised border border-border rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent" />
      <input placeholder="Téléphone" value={telephone} onChange={(e) => setTelephone(e.target.value)}
        className="bg-surface-raised border border-border rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent" />
      <button type="submit" className="col-span-2 bg-accent text-accent-contrast text-sm font-medium rounded-md py-2 hover:opacity-90 transition-opacity">
        Ajouter
      </button>
    </form>
  );
}