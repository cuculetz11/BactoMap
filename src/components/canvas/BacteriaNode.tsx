"use client";

import React, { memo } from "react";
import { Handle, NodeProps, Position } from "@xyflow/react";
import { BACTERIA_COLORS } from "@/lib/colors";
import { BacteriaNodeData } from "@/types/bacteria";
import {
  Plus,
  FileText,
  ChevronDown,
  ChevronUp,
  Pencil,
} from "lucide-react";

/**
 * Afișează frumos textul unei subsecțiuni direct în dreptunghiul deschis pe pânză
 */
function InlineSubsectionText({
  content,
  dotColor,
}: {
  content: string;
  dotColor: string;
}) {
  const lines = (content || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return (
      <p className="text-[11px] italic text-slate-400">
        Fără detalii — apasă pe Editează pentru a completa.
      </p>
    );
  }

  return (
    <div className="space-y-1 text-xs text-slate-700 leading-relaxed">
      {lines.map((line, i) => {
        const isBullet = /^[-•*]\s+/.test(line);
        const clean = isBullet ? line.replace(/^[-•*]\s+/, "") : line;
        if (isBullet) {
          return (
            <div key={i} className="flex items-start gap-1.5">
              <span
                style={{ backgroundColor: dotColor }}
                className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
              />
              <span className="flex-1 break-words">{clean}</span>
            </div>
          );
        }
        return (
          <p key={i} className="break-words">
            {clean}
          </p>
        );
      })}
    </div>
  );
}

function BacteriaNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as BacteriaNodeData;
  const palette =
    BACTERIA_COLORS[nodeData.colorKey] || BACTERIA_COLORS.violet;
  const subsections = nodeData.subsections || [];
  const subsectionsCount = subsections.length;
  const isExpanded = Boolean(nodeData.expanded);

  const firstPreview =
    subsectionsCount > 0
      ? subsections[0].title
      : "Apasă pentru notițe";

  return (
    <div
      style={{
        backgroundColor: palette.bg,
        borderColor: palette.border,
        color: palette.text,
        width: isExpanded ? 320 : 240,
      }}
      className={`group relative rounded-2xl border-2 px-4 pt-3 pb-4 shadow-sm hover:shadow-md transition-all duration-200 select-none flex flex-col justify-between ${
        selected ? "ring-4 ring-violet-300/70" : ""
      }`}
    >
      {/* Puncte de conectare */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-slate-400/70 !border-2 !border-white opacity-0 group-hover:opacity-100 transition-opacity"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-slate-400/70 !border-2 !border-white opacity-0 group-hover:opacity-100 transition-opacity"
      />

      {/* Header-ul Dreptunghiului: Titlul + Buton Editează + Săgeată în Jos (Expand) */}
      <div className="flex items-start justify-between gap-2">
        <div
          onClick={(e) => {
            e.stopPropagation();
            nodeData.onToggleExpand(id);
          }}
          className="flex-1 cursor-pointer"
        >
          <h3 className="font-bold text-[15px] leading-snug break-words tracking-tight">
            {nodeData.title || "Bacterie nouă"}
          </h3>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Buton de Editare / Deschidere Pop-up */}
          <button
            type="button"
            title="Editează subsecțiunile și culoarea"
            onClick={(e) => {
              e.stopPropagation();
              nodeData.onOpenModal(id);
            }}
            className="nodrag nopan p-1.5 rounded-lg bg-white/75 hover:bg-white text-slate-600 hover:text-violet-700 shadow-sm transition"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>

          {/* SĂGEATA ÎN JOS / SUS: Deschide informațiile direct pe pânză și împinge nodurile de sub el */}
          <button
            type="button"
            title={
              isExpanded
                ? "Strânge informațiile"
                : "Deschide informațiile în jos"
            }
            onClick={(e) => {
              e.stopPropagation();
              nodeData.onToggleExpand(id);
            }}
            style={{
              backgroundColor: isExpanded ? palette.border : "rgba(255,255,255,0.85)",
              color: isExpanded ? "#ffffff" : palette.text,
            }}
            className="nodrag nopan p-1.5 rounded-lg shadow-sm hover:scale-105 active:scale-95 transition"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 stroke-[2.5]" />
            ) : (
              <ChevronDown className="w-4 h-4 stroke-[2.5]" />
            )}
          </button>
        </div>
      </div>

      {/* Bara de sumar (când este strâns) */}
      {!isExpanded && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            nodeData.onToggleExpand(id);
          }}
          className="mt-2.5 flex items-center justify-between gap-2 cursor-pointer"
        >
          <div
            style={{
              backgroundColor: palette.badgeBg,
              color: palette.badgeText,
            }}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold truncate max-w-[195px]"
          >
            <FileText className="w-3 h-3 shrink-0" />
            <span className="truncate">
              {subsectionsCount > 0
                ? `${subsectionsCount} ${
                    subsectionsCount === 1 ? "secțiune" : "secțiuni"
                  } • ${firstPreview}`
                : "Apasă ⌄ sau creionul"}
            </span>
          </div>
        </div>
      )}

      {/* SECȚIUNEA EXPANDATĂ ÎN JOS (View-Only direct în dreptunghi!) */}
      {isExpanded && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="nodrag cursor-default mt-3 pt-2.5 border-t border-black/10 space-y-2.5"
        >
          {subsectionsCount === 0 ? (
            <div className="bg-white/85 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-500 mb-2">
                Nu există încă subsecțiuni pentru această bacterie.
              </p>
              <button
                type="button"
                onClick={() => nodeData.onOpenModal(id)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-semibold shadow-sm"
              >
                <Pencil className="w-3 h-3" />
                <span>Adaugă subsecțiuni</span>
              </button>
            </div>
          ) : (
            subsections.map((sub, idx) => (
              <div
                key={sub.id}
                className="bg-white/95 rounded-xl border border-black/5 shadow-sm overflow-hidden"
              >
                <div
                  style={{
                    backgroundColor: palette.badgeBg,
                    color: palette.text,
                  }}
                  className="px-3 py-1.5 text-xs font-bold flex items-center gap-1.5"
                >
                  <span
                    style={{ backgroundColor: palette.border }}
                    className="w-4 h-4 rounded-md text-white text-[10px] font-bold flex items-center justify-center shrink-0"
                  >
                    {idx + 1}
                  </span>
                  <span className="truncate">
                    {sub.title || `Secțiunea ${idx + 1}`}
                  </span>
                </div>
                <div className="p-2.5">
                  <InlineSubsectionText
                    content={sub.content}
                    dotColor={palette.border}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Butonul '+' de la baza dreptunghiului: adaugă o ramură nouă (copil) */}
      <button
        type="button"
        title="Adaugă o ramură nouă din această bacterie"
        onClick={(e) => {
          e.stopPropagation();
          nodeData.onAddChild(id);
        }}
        style={{
          backgroundColor: palette.border,
        }}
        className="nodrag nopan absolute -bottom-3.5 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full text-white shadow-md flex items-center justify-center hover:scale-110 active:scale-95 transition-transform border-2 border-white z-10"
      >
        <Plus className="w-4 h-4 stroke-[2.7]" />
      </button>
    </div>
  );
}

export default memo(BacteriaNodeComponent);
