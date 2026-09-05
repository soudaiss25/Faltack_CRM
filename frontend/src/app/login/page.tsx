"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";

export default function PageConnexion() {
  const { connexion } = useAuth();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");
  const [enCours, setEnCours] = useState(false);

  async function gererSoumission(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");
    setEnCours(true);
    try {
      await connexion(email, motDePasse);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur de connexion");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Signature visuelle : une seule ligne courbe ambre en fond, discrète, évoque une courbe de trésorerie */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.07] pointer-events-none"
        preserveAspectRatio="none"
        viewBox="0 0 1200 800"
      >
        <path
          d="M0,600 C200,500 300,700 500,550 C700,400 800,650 1000,450 C1100,350 1150,500 1200,400"
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="3"
        />
      </svg>

      <div className="w-full max-w-sm relative">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-2 h-2 rounded-full bg-accent" />
            <span className="text-xs tracking-[0.2em] uppercase text-text-muted">Faltack</span>
          </div>
          <h1 className="font-[family-name:var(--font-display)] italic text-3xl text-text">
            Faltack CRM
          </h1>
          <p className="text-text-muted text-sm mt-2">Connectez-vous à votre espace</p>
        </div>

        <form onSubmit={gererSoumission} className="bg-surface border border-border rounded-lg p-6 space-y-4">
          <div>
            <label className="block text-xs text-text-muted mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface-raised border border-border rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
              placeholder="vous@cabinet.fr"
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1.5">Mot de passe</label>
            <input
              type="password"
              required
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              className="w-full bg-surface-raised border border-border rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
              placeholder="••••••••"
            />
          </div>

          {erreur && (
            <p className="text-danger text-sm bg-danger/10 border border-danger/30 rounded-md px-3 py-2">
              {erreur}
            </p>
          )}

          <button
            type="submit"
            disabled={enCours}
            className="w-full bg-accent text-ink font-medium rounded-md py-2.5 text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {enCours ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
