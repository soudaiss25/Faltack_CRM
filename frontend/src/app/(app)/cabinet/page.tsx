"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formaterMontant } from "@/lib/format";
import { TrendingUp, TrendingDown, Wallet, Plus, Trash2, Trophy, Users, UserPlus, ListFilter } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

type StatsCabinet = {
  honoraires_factures: number;
  honoraires_encaisses: number;
  honoraires_suivis: number;
  honoraires_occasionnels: number;
  total_depenses_internes: number;
  marge_cabinet: number;
  top_clients: { nom: string; montant: number }[];
  depenses_par_categorie: Record<string, number>;
  nb_honoraires: number;
};

type DepenseInterne = { id: number; libelle: string; categorie: string; montant: number; date_depense: string };
type EntrepriseOption = { id: number; nom: string };
type PaiementPrestation = {
  id: number;
  libelle: string;
  montant: number;
  date_paiement: string;
  nom_client: string;
  type_client: "suivi" | "occasionnel";
};

type PresetId = "mois" | "mois_dernier" | "trimestre" | "annee" | "tout";
const PRESETS: { id: PresetId; label: string }[] = [
  { id: "mois", label: "Ce mois-ci" },
  { id: "mois_dernier", label: "Mois dernier" },
  { id: "trimestre", label: "Ce trimestre" },
  { id: "annee", label: "Cette année" },
  { id: "tout", label: "Tout" },
];

const LABEL_CATEGORIE: Record<string, string> = {
  LOYER: "Loyer", SALAIRES: "Salaires", ACHATS: "Achats", MARKETING: "Marketing",
  FOURNITURES: "Fournitures", TRANSPORT: "Transport", AUTRE: "Autre",
};
const COULEURS_CATEGORIE = ["#5b5cf0", "#16a34a", "#d97706", "#e11d48", "#0891b2", "#7c3aed", "#6d6d87"];

const ONGLETS_CABINET = [
  { id: "vue", label: "Vue d'ensemble" },
  { id: "paiements", label: "Paiements de prestations" },
] as const;
type OngletCabinetId = typeof ONGLETS_CABINET[number]["id"];

function formaterDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function bornesDuMois(mois: string): { debut: string; fin: string } {
  const [annee, m] = mois.split("-").map(Number);
  return { debut: formaterDate(new Date(annee, m - 1, 1)), fin: formaterDate(new Date(annee, m, 0)) };
}

function calculerBornes(preset: PresetId): { debut: string; fin: string } | null {
  const maintenant = new Date();
  const annee = maintenant.getFullYear();
  const mois = maintenant.getMonth();
  switch (preset) {
    case "mois":
      return { debut: formaterDate(new Date(annee, mois, 1)), fin: formaterDate(maintenant) };
    case "mois_dernier": {
      return { debut: formaterDate(new Date(annee, mois - 1, 1)), fin: formaterDate(new Date(annee, mois, 0)) };
    }
    case "trimestre": {
      const debutTrimestre = Math.floor(mois / 3) * 3;
      return { debut: formaterDate(new Date(annee, debutTrimestre, 1)), fin: formaterDate(maintenant) };
    }
    case "annee":
      return { debut: formaterDate(new Date(annee, 0, 1)), fin: formaterDate(maintenant) };
    default:
      return null;
  }
}

export default function PageCabinet() {
  const { utilisateur } = useAuth();
  const estSuperAdmin = utilisateur?.role === "SUPER_ADMIN";
  const [ongletActif, setOngletActif] = useState<OngletCabinetId>("vue");
  const [stats, setStats] = useState<StatsCabinet | null>(null);
  const [depenses, setDepenses] = useState<DepenseInterne[]>([]);
  const [erreur, setErreur] = useState("");
  const [preset, setPreset] = useState<PresetId>("mois");
  const [formulaireDepenseOuvert, setFormulaireDepenseOuvert] = useState(false);
  const [formulaireHonoraireOuvert, setFormulaireHonoraireOuvert] = useState(false);

  const charger = useCallback(() => {
    const bornes = calculerBornes(preset);
    api.cabinet.stats({ date_debut: bornes?.debut, date_fin: bornes?.fin }).then(setStats).catch((e) => setErreur(e.message));
  }, [preset]);

  function rechargerDepenses() {
    api.depensesCabinet.lister().then(setDepenses).catch(() => {});
  }

  useEffect(() => { charger(); }, [charger]);
  useEffect(rechargerDepenses, []);

  if (erreur) return <div className="p-8 text-danger text-sm">{erreur}</div>;

  const donneesCategories = stats
    ? Object.entries(stats.depenses_par_categorie).map(([cle, valeur]) => ({ name: LABEL_CATEGORIE[cle] || cle, value: valeur }))
    : [];

  return (
    <div className="p-8 max-w-5xl">
      <header className="mb-6">
        <h1 className="font-[family-name:var(--font-display)] text-2xl text-text">Mon cabinet</h1>
        <p className="text-text-muted text-sm mt-1">Ce que le cabinet gagne et dépense pour lui-même — indépendamment de l&apos;activité de ses clients</p>
      </header>

      <div className="flex gap-1 border-b border-border mb-6">
        {ONGLETS_CABINET.map((o) => (
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

      {ongletActif === "vue" && (
        <div className="flex gap-1 mb-8 bg-surface border border-border rounded-lg p-3 w-fit">
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
      )}

      {ongletActif === "vue" ? (
        !stats ? (
          <p className="text-text-muted text-sm">Chargement...</p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <CarteStat icone={<TrendingUp size={16} className="text-text-muted" />} label="Prestations facturées" valeur={formaterMontant(stats.honoraires_factures)} />
              <CarteStat icone={<TrendingUp size={16} className="text-success" />} label="Prestations encaissées" valeur={formaterMontant(stats.honoraires_encaisses)} />
              <CarteStat icone={<TrendingDown size={16} className="text-danger" />} label="Dépenses internes" valeur={formaterMontant(stats.total_depenses_internes)} />
              <CarteStat
                icone={<Wallet size={16} className={stats.marge_cabinet >= 0 ? "text-success" : "text-danger"} />}
                label="Marge du cabinet"
                valeur={formaterMontant(stats.marge_cabinet)}
                accent={stats.marge_cabinet >= 0 ? "success" : "danger"}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <CarteStat icone={<Users size={16} className="text-text-muted" />} label="Prestations — clients suivis" valeur={formaterMontant(stats.honoraires_suivis)} />
              <CarteStat icone={<UserPlus size={16} className="text-text-muted" />} label="Prestations — clients occasionnels" valeur={formaterMontant(stats.honoraires_occasionnels)} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-surface border border-border rounded-lg p-5">
                <h2 className="text-sm text-text-muted mb-4 flex items-center gap-2">
                  <Trophy size={15} /> Clients les plus rentables (prestations)
                </h2>
                {stats.top_clients.length === 0 ? (
                  <p className="text-text-muted text-sm">Aucune prestation facturée sur cette période.</p>
                ) : (
                  <div className="space-y-2">
                    {stats.top_clients.map((c, i) => (
                      <div key={c.nom} className="flex items-center justify-between text-sm">
                        <span className="text-text-muted">{i + 1}. {c.nom}</span>
                        <span className="text-text">{formaterMontant(c.montant)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-surface border border-border rounded-lg p-5">
                <h2 className="text-sm text-text-muted mb-4">Répartition des dépenses internes</h2>
                {donneesCategories.length === 0 ? (
                  <p className="text-text-muted text-sm">Aucune dépense interne sur cette période.</p>
                ) : (
                  <div className="flex items-center gap-6">
                    <ResponsiveContainer width={140} height={140}>
                      <PieChart>
                        <Pie data={donneesCategories} dataKey="value" nameKey="name" innerRadius={35} outerRadius={65} paddingAngle={2}>
                          {donneesCategories.map((_, i) => (
                            <Cell key={i} fill={COULEURS_CATEGORIE[i % COULEURS_CATEGORIE.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => formaterMontant(Number(v ?? 0))} />
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
                )}
              </div>
            </div>

            <section className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm text-text-muted">Ajouter une prestation</h2>
                <button onClick={() => setFormulaireHonoraireOuvert(!formulaireHonoraireOuvert)} className="flex items-center gap-1.5 text-xs text-accent hover:opacity-80">
                  <Plus size={14} /> Nouvelle prestation
                </button>
              </div>
              {formulaireHonoraireOuvert && (
                <FormulaireHonoraireCabinet onCree={() => { setFormulaireHonoraireOuvert(false); charger(); }} />
              )}
            </section>

            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm text-text-muted">Dépenses internes ({depenses.length})</h2>
                {estSuperAdmin && (
                  <button onClick={() => setFormulaireDepenseOuvert(!formulaireDepenseOuvert)} className="flex items-center gap-1.5 text-xs text-accent hover:opacity-80">
                    <Plus size={14} /> Ajouter (salaire, loyer...)
                  </button>
                )}
              </div>

              {formulaireDepenseOuvert && estSuperAdmin && (
                <FormulaireDepenseCabinet onCree={() => { setFormulaireDepenseOuvert(false); rechargerDepenses(); charger(); }} />
              )}

              {depenses.length === 0 ? (
                <p className="text-text-muted text-sm">Aucune dépense interne enregistrée.</p>
              ) : (
                <div className="bg-surface border border-border rounded-lg divide-y divide-border">
                  {depenses.map((d) => (
                    <div key={d.id} className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-text">{d.libelle}</p>
                        <p className="text-xs text-text-muted">{LABEL_CATEGORIE[d.categorie]} · {new Date(d.date_depense).toLocaleDateString("fr-FR")}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-danger text-sm">-{formaterMontant(d.montant)}</span>
                        {estSuperAdmin && (
                          <button
                            onClick={() => api.depensesCabinet.supprimer(d.id).then(() => { rechargerDepenses(); charger(); })}
                            className="text-text-muted hover:text-danger transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )
      ) : (
        <SectionPaiements />
      )}
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

function SectionPaiements() {
  const [paiements, setPaiements] = useState<PaiementPrestation[]>([]);
  const [chargement, setChargement] = useState(true);
  const [typeFiltre, setTypeFiltre] = useState<"tous" | "suivi" | "occasionnel">("tous");
  const [montantMin, setMontantMin] = useState("");
  const [montantMax, setMontantMax] = useState("");
  const [mois, setMois] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");

  const charger = useCallback(() => {
    setChargement(true);
    let debut = dateDebut || undefined;
    let fin = dateFin || undefined;
    if (mois) {
      const bornes = bornesDuMois(mois);
      debut = bornes.debut;
      fin = bornes.fin;
    }
    api.honoraires
      .listerPaiements({
        type: typeFiltre === "tous" ? undefined : typeFiltre,
        montant_min: montantMin ? Number(montantMin) : undefined,
        montant_max: montantMax ? Number(montantMax) : undefined,
        date_debut: debut,
        date_fin: fin,
      })
      .then(setPaiements)
      .finally(() => setChargement(false));
  }, [typeFiltre, montantMin, montantMax, mois, dateDebut, dateFin]);

  useEffect(() => { charger(); }, [charger]);

  const totalFiltre = paiements.reduce((t, p) => t + Number(p.montant), 0);
  const filtresActifs = Boolean(montantMin || montantMax || mois || dateDebut || dateFin || typeFiltre !== "tous");

  function reinitialiser() {
    setTypeFiltre("tous");
    setMontantMin("");
    setMontantMax("");
    setMois("");
    setDateDebut("");
    setDateFin("");
  }

  return (
    <div>
      <h2 className="text-sm text-text-muted mb-3 flex items-center gap-2">
        <ListFilter size={15} /> {paiements.length} paiement(s) reçu(s)
      </h2>

      <div className="bg-surface border border-border rounded-lg p-4 mb-3 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs text-text-muted mb-1">Type de client</label>
          <div className="flex gap-1 bg-surface-raised border border-border rounded-md p-1">
            {([
              { id: "tous", label: "Tous" },
              { id: "suivi", label: "Suivis" },
              { id: "occasionnel", label: "Occasionnels" },
            ] as const).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTypeFiltre(t.id)}
                className={`px-2.5 py-1.5 rounded text-xs transition-colors ${
                  typeFiltre === t.id ? "bg-accent text-accent-contrast" : "text-text-muted"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs text-text-muted mb-1">Montant min</label>
          <input type="number" min={0} step="0.01" value={montantMin} onChange={(e) => setMontantMin(e.target.value)}
            className="w-24 bg-surface-raised border border-border rounded-md px-2 py-1.5 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent" />
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1">Montant max</label>
          <input type="number" min={0} step="0.01" value={montantMax} onChange={(e) => setMontantMax(e.target.value)}
            className="w-24 bg-surface-raised border border-border rounded-md px-2 py-1.5 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent" />
        </div>

        <div>
          <label className="block text-xs text-text-muted mb-1">Mois précis</label>
          <input
            type="month"
            value={mois}
            onChange={(e) => { setMois(e.target.value); setDateDebut(""); setDateFin(""); }}
            className="bg-surface-raised border border-border rounded-md px-2 py-1.5 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        <span className="text-xs text-text-muted pb-2">— ou une période —</span>

        <div>
          <label className="block text-xs text-text-muted mb-1">Du</label>
          <input
            type="date"
            value={dateDebut}
            onChange={(e) => { setDateDebut(e.target.value); setMois(""); }}
            className="bg-surface-raised border border-border rounded-md px-2 py-1.5 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1">Au</label>
          <input
            type="date"
            value={dateFin}
            onChange={(e) => { setDateFin(e.target.value); setMois(""); }}
            className="bg-surface-raised border border-border rounded-md px-2 py-1.5 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        {filtresActifs && (
          <button type="button" onClick={reinitialiser} className="text-xs text-text-muted hover:text-danger transition-colors pb-2">
            Réinitialiser
          </button>
        )}
      </div>

      {chargement ? (
        <p className="text-text-muted text-sm">Chargement...</p>
      ) : paiements.length === 0 ? (
        <p className="text-text-muted text-sm">Aucun paiement ne correspond à ces filtres.</p>
      ) : (
        <>
          <div className="bg-surface border border-border rounded-lg divide-y divide-border">
            {paiements.map((p) => (
              <div key={p.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-text">{p.libelle}</p>
                  <p className="text-xs text-text-muted flex items-center gap-1.5">
                    {p.nom_client}
                    {p.type_client === "occasionnel" && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-accent-soft text-accent">Occasionnel</span>
                    )}
                    <span>· Payée le {new Date(p.date_paiement).toLocaleDateString("fr-FR")}</span>
                  </p>
                </div>
                <span className="text-success text-sm">{formaterMontant(p.montant)}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-text-muted mt-2 text-right">
            Total filtré : <span className="text-text">{formaterMontant(totalFiltre)}</span>
          </p>
        </>
      )}
    </div>
  );
}

function FormulaireHonoraireCabinet({ onCree }: { onCree: () => void }) {
  const [entreprises, setEntreprises] = useState<EntrepriseOption[]>([]);
  const [modeClient, setModeClient] = useState<"suivi" | "occasionnel">("suivi");
  const [entrepriseId, setEntrepriseId] = useState<number | "">("");
  const [nomClientLibre, setNomClientLibre] = useState("");
  const [libelle, setLibelle] = useState("");
  const [montant, setMontant] = useState(0);
  const [dateFacturation, setDateFacturation] = useState(new Date().toISOString().slice(0, 10));
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    api.entreprises.lister().then(setEntreprises).catch(() => {});
  }, []);

  async function gererSoumission(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");

    if (modeClient === "suivi") {
      if (!entrepriseId) {
        setErreur("Sélectionne un client dans la liste");
        return;
      }
      try {
        await api.honoraires.creer(Number(entrepriseId), { libelle, montant, date_facturation: dateFacturation });
        onCree();
      } catch (err) {
        setErreur(err instanceof Error ? err.message : "Erreur");
      }
    } else {
      if (!nomClientLibre.trim()) {
        setErreur("Indique le nom du client");
        return;
      }
      try {
        await api.honoraires.creerOccasionnelle({ libelle, montant, date_facturation: dateFacturation, nom_client_libre: nomClientLibre });
        onCree();
      } catch (err) {
        setErreur(err instanceof Error ? err.message : "Erreur");
      }
    }
  }

  return (
    <form onSubmit={gererSoumission} className="bg-surface border border-border rounded-lg p-4 mb-3 grid grid-cols-2 gap-3">
      <div className="col-span-2 flex gap-1 bg-surface-raised border border-border rounded-md p-1 w-fit">
        <button
          type="button"
          onClick={() => setModeClient("suivi")}
          className={`px-3 py-1.5 rounded text-xs transition-colors ${
            modeClient === "suivi" ? "bg-accent text-accent-contrast" : "text-text-muted"
          }`}
        >
          Client suivi
        </button>
        <button
          type="button"
          onClick={() => setModeClient("occasionnel")}
          className={`px-3 py-1.5 rounded text-xs transition-colors ${
            modeClient === "occasionnel" ? "bg-accent text-accent-contrast" : "text-text-muted"
          }`}
        >
          Client occasionnel
        </button>
      </div>

      {modeClient === "suivi" ? (
        <select
          required
          value={entrepriseId}
          onChange={(e) => setEntrepriseId(e.target.value ? Number(e.target.value) : "")}
          className="col-span-2 bg-surface-raised border border-border rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="">Choisir un client dans la base...</option>
          {entreprises.map((e) => (
            <option key={e.id} value={e.id}>{e.nom}</option>
          ))}
        </select>
      ) : (
        <input
          required
          placeholder="Nom et prénom, ou désignation de l'entreprise"
          value={nomClientLibre}
          onChange={(e) => setNomClientLibre(e.target.value)}
          className="col-span-2 bg-surface-raised border border-border rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent"
        />
      )}

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

function FormulaireDepenseCabinet({ onCree }: { onCree: () => void }) {
  const [libelle, setLibelle] = useState("");
  const [categorie, setCategorie] = useState("SALAIRES");
  const [montant, setMontant] = useState(0);
  const [dateDepense, setDateDepense] = useState(new Date().toISOString().slice(0, 10));
  const [erreur, setErreur] = useState("");

  async function gererSoumission(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.depensesCabinet.creer({ libelle, categorie, montant, date_depense: dateDepense });
      onCree();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur");
    }
  }

  return (
    <form onSubmit={gererSoumission} className="bg-surface border border-border rounded-lg p-4 mb-3 grid grid-cols-2 gap-3">
      <input required placeholder="Libellé (ex: Salaire Julie - Août)" value={libelle} onChange={(e) => setLibelle(e.target.value)}
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