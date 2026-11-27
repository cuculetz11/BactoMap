"use client";

import React, { useState } from "react";
import {
  Plus,
  Search,
  Maximize2,
  LogOut,
  Check,
  Loader2,
  Microscope,
  X,
} from "lucide-react";

interface SearchNodeItem {
  id: string;
  title: string;
}

interface FloatingToolbarProps {
  username: string;
  saveStatus: "saved" | "saving";
  nodesList: SearchNodeItem[];
  onAddRootNode: () => void;
  onFocusNode: (nodeId: string) => void;
  onFitView: () => void;
  onLogout: () => void;
}

export default function FloatingToolbar({
  username,
  saveStatus,
  nodesList,
  onAddRootNode,
  onFocusNode,
  onFitView,
  onLogout,
}: FloatingToolbarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? nodesList.filter((n) =>
        n.title.toLowerCase().includes(query.trim().toLowerCase())
      )
    : nodesList.slice(0, 8);

  return (
    <>
      {/* Bara de sus (Brand + Status Salvare + User) */}
      <div className="fixed top-3.5 left-3.5 right-3.5 z-20 flex items-center justify-between pointer-events-none">
        {/* Stânga: Logo + Nume */}
        <div className="pointer-events-auto flex items-center gap-2.5 bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-sm rounded-2xl px-3.5 py-2">
          <div className="w-8 h-8 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-sm">
            <Microscope className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 leading-none">
              BactoMap
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              @{username}
            </div>
          </div>
        </div>

        {/* Dreapta: Status Auto-Save + Logout */}
        <div className="pointer-events-auto flex items-center gap-2 bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-sm rounded-2xl px-3 py-2">
          <div className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-lg bg-slate-50 text-slate-600">
            {saveStatus === "saving" ? (
              <>
                <Loader2 className="w-3.5 h-3.5 text-violet-600 animate-spin" />
                <span className="hidden sm:inline">Se salvează...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Salvat</span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={onLogout}
            title="Ieși din cont"
            className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bara Plutitoare de Jos (Touch-Friendly pentru Samsung Tab / Telefon) */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-lg rounded-2xl p-2">
        <button
          type="button"
          onClick={onAddRootNode}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 active:scale-95 text-white font-semibold text-sm shadow-sm shadow-violet-200 transition"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Rădăcină nouă</span>
        </button>

        <button
          type="button"
          onClick={() => setSearchOpen((prev) => !prev)}
          title="Caută o bacterie pe pânza infinită"
          className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
            searchOpen
              ? "bg-slate-900 text-white"
              : "bg-slate-100 hover:bg-slate-200/80 text-slate-700"
          }`}
        >
          <Search className="w-4 h-4" />
          <span className="hidden sm:inline">Caută</span>
        </button>

        <button
          type="button"
          onClick={onFitView}
          title="Cuprinde toți arborii pe ecran"
          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-sm font-semibold transition"
        >
          <Maximize2 className="w-4 h-4" />
          <span className="hidden sm:inline">Centrează</span>
        </button>
      </div>

      {/* Popover de Căutare Rapidă cu Teleportare pe Pânză */}
      {searchOpen && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-30 w-[92vw] max-w-sm bg-white border border-slate-200 rounded-2xl shadow-2xl p-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Search className="w-4 h-4 text-slate-400 ml-1" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Caută bacterie (ex: Staphylococcus)..."
              className="w-full text-sm text-slate-900 outline-none bg-transparent"
            />
            <button
              type="button"
              onClick={() => {
                setSearchOpen(false);
                setQuery("");
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-2 max-h-52 overflow-y-auto divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400">
                Nicio bacterie găsită
              </div>
            ) : (
              filtered.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onFocusNode(item.id);
                    setSearchOpen(false);
                    setQuery("");
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-violet-50 text-sm font-medium text-slate-800 hover:text-violet-800 transition flex items-center justify-between"
                >
                  <span className="truncate">{item.title}</span>
                  <span className="text-[11px] text-violet-600 font-semibold">
                    Mergi →
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}
