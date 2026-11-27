"use client";

import React, { useState } from "react";
import { COLOR_LIST, BACTERIA_COLORS } from "@/lib/colors";
import { ColorKey, Subsection } from "@/types/bacteria";
import {
  X,
  Plus,
  Trash2,
  GitBranchPlus,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Pencil,
  BookOpen,
  Check,
} from "lucide-react";

interface BacteriaModalProps {
  nodeId: string;
  title: string;
  colorKey: ColorKey;
  subsections: Subsection[];
  onClose: () => void;
  onChangeTitle: (nodeId: string, newTitle: string) => void;
  onChangeColor: (nodeId: string, newColor: ColorKey) => void;
  onChangeSubsections: (nodeId: string, newSubsections: Subsection[]) => void;
  onAddChildFromModal: (parentNodeId: string) => void;
  onDeleteNode: (nodeId: string) => void;
}

const QUICK_SUBSECTION_PRESETS = [
  "Morfologie & Gram",
  "Factori de virulență",
  "Boli & Clinică",
  "Diagnostic de laborator",
  "Tratament / Antibiotice",
  "Truc mnemonic",
];

/**
 * Formatează frumos conținutul unei subsecțiuni în modul View-Only:
 * - Rândurile care încep cu "-", "•", "*" devin liste cu buline colorate
 * - Paragrafele normale sunt aerisite și ușor de citit pe tabletă
 */
function FormattedSubsectionContent({
  content,
  accentColor,
}: {
  content: string;
  accentColor: string;
}) {
  const lines = content
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return (
      <p className="text-sm italic text-slate-400">
        Fără detalii completate în această subsecțiune.
      </p>
    );
  }

  return (
    <div className="space-y-2 text-[15px] text-slate-700 leading-relaxed">
      {lines.map((line, index) => {
        const isBullet = /^[-•*]\s+/.test(line);
        const cleanText = isBullet ? line.replace(/^[-•*]\s+/, "") : line;

        if (isBullet) {
          return (
            <div key={index} className="flex items-start gap-2.5 pl-1">
              <span
                style={{ backgroundColor: accentColor }}
                className="w-2 h-2 rounded-full mt-2 shrink-0"
              />
              <span className="flex-1">{cleanText}</span>
            </div>
          );
        }

        return <p key={index}>{cleanText}</p>;
      })}
    </div>
  );
}

export default function BacteriaModal({
  nodeId,
  title,
  colorKey,
  subsections,
  onClose,
  onChangeTitle,
  onChangeColor,
  onChangeSubsections,
  onAddChildFromModal,
  onDeleteNode,
}: BacteriaModalProps) {
  const palette = BACTERIA_COLORS[colorKey] || BACTERIA_COLORS.violet;

  // Dacă nodul este proaspăt creat și nu are încă text scris, îl deschidem direct în Edit Mode.
  // Altfel, îl deschidem în modul View-Only (Citire & Învățare).
  const hasFilledContent = subsections.some(
    (s) => s.content && s.content.trim().length > 0
  );
  const [isEditing, setIsEditing] = useState<boolean>(!hasFilledContent);

  const handleAddSubsection = (defaultTitle = "") => {
    const newSub: Subsection = {
      id: crypto.randomUUID(),
      title: defaultTitle,
      content: "",
    };
    onChangeSubsections(nodeId, [...subsections, newSub]);
  };

  const handleUpdateSubsection = (
    subId: string,
    field: "title" | "content",
    value: string
  ) => {
    const updated = subsections.map((s) =>
      s.id === subId ? { ...s, [field]: value } : s
    );
    onChangeSubsections(nodeId, updated);
  };

  const handleRemoveSubsection = (subId: string) => {
    onChangeSubsections(
      nodeId,
      subsections.filter((s) => s.id !== subId)
    );
  };

  const handleMoveSubsection = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= subsections.length) return;
    const copy = [...subsections];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    onChangeSubsections(nodeId, copy);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-40 bg-slate-900/45 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* =====================================================================
            HEADER POP-UP (Diferit pentru View-Only vs Edit Mode)
        ===================================================================== */}
        <div
          style={{
            backgroundColor: palette.bg,
            borderBottomColor: palette.border,
          }}
          className="px-5 sm:px-7 pt-5 pb-4 border-b-2"
        >
          <div className="flex items-start justify-between gap-3">
            {isEditing ? (
              <div className="flex-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Editare Nume Bacterie / Familie (în latină)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => onChangeTitle(nodeId, e.target.value)}
                  placeholder="Ex: Staphylococcus aureus"
                  className="w-full text-xl sm:text-2xl font-bold bg-white/90 focus:bg-white text-slate-900 px-3.5 py-2 rounded-xl border border-slate-300/80 focus:border-violet-600 outline-none transition"
                />
              </div>
            ) : (
              <div className="flex-1 pr-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider mb-2 bg-white/80 shadow-sm"
                  style={{ color: palette.badgeText }}
                >
                  <span
                    style={{ backgroundColor: palette.dot }}
                    className="w-2 h-2 rounded-full"
                  />
                  <span>{palette.label}</span>
                </div>
                <h2
                  style={{ color: palette.text }}
                  className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight break-words"
                >
                  {title || "Bacterie fără nume"}
                </h2>
              </div>
            )}

            {/* Butoane sus-dreapta: Comutare Citire/Editare + Închidere */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsEditing((prev) => !prev)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition ${
                  isEditing
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-white/90 hover:bg-white text-slate-800 border border-slate-200/80"
                }`}
              >
                {isEditing ? (
                  <>
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Vezi fișa</span>
                  </>
                ) : (
                  <>
                    <Pencil className="w-3.5 h-3.5 text-violet-600" />
                    <span>Editează</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                title="Închide fereastra"
                className="p-2 rounded-xl bg-white/80 hover:bg-white text-slate-600 hover:text-slate-900 shadow-sm transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Selectorul de culoare apare DOAR în modul de Editare */}
          {isEditing && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-600 mr-1">
                  Culoare dreptunghi:
                </span>
                {COLOR_LIST.map((c) => {
                  const active = c.key === colorKey;
                  return (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => onChangeColor(nodeId, c.key)}
                      title={`${c.label} — ${c.hint}`}
                      style={{
                        backgroundColor: c.bg,
                        borderColor: c.border,
                        color: c.text,
                      }}
                      className={`px-2.5 py-1 rounded-xl border-2 text-xs font-bold flex items-center gap-1.5 transition ${
                        active
                          ? "ring-2 ring-slate-900 scale-105 shadow-sm"
                          : "opacity-80 hover:opacity-100"
                      }`}
                    >
                      <span
                        style={{ backgroundColor: c.dot }}
                        className="w-2.5 h-2.5 rounded-full"
                      />
                      <span>{c.label.split(" ")[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* =====================================================================
            CORPUL POP-UP-ULUI: VIEW-ONLY (ÎNVĂȚARE) vs EDIT MODE
        ===================================================================== */}
        {!isEditing ? (
          /* -------------------- MODUL VIEW-ONLY (CURAT & CLAR) -------------------- */
          <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-4 bg-slate-50/50">
            {subsections.length === 0 ? (
              <div className="text-center py-10 px-4 rounded-2xl border border-slate-200 bg-white">
                <p className="text-base font-semibold text-slate-700">
                  Această bacterie nu are încă notițe adăugate.
                </p>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  Apasă pe butonul de editare pentru a adăuga subsecțiuni și informații.
                </p>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-sm transition"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Editează și adaugă subsecțiuni</span>
                </button>
              </div>
            ) : (
              subsections.map((sub, idx) => (
                <section
                  key={sub.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden"
                >
                  {/* Bara de titlu a subsecțiunii */}
                  <div
                    style={{
                      backgroundColor: palette.bg,
                      borderBottomColor: palette.badgeBg,
                    }}
                    className="px-4 sm:px-5 py-2.5 border-b flex items-center gap-2.5"
                  >
                    <span
                      style={{
                        backgroundColor: palette.border,
                      }}
                      className="w-5 h-5 rounded-lg text-white text-[11px] font-bold flex items-center justify-center shrink-0"
                    >
                      {idx + 1}
                    </span>
                    <h3
                      style={{ color: palette.text }}
                      className="text-sm sm:text-base font-bold tracking-tight"
                    >
                      {sub.title || `Subsecțiunea ${idx + 1}`}
                    </h3>
                  </div>

                  {/* Conținutul formatat clar pentru învățat */}
                  <div className="p-4 sm:p-5">
                    <FormattedSubsectionContent
                      content={sub.content}
                      accentColor={palette.border}
                    />
                  </div>
                </section>
              ))
            )}
          </div>
        ) : (
          /* -------------------- MODUL EDITARE -------------------- */
          <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-4 bg-slate-50/60">
            {subsections.length === 0 ? (
              <div className="text-center py-8 px-4 rounded-2xl border-2 border-dashed border-slate-200 bg-white">
                <p className="text-sm font-semibold text-slate-700">
                  Nicio subsecțiune adăugată încă pentru această bacterie
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Creează propriile tale subsecțiuni pentru a învăța structurat
                  (ex: Morfologie, Virulență, Boli, Tratament).
                </p>
              </div>
            ) : (
              subsections.map((sub, idx) => (
                <div
                  key={sub.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 transition hover:border-slate-300"
                >
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <input
                      type="text"
                      value={sub.title}
                      onChange={(e) =>
                        handleUpdateSubsection(sub.id, "title", e.target.value)
                      }
                      placeholder="Titlul subsecțiunii (ex: Factori de virulență)..."
                      className="flex-1 text-sm font-bold text-slate-900 bg-slate-50 focus:bg-white px-3 py-2 rounded-xl border border-slate-200 focus:border-violet-500 outline-none transition"
                    />

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveSubsection(idx, -1)}
                        title="Mută mai sus"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === subsections.length - 1}
                        onClick={() => handleMoveSubsection(idx, 1)}
                        title="Mută mai jos"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubsection(sub.id)}
                        title="Șterge această subsecțiune"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={3}
                    value={sub.content}
                    onChange={(e) =>
                      handleUpdateSubsection(sub.id, "content", e.target.value)
                    }
                    placeholder="Scrie aici informațiile clare (poți începe rândurile cu '-' pentru liste cu buline)..."
                    className="w-full text-sm text-slate-700 leading-relaxed bg-slate-50/50 focus:bg-white p-3 rounded-xl border border-slate-200 focus:border-violet-500 outline-none resize-y transition"
                  />
                </div>
              ))
            )}

            {/* Buton mare '+ Adaugă subsecțiune nouă' */}
            <button
              type="button"
              onClick={() => handleAddSubsection("")}
              className="w-full py-3 px-4 rounded-2xl border-2 border-dashed border-violet-300 hover:border-violet-500 bg-violet-50/50 hover:bg-violet-50 text-violet-700 font-semibold text-sm flex items-center justify-center gap-2 transition"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Adaugă o subsecțiune nouă (creată de tine)</span>
            </button>

            {/* Sugestii rapide cu 1 tap */}
            <div className="pt-1">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                <span>SAU ADAUGĂ RAPID O SUBSECȚIUNE MEDICALĂ:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_SUBSECTION_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleAddSubsection(preset)}
                    className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-violet-50 border border-slate-200 hover:border-violet-300 text-xs font-medium text-slate-700 hover:text-violet-700 transition"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            FOOTER POP-UP
        ===================================================================== */}
        <div className="px-5 sm:px-7 py-3.5 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {isEditing && (
              <button
                type="button"
                onClick={() => onDeleteNode(nodeId)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200/80 flex items-center gap-1.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Șterge dreptunghiul</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onAddChildFromModal(nodeId);
                onClose();
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 flex items-center gap-1.5 transition"
            >
              <GitBranchPlus className="w-3.5 h-3.5" />
              <span>+ Ramură nouă din el</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
              >
                <Check className="w-4 h-4" />
                <span>Gata (Vezi fișa)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition"
              >
                Închide
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
