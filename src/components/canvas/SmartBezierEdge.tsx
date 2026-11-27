"use client";

import React from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getBezierPath,
  useInternalNode,
} from "@xyflow/react";
import { getNodeDimensions, getSmartEdgeParams } from "@/lib/collision";
import { COLOR_LIST } from "@/lib/colors";
import { X } from "lucide-react";

interface SmartEdgeData {
  color?: string;
  onDeleteEdge?: (id: string) => void;
  onChangeEdgeColor?: (id: string, strokeColor: string) => void;
}

export default function SmartBezierEdge({
  id,
  source,
  target,
  selected,
  style,
  data,
}: EdgeProps) {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);

  if (!sourceNode || !targetNode) {
    return null;
  }

  const sFallback = getNodeDimensions(sourceNode);
  const tFallback = getNodeDimensions(targetNode);

  const sWidth = sourceNode.measured?.width || sFallback.width;
  const sHeight = sourceNode.measured?.height || sFallback.height;
  const tWidth = targetNode.measured?.width || tFallback.width;
  const tHeight = targetNode.measured?.height || tFallback.height;

  const { sx, sy, tx, ty, sourcePos, targetPos } = getSmartEdgeParams(
    sourceNode.internals.positionAbsolute,
    targetNode.internals.positionAbsolute,
    sWidth,
    sHeight,
    tWidth,
    tHeight
  );

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX: sx,
    sourceY: sy,
    sourcePosition: sourcePos,
    targetX: tx,
    targetY: ty,
    targetPosition: targetPos,
    curvature: 0.28,
  });

  const edgeData = data as SmartEdgeData | undefined;
  const currentStroke =
    edgeData?.color || (style?.stroke as string) || "#94a3b8";

  return (
    <>
      {/* Zonă invizibilă mai groasă (24px) ca să poți da click/tap super ușor pe linie și pe tabletă */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={24}
        className="react-flow__edge-interaction cursor-pointer"
      />
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          strokeWidth: selected ? 3.6 : 2.5,
          stroke: currentStroke,
          filter: selected
            ? "drop-shadow(0 0 4px rgba(124, 58, 237, 0.35))"
            : undefined,
          transition: "stroke 150ms ease, stroke-width 150ms ease",
        }}
      />
      {selected && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
            onClick={(e) => e.stopPropagation()}
            className="nodrag nopan z-30 flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-full shadow-lg border border-slate-200"
          >
            {/* Bulinele pentru alegerea culorii liniei */}
            {COLOR_LIST.map((c) => {
              const isCurrent =
                currentStroke.toLowerCase() === c.border.toLowerCase() ||
                currentStroke.toLowerCase() === c.edgeStroke.toLowerCase();
              return (
                <button
                  key={c.key}
                  type="button"
                  title={`Culoare linie: ${c.label}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    edgeData?.onChangeEdgeColor?.(id, c.border);
                  }}
                  style={{ backgroundColor: c.border }}
                  className={`w-5 h-5 rounded-full border-2 border-white shadow-sm transition-transform hover:scale-110 active:scale-95 ${
                    isCurrent ? "ring-2 ring-slate-900 scale-110" : ""
                  }`}
                />
              );
            })}

            {/* Separator discret */}
            <div className="w-px h-4 bg-slate-200 mx-0.5" />

            {/* Buton ștergere linie */}
            {edgeData?.onDeleteEdge && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  edgeData.onDeleteEdge?.(id);
                }}
                title="Șterge această linie"
                className="w-5 h-5 rounded-full bg-rose-500 hover:bg-rose-600 text-white shadow-sm flex items-center justify-center transition-transform hover:scale-110 active:scale-90"
              >
                <X className="w-3 h-3 stroke-[2.5]" />
              </button>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
