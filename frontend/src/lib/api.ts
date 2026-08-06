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
    stats: () => appel("/dashboard/stats"),
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

  journal: {
    obtenir: () => appel("/dashboard/journal"),
  },
};