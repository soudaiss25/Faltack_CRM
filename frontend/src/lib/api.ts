const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

async function appel(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const reponse = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const donnees = await reponse.json().catch(() => null);

  if (!reponse.ok) {
    throw new Error(donnees?.erreur || "Une erreur est survenue");
  }
  return donnees;
}

export const api = {
  connexion: (email: string, mot_de_passe: string) =>
    appel("/auth/connexion", { method: "POST", body: JSON.stringify({ email, mot_de_passe }) }),

  dashboard: {
    stats: (params?: { entreprise_id?: number; date_debut?: string; date_fin?: string }) => {
      const qs = new URLSearchParams();
      if (params?.entreprise_id) qs.set("entreprise_id", String(params.entreprise_id));
      if (params?.date_debut) qs.set("date_debut", params.date_debut);
      if (params?.date_fin) qs.set("date_fin", params.date_fin);
      const suffix = qs.toString() ? `?${qs.toString()}` : "";
      return appel(`/dashboard/stats${suffix}`);
    },
  },
  entreprises: {
    lister: (statut?: string) => appel(`/entreprises${statut ? `?statut=${statut}` : ""}`),
    obtenir: (id: number) => appel(`/entreprises/${id}`),
    creer: (data: Record<string, unknown>) =>
      appel("/entreprises", { method: "POST", body: JSON.stringify(data) }),
    convertir: (id: number, statut: string) =>
      appel(`/entreprises/${id}/convertir`, { method: "POST", body: JSON.stringify({ statut }) }),
  },

  contacts: {
    lister: (entrepriseId: number) => appel(`/entreprises/${entrepriseId}/contacts`),
    creer: (entrepriseId: number, data: Record<string, unknown>) =>
      appel(`/entreprises/${entrepriseId}/contacts`, { method: "POST", body: JSON.stringify(data) }),
    supprimer: (id: number) => appel(`/contacts/${id}`, { method: "DELETE" }),
  },

  factures: {
    lister: () => appel("/factures"),
    listerImpayes: () => appel("/factures/impayes"),
    obtenir: (id: number) => appel(`/factures/${id}`),
    creer: (data: Record<string, unknown>) =>
      appel("/factures", { method: "POST", body: JSON.stringify(data) }),
    ajouterPaiement: (id: number, data: Record<string, unknown>) =>
      appel(`/factures/${id}/paiements`, { method: "POST", body: JSON.stringify(data) }),
    telechargerPDF: async (id: number, numero: string) => {
      const token = localStorage.getItem("token");
      const reponse = await fetch(`${API_URL}/factures/${id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!reponse.ok) throw new Error("Impossible de générer le PDF");
      const blob = await reponse.blob();
      const url = window.URL.createObjectURL(blob);
      const lien = document.createElement("a");
      lien.href = url;
      lien.download = `${numero}.pdf`;
      lien.click();
      window.URL.revokeObjectURL(url);
    },
  },

  interactions: {
    lister: (entrepriseId: number) => appel(`/entreprises/${entrepriseId}/interactions`),
    creer: (entrepriseId: number, data: Record<string, unknown>) =>
      appel(`/entreprises/${entrepriseId}/interactions`, { method: "POST", body: JSON.stringify(data) }),
  },

  depenses: {
    lister: (entrepriseId: number) => appel(`/entreprises/${entrepriseId}/depenses`),
    creer: (entrepriseId: number, data: Record<string, unknown>) =>
      appel(`/entreprises/${entrepriseId}/depenses`, { method: "POST", body: JSON.stringify(data) }),
    supprimer: (id: number) => appel(`/depenses/${id}`, { method: "DELETE" }),
  },

  analyse: {
    obtenir: (entrepriseId: number) => appel(`/entreprises/${entrepriseId}/analyse`),
  },

  journal: {
    obtenir: () => appel("/dashboard/journal"),
  },

  utilisateurs: {
    lister: () => appel("/utilisateurs"),
    creer: (data: Record<string, unknown>) =>
      appel("/utilisateurs", { method: "POST", body: JSON.stringify(data) }),
    mettreAJour: (id: number, data: Record<string, unknown>) =>
      appel(`/utilisateurs/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    supprimer: (id: number) => appel(`/utilisateurs/${id}`, { method: "DELETE" }),
  },

  honoraires: {
    lister: (entrepriseId: number) => appel(`/entreprises/${entrepriseId}/honoraires`),
    creer: (entrepriseId: number, data: Record<string, unknown>) =>
      appel(`/entreprises/${entrepriseId}/honoraires`, { method: "POST", body: JSON.stringify(data) }),
    creerOccasionnelle: (data: Record<string, unknown>) =>
      appel(`/honoraires/occasionnel`, { method: "POST", body: JSON.stringify(data) }),
    listerPaiements: (params?: { type?: string; montant_min?: number; montant_max?: number; date_debut?: string; date_fin?: string }) => {
      const qs = new URLSearchParams();
      if (params?.type) qs.set("type", params.type);
      if (params?.montant_min) qs.set("montant_min", String(params.montant_min));
      if (params?.montant_max) qs.set("montant_max", String(params.montant_max));
      if (params?.date_debut) qs.set("date_debut", params.date_debut);
      if (params?.date_fin) qs.set("date_fin", params.date_fin);
      const suffix = qs.toString() ? `?${qs.toString()}` : "";
      return appel(`/honoraires/paiements${suffix}`);
    },
    marquerPaye: (id: number) => appel(`/honoraires/${id}/marquer-paye`, { method: "POST", body: JSON.stringify({}) }),
    supprimer: (id: number) => appel(`/honoraires/${id}`, { method: "DELETE" }),
  },

  depensesCabinet: {
    lister: () => appel("/depenses-cabinet"),
    creer: (data: Record<string, unknown>) =>
      appel("/depenses-cabinet", { method: "POST", body: JSON.stringify(data) }),
    supprimer: (id: number) => appel(`/depenses/${id}`, { method: "DELETE" }),
  },

  cabinet: {
    stats: (params?: { date_debut?: string; date_fin?: string }) => {
      const qs = new URLSearchParams();
      if (params?.date_debut) qs.set("date_debut", params.date_debut);
      if (params?.date_fin) qs.set("date_fin", params.date_fin);
      const suffix = qs.toString() ? `?${qs.toString()}` : "";
      return appel(`/cabinet/stats${suffix}`);
    },
  },
    documents: {
    lister: (entrepriseId: number) => appel(`/entreprises/${entrepriseId}/documents`),
    listerVersions: (entrepriseId: number, nomFichier: string) =>
      appel(`/entreprises/${entrepriseId}/documents/${encodeURIComponent(nomFichier)}/versions`),
    televerser: async (entrepriseId: number, fichier: File, categorie: string) => {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("fichier", fichier);
      formData.append("categorie", categorie);
      const reponse = await fetch(`${API_URL}/entreprises/${entrepriseId}/documents`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const donnees = await reponse.json().catch(() => null);
      if (!reponse.ok) throw new Error(donnees?.erreur || "Échec du téléversement");
      return donnees;
    },
    telecharger: async (id: number) => {
      const donnees = await appel(`/documents/${id}/telecharger`);
      window.open(donnees.url, "_blank");
    },
    supprimer: (id: number) => appel(`/documents/${id}`, { method: "DELETE" }),
  },
};