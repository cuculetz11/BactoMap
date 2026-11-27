"use client";

import React, { memo } from "react";
import { Handle, NodeProps, Position } from "@xyflow/react";
import { BACTERIA_COLORS } from "@/lib/colors";
import { BacteriaNodeData } from "@/types/bacteria";
import { Plus, FileText } from "lucide-react";

function BacteriaNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as BacteriaNodeData;
  const palette =
    BACTERIA_COLORS[nodeData.colorKey] || BACTERIA_COLORS.violet;
  const subsectionsCount = nodeData.subsections?.length || 0;

  const firstPreview =
    subsectionsCount > 0
      ? nodeData.subsections[0].title
      : "Apasă pentru notițe";

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        nodeData.onOpenModal(id);
      }}
      style={{
        backgroundColor: palette.bg,
        borderColor: palette.border,
        color: palette.text,
      }}
      className={`group relative w-[228px] min-h-[88px] rounded-2xl border-2 px-4 py-3 shadow-sm hover:shadow-md transition-shadow select-none cursor-pointer flex flex-col justify-between ${
        selected ? "ring-4 ring-violet-300/70" : ""
      }`}
    >
      {/* Puncte invizibile / discrete pe toate cele 4 laturi pentru conectare dinamică */}
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

      {/* Titlul bacteriei (în latină / italicizat finuț) */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-bold text-[15px] leading-snug break-words tracking-tight">
          {nodeData.title || "Bacterie nouă"}
        </h3>
        <span
          style={{ backgroundColor: palette.dot }}
          className="w-2.5 h-2.5 rounded-full shrink-0 mt-1.5"
        />
      </div>

      {/* Subsolul dreptunghiului: Câte subsecțiuni are în pop-up */}
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <div
          style={{
            backgroundColor: palette.badgeBg,
            color: palette.badgeText,
          }}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold truncate max-w-[165px]"
        >
          <FileText className="w-3 h-3 shrink-0" />
          <span className="truncate">
            {subsectionsCount > 0
              ? `${subsectionsCount} ${
                  subsectionsCount === 1 ? "secțiune" : "secțiuni"
                } • ${firstPreview}`
              : "Adaugă detalii"}
          </span>
        </div>
      </div>

      {/* Buton rapid '+' pentru a trage o ramură nouă (ideal pe Samsung Tab / telefon) */}
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
        className="nodrag nopan absolute -bottom-3.5 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full text-white shadow-md flex items-center justify-center hover:scale-110 active:scale-95 transition-transform border-2 border-white"
      >
        <Plus className="w-4 h-4 stroke-[2.7]" />
      </button>
    </div>
  );
}

export default memo(BacteriaNodeComponent);
