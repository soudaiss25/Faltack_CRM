"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formaterMontant } from "@/lib/format";
import {
  ArrowLeft, Plus, Trash2, FileText, TrendingUp, TrendingDown,
  Wallet, LineChart as LineChartIcon, Percent, Clock,
  CheckCircle2, AlertTriangle, Lightbulb,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell,
} from "recharts";

type Contact = { id: number; nom: string; fonction: string | null; email: string | null; telephone: string | null };
type Facture = { id: number; numero: string; statut: string; date_emission: string; montants: { montantTTC: number; soldeDu: number } };
type Interaction = { id: number; type: string; contenu: string; fait_le: string; cree_par?: { nom: string } };
type Depense = { id: number; libelle: string; categorie: string; montant: number; date_depense: string };
type Honoraire = { id: number; libelle: string; montant: number; date_facturation: string; date_paiement: string | null };
type Entreprise = {
  id: number; nom: string; siret: string | null; adresse: string | null; statut: string;
  contacts: Contact[]; factures: Facture[]; interactions: Interaction[];
};
type Diagnostic = { points_forts: string[]; points_faibles: string[]; opportunites: string[] };
type Analyse = {
  ca_facture: number; ca_encaisse: number; solde_du: number; total_depenses: number; marge: number;
  depenses_par_categorie: Record<string, number>;
  evolution_mensuelle: { cle: string; label: string; encaisse: number; depenses: number }[];
  taux_marge: number | null;
  taux_impaye: number | null;
  delai_moyen_paiement_jours: number | null;
  evolution_ca_pct: number | null;
  diagnostic: Diagnostic;
};

const LABEL_STATUT: Record<string, string> = {
  PROSPECT: "Prospect", DEVIS_ENVOYE: "Devis envoyé", SIGNE: "Signé", CLIENT_ACTIF: "Client actif",
};
const LABEL_TYPE_INTERACTION: Record<string, string> = {
  NOTE: "Note", APPEL: "Appel", EMAIL: "Email", TACHE: "Tâche",
};
const LABEL_CATEGORIE: Record<string, string> = {
  LOYER: "Loyer", SALAIRES: "Salaires", ACHATS: "Achats", MARKETING: "Marketing",
  FOURNITURES: "Fournitures", TRANSPORT: "Transport", AUTRE: "Autre",
};
const COULEURS_CATEGORIE = ["#5b5cf0", "#16a34a", "#d97706", "#e11d48", "#0891b2", "#7c3aed", "#6d6d87"];

const ONGLETS = [
  { id: "finance", label: "Vue financière" },
  { id: "factures", label: "Factures" },
  { id: "depenses", label: "Dépenses" },
  { id: "contacts", label: "Contacts" },
  { id: "historique", label: "Historique" },
  { id: "honoraires", label: "Prestations" },
] as const;
type OngletId = typeof ONGLETS[number]["id"];

export default function PageDetailEntreprise({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { utilisateur } = useAuth();
  const estStaff = utilisateur?.role !== "CLIENT";
  const [entreprise, setEntreprise] = useState<Entreprise | null>(null);
  const [ongletActif, setOngletActif] = useState<OngletId>("finance");

  function recharger() {
    api.entreprises.obtenir(Number(id)).then(setEntreprise);
  }

  useEffect(recharger, [id]);

  if (!entreprise) return <div className="p-8 text-text-muted text-sm">Chargement...</div>;

  const onglets = estStaff ? ONGLETS : ONGLETS.filter((o) => o.id !== "honoraires");

  return (
    <div className="p-8 max-w-5xl">
      <Link href="/entreprises" className="inline-flex items-center gap-1.5 text-text-muted hover:text-text text-sm mb-6 transition-colors">
        <ArrowLeft size={14} /> Retour aux entreprises
      </Link>

      <header className="mb-6 flex items-start justify-between">
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

      <div className="flex gap-1 border-b border-border mb-6">
        {onglets.map((o) => (
          <button
            key={o.id}
            onClick={() => setOngletActif(o.id)}
            className={`px-4 py-2.5 text-sm border-b-2 transition-colors -mb-px ${
              ongletActif === o.id
                ? "border-accent text-accent font-medium"
                : "border-transparent text-text-muted hover:text-text"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {ongletActif === "finance" && <OngletFinance entrepriseId={entreprise.id} />}
      {ongletActif === "factures" && <OngletFactures entreprise={entreprise} estStaff={estStaff} />}
      {ongletActif === "depenses" && <OngletDepenses entrepriseId={entreprise.id} estStaff={estStaff} />}
      {ongletActif === "contacts" && <OngletContacts entreprise={entreprise} estStaff={estStaff} onAjout={recharger} />}
      {ongletActif === "historique" && (
        <HistoriqueCRM entrepriseId={entreprise.id} interactions={entreprise.interactions} estStaff={estStaff} onAjout={recharger} />
      )}
      {ongletActif === "honoraires" && estStaff && <OngletHonoraires entrepriseId={entreprise.id} />}
    </div>
  );
}

function OngletFinance({ entrepriseId }: { entrepriseId: number }) {
  const [analyse, setAnalyse] = useState<Analyse | null>(null);

  useEffect(() => {
    api.analyse.obtenir(entrepriseId).then(setAnalyse);
  }, [entrepriseId]);

  if (!analyse) return <p className="text-text-muted text-sm">Chargement de l&apos;analyse...</p>;

  const donneesCategories = Object.entries(analyse.depenses_par_categorie).map(([cle, valeur]) => ({
    name: LABEL_CATEGORIE[cle] || cle,
    value: valeur,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <CarteStat icone={<TrendingUp size={15} className="text-text-muted" />} label="CA facturé" valeur={formaterMontant(analyse.ca_facture)} />
        <CarteStat icone={<TrendingUp size={15} className="text-success" />} label="CA encaissé" valeur={formaterMontant(analyse.ca_encaisse)} />
        <CarteStat icone={<TrendingDown size={15} className="text-danger" />} label="Dépenses" valeur={formaterMontant(analyse.total_depenses)} />
        <CarteStat
          icone={<Wallet size={15} className={analyse.marge >= 0 ? "text-success" : "text-danger"} />}
          label="Marge"
          valeur={formaterMontant(analyse.marge)}
          accent={analyse.marge >= 0 ? "success" : "danger"}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <CarteStat
          icone={<Percent size={15} className="text-text-muted" />}
          label="Taux de marge"
          valeur={analyse.taux_marge !== null ? `${analyse.taux_marge.toFixed(0)}%` : "—"}
          accent={analyse.taux_marge !== null && analyse.taux_marge < 0 ? "danger" : undefined}
        />
        <CarteStat
          icone={<Percent size={15} className="text-text-muted" />}
          label="Taux d'impayés"
          valeur={analyse.taux_impaye !== null ? `${analyse.taux_impaye.toFixed(0)}%` : "—"}
          accent={analyse.taux_impaye !== null && analyse.taux_impaye > 20 ? "danger" : undefined}
        />
        <CarteStat
          icone={<Clock size={15} className="text-text-muted" />}
          label="Délai moyen paiement"
          valeur={analyse.delai_moyen_paiement_jours !== null ? `${Math.round(analyse.delai_moyen_paiement_jours)} j` : "—"}
        />
        <CarteStat
          icone={
            analyse.evolution_ca_pct !== null && analyse.evolution_ca_pct < 0
              ? <TrendingDown size={15} className="text-danger" />
              : <TrendingUp size={15} className="text-success" />
          }
          label="Évolution encaissé"
          valeur={analyse.evolution_ca_pct !== null ? `${analyse.evolution_ca_pct >= 0 ? "+" : ""}${analyse.evolution_ca_pct.toFixed(0)}%` : "—"}
          accent={analyse.evolution_ca_pct !== null ? (analyse.evolution_ca_pct >= 0 ? "success" : "danger") : undefined}
        />
      </div>

      {(analyse.diagnostic.points_forts.length > 0 || analyse.diagnostic.points_faibles.length > 0 || analyse.diagnostic.opportunites.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {analyse.diagnostic.points_forts.length > 0 && (
            <PanneauDiagnostic titre="Points forts" icone={<CheckCircle2 size={15} className="text-success" />} items={analyse.diagnostic.points_forts} couleur="success" />
          )}
          {analyse.diagnostic.points_faibles.length > 0 && (
            <PanneauDiagnostic titre="Points faibles" icone={<AlertTriangle size={15} className="text-danger" />} items={analyse.diagnostic.points_faibles} couleur="danger" />
          )}
          {analyse.diagnostic.opportunites.length > 0 && (
            <PanneauDiagnostic titre="Opportunités" icone={<Lightbulb size={15} className="text-accent" />} items={analyse.diagnostic.opportunites} couleur="accent" />
          )}
        </div>
      )}

      <div className="bg-surface border border-border rounded-lg p-5">
        <h3 className="text-sm text-text-muted mb-4 flex items-center gap-2">
          <LineChartIcon size={15} /> Évolution sur 6 mois
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={analyse.evolution_mensuelle} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorEncaisse" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorDepenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#e11d48" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#e11d48" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e6e5f5" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#6d6d87" }} axisLine={{ stroke: "#e6e5f5" }} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#6d6d87" }} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(valeur) => formaterMontant(Number(valeur ?? 0))}
              contentStyle={{ background: "#ffffff", border: "1px solid #e6e5f5", borderRadius: 8, fontSize: 13 }}
            />
            <Area type="monotone" dataKey="encaisse" name="Encaissé" stroke="#16a34a" fill="url(#colorEncaisse)" strokeWidth={2} />
            <Area type="monotone" dataKey="depenses" name="Dépenses" stroke="#e11d48" fill="url(#colorDepenses)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {donneesCategories.length > 0 && (
        <div className="bg-surface border border-border rounded-lg p-5">
          <h3 className="text-sm text-text-muted mb-4">Répartition des dépenses</h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={donneesCategories} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={2}>
                  {donneesCategories.map((_, i) => (
                    <Cell key={i} fill={COULEURS_CATEGORIE[i % COULEURS_CATEGORIE.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(valeur) => formaterMontant(Number(valeur ?? 0))} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 text-sm">
              {donneesCategories.map((c, i) => (
                <div key={c.name} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: COULEURS_CATEGORIE[i % COULEURS_CATEGORIE.length] }} />
                  <span className="text-text-muted">{c.name}</span>
                  <span className="text-text ml-1">{formaterMontant(c.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PanneauDiagnostic({
  titre, icone, items, couleur,
}: { titre: string; icone: React.ReactNode; items: string[]; couleur: "success" | "danger" | "accent" }) {
  const bordure = couleur === "success" ? "border-success/30" : couleur === "danger" ? "border-danger/30" : "border-accent/30";
  return (
    <div className={`bg-surface border ${bordure} rounded-lg p-4`}>
      <h3 className="text-sm text-text flex items-center gap-2 mb-2.5 font-medium">{icone}{titre}</h3>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="text-xs text-text-muted leading-relaxed">{item}</li>
        ))}
      </ul>
    </div>
  );
}

function CarteStat({ icone, label, valeur, accent }: { icone: React.ReactNode; label: string; valeur: string; accent?: "success" | "danger" }) {
  const couleurTexte = accent === "success" ? "text-success" : accent === "danger" ? "text-danger" : "text-text";
  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <div className="flex items-center gap-1.5 text-text-muted text-xs mb-1.5">{icone}{label}</div>
      <p className={`font-[family-name:var(--font-display)] text-lg ${couleurTexte}`}>{valeur}</p>
    </div>
  );
}

function OngletFactures({ entreprise, estStaff }: { entreprise: Entreprise; estStaff: boolean }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm text-text-muted">{entreprise.factures.length} facture(s)</h2>
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
    </div>
  );
}

function OngletDepenses({ entrepriseId, estStaff }: { entrepriseId: number; estStaff: boolean }) {
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [chargement, setChargement] = useState(true);

  function recharger() {
    api.depenses.lister(entrepriseId).then(setDepenses).finally(() => setChargement(false));
  }

  useEffect(recharger, [entrepriseId]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm text-text-muted">{depenses.length} dépense(s)</h2>
        {estStaff && (
          <button onClick={() => setFormulaireOuvert(!formulaireOuvert)} className="flex items-center gap-1.5 text-xs text-accent hover:opacity-80">
            <Plus size={14} /> Ajouter une dépense
          </button>
        )}
      </div>

      {formulaireOuvert && (
        <FormulaireDepense entrepriseId={entrepriseId} onCree={() => { setFormulaireOuvert(false); recharger(); }} />
      )}

      {chargement ? (
        <p className="text-text-muted text-sm">Chargement...</p>
      ) : depenses.length === 0 ? (
        <p className="text-text-muted text-sm">Aucune dépense enregistrée pour cette entreprise.</p>
      ) : (
        <div className="bg-surface border border-border rounded-lg divide-y divide-border">
          {depenses.map((d) => (
            <div key={d.id} className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm text-text">{d.libelle}</p>
                <p className="text-xs text-text-muted">
                  {LABEL_CATEGORIE[d.categorie]} · {new Date(d.date_depense).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-danger text-sm">-{formaterMontant(d.montant)}</span>
                {estStaff && (
                  <button onClick={() => api.depenses.supprimer(d.id).then(recharger)} className="text-text-muted hover:text-danger transition-colors">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FormulaireDepense({ entrepriseId, onCree }: { entrepriseId: number; onCree: () => void }) {
  const [libelle, setLibelle] = useState("");
  const [categorie, setCategorie] = useState("AUTRE");
  const [montant, setMontant] = useState(0);
  const [dateDepense, setDateDepense] = useState(new Date().toISOString().slice(0, 10));
  const [erreur, setErreur] = useState("");

  async function gererSoumission(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.depenses.creer(entrepriseId, { libelle, categorie, montant, date_depense: dateDepense });
      onCree();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur");
    }
  }

  return (
    <form onSubmit={gererSoumission} className="bg-surface border border-border rounded-lg p-4 mb-3 grid grid-cols-2 gap-3">
      <input required placeholder="Libellé" value={libelle} onChange={(e) => setLibelle(e.target.value)}
        className="col-span-2 bg-surface-raised border border-border rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent" />
      <select value={categorie} onChange={(e) => setCategorie(e.target.value)}
        className="bg-surface-raised border border-border rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent">
        {Object.entries(LABEL_CATEGORIE).map(([cle, label]) => (
          <option key={cle} value={cle}>{label}</option>
        ))}
      </select>
      <input type="number" step="0.01" min={0} required placeholder="Montant" value={montant || ""} onChange={(e) => setMontant(Number(e.target.value))}
        className="bg-surface-raised border border-border rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent" />
      <input type="date" required value={dateDepense} onChange={(e) => setDateDepense(e.target.value)}
        className="col-span-2 bg-surface-raised border border-border rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent" />
      {erreur && <p className="col-span-2 text-danger text-xs">{erreur}</p>}
      <button type="submit" className="col-span-2 bg-accent text-accent-contrast text-sm font-medium rounded-md py-2 hover:opacity-90 transition-opacity">
        Ajouter
      </button>
    </form>
  );
}

function OngletContacts({ entreprise, estStaff, onAjout }: { entreprise: Entreprise; estStaff: boolean; onAjout: () => void }) {
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm text-text-muted">{entreprise.contacts.length} contact(s)</h2>
        {estStaff && (
          <button onClick={() => setFormulaireOuvert(!formulaireOuvert)} className="flex items-center gap-1.5 text-xs text-accent hover:opacity-80">
            <Plus size={14} /> Ajouter un contact
          </button>
        )}
      </div>

      {formulaireOuvert && (
        <FormulaireContact entrepriseId={entreprise.id} onCree={() => { setFormulaireOuvert(false); onAjout(); }} />
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
                <button onClick={() => api.contacts.supprimer(c.id).then(onAjout)} className="text-text-muted hover:text-danger transition-colors">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
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

function HistoriqueCRM({
  entrepriseId, interactions, estStaff, onAjout,
}: { entrepriseId: number; interactions: Interaction[]; estStaff: boolean; onAjout: () => void }) {
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [type, setType] = useState("NOTE");
  const [contenu, setContenu] = useState("");

  async function gererSoumission(e: React.FormEvent) {
    e.preventDefault();
    await api.interactions.creer(entrepriseId, { type, contenu, fait_le: new Date().toISOString().slice(0, 10) });
    setContenu("");
    setFormulaireOuvert(false);
    onAjout();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm text-text-muted">{interactions.length} échange(s)</h2>
        {estStaff && (
          <button onClick={() => setFormulaireOuvert(!formulaireOuvert)} className="flex items-center gap-1.5 text-xs text-accent hover:opacity-80">
            <Plus size={14} /> Ajouter une note
          </button>
        )}
      </div>

      {formulaireOuvert && (
        <form onSubmit={gererSoumission} className="bg-surface border border-border rounded-lg p-4 mb-3 space-y-3">
          <select value={type} onChange={(e) => setType(e.target.value)}
            className="bg-surface-raised border border-border rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent">
            <option value="NOTE">Note</option>
            <option value="APPEL">Appel</option>
            <option value="EMAIL">Email</option>
            <option value="TACHE">Tâche</option>
          </select>
          <textarea
            required
            rows={3}
            placeholder="Contenu de l'échange..."
            value={contenu}
            onChange={(e) => setContenu(e.target.value)}
            className="w-full bg-surface-raised border border-border rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent resize-none"
          />
          <button type="submit" className="bg-accent text-accent-contrast text-sm font-medium rounded-md px-4 py-2 hover:opacity-90 transition-opacity">
            Ajouter
          </button>
        </form>
      )}

      {interactions.length === 0 ? (
        <p className="text-text-muted text-sm">Aucun échange enregistré pour le moment.</p>
      ) : (
        <div className="bg-surface border border-border rounded-lg divide-y divide-border">
          {interactions.map((i) => (
            <div key={i.id} className="px-4 py-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs px-2 py-0.5 rounded-full bg-accent-soft text-accent">
                  {LABEL_TYPE_INTERACTION[i.type]}
                </span>
                <span className="text-xs text-text-muted">
                  {new Date(i.fait_le).toLocaleDateString("fr-FR")}
                  {i.cree_par ? ` · ${i.cree_par.nom}` : ""}
                </span>
              </div>
              <p className="text-sm text-text">{i.contenu}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OngletHonoraires({ entrepriseId }: { entrepriseId: number }) {
  const [honoraires, setHonoraires] = useState<Honoraire[]>([]);
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  function recharger() {
    api.honoraires.lister(entrepriseId).then(setHonoraires).finally(() => setChargement(false));
  }

  useEffect(recharger, [entrepriseId]);

  async function gererMarquerPaye(id: number) {
    setErreur("");
    try {
      await api.honoraires.marquerPaye(id);
      recharger();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur lors du marquage comme payée");
    }
  }

  async function gererSuppression(id: number) {
    setErreur("");
    try {
      await api.honoraires.supprimer(id);
      recharger();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur lors de la suppression");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm text-text-muted">{honoraires.length} prestation(s)</h2>
        <button onClick={() => setFormulaireOuvert(!formulaireOuvert)} className="flex items-center gap-1.5 text-xs text-accent hover:opacity-80">
          <Plus size={14} /> Ajouter une prestation
        </button>
      </div>

      {erreur && <p className="text-danger text-xs mb-3">{erreur}</p>}

      {formulaireOuvert && (
        <FormulaireHonoraire entrepriseId={entrepriseId} onCree={() => { setFormulaireOuvert(false); recharger(); }} />
      )}

      {chargement ? (
        <p className="text-text-muted text-sm">Chargement...</p>
      ) : honoraires.length === 0 ? (
        <p className="text-text-muted text-sm">Aucune prestation facturée à cette entreprise.</p>
      ) : (
        <div className="bg-surface border border-border rounded-lg divide-y divide-border">
          {honoraires.map((h) => (
            <div key={h.id} className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm text-text">{h.libelle}</p>
                <p className="text-xs text-text-muted">
                  Facturée le {new Date(h.date_facturation).toLocaleDateString("fr-FR")}
                  {h.date_paiement ? ` · Payée le ${new Date(h.date_paiement).toLocaleDateString("fr-FR")}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-text text-sm">{formaterMontant(h.montant)}</span>
                {h.date_paiement ? (
                  <span className="text-xs px-2 py-1 rounded-full bg-success/10 text-success font-medium">Payée</span>
                ) : (
                  <button
                    onClick={() => gererMarquerPaye(h.id)}
                    className="text-xs px-2 py-1 rounded-md border border-border text-text-muted hover:border-accent hover:text-accent transition-colors"
                  >
                    Marquer payée
                  </button>
                )}
                <button onClick={() => gererSuppression(h.id)} className="text-text-muted hover:text-danger transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FormulaireHonoraire({ entrepriseId, onCree }: { entrepriseId: number; onCree: () => void }) {
  const [libelle, setLibelle] = useState("");
  const [montant, setMontant] = useState(0);
  const [dateFacturation, setDateFacturation] = useState(new Date().toISOString().slice(0, 10));
  const [erreur, setErreur] = useState("");

  async function gererSoumission(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.honoraires.creer(entrepriseId, { libelle, montant, date_facturation: dateFacturation });
      onCree();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur");
    }
  }

  return (
    <form onSubmit={gererSoumission} className="bg-surface border border-border rounded-lg p-4 mb-3 grid grid-cols-2 gap-3">
      <input required placeholder="Libellé" value={libelle} onChange={(e) => setLibelle(e.target.value)}
        className="col-span-2 bg-surface-raised border border-border rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent" />
      <input type="number" step="0.01" min={0} required placeholder="Montant" value={montant || ""} onChange={(e) => setMontant(Number(e.target.value))}
        className="bg-surface-raised border border-border rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent" />
      <input type="date" required value={dateFacturation} onChange={(e) => setDateFacturation(e.target.value)}
        className="bg-surface-raised border border-border rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent" />
      {erreur && <p className="col-span-2 text-danger text-xs">{erreur}</p>}
      <button type="submit" className="col-span-2 bg-accent text-accent-contrast text-sm font-medium rounded-md py-2 hover:opacity-90 transition-opacity">
        Ajouter
      </button>
    </form>
  );
}