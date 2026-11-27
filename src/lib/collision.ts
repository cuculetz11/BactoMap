import { Node, Position } from "@xyflow/react";

export const NODE_WIDTH = 228;
export const NODE_HEIGHT = 88;
export const COLLISION_PADDING = 24;

/**
 * Rezolvă automat suprapunerile dintre dreptunghiuri:
 * Când un dreptunghi este mutat sau creat, dacă se suprapune peste altul,
 * îl împinge lin în cea mai apropiată poziție liberă, fără să încalece alte noduri.
 */
export function resolveNodeCollisions<T extends Node>(
  nodes: T[],
  movedNodeId?: string
): T[] {
  const result = nodes.map((n) => ({
    ...n,
    position: { x: n.position.x, y: n.position.y },
  }));

  const minDx = NODE_WIDTH + COLLISION_PADDING;
  const minDy = NODE_HEIGHT + COLLISION_PADDING;

  for (let iter = 0; iter < 12; iter++) {
    let hadOverlap = false;

    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const a = result[i];
        const b = result[j];

        const dx = b.position.x - a.position.x;
        const dy = b.position.y - a.position.y;

        const overlapX = minDx - Math.abs(dx);
        const overlapY = minDy - Math.abs(dy);

        if (overlapX > 0 && overlapY > 0) {
          hadOverlap = true;

          // Alegem axa pe care e nevoie de cea mai mică deplasare pentru o mișcare fină
          const pushAlongX = overlapX < overlapY;
          const signX = dx === 0 ? (i % 2 === 0 ? 1 : -1) : Math.sign(dx);
          const signY = dy === 0 ? 1 : Math.sign(dy);

          // Dacă știm care nod a fost mutat de utilizator, îl ajustăm doar pe el sau pe vecin
          if (movedNodeId && a.id === movedNodeId) {
            if (pushAlongX) {
              a.position.x -= signX * overlapX;
            } else {
              a.position.y -= signY * overlapY;
            }
          } else if (movedNodeId && b.id === movedNodeId) {
            if (pushAlongX) {
              b.position.x += signX * overlapX;
            } else {
              b.position.y += signY * overlapY;
            }
          } else {
            if (pushAlongX) {
              const half = overlapX / 2;
              a.position.x -= signX * half;
              b.position.x += signX * half;
            } else {
              const half = overlapY / 2;
              a.position.y -= signY * half;
              b.position.y += signY * half;
            }
          }
        }
      }
    }

    if (!hadOverlap) break;
  }

  return result;
}

/**
 * Găsește o poziție liberă și frumoasă pentru o ramură nouă (copil) plecând din părinte.
 */
export function findFreeChildPosition<T extends Node>(
  parentNode: T,
  allNodes: T[]
): { x: number; y: number } {
  const existingChildrenBelow = allNodes.filter(
    (n) =>
      n.id !== parentNode.id &&
      n.position.y > parentNode.position.y + 40 &&
      n.position.y < parentNode.position.y + 260
  );

  const offsetIndex = existingChildrenBelow.length;
  const spreadX =
    offsetIndex === 0
      ? 0
      : (offsetIndex % 2 === 1 ? 1 : -1) *
        Math.ceil(offsetIndex / 2) *
        (NODE_WIDTH + 36);

  const candidate = {
    x: parentNode.position.x + spreadX,
    y: parentNode.position.y + NODE_HEIGHT + 84,
  };

  // Rulăm o verificare rapidă cu resolveNodeCollisions pe un nod virtual
  const tempId = "__candidate__";
  const resolved = resolveNodeCollisions(
    [
      ...allNodes,
      {
        ...parentNode,
        id: tempId,
        position: candidate,
      },
    ],
    tempId
  );

  const placed = resolved.find((n) => n.id === tempId);
  return placed ? placed.position : candidate;
}

/**
 * Calculează dinamic punctul de plecare și de sosire al liniei dintre 2 dreptunghiuri
 * astfel încât linia să se atașeze automat pe latura cea mai apropiată (Sus/Jos/Stânga/Dreapta)
 * în timp ce muți dreptunghiul oriunde pe ecran.
 */
export function getSmartEdgeParams(
  sourcePos: { x: number; y: number },
  targetPos: { x: number; y: number },
  sourceWidth = NODE_WIDTH,
  sourceHeight = NODE_HEIGHT,
  targetWidth = NODE_WIDTH,
  targetHeight = NODE_HEIGHT
): {
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  sourcePos: Position;
  targetPos: Position;
} {
  const sourceCenter = {
    x: sourcePos.x + sourceWidth / 2,
    y: sourcePos.y + sourceHeight / 2,
  };
  const targetCenter = {
    x: targetPos.x + targetWidth / 2,
    y: targetPos.y + targetHeight / 2,
  };

  const dx = targetCenter.x - sourceCenter.x;
  const dy = targetCenter.y - sourceCenter.y;

  // Alegem dacă legătura e predominant verticală sau orizontală
  if (Math.abs(dy) >= Math.abs(dx) * 0.65) {
    if (dy >= 0) {
      // Target este SUB Source
      return {
        sx: sourceCenter.x,
        sy: sourcePos.y + sourceHeight,
        tx: targetCenter.x,
        ty: targetPos.y,
        sourcePos: Position.Bottom,
        targetPos: Position.Top,
      };
    } else {
      // Target este DEASUPRA Source
      return {
        sx: sourceCenter.x,
        sy: sourcePos.y,
        tx: targetCenter.x,
        ty: targetPos.y + targetHeight,
        sourcePos: Position.Top,
        targetPos: Position.Bottom,
      };
    }
  } else {
    if (dx >= 0) {
      // Target este în DREAPTA Source
      return {
        sx: sourcePos.x + sourceWidth,
        sy: sourceCenter.y,
        tx: targetPos.x,
        ty: targetCenter.y,
        sourcePos: Position.Right,
        targetPos: Position.Left,
      };
    } else {
      // Target este în STÂNGA Source
      return {
        sx: sourcePos.x,
        sy: sourceCenter.y,
        tx: targetPos.x + targetWidth,
        ty: targetCenter.y,
        sourcePos: Position.Left,
        targetPos: Position.Right,
      };
    }
  }
}
