import { useState } from "react";
import { Play, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface AssistantMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  workflow?: string[];
}

export function AssistantPanel({
  messages,
  busy,
  onSend,
  onRun,
}: {
  messages: AssistantMessage[];
  busy: boolean;
  onSend: (text: string) => void;
  onRun: () => void;
}) {
  const [draft, setDraft] = useState("");

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Ask me to build, change or explain a workflow. For example: “Compare Indiana and Michigan load for
            the last 30 days.”
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={
              m.role === "user"
                ? "border-l-2 border-navy bg-secondary px-3 py-2 text-sm text-navy"
                : "border-l-2 border-primary bg-accent/40 px-3 py-2 text-sm"
            }
          >
            {m.role === "assistant" && (
              <p className="mb-1 flex items-center gap-1.5 label-caps text-primary">
                <Sparkles className="h-3 w-3" /> Assistant
              </p>
            )}
            <p className="leading-snug">{m.text}</p>
            {m.workflow && m.workflow.length > 0 && (
              <div className="mt-2 border border-border bg-card px-3 py-2">
                <p className="label-caps text-navy">Workflow</p>
                <pre className="mt-1 whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-muted-foreground">
                  {m.workflow.join("\n↓\n")}
                </pre>
                <Button size="sm" className="mt-2 w-full" onClick={onRun}>
                  <Play className="mr-1.5 h-3.5 w-3.5" /> Run workflow
                </Button>
              </div>
            )}
          </div>
        ))}
        {busy && <p className="text-xs text-muted-foreground">Analyzing canvas…</p>}
      </div>

      <form
        className="flex items-center gap-2 border-t border-border p-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.trim()) return;
          onSend(draft.trim());
          setDraft("");
        }}
      >
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask the Canvas Assistant…"
          aria-label="Message the Canvas Assistant"
          className="h-9"
        />
        <Button type="submit" size="icon" className="h-9 w-9 shrink-0" aria-label="Send">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
