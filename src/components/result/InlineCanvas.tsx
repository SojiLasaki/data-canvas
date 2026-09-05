import { useEffect, useMemo, useState } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  applyEdgeChanges,
  applyNodeChanges,
  type EdgeChange,
  type NodeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { MisoNodeCard } from "@/components/canvas/MisoNodeCard";
import { MisoEdgeLine } from "@/components/canvas/MisoEdgeLine";
import { pipelineToGraph } from "@/lib/pipeline/graph";
import type { MisoEdge, MisoNode } from "@/lib/canvas/graph";
import type { Pipeline } from "@/lib/pipeline/types";
import { cn } from "@/lib/utils";

const nodeTypes = { miso: MisoNodeCard };
const edgeTypes = { miso: MisoEdgeLine };

/** A compact, read-mostly projection of the shared pipeline as a node graph. */
export function InlineCanvas({
  pipeline,
  className,
  selectedStepId,
  onSelectStep,
}: {
  pipeline: Pipeline;
  className?: string;
  selectedStepId?: string | null;
  onSelectStep?: (stepId: string | null) => void;
}) {
  const graph = useMemo(() => pipelineToGraph(pipeline), [pipeline]);
  const [nodes, setNodes] = useState<MisoNode[]>(graph.nodes);
  const [edges, setEdges] = useState<MisoEdge[]>(graph.edges);

  useEffect(() => {
    setNodes(graph.nodes);
    setEdges(graph.edges);
  }, [graph]);

  const painted = useMemo(
    () => nodes.map((n) => ({ ...n, selected: graph.stepByNode[n.id] === selectedStepId })),
    [nodes, graph, selectedStepId],
  );

  return (
    <div className={cn("h-[420px] w-full border border-border bg-canvas", className)}>
      <ReactFlowProvider>
        <ReactFlow<MisoNode, MisoEdge>
          nodes={painted}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={(changes: NodeChange<MisoNode>[]) => setNodes((n) => applyNodeChanges(changes, n))}
          onEdgesChange={(changes: EdgeChange<MisoEdge>[]) => setEdges((e) => applyEdgeChanges(changes, e))}
          onNodeClick={(_, node) => {
            const stepIdValue = graph.stepByNode[node.id];
            if (stepIdValue) onSelectStep?.(stepIdValue === selectedStepId ? null : stepIdValue);
          }}
          onPaneClick={() => onSelectStep?.(null)}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.2}
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{ type: "miso" }}
        >
          <Background variant={BackgroundVariant.Lines} gap={28} color="var(--canvas-grid)" />
          <Controls showInteractive={false} className="!border !border-border !bg-card !shadow-none" />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}
