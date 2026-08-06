"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { LayoutDashboard, Building2, FileText, LogOut,BookOpen } from "lucide-react";

const NAVIGATION = [
  { href: "/dashboard", label: "Dashboard", icone: LayoutDashboard },
  { href: "/entreprises", label: "Entreprises", icone: Building2 },
  { href: "/factures", label: "Factures", icone: FileText },
  { href: "/journal", label: "Journal de caisse", icone: BookOpen },
];

export default function LayoutApplication({ children }: { children: React.ReactNode }) {
  const { utilisateur, chargement, deconnexion } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!chargement && !utilisateur) router.push("/login");
  }, [chargement, utilisateur, router]);

  if (chargement || !utilisateur) {
    return <div className="min-h-screen flex items-center justify-center text-text-muted text-sm">Chargement...</div>;
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 border-r border-border bg-surface flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent" />
            <span className="text-xs tracking-[0.2em] uppercase text-text-muted">Faltack</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAVIGATION.map(({ href, label, icone: Icone }) => {
            const actif = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                  actif ? "bg-accent-soft text-accent" : "text-text-muted hover:text-text hover:bg-surface-raised"
                }`}
              >
                <Icone size={16} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-border">
          <div className="px-3 mb-2">
            <p className="text-sm text-text">{utilisateur.nom}</p>
            <p className="text-xs text-text-muted">
              {utilisateur.role === "CLIENT" ? "Espace client" : utilisateur.role === "SUPER_ADMIN" ? "Super admin" : "Collaborateur"}
            </p>
          </div>
          <button
            onClick={deconnexion}
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-text-muted hover:text-danger hover:bg-danger/10 transition-colors w-full"
          >
            <LogOut size={16} />
            Déconnexion
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
