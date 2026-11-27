"use client";

import React, { useEffect, useState } from "react";
import AuthScreen from "@/components/auth/AuthScreen";
import BacteriaCanvas from "@/components/canvas/BacteriaCanvas";
import { getActiveSession, signOutUser } from "@/lib/supabase";
import { UserSession } from "@/types/bacteria";

export default function HomePage() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    getActiveSession().then((active) => {
      setSession(active);
      setChecking(false);
    });
  }, []);

  const handleLogout = async () => {
    await signOutUser();
    setSession(null);
  };

  if (checking) {
    return (
      <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center">
        <div className="text-sm font-semibold text-slate-500 animate-pulse">
          Se deschide BactoMap...
        </div>
      </div>
    );
  }

  if (!session) {
    return <AuthScreen onAuthenticated={(s) => setSession(s)} />;
  }

  return <BacteriaCanvas session={session} onLogout={handleLogout} />;
}
