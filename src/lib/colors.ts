import { ColorKey } from "@/types/bacteria";

export interface NodeColorPalette {
  key: ColorKey;
  label: string;
  hint: string;
  bg: string;
  border: string;
  text: string;
  badgeBg: string;
  badgeText: string;
  dot: string;
  edgeStroke: string;
}

export const BACTERIA_COLORS: Record<ColorKey, NodeColorPalette> = {
  violet: {
    key: "violet",
    label: "Mov (Gram +)",
    hint: "Ideal pentru bacterii Gram-pozitive",
    bg: "#f5f3ff",
    border: "#8b5cf6",
    text: "#4c1d95",
    badgeBg: "#ede9fe",
    badgeText: "#6d28d9",
    dot: "#8b5cf6",
    edgeStroke: "#a78bfa",
  },
  rose: {
    key: "rose",
    label: "Roz (Gram -)",
    hint: "Ideal pentru bacterii Gram-negative",
    bg: "#fff1f2",
    border: "#f43f5e",
    text: "#881337",
    badgeBg: "#ffe4e6",
    badgeText: "#e11d48",
    dot: "#f43f5e",
    edgeStroke: "#fb7185",
  },
  sky: {
    key: "sky",
    label: "Albastru (Aerobi / Familie)",
    hint: "Ideal pentru ramuri sau familii aerobe",
    bg: "#f0f9ff",
    border: "#0ea5e9",
    text: "#0c4a6e",
    badgeBg: "#e0f2fe",
    badgeText: "#0284c7",
    dot: "#0ea5e9",
    edgeStroke: "#38bdf8",
  },
  emerald: {
    key: "emerald",
    label: "Verde (Anaerobi / Specie)",
    hint: "Ideal pentru anaerobi sau sub-ramuri",
    bg: "#ecfdf5",
    border: "#10b981",
    text: "#064e3b",
    badgeBg: "#d1fae5",
    badgeText: "#059669",
    dot: "#10b981",
    edgeStroke: "#34d399",
  },
  amber: {
    key: "amber",
    label: "Ambră (Atipice / BAAR)",
    hint: "Micobacterii, spirochete, chlamydii",
    bg: "#fffbeb",
    border: "#f59e0b",
    text: "#78350f",
    badgeBg: "#fef3c7",
    badgeText: "#d97706",
    dot: "#f59e0b",
    edgeStroke: "#fbbf24",
  },
  slate: {
    key: "slate",
    label: "Gri (Rădăcină / Clasificare)",
    hint: "Nod rădăcină sau categorie generală",
    bg: "#f8fafc",
    border: "#64748b",
    text: "#0f172a",
    badgeBg: "#f1f5f9",
    badgeText: "#475569",
    dot: "#64748b",
    edgeStroke: "#94a3b8",
  },
};

export const COLOR_LIST: NodeColorPalette[] = Object.values(BACTERIA_COLORS);
