import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  Play,
  Redo2,
  Save,
  Search,
  Sparkles,
  Undo2,
} from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";

import { MisoNodeCard } from "@/components/canvas/MisoNodeCard";
import { MisoEdgeLine } from "@/components/canvas/MisoEdgeLine";
import { NodePalette } from "@/components/canvas/NodePalette";
import { NodeSearchDialog } from "@/components/canvas/NodeSearchDialog";
import { AssistantPanel, type AssistantMessage } from "@/components/canvas/AssistantPanel";
import { Inspector } from "@/components/canvas/Inspector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { createEdge, createNode, nextId, recomputeEdges, type MisoEdge, type MisoNode } from "@/lib/canvas/graph";
import { defaultSettings, evaluateConnection, modifierKindFor } from "@/lib/canvas/compatibility";
import { makeNode } from "@/lib/canvas/nodeFactory";
import type { MisoNodeData } from "@/lib/canvas/types";
import { aiService } from "@/services/aiService";
import { canvasService } from "@/services/canvasService";

export const Route = createFileRoute("/canvas")({
  validateSearch: z.object({ q: z.string().optional() }),
  component: () => (
    <ReactFlowProvider>
      <CanvasPage />
    </ReactFlowProvider>
  ),
  head: () => ({
    meta: [
      { title: "AI Data Canvas · MISO Navigator" },
      {
        name: "description",
        content:
          "Visually connect MISO data sources, datasets, filters, transformations and visualizations on an AI-assisted canvas.",
      },
      { property: "og:title", content: "AI Data Canvas · MISO Navigator" },
      {
        property: "og:description",
        content: "Build MISO data workflows visually with AI-generated nodes and validated connections.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

type RunState =
  | { phase: "idle" }
  | { phase: "loading"; steps: string[] }
  | { phase: "running"; steps: string[]; done: number }
  | { phase: "complete" }
  | { phase: "error" };

const nodeTypes = { miso: MisoNodeCard };
const edgeTypes = { miso: MisoEdgeLine };

function CanvasPage() {
  const { q } = Route.useSearch();
  const { screenToFlowPosition } = useReactFlow();
  const wrapper = useRef<HTMLDivElement>(null);

  const [nodes, setNodes] = useState<MisoNode[]>([]);
  const [edges, setEdges] = useState<MisoEdge[]>([]);
  const [past, setPast] = useState<{ nodes: MisoNode[]; edges: MisoEdge[] }[]>([]);
  const [future, setFuture] = useState<{ nodes: MisoNode[]; edges: MisoEdge[] }[]>([]);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [command, setCommand] = useState("");
  const [run, setRun] = useState<RunState>({ phase: "idle" });
  const [tab, setTab] = useState("assistant");
  const generatedFor = useRef<string | null>(null);

  const selectedNode = useMemo(() => nodes.find((n) => n.selected) ?? null, [nodes]);
  const upstream = useMemo(() => {
    if (!selectedNode) return [] as MisoNodeData[];
    const ids = edges.filter((e) => e.target === selectedNode.id).map((e) => e.source);
    return nodes.filter((n) => ids.includes(n.id)).map((n) => n.data);
  }, [edges, nodes, selectedNode]);

  const snapshot = useCallback(() => {
    setPast((p) => [...p.slice(-40), { nodes, edges }]);
    setFuture([]);
  }, [nodes, edges]);

  const say = (text: string, workflow?: string[]) =>
    setMessages((m) => [
      ...m,
      { id: nextId("m"), role: "assistant", text, ...(workflow ? { workflow } : {}) },
    ]);

  /* ---------- AI generation from the search experience ---------- */
  const generate = useCallback(
    async (prompt: string) => {
      setBusy(true);
      setRun({ phase: "loading", steps: ["Finding MISO data…", "Analyzing compatibility…", "Building your workflow…"] });
      const wf = await aiService.generateWorkflow(prompt);
      await new Promise((r) => setTimeout(r, 700));
      setNodes(wf.nodes);
      setEdges(wf.edges);
      setMessages((m) => [
        ...m,
        { id: nextId("m"), role: "user", text: prompt },
        { id: nextId("m"), role: "assistant", text: wf.message, workflow: wf.summary },
      ]);
      setRun({ phase: "idle" });
      setBusy(false);
    },
    [],
  );

  useEffect(() => {
    if (q && generatedFor.current !== q) {
      generatedFor.current = q;
      void generate(q);
    }
  }, [q, generate]);

  useEffect(() => {
    if (!q) {
      const saved = canvasService.load();
      if (saved && saved.nodes.length) {
        setNodes(saved.nodes);
        setEdges(saved.edges);
      }
    }
  }, [q]);

  /* ---------- graph mutations ---------- */
  const onNodesChange = useCallback(
    (changes: NodeChange<MisoNode>[]) => setNodes((n) => applyNodeChanges(changes, n)),
    [],
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange<MisoEdge>[]) => setEdges((e) => applyEdgeChanges(changes, e)),
    [],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      snapshot();
      setEdges((eds) => {
        const source = nodes.find((n) => n.id === connection.source);
        const target = nodes.find((n) => n.id === connection.target);
        const compatibility = evaluateConnection(source?.data, target?.data);
        const modifierKind = modifierKindFor(source?.data);
        if (compatibility.state === "invalid") toast.error(compatibility.reason);
        return addEdge(
          {
            ...connection,
            id: nextId("e"),
            type: "miso",
            data: { compatibility, modifierKind, settings: defaultSettings(modifierKind) },
          },
          eds,
        ) as MisoEdge[];
      });
    },
    [nodes, snapshot],
  );

  useEffect(() => {
    setEdges((eds) => {
      const next = recomputeEdges(nodes, eds);
      const changed = next.some(
        (e, i) => e.data?.compatibility.state !== eds[i]?.data?.compatibility.state,
      );
      return changed ? next : eds;
    });
  }, [nodes]);

  const addNode = useCallback(
    (data: MisoNodeData, position?: { x: number; y: number }) => {
      snapshot();
      const pos = position ?? { x: 120 + nodes.length * 40, y: 120 + (nodes.length % 4) * 130 };
      setNodes((n) => [...n, createNode(data, pos)]);
    },
    [nodes.length, snapshot],
  );

  const patchNode = useCallback((id: string, patch: Partial<MisoNodeData>) => {
    setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n)));
  }, []);

  const undo = () => {
    setPast((p) => {
      const prev = p[p.length - 1];
      if (!prev) return p;
      setFuture((f) => [...f, { nodes, edges }]);
      setNodes(prev.nodes);
      setEdges(prev.edges);
      return p.slice(0, -1);
    });
  };

  const redo = () => {
    setFuture((f) => {
      const next = f[f.length - 1];
      if (!next) return f;
      setPast((p) => [...p, { nodes, edges }]);
      setNodes(next.nodes);
      setEdges(next.edges);
      return f.slice(0, -1);
    });
  };

  /* ---------- suggestions & assistant ---------- */
  const handleSuggestion = (action: string, node: MisoNode) => {
    const pos = { x: node.position.x + 320, y: node.position.y };
    if (action === "Visualize" || action.startsWith("Extract")) {
      const rec = aiService.recommendVisualization(node.data);
      const data =
        action === "Visualize"
          ? makeNode("visualization", rec.type, {
              tags: [rec.type],
              config: { type: rec.type, xAxis: "Timestamp", yAxis: "Load MW", aggregation: "Average", title: node.data.name },
            })
          : makeNode("transform", "Find Section", { description: action.replace("Extract: ", ""), tags: ["Extraction"] });
      snapshot();
      const created = createNode(data, pos);
      setNodes((ns) => [...ns, created]);
      setEdges((es) => [...es, createEdge(node, created)]);
      say(
        action === "Visualize"
          ? `Recommended: ${rec.type}. ${rec.reason}`
          : `Loading only the “${action.replace("Extract: ", "")}” section of ${node.data.name}.`,
      );
      return;
    }
    const map: Record<string, MisoNodeData> = {
      Compare: makeNode("compare", "Compare", { description: `${node.data.name} vs …`, tags: ["Compare"] }),
      Filter: makeNode("filter", "Filter", { description: "Location = Indiana", tags: ["Filter"] }),
      Aggregate: makeNode("transform", "Aggregate", { description: "Hourly → Daily average", tags: ["Aggregate"] }),
      Download: makeNode("output", "Output", { tags: ["CSV"], config: { format: "CSV" } }),
      "Open full dataset": makeNode("output", "Output", { tags: ["CSV"], config: { format: "CSV" } }),
      "Find related data": makeNode("dataset", "Related Dataset", { description: "Suggested by the assistant", tags: ["Hourly", "MW"] }),
    };
    const data = map[action];
    if (!data) return;
    snapshot();
    const created = createNode(data, pos);
    setNodes((ns) => [...ns, created]);
    setEdges((es) => [...es, createEdge(node, created)]);
    say(`Added ${data.name} downstream of ${node.data.name}.`);
  };

  const handleAssistant = async (text: string) => {
    setMessages((m) => [...m, { id: nextId("m"), role: "user", text }]);
    setBusy(true);
    if (/compare|create a graph|visuali[sz]e .*(load|price)|workflow/i.test(text) && nodes.length === 0) {
      await generate(text);
      setBusy(false);
      return;
    }
    const res = await aiService.interpretCommand(text);
    if (res.add) addNode(res.add);
    say(res.reply, nodes.length ? nodes.map((n) => n.data.name) : undefined);
    setBusy(false);
  };

  const runWorkflow = async () => {
    if (nodes.length === 0) {
      setRun({ phase: "error" });
      return;
    }
    const steps = ["Retrieving data", "Applying filters", "Transforming data", "Creating visualization"];
    setRun({ phase: "running", steps, done: 0 });
    for (let i = 1; i <= steps.length; i += 1) {
      await new Promise((r) => setTimeout(r, 550));
      setRun({ phase: "running", steps, done: i });
    }
    setNodes((ns) => ns.map((n) => ({ ...n, data: { ...n.data, status: "complete" } })));
    setRun({ phase: "complete" });
  };

  const save = () => {
    canvasService.save({ nodes, edges, notes: "" });
    toast.success("Canvas saved to this browser");
  };

  const exportAs = (format: "JSON" | "SVG" | "PNG" | "Link") => {
    if (format === "JSON") {
      canvasService.download("miso-workflow.json", canvasService.exportJson(nodes, edges), "application/json");
    } else if (format === "SVG" || format === "PNG") {
      canvasService.download(
        `miso-workflow.svg`,
        canvasService.exportSvg(nodes, edges),
        "image/svg+xml",
      );
      if (format === "PNG") toast.info("Exported as vector SVG — PNG rasterization runs server-side.");
    } else {
      void navigator.clipboard?.writeText(`${window.location.origin}/canvas?shared=prototype`);
      toast.success("Shareable link copied (prototype placeholder)");
    }
  };

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const raw = event.dataTransfer.getData("application/miso-node");
    if (!raw) return;
    const data = JSON.parse(raw) as MisoNodeData;
    addNode(data, screenToFlowPosition({ x: event.clientX, y: event.clientY }));
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top navigation */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-navy">
            <ArrowLeft className="h-4 w-4" /> MISO Navigator
          </Link>
          <span className="h-5 w-px bg-border" />
          <h1 className="text-sm font-semibold text-navy">Data Canvas</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={undo} disabled={past.length === 0} aria-label="Undo">
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={redo} disabled={future.length === 0} aria-label="Redo">
            <Redo2 className="h-4 w-4" />
          </Button>
          <span className="mx-1 h-5 w-px bg-border" />
          <Button variant="outline" size="sm" onClick={save}>
            <Save className="mr-1.5 h-3.5 w-3.5" /> Save
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="mr-1.5 h-3.5 w-3.5" /> Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(["PNG", "SVG", "JSON", "Link"] as const).map((f) => (
                <DropdownMenuItem key={f} onSelect={() => exportAs(f)}>
                  {f === "Link" ? "Shareable link" : `Export ${f}`}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" onClick={runWorkflow}>
            <Play className="mr-1.5 h-3.5 w-3.5" /> Run
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <NodePalette onAdd={(d) => addNode(d)} onSearch={() => setSearchOpen(true)} />

        {/* Canvas */}
        <main className="relative min-w-0 flex-1 bg-canvas" ref={wrapper}>
          {/* Command bar */}
          <div className="pointer-events-none absolute inset-x-0 top-4 z-10 flex justify-center px-6">
            <form
              className="pointer-events-auto flex w-full max-w-xl items-center gap-2 border border-border bg-card px-3 py-1.5 shadow-sm"
              onSubmit={(e) => {
                e.preventDefault();
                if (!command.trim()) return;
                void handleAssistant(command.trim());
                setCommand("");
                setTab("assistant");
              }}
            >
              <span className="border border-border px-1 text-[10px] font-semibold text-muted-foreground">⌘K</span>
              <Input
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="Ask AI or add something…"
                aria-label="Canvas command bar"
                className="h-7 border-0 px-0 shadow-none focus-visible:ring-0"
              />
              <button
                type="button"
                aria-label="Search MISO resources"
                onClick={() => setSearchOpen(true)}
                className="text-muted-foreground hover:text-navy"
              >
                <Search className="h-4 w-4" />
              </button>
            </form>
          </div>

          <ReactFlow<MisoNode, MisoEdge>
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeDragStart={snapshot}
            onDrop={onDrop}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
            }}
            onSelectionChange={({ nodes: sel }) => {
              if (sel.length) setTab("inspector");
            }}
            fitView
            proOptions={{ hideAttribution: true }}
            defaultEdgeOptions={{ type: "miso" }}
          >
            <Background variant={BackgroundVariant.Lines} gap={28} color="var(--canvas-grid)" />
            <Controls showInteractive={false} className="!border !border-border !bg-card !shadow-none" />
            <MiniMap pannable className="!border !border-border !bg-card" maskColor="oklch(0.9 0.01 250 / 40%)" />
          </ReactFlow>

          {/* States */}
          {nodes.length === 0 && run.phase === "idle" && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="pointer-events-auto max-w-md border border-border bg-card px-8 py-8 text-center">
                <Sparkles className="mx-auto h-6 w-6 text-primary" />
                <h2 className="mt-3 text-base font-semibold text-navy">Start building your data workflow</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add a node from the left, or ask the AI to create one for you.
                </p>
                <form
                  className="mt-4 flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!command.trim()) return;
                    void generate(command.trim());
                    setCommand("");
                  }}
                >
                  <Input
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    placeholder="What would you like to visualize?"
                    aria-label="Describe the workflow you want"
                  />
                  <Button type="submit">Create</Button>
                </form>
              </div>
            </div>
          )}

          {run.phase === "loading" && (
            <StatePanel title="Preparing your workflow">
              {run.steps.map((s) => (
                <p key={s} className="text-sm text-muted-foreground">
                  {s}
                </p>
              ))}
            </StatePanel>
          )}

          {run.phase === "running" && (
            <StatePanel title="Running workflow…">
              <ol className="space-y-1 text-sm">
                {run.steps.map((s, i) => (
                  <li key={s} className={i < run.done ? "text-valid" : "text-muted-foreground"}>
                    {i + 1}. {s} {i < run.done ? "✓" : "…"}
                  </li>
                ))}
              </ol>
            </StatePanel>
          )}

          {run.phase === "complete" && (
            <StatePanel title="Workflow complete ✓">
              <div className="mt-2 flex gap-2">
                <Button size="sm" onClick={() => setRun({ phase: "idle" })}>
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> View results
                </Button>
                <Button size="sm" variant="outline" onClick={() => exportAs("JSON")}>
                  Download
                </Button>
              </div>
            </StatePanel>
          )}

          {run.phase === "error" && (
            <StatePanel title="We couldn't complete this workflow.">
              <p className="text-sm text-muted-foreground">Add at least one node before running.</p>
              <div className="mt-2 flex gap-2">
                <Button size="sm" onClick={() => setRun({ phase: "idle" })}>
                  Try again
                </Button>
                <Button size="sm" variant="outline" onClick={() => setTab("assistant")}>
                  Ask AI
                </Button>
              </div>
            </StatePanel>
          )}
        </main>

        {/* Right panel */}
        <aside className="flex w-80 shrink-0 flex-col border-l border-border bg-sidebar" aria-label="Canvas assistant">
          <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col gap-0">
            <div className="border-b border-border px-4 py-2.5">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="assistant">Canvas Assistant</TabsTrigger>
                <TabsTrigger value="inspector">Inspector</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="assistant" className="min-h-0 flex-1 overflow-hidden">
              <AssistantPanel
                messages={messages}
                busy={busy}
                onSend={(t) => void handleAssistant(t)}
                onRun={runWorkflow}
              />
            </TabsContent>
            <TabsContent value="inspector" className="min-h-0 flex-1 overflow-y-auto">
              <Inspector
                node={selectedNode}
                upstream={upstream}
                onPatch={patchNode}
                onSuggestion={handleSuggestion}
              />
            </TabsContent>
          </Tabs>
        </aside>
      </div>

      <NodeSearchDialog open={searchOpen} onOpenChange={setSearchOpen} onPick={(d) => addNode(d)} />
    </div>
  );
}

function StatePanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="absolute bottom-6 left-1/2 z-10 w-80 -translate-x-1/2 border border-border bg-card px-4 py-3 shadow-sm">
      <p className="text-sm font-semibold text-navy">{title}</p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
