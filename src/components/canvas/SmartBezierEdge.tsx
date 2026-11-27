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
import { X } from "lucide-react";

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

  const onDeleteEdge = (
    data as { onDeleteEdge?: (id: string) => void } | undefined
  )?.onDeleteEdge;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          strokeWidth: selected ? 3 : 2.3,
          stroke: selected ? "#7c3aed" : (style?.stroke as string) || "#94a3b8",
          transition: "stroke 150ms ease",
        }}
      />
      {selected && onDeleteEdge && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
            className="nodrag nopan"
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteEdge(id);
              }}
              title="Șterge această ramură"
              className="w-6 h-6 rounded-full bg-rose-500 hover:bg-rose-600 text-white shadow-md flex items-center justify-center border-2 border-white transition-transform active:scale-90"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
