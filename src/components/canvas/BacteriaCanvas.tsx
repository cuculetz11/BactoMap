"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Background,
  BackgroundVariant,
  Connection,
  Controls,
  Edge,
  EdgeChange,
  MiniMap,
  Node,
  NodeChange,
  ReactFlow,
  ReactFlowProvider,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import BacteriaNode from "@/components/canvas/BacteriaNode";
import SmartBezierEdge from "@/components/canvas/SmartBezierEdge";
import FloatingToolbar from "@/components/canvas/FloatingToolbar";
import BacteriaModal from "@/components/modal/BacteriaModal";
import { BACTERIA_COLORS } from "@/lib/colors";
import {
  findFreeChildPosition,
  NODE_HEIGHT,
  NODE_WIDTH,
  resolveNodeCollisions,
} from "@/lib/collision";
import { loadUserGraph, saveUserGraph } from "@/lib/supabase";
import {
  BacteriaEdgeRecord,
  BacteriaNodeData,
  BacteriaNodeRecord,
  ColorKey,
  Subsection,
  UserSession,
} from "@/types/bacteria";

const nodeTypes = {
  bacteria: BacteriaNode,
};

const edgeTypes = {
  smartBezier: SmartBezierEdge,
};

interface BacteriaCanvasInnerProps {
  session: UserSession;
  onLogout: () => void;
}

function BacteriaCanvasInner({ session, onLogout }: BacteriaCanvasInnerProps) {
  const { fitView, setCenter, screenToFlowPosition } = useReactFlow();

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [activeModalNodeId, setActiveModalNodeId] = useState<string | null>(
    null
  );
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving">("saved");
  const [initialLoaded, setInitialLoaded] = useState(false);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleOpenModal = useCallback((nodeId: string) => {
    setActiveModalNodeId(nodeId);
  }, []);

  const handleDeleteEdge = useCallback((edgeId: string) => {
    setEdges((eds) => eds.filter((e) => e.id !== edgeId));
  }, []);

  // Adaugă o ramură nouă (dreptunghi copil) legată de părinte, într-un loc liber fără suprapuneri
  const handleAddChildNode = useCallback(
    (parentNodeId: string) => {
      setNodes((currentNodes) => {
        const parent = currentNodes.find((n) => n.id === parentNodeId);
        if (!parent) return currentNodes;

        const parentData = parent.data as unknown as BacteriaNodeData;
        const freePos = findFreeChildPosition(parent, currentNodes);
        const newNodeId = crypto.randomUUID();

        const newNode: Node = {
          id: newNodeId,
          type: "bacteria",
          position: freePos,
          data: {
            title: "Specie / Ramură nouă",
            colorKey: parentData.colorKey || "violet",
            subsections: [
              {
                id: crypto.randomUUID(),
                title: "Caractere generale",
                content: "",
              },
            ],
            onOpenModal: handleOpenModal,
            onAddChild: () => {},
          } satisfies BacteriaNodeData,
        };

        const palette =
          BACTERIA_COLORS[parentData.colorKey] || BACTERIA_COLORS.violet;

        setEdges((currentEdges) => [
          ...currentEdges,
          {
            id: crypto.randomUUID(),
            source: parentNodeId,
            target: newNodeId,
            type: "smartBezier",
            style: { stroke: palette.edgeStroke },
            data: { onDeleteEdge: handleDeleteEdge },
          },
        ]);

        const updated = resolveNodeCollisions(
          [...currentNodes, newNode],
          newNodeId
        );

        // Deschidem direct pop-up-ul pentru noul nod ca să-i poți scrie numele
        setTimeout(() => {
          setActiveModalNodeId(newNodeId);
        }, 120);

        return updated;
      });
    },
    [handleOpenModal, handleDeleteEdge]
  );

  // Atașăm callback-urile pe fiecare nod
  const hydrateNodeCallbacks = useCallback(
    (rawNodes: Node[]): Node[] =>
      rawNodes.map((n) => ({
        ...n,
        data: {
          ...n.data,
          onOpenModal: handleOpenModal,
          onAddChild: handleAddChildNode,
        },
      })),
    [handleOpenModal, handleAddChildNode]
  );

  // Încărcarea inițială a schemei studentului
  useEffect(() => {
    let mounted = true;
    loadUserGraph(session.id).then(({ nodes: dbNodes, edges: dbEdges }) => {
      if (!mounted) return;

      const rfNodes: Node[] = dbNodes.map((n) => ({
        id: n.id,
        type: "bacteria",
        position: { x: n.position_x, y: n.position_y },
        data: {
          title: n.title,
          colorKey: n.color_key || "violet",
          subsections: Array.isArray(n.subsections) ? n.subsections : [],
          onOpenModal: handleOpenModal,
          onAddChild: handleAddChildNode,
        } satisfies BacteriaNodeData,
      }));

      const rfEdges: Edge[] = dbEdges.map((e) => {
        const sourceRecord = dbNodes.find((n) => n.id === e.source_id);
        const palette =
          BACTERIA_COLORS[sourceRecord?.color_key || "violet"] ||
          BACTERIA_COLORS.violet;
        return {
          id: e.id,
          source: e.source_id,
          target: e.target_id,
          type: "smartBezier",
          style: { stroke: palette.edgeStroke },
          data: { onDeleteEdge: handleDeleteEdge },
        };
      });

      setNodes(resolveNodeCollisions(rfNodes));
      setEdges(rfEdges);
      setInitialLoaded(true);

      setTimeout(() => {
        fitView({ padding: 0.22, duration: 400 });
      }, 100);
    });

    return () => {
      mounted = false;
    };
  }, [
    session.id,
    handleOpenModal,
    handleAddChildNode,
    handleDeleteEdge,
    fitView,
  ]);

  // Auto-save cu debounce (500ms) la orice modificare de nod sau ramură
  useEffect(() => {
    if (!initialLoaded) return;

    setSaveStatus("saving");
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(async () => {
      const nodeRecords: BacteriaNodeRecord[] = nodes.map((n) => {
        const d = n.data as unknown as BacteriaNodeData;
        return {
          id: n.id,
          user_id: session.id,
          title: d.title,
          color_key: d.colorKey,
          position_x: Math.round(n.position.x),
          position_y: Math.round(n.position.y),
          subsections: d.subsections || [],
        };
      });

      const edgeRecords: BacteriaEdgeRecord[] = edges.map((e) => ({
        id: e.id,
        user_id: session.id,
        source_id: e.source,
        target_id: e.target,
      }));

      await saveUserGraph(session.id, nodeRecords, edgeRecords);
      setSaveStatus("saved");
    }, 500);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [nodes, edges, session.id, initialLoaded]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => hydrateNodeCallbacks(applyNodeChanges(changes, nds)));
    },
    [hydrateNodeCallbacks]
  );

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);

  // Când utilizatorul termină de mutat un dreptunghi, rezolvăm finuț orice suprapunere
  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent, draggedNode: Node) => {
      setNodes((nds) =>
        hydrateNodeCallbacks(resolveNodeCollisions(nds, draggedNode.id))
      );
    },
    [hydrateNodeCallbacks]
  );

  // Conectare manuală între 2 dreptunghiuri existente
  const onConnect = useCallback(
    (connection: Connection) => {
      if (
        !connection.source ||
        !connection.target ||
        connection.source === connection.target
      ) {
        return;
      }

      setEdges((eds) => {
        const alreadyExists = eds.some(
          (e) =>
            (e.source === connection.source &&
              e.target === connection.target) ||
            (e.source === connection.target && e.target === connection.source)
        );
        if (alreadyExists) return eds;

        return [
          ...eds,
          {
            id: crypto.randomUUID(),
            source: connection.source,
            target: connection.target,
            type: "smartBezier",
            style: { stroke: "#8b5cf6" },
            data: { onDeleteEdge: handleDeleteEdge },
          },
        ];
      });
    },
    [handleDeleteEdge]
  );

  // Adaugă o Rădăcină Nouă (pentru un arbore nou pe aceeași pânză infinită)
  const handleAddRootNode = useCallback(() => {
    const centerFlow = screenToFlowPosition({
      x: window.innerWidth / 2 - NODE_WIDTH / 2,
      y: window.innerHeight / 2 - NODE_HEIGHT / 2,
    });

    const newNodeId = crypto.randomUUID();
    const newNode: Node = {
      id: newNodeId,
      type: "bacteria",
      position: centerFlow,
      data: {
        title: "Familie / Rădăcină nouă",
        colorKey: "slate",
        subsections: [
          {
            id: crypto.randomUUID(),
            title: "Caractere generale",
            content: "",
          },
        ],
        onOpenModal: handleOpenModal,
        onAddChild: handleAddChildNode,
      } satisfies BacteriaNodeData,
    };

    setNodes((nds) =>
      hydrateNodeCallbacks(resolveNodeCollisions([...nds, newNode], newNodeId))
    );
    setActiveModalNodeId(newNodeId);
  }, [
    screenToFlowPosition,
    handleOpenModal,
    handleAddChildNode,
    hydrateNodeCallbacks,
  ]);

  // Modificări din Pop-up
  const handleChangeTitle = useCallback((nodeId: string, newTitle: string) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, title: newTitle } } : n
      )
    );
  }, []);

  const handleChangeColor = useCallback(
    (nodeId: string, newColor: ColorKey) => {
      const palette = BACTERIA_COLORS[newColor] || BACTERIA_COLORS.violet;
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId
            ? { ...n, data: { ...n.data, colorKey: newColor } }
            : n
        )
      );
      setEdges((eds) =>
        eds.map((e) =>
          e.source === nodeId
            ? { ...e, style: { ...e.style, stroke: palette.edgeStroke } }
            : e
        )
      );
    },
    []
  );

  const handleChangeSubsections = useCallback(
    (nodeId: string, newSubsections: Subsection[]) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId
            ? { ...n, data: { ...n.data, subsections: newSubsections } }
            : n
        )
      );
    },
    []
  );

  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) =>
      eds.filter((e) => e.source !== nodeId && e.target !== nodeId)
    );
    setActiveModalNodeId(null);
  }, []);

  const handleFocusNode = useCallback(
    (nodeId: string) => {
      const target = nodes.find((n) => n.id === nodeId);
      if (!target) return;
      setCenter(
        target.position.x + NODE_WIDTH / 2,
        target.position.y + NODE_HEIGHT / 2,
        { zoom: 1.15, duration: 500 }
      );
    },
    [nodes, setCenter]
  );

  const activeModalNode = useMemo(
    () => nodes.find((n) => n.id === activeModalNodeId) || null,
    [nodes, activeModalNodeId]
  );

  const searchItems = useMemo(
    () =>
      nodes.map((n) => ({
        id: n.id,
        title: (n.data as unknown as BacteriaNodeData).title || "Bacterie",
      })),
    [nodes]
  );

  return (
    <div className="w-screen h-screen bg-slate-50 relative overflow-hidden select-none">
      <FloatingToolbar
        username={session.username}
        saveStatus={saveStatus}
        nodesList={searchItems}
        onAddRootNode={handleAddRootNode}
        onFocusNode={handleFocusNode}
        onFitView={() => fitView({ padding: 0.22, duration: 450 })}
        onLogout={onLogout}
      />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        minZoom={0.15}
        maxZoom={2.2}
        panOnDrag
        zoomOnPinch
        panOnScroll
        selectionOnDrag={false}
        deleteKeyCode={["Backspace", "Delete"]}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.4}
          color="#cbd5e1"
        />
        <Controls
          position="bottom-left"
          showInteractive={false}
          className="!bg-white/90 !backdrop-blur-md !border !border-slate-200 !rounded-2xl !shadow-md overflow-hidden"
        />
        <MiniMap
          position="bottom-right"
          pannable
          zoomable
          nodeColor={(n) => {
            const d = n.data as unknown as BacteriaNodeData;
            return BACTERIA_COLORS[d?.colorKey || "violet"]?.border || "#8b5cf6";
          }}
          className="!hidden md:!block !bg-white/90 !backdrop-blur-md !border !border-slate-200 !rounded-2xl !shadow-md"
        />
      </ReactFlow>

      {/* Pop-up-ul cu Subsecțiuni Custom când dai click/tap pe un dreptunghi */}
      {activeModalNode && (
        <BacteriaModal
          nodeId={activeModalNode.id}
          title={(activeModalNode.data as unknown as BacteriaNodeData).title}
          colorKey={
            (activeModalNode.data as unknown as BacteriaNodeData).colorKey
          }
          subsections={
            (activeModalNode.data as unknown as BacteriaNodeData).subsections ||
            []
          }
          onClose={() => setActiveModalNodeId(null)}
          onChangeTitle={handleChangeTitle}
          onChangeColor={handleChangeColor}
          onChangeSubsections={handleChangeSubsections}
          onAddChildFromModal={handleAddChildNode}
          onDeleteNode={handleDeleteNode}
        />
      )}
    </div>
  );
}

export default function BacteriaCanvas(props: BacteriaCanvasInnerProps) {
  return (
    <ReactFlowProvider>
      <BacteriaCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
