"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formaterMontant } from "@/lib/format";
import { AlertTriangle, Mail, X, Copy, Check } from "lucide-react";

type Contact = { nom: string; email: string | null };
type FactureImpayee = {
  id: number;
  numero: string;
  entreprise: { id: number; nom: string } | null;
  contacts: Contact[];
  date_emission: string;
  date_echeance: string | null;
  montant_ttc: number;
  solde_du: number;
  statut: string;
  jours_retard: number | null;
};

const LABEL_STATUT: Record<string, string> = {
  ENVOYEE: "Envoyée",
  PARTIELLEMENT_PAYEE: "Partiellement payée",
  EN_RETARD: "En retard",
};

export default function PageImpayes() {
  const [factures, setFactures] = useState<FactureImpayee[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [seulementEnRetard, setSeulementEnRetard] = useState(false);
  const [factureRelance, setFactureRelance] = useState<FactureImpayee | null>(null);

  useEffect(() => {
    api.factures.listerImpayes().then(setFactures).catch((e) => setErreur(e.message)).finally(() => setChargement(false));
  }, []);

  if (erreur) return <div className="p-8 text-danger text-sm">{erreur}</div>;

  const facturesAffichees = [...factures]
    .filter((f) => !seulementEnRetard || (f.jours_retard !== null && f.jours_retard > 0))
    .sort((a, b) => (b.jours_retard ?? -999) - (a.jours_retard ?? -999));

  const totalDu = facturesAffichees.reduce((t, f) => t + f.solde_du, 0);
  const nbEnRetard = factures.filter((f) => f.jours_retard !== null && f.jours_retard > 0).length;

  return (
    <div className="p-8 max-w-5xl">
      <header className="mb-6">
        <h1 className="font-[family-name:var(--font-display)] text-2xl text-text">Impayés</h1>
        <p className="text-text-muted text-sm mt-1">Toutes les factures avec un solde dû, toutes entreprises confondues</p>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-surface border border-border rounded-lg p-4">
          <p className="text-text-muted text-xs mb-1.5">Total dû</p>
          <p className="font-[family-name:var(--font-display)] text-lg text-danger">{formaterMontant(totalDu)}</p>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4">
          <p className="text-text-muted text-xs mb-1.5">Factures impayées</p>
          <p className="font-[family-name:var(--font-display)] text-lg text-text">{factures.length}</p>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4">
          <p className="text-text-muted text-xs mb-1.5 flex items-center gap-1.5">
            <AlertTriangle size={13} className="text-danger" /> Dont en retard
          </p>
          <p className="font-[family-name:var(--font-display)] text-lg text-danger">{nbEnRetard}</p>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-text-muted mb-4 w-fit cursor-pointer">
        <input type="checkbox" checked={seulementEnRetard} onChange={(e) => setSeulementEnRetard(e.target.checked)} />
        N'afficher que les factures en retard
      </label>

      {chargement ? (
        <p className="text-text-muted text-sm">Chargement...</p>
      ) : facturesAffichees.length === 0 ? (
        <p className="text-text-muted text-sm">Aucune facture impayée ne correspond.</p>
      ) : (
        <div className="bg-surface border border-border rounded-lg divide-y divide-border">
          {facturesAffichees.map((f) => (
            <div key={f.id} className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm text-text">
                  <Link href={`/factures/${f.id}`} className="hover:text-accent transition-colors font-mono text-xs">{f.numero}</Link>
                  {" · "}{f.entreprise?.nom || "—"}
                </p>
                <p className="text-xs text-text-muted">
                  Échéance {f.date_echeance ? new Date(f.date_echeance).toLocaleDateString("fr-FR") : "non définie"}
                  {f.jours_retard !== null && f.jours_retard > 0 && (
                    <span className="text-danger font-medium"> · {f.jours_retard} j de retard</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-danger text-sm">{formaterMontant(f.solde_du)} dû</span>
                <button
                  onClick={() => setFactureRelance(f)}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border border-border text-text-muted hover:border-accent hover:text-accent transition-colors"
                >
                  <Mail size={13} /> Relancer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {factureRelance && (
        <ModalRelance facture={factureRelance} onFermer={() => setFactureRelance(null)} />
      )}
    </div>
  );
}

function genererTexteRelance(f: FactureImpayee) {
  const contact = f.contacts[0];
  const prenom = contact?.nom ? contact.nom.split(" ")[0] : "";
  const echeance = f.date_echeance ? new Date(f.date_echeance).toLocaleDateString("fr-FR") : "";
  const objet = `Relance : facture ${f.numero} en attente de règlement`;
  const corps = `Bonjour${prenom ? ` ${prenom}` : ""},

Nous nous permettons de revenir vers vous concernant la facture ${f.numero}${echeance ? ` dont l'échéance était fixée au ${echeance}` : ""}.

À ce jour, un solde de ${formaterMontant(f.solde_du)} reste dû sur cette facture.

Pourriez-vous nous indiquer une date prévisionnelle de règlement, ou nous transmettre le paiement dans les meilleurs délais ?

N'hésitez pas à revenir vers nous pour toute question.

Cordialement`;
  return { objet, corps };
}

function ModalRelance({ facture, onFermer }: { facture: FactureImpayee; onFermer: () => void }) {
  const { objet, corps } = genererTexteRelance(facture);
  const [copie, setCopie] = useState(false);
  const contact = facture.contacts[0];

  function copier() {
    navigator.clipboard.writeText(`Objet : ${objet}\n\n${corps}`);
    setCopie(true);
    setTimeout(() => setCopie(false), 2000);
  }

  const lienMailto = `mailto:${contact?.email || ""}?subject=${encodeURIComponent(objet)}&body=${encodeURIComponent(corps)}`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onFermer}>
      <div className="bg-surface border border-border rounded-lg p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-text font-medium">Relance — {facture.numero}</h2>
          <button onClick={onFermer} className="text-text-muted hover:text-text">
            <X size={18} />
          </button>
        </div>

        {!contact?.email && (
          <p className="text-danger text-xs mb-3">Aucun email de contact enregistré pour cette entreprise — ajoute un contact avant d'envoyer.</p>
        )}

        <p className="text-xs text-text-muted mb-1.5">Objet</p>
        <p className="text-sm text-text bg-surface-raised border border-border rounded-md px-3 py-2 mb-3">{objet}</p>

        <p className="text-xs text-text-muted mb-1.5">Message</p>
        <pre className="text-sm text-text bg-surface-raised border border-border rounded-md px-3 py-2 whitespace-pre-wrap font-sans mb-4">{corps}</pre>

        <div className="flex gap-2">
          <button
            onClick={copier}
            className="flex-1 flex items-center justify-center gap-1.5 border border-border rounded-md py-2 text-sm text-text hover:border-accent transition-colors"
          >
            {copie ? <Check size={14} className="text-success" /> : <Copy size={14} />}
            {copie ? "Copié" : "Copier"}
          </button>
          
            href={lienMailto}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium transition-opacity ${
              contact?.email ? "bg-accent text-accent-contrast hover:opacity-90" : "bg-surface-raised text-text-muted pointer-events-none"
            }`}
          <a>
            <Mail size={14} /> Ouvrir dans ma messagerie
          </a>
        </div>
      </div>
    </div>
  );
}