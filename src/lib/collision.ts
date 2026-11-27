import { Edge, Node, Position } from "@xyflow/react";
import { BacteriaNodeData } from "@/types/bacteria";

export const NODE_WIDTH = 240;
export const EXPANDED_NODE_WIDTH = 320;
export const NODE_HEIGHT = 96;
export const COLLISION_PADDING = 28;

/**
 * Estimează precis lățimea și înălțimea unui dreptunghi în funcție de starea lui:
 * - Restrâns (compact): 240 x 96
 * - Deschis în jos (expanded): calculează înălțimea tuturor subsecțiunilor și rândurilor de text
 */
export function getNodeDimensions(node: Node): {
  width: number;
  height: number;
} {
  const data = node.data as unknown as BacteriaNodeData | undefined;
  const isExpanded = Boolean(data?.expanded);

  // Dacă React Flow a măsurat deja DOM-ul și se potrivește cu starea curentă, luăm valoarea mai mare
  if (!isExpanded) {
    return {
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    };
  }

  const subsections = data?.subsections || [];
  let estimatedHeight = 112; // Header + butoane

  if (subsections.length === 0) {
    estimatedHeight += 72;
  } else {
    for (const sub of subsections) {
      const text = sub.content || "";
      const explicitLines = text.split("\n");
      let wrappedLines = 0;
      for (const line of explicitLines) {
        wrappedLines += Math.max(1, Math.ceil(line.length / 36));
      }
      // Titlu subsecțiune (~34px) + rânduri text (~21px/rând) + padding card (~24px)
      estimatedHeight += 36 + wrappedLines * 21 + 22;
    }
  }

  const measuredHeight = node.measured?.height || 0;
  return {
    width: EXPANDED_NODE_WIDTH,
    height: Math.max(estimatedHeight, measuredHeight, 180),
  };
}

/**
 * Găsește toți descendenții (copii, nepoți etc.) ai unui nod părinte din arbore
 */
export function getDescendantNodeIds(
  parentId: string,
  edges: Edge[]
): Set<string> {
  const descendants = new Set<string>();
  const queue = [parentId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const edge of edges) {
      if (edge.source === current && !descendants.has(edge.target)) {
        descendants.add(edge.target);
        queue.push(edge.target);
      }
    }
  }

  return descendants;
}

/**
 * Rezolvă dinamic coliziunile dintre dreptunghiuri ținând cont de dimensiunea reală
 * a fiecărui dreptunghi (inclusiv când un nod se deschide în jos cu săgeata!).
 * Prioritizarea pe verticală (push în jos) păstrează arborii ordonați și liniile curate.
 */
export function resolveNodeCollisions<T extends Node>(
  nodes: T[],
  anchorNodeId?: string
): T[] {
  const result = nodes.map((n) => ({
    ...n,
    position: { x: n.position.x, y: n.position.y },
  }));

  for (let iter = 0; iter < 18; iter++) {
    let hadOverlap = false;

    // Sortăm de sus în jos ca împingerea să curgă natural în josul arborelui
    result.sort((a, b) => a.position.y - b.position.y);

    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const a = result[i];
        const b = result[j];

        const dimA = getNodeDimensions(a);
        const dimB = getNodeDimensions(b);

        const centerAx = a.position.x + dimA.width / 2;
        const centerAy = a.position.y + dimA.height / 2;
        const centerBx = b.position.x + dimB.width / 2;
        const centerBy = b.position.y + dimB.height / 2;

        const dx = centerBx - centerAx;
        const dy = centerBy - centerAy;

        const minDx = (dimA.width + dimB.width) / 2 + COLLISION_PADDING;
        const minDy = (dimA.height + dimB.height) / 2 + COLLISION_PADDING;

        const overlapX = minDx - Math.abs(dx);
        const overlapY = minDy - Math.abs(dy);

        if (overlapX > 0 && overlapY > 0) {
          hadOverlap = true;

          const aExpanded = Boolean(
            (a.data as unknown as BacteriaNodeData)?.expanded
          );
          const bExpanded = Boolean(
            (b.data as unknown as BacteriaNodeData)?.expanded
          );

          // Dacă unul dintre noduri este deschis (expanded) și celălalt este sub el,
          // împingem nodul de jos pe verticală ca să nu strice structura arborelui
          if ((aExpanded || a.id === anchorNodeId) && b.position.y >= a.position.y) {
            b.position.y += overlapY + 4;
            continue;
          }
          if ((bExpanded || b.id === anchorNodeId) && a.position.y > b.position.y) {
            a.position.y += overlapY + 4;
            continue;
          }

          const pushAlongX = overlapX < overlapY;
          const signX = dx === 0 ? (i % 2 === 0 ? 1 : -1) : Math.sign(dx);
          const signY = dy >= 0 ? 1 : -1;

          if (anchorNodeId && a.id === anchorNodeId) {
            if (pushAlongX) {
              b.position.x += signX * overlapX;
            } else {
              b.position.y += signY * overlapY;
            }
          } else if (anchorNodeId && b.id === anchorNodeId) {
            if (pushAlongX) {
              a.position.x -= signX * overlapX;
            } else {
              a.position.y -= signY * overlapY;
            }
          } else {
            if (pushAlongX) {
              const half = overlapX / 2;
              a.position.x -= signX * half;
              b.position.x += signX * half;
            } else {
              // Împingem întotdeauna nodul mai de jos și mai în jos
              if (b.position.y >= a.position.y) {
                b.position.y += overlapY;
              } else {
                a.position.y += overlapY;
              }
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
 * Când un nod este deschis în jos cu săgeata (sau închis la loc):
 * - Când se DESCHIDE: calculează cu cât a crescut înălțimea dreptunghiului (`deltaY`)
 *   și coboară automat sub-arborele lui + toate nodurile de dedesubt care s-ar intersecta,
 *   apoi rezolvă orice coliziune rămasă.
 * - Când se ÎNCHIDE: urcă înapoi nodurile care au fost împinse, readucând schema compactă.
 */
export function applyDynamicExpandShift<T extends Node>(
  nodes: T[],
  edges: Edge[],
  toggledNodeId: string,
  nextExpanded: boolean,
  previousDeltaMap: Record<string, number>
): {
  nodes: T[];
  updatedDeltaMap: Record<string, number>;
} {
  const target = nodes.find((n) => n.id === toggledNodeId);
  if (!target) {
    return { nodes, updatedDeltaMap: previousDeltaMap };
  }

  //Actualizăm flag-ul expanded pe nodul țintă
  const updatedNodes = nodes.map((n) =>
    n.id === toggledNodeId
      ? {
          ...n,
          data: {
            ...n.data,
            expanded: nextExpanded,
          },
        }
      : { ...n, position: { ...n.position } }
  );

  const toggledNodeAfter = updatedNodes.find((n) => n.id === toggledNodeId)!;
  const expandedDims = getNodeDimensions({
    ...toggledNodeAfter,
    data: { ...toggledNodeAfter.data, expanded: true },
  });

  // Cu cât crește nodul în jos față de starea compactă
  const deltaY = Math.max(0, expandedDims.height - NODE_HEIGHT + 20);
  const descendants = getDescendantNodeIds(toggledNodeId, edges);
  const newDeltaMap = { ...previousDeltaMap };

  const parentCenterX =
    target.position.x + EXPANDED_NODE_WIDTH / 2;

  if (nextExpanded) {
    newDeltaMap[toggledNodeId] = deltaY;

    for (const n of updatedNodes) {
      if (n.id === toggledNodeId) continue;

      const isDescendantBelow =
        descendants.has(n.id) && n.position.y > target.position.y + 20;

      const nDim = getNodeDimensions(n);
      const nCenterX = n.position.x + nDim.width / 2;
      const horizontallyInColumn =
        Math.abs(nCenterX - parentCenterX) <
        (EXPANDED_NODE_WIDTH + nDim.width) / 2 + 40;
      const isDirectlyBelow =
        n.position.y > target.position.y + 20 && horizontallyInColumn;

      if (isDescendantBelow || isDirectlyBelow) {
        n.position.y += deltaY;
      }
    }

    return {
      nodes: resolveNodeCollisions(updatedNodes, toggledNodeId),
      updatedDeltaMap: newDeltaMap,
    };
  } else {
    const appliedDelta = newDeltaMap[toggledNodeId] || deltaY;
    delete newDeltaMap[toggledNodeId];

    for (const n of updatedNodes) {
      if (n.id === toggledNodeId) continue;

      const isDescendantBelow =
        descendants.has(n.id) && n.position.y > target.position.y + 20;

      const nDim = getNodeDimensions(n);
      const nCenterX = n.position.x + nDim.width / 2;
      const horizontallyInColumn =
        Math.abs(nCenterX - parentCenterX) <
        (EXPANDED_NODE_WIDTH + nDim.width) / 2 + 40;
      const isDirectlyBelow =
        n.position.y > target.position.y + 20 && horizontallyInColumn;

      if (isDescendantBelow || isDirectlyBelow) {
        n.position.y = Math.max(
          target.position.y + NODE_HEIGHT + 48,
          n.position.y - appliedDelta
        );
      }
    }

    return {
      nodes: resolveNodeCollisions(updatedNodes, toggledNodeId),
      updatedDeltaMap: newDeltaMap,
    };
  }
}

/**
 * Găsește o poziție liberă și frumoasă pentru o ramură nouă (copil) plecând din părinte,
 * ținând cont și dacă părintele este deschis (expandat în jos) în acel moment!
 */
export function findFreeChildPosition<T extends Node>(
  parentNode: T,
  allNodes: T[]
): { x: number; y: number } {
  const parentDims = getNodeDimensions(parentNode);

  const existingChildrenBelow = allNodes.filter(
    (n) =>
      n.id !== parentNode.id &&
      n.position.y > parentNode.position.y + parentDims.height * 0.5 &&
      n.position.y < parentNode.position.y + parentDims.height + 280
  );

  const offsetIndex = existingChildrenBelow.length;
  const spreadX =
    offsetIndex === 0
      ? 0
      : (offsetIndex % 2 === 1 ? 1 : -1) *
        Math.ceil(offsetIndex / 2) *
        (NODE_WIDTH + 40);

  const candidate = {
    x: parentNode.position.x + spreadX,
    y: parentNode.position.y + parentDims.height + 76,
  };

  const tempId = "__candidate__";
  const resolved = resolveNodeCollisions(
    [
      ...allNodes,
      {
        ...parentNode,
        id: tempId,
        data: { ...parentNode.data, expanded: false },
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
 * ținând cont de înălțimea reală a nodului (când nodul se dă în jos, linia pleacă
 * exact de la baza nodului extins, fără să treacă peste textul afișat!).
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

  // Dacă nodul țintă este mai jos decât baza nodului sursă, ancorăm mereu Jos -> Sus
  if (targetPos.y >= sourcePos.y + sourceHeight - 20) {
    return {
      sx: sourceCenter.x,
      sy: sourcePos.y + sourceHeight,
      tx: targetCenter.x,
      ty: targetPos.y,
      sourcePos: Position.Bottom,
      targetPos: Position.Top,
    };
  }

  // Dacă nodul țintă este deasupra nodului sursă, ancorăm Sus -> Jos
  if (targetPos.y + targetHeight <= sourcePos.y + 20) {
    return {
      sx: sourceCenter.x,
      sy: sourcePos.y,
      tx: targetCenter.x,
      ty: targetPos.y + targetHeight,
      sourcePos: Position.Top,
      targetPos: Position.Bottom,
    };
  }

  // Altfel, sunt pe aceeași linie orizontală (Stânga / Dreapta)
  if (dx >= 0) {
    return {
      sx: sourcePos.x + sourceWidth,
      sy: sourceCenter.y,
      tx: targetPos.x,
      ty: targetCenter.y,
      sourcePos: Position.Right,
      targetPos: Position.Left,
    };
  } else {
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
