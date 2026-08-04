"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "./api";

type Utilisateur = { id: number; nom: string; role: string; entreprise_id: number | null };

type AuthContextType = {
  utilisateur: Utilisateur | null;
  chargement: boolean;
  connexion: (email: string, mdp: string) => Promise<void>;
  deconnexion: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null);
  const [chargement, setChargement] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Au premier chargement, on relit la session sauvegardée pour ne pas
    // reconnecter l'utilisateur à chaque rafraîchissement de page.
    // localStorage n'existe pas côté serveur (SSR) : on ne peut le lire
    // qu'ici, après le montage côté client — useEffect est donc le bon outil,
    // pas un contournement. On désactive la règle de lint sur cette ligne précise.
    const stocke = localStorage.getItem("utilisateur");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUtilisateur(stocke ? JSON.parse(stocke) : null);
    setChargement(false);
  }, []);

  async function connexion(email: string, mot_de_passe: string) {
    const { token, utilisateur: u } = await api.connexion(email, mot_de_passe);
    localStorage.setItem("token", token);
    localStorage.setItem("utilisateur", JSON.stringify(u));
    setUtilisateur(u);
    router.push("/dashboard");
  }

  function deconnexion() {
    localStorage.removeItem("token");
    localStorage.removeItem("utilisateur");
    setUtilisateur(null);
    router.push("/login");
  }

  return (
    <AuthContext.Provider value={{ utilisateur, chargement, connexion, deconnexion }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé à l'intérieur de AuthProvider");
  return ctx;
}
