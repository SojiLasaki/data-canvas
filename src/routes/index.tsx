import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, BarChart3, Database, FileText, Search, Sparkles, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "MISO Navigator — Ask, explore and visualize MISO data" },
      {
        name: "description",
        content:
          "MISO Navigator helps analysts and researchers search MISO datasets, documents and APIs, then build AI-assisted data workflows on the Data Canvas.",
      },
      { property: "og:title", content: "MISO Navigator — Ask, explore and visualize MISO data" },
      {
        property: "og:description",
        content: "Search MISO data in plain language and turn any answer into a visual data workflow.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const RECENT = [
  { title: "Indiana load — last 30 days", meta: "Dataset · Hourly", icon: Database },
  { title: "MISO Market Report", meta: "Document · PDF", icon: FileText },
  { title: "Day-ahead LMP by zone", meta: "Dataset · 5-minute", icon: BarChart3 },
];

const PROMPTS = [
  "Compare Indiana and Michigan electricity load over the last 30 days.",
  "Show wind generation trends for the last quarter.",
  "Summarize transmission planning from the MISO Planning Report.",
];

function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const ask = (q: string) => {
    if (!q.trim()) return;
    void navigate({ to: "/result", search: { q: q.trim() } });
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto max-w-4xl px-6 py-20">
        <h1 className="text-3xl font-semibold tracking-tight text-navy">What can I help you with?</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ask about MISO load, pricing, generation, documents or APIs. I'll find the data and can build the
          workflow for you.
        </p>

        <form
          className="mt-6 flex items-center gap-2 border border-border bg-card px-3 py-2"
          onSubmit={(e) => {
            e.preventDefault();
            ask(query);
          }}
        >
          <Search className="h-4 w-4 text-muted-foreground" aria-hidden />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a question about MISO data…"
            aria-label="Ask a question about MISO data"
            className="h-8 border-0 px-0 shadow-none focus-visible:ring-0"
          />
          <Button type="submit" size="sm">
            Ask
          </Button>
        </form>

        <div className="mt-3 flex flex-wrap gap-2">
          {PROMPTS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => ask(p)}
              className="border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-navy"
            >
              {p}
            </button>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => ask("Create a graph of MISO load by state")}>
            <Workflow className="mr-1.5 h-3.5 w-3.5" /> Create a graph
          </Button>
          <Button variant="outline" size="sm" onClick={() => ask("Visualize Indiana load for the last 30 days")}>
            <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Visualize this data
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/canvas" search={{}}>
              Open Data Canvas <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        <section className="mt-16">
          <h2 className="label-caps text-muted-foreground">Jump right back into…</h2>
          <div className="mt-3 grid gap-px border border-border bg-border sm:grid-cols-3">
            {RECENT.map((r) => (
              <Link
                key={r.title}
                to="/data"
                className="bg-card px-4 py-4 transition-colors hover:bg-secondary"
              >
                <r.icon className="h-4 w-4 text-primary" aria-hidden />
                <p className="mt-3 text-sm font-medium text-navy">{r.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{r.meta}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
