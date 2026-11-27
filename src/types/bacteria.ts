export type ColorKey =
  | "violet"
  | "rose"
  | "sky"
  | "emerald"
  | "amber"
  | "slate";

export interface Subsection {
  id: string;
  title: string;
  content: string;
}

export interface BacteriaNodeRecord {
  id: string;
  user_id: string;
  title: string;
  color_key: ColorKey;
  position_x: number;
  position_y: number;
  subsections: Subsection[];
  updated_at?: string;
}

export interface BacteriaEdgeRecord {
  id: string;
  user_id: string;
  source_id: string;
  target_id: string;
  color?: string;
}

export interface BacteriaNodeData extends Record<string, unknown> {
  title: string;
  colorKey: ColorKey;
  subsections: Subsection[];
  expanded?: boolean;
  onOpenModal: (nodeId: string) => void;
  onAddChild: (parentNodeId: string) => void;
  onToggleExpand: (nodeId: string) => void;
}

export interface UserSession {
  id: string;
  username: string;
  email: string;
  isLocalDemo?: boolean;
}
