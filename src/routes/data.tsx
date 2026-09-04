import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BarChart3, Search, Workflow } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CATALOG } from "@/services/misoService";
import { NODE_ICON } from "@/components/canvas/nodeVisuals";
import { KIND_LABEL } from "@/lib/canvas/nodeFactory";

export const Route = createFileRoute("/data")({
  component: DataPage,
  head: () => ({
    meta: [
      { title: "MISO Data Catalog · MISO Navigator" },
      {
        name: "description",
        content:
          "Browse MISO datasets, APIs and documents, then open any resource directly in the AI Data Canvas to build a workflow.",
      },
      { property: "og:title", content: "MISO Data Catalog · MISO Navigator" },
      {
        property: "og:description",
        content: "Browse MISO datasets, APIs and documents and open them in the AI Data Canvas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function DataPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const results = CATALOG.filter(
    (r) =>
      !q.trim() ||
      r.title.toLowerCase().includes(q.toLowerCase()) ||
      r.keywords.some((k) => k.includes(q.toLowerCase())),
  );

  const open = (prompt: string) => void navigate({ to: "/result", search: { q: prompt } });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-2xl font-semibold tracking-tight text-navy">Data</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          MISO datasets, APIs and documents. Open any resource in the Data Canvas to build a workflow.
        </p>

        <div className="mt-6 flex items-center gap-2 border border-border bg-card px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" aria-hidden />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search datasets, APIs and documents"
            aria-label="Search MISO data catalog"
            className="h-8 border-0 px-0 shadow-none focus-visible:ring-0"
          />
        </div>

        <div className="mt-6 border border-border">
          {results.map((r) => {
            const Icon = NODE_ICON[r.kind];
            return (
              <div
                key={r.id}
                className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3 last:border-b-0"
              >
                <Icon className="h-4 w-4 text-primary" aria-hidden />
                <div className="min-w-52 flex-1">
                  <p className="text-sm font-medium text-navy">{r.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {KIND_LABEL[r.kind]} · {r.subtitle}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => open(`Open ${r.title} in canvas`)}>
                  <Workflow className="mr-1.5 h-3.5 w-3.5" /> Open in Canvas
                </Button>
                <Button size="sm" onClick={() => open(`Create a visualization of ${r.title}`)}>
                  <BarChart3 className="mr-1.5 h-3.5 w-3.5" /> Create visualization
                </Button>
              </div>
            );
          })}
          {results.length === 0 && (
            <p className="px-4 py-8 text-sm text-muted-foreground">No resources matched that search.</p>
          )}
        </div>
      </main>
    </div>
  );
}
