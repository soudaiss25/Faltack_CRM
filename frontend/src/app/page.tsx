"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function Page() {
  const { utilisateur, chargement } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!chargement) router.push(utilisateur ? "/dashboard" : "/login");
  }, [chargement, utilisateur, router]);

  return <div className="min-h-screen flex items-center justify-center text-text-muted text-sm">Chargement...</div>;
}
