"use client";

import React, { useState } from "react";
import {
  isSupabaseConfigured,
  signInWithIdentifier,
  signUpWithIdentifier,
} from "@/lib/supabase";
import { UserSession } from "@/types/bacteria";
import { Microscope, ArrowRight, Sparkles, Lock, User } from "lucide-react";

interface AuthScreenProps {
  onAuthenticated: (session: UserSession) => void;
}

export default function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier.trim() || !password.trim()) {
      setError("Completează username-ul (sau email-ul) și parola.");
      return;
    }

    setLoading(true);
    try {
      const res =
        mode === "login"
          ? await signInWithIdentifier(identifier, password)
          : await signUpWithIdentifier(identifier, password);

      if (res.error) {
        setError(res.error);
      } else if (res.session) {
        onAuthenticated(res.session);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    setLoading(true);
    setError(null);
    try {
      const loginTry = await signInWithIdentifier("student_demo", "medicina123");
      if (loginTry.session) {
        onAuthenticated(loginTry.session);
        return;
      }
      const signupTry = await signUpWithIdentifier("student_demo", "medicina123");
      if (signupTry.session) {
        onAuthenticated(signupTry.session);
      } else if (signupTry.error) {
        setError(signupTry.error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Fundal cu puncte finuțe ca pe canvas */}
      <div
        className="absolute inset-0 opacity-45 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(#94a3b8 1.25px, transparent 1.25px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative z-10 w-full max-w-md bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl shadow-xl p-7 sm:p-9">
        {/* Logo & Titlu */}
        <div className="flex flex-col items-center text-center mb-7">
          <div className="w-14 h-14 rounded-2xl bg-violet-600 text-white flex items-center justify-center shadow-md shadow-violet-200 mb-3">
            <Microscope className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            BactoMap
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pânză infinită pentru clasificarea și învățarea bacteriilor în latină
          </p>
        </div>

        {/* Switch Intrare / Cont Nou */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
            }}
            className={`py-2.5 text-sm font-semibold rounded-xl transition-all ${
              mode === "login"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Intră în cont
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError(null);
            }}
            className={`py-2.5 text-sm font-semibold rounded-xl transition-all ${
              mode === "signup"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Cont nou
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Username sau Email
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="ex: alana sau alana@med.ro"
                autoComplete="username"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-sm focus:bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Parolă
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minim 6 caractere"
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-sm focus:bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 active:scale-[0.99] text-white font-semibold text-sm shadow-md shadow-violet-200 flex items-center justify-center gap-2 transition disabled:opacity-60"
          >
            <span>
              {loading
                ? "Se încarcă..."
                : mode === "login"
                ? "Deschide pânza mea"
                : "Creează contul gratuit"}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Acces instant cu 1 tap pentru testare rapidă pe tabletă */}
        <div className="mt-5 pt-5 border-t border-slate-100 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleQuickDemo}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-600" />
            <span>Intră instant în Contul Demo (cu arbori exemplu)</span>
          </button>

          <p className="text-[11px] text-center text-slate-400">
            {isSupabaseConfigured
              ? "Conectat la Supabase Cloud • Salvare automată activă"
              : "Mod Local Activ • Adaugă cheile Supabase în .env.local pentru Cloud"}
          </p>
        </div>
      </div>
    </div>
  );
}
