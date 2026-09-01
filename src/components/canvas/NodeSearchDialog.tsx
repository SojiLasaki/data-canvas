import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CATALOG } from "@/services/misoService";
import type { MisoNodeData } from "@/lib/canvas/types";
import { NODE_ICON } from "./nodeVisuals";
import { KIND_LABEL } from "@/lib/canvas/nodeFactory";

export function NodeSearchDialog({
  open,
  onOpenChange,
  onPick,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onPick: (data: MisoNodeData) => void;
}) {
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return CATALOG;
    return CATALOG.filter(
      (r) =>
        r.title.toLowerCase().includes(s) ||
        r.subtitle.toLowerCase().includes(s) ||
        r.keywords.some((k) => k.includes(s)),
    );
  }, [q]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 p-0">
        <DialogHeader className="border-b border-border px-4 py-3">
          <DialogTitle className="text-sm">Add node</DialogTitle>
        </DialogHeader>
        <div className="px-4 py-3">
          <Input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search MISO resources, e.g. Indiana load"
            aria-label="Search MISO resources"
          />
        </div>
        <div className="max-h-80 overflow-y-auto border-t border-border">
          {results.map((r) => {
            const Icon = NODE_ICON[r.kind];
            return (
              <button
                key={r.id}
                type="button"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("application/miso-node", JSON.stringify(r.build()));
                  e.dataTransfer.effectAllowed = "move";
                }}
                onClick={() => {
                  onPick(r.build());
                  onOpenChange(false);
                }}
                className="flex w-full items-center gap-3 border-b border-border px-4 py-2.5 text-left hover:bg-secondary"
              >
                <Icon className="h-4 w-4 text-primary" aria-hidden />
                <span className="flex-1">
                  <span className="block text-sm text-navy">{r.title}</span>
                  <span className="block text-[11px] text-muted-foreground">{r.subtitle}</span>
                </span>
                <span className="label-caps text-muted-foreground">{KIND_LABEL[r.kind]}</span>
              </button>
            );
          })}
          {results.length === 0 && (
            <p className="px-4 py-6 text-sm text-muted-foreground">No MISO resources matched that search.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
