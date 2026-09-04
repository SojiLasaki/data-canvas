import { Copy, ExternalLink, FileText, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Pipeline } from "@/lib/pipeline/types";

const CHANNELS = ["X axis", "Y axis", "Group by", "Tooltip", "Not used"];

export function SourcePanel({
  pipeline,
  onChannel,
}: {
  pipeline: Pipeline;
  onChannel: (attribute: string, channel: string) => void;
}) {
  return (
    <div className="space-y-4">
      <section>
        <h3 className="label-caps text-muted-foreground">Data sources</h3>
        <div className="mt-2 space-y-2">
          {pipeline.sources.map((s) => (
            <div key={s.id} className="border border-border bg-card px-3 py-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-navy">{s.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {s.type} · {s.dataType}
                    {s.section ? ` · ${s.section}` : ""}
                  </p>
                </div>
                <span className="flex items-center gap-1 border border-valid px-1.5 py-0.5 text-[10px] text-valid">
                  <span className="h-1.5 w-1.5 bg-valid" aria-hidden /> {s.status}
                </span>
              </div>

              <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                {[
                  ["Last updated", s.updated],
                  ["Unit", s.unit],
                  ["Frequency", s.frequency],
                  ["Coverage", s.coverage],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="truncate text-navy">{v}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-2 flex flex-wrap gap-1.5">
                <Button asChild size="sm" variant="outline" className="h-6 px-2 text-[11px]">
                  <a href={s.url} target="_blank" rel="noreferrer">
                    {s.type === "PDF" ? (
                      <FileText className="mr-1 h-3 w-3" />
                    ) : (
                      <ExternalLink className="mr-1 h-3 w-3" />
                    )}
                    Open source
                  </a>
                </Button>
                <Button asChild size="sm" variant="outline" className="h-6 px-2 text-[11px]">
                  <a href={s.url} target="_blank" rel="noreferrer">
                    <Link2 className="mr-1 h-3 w-3" /> View API
                  </a>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-[11px]"
                  onClick={() => {
                    void navigator.clipboard?.writeText(s.url);
                    toast.success("API endpoint copied");
                  }}
                >
                  <Copy className="mr-1 h-3 w-3" /> Copy API
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="label-caps text-muted-foreground">Attributes</h3>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Map any attribute to a visualization channel.
        </p>
        <div className="mt-2 space-y-1.5">
          {pipeline.attributes.map((a) => (
            <div
              key={a.name}
              className="flex items-center gap-2 border border-border bg-card px-3 py-1.5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-navy">{a.name}</p>
                <p className="truncate text-[10px] text-muted-foreground">
                  {a.type}
                  {a.unit ? ` · ${a.unit}` : ""} · {a.source}
                </p>
              </div>
              <Select
                value={pipeline.channels[a.name] ?? "Not used"}
                onValueChange={(v) => onChannel(a.name, v)}
              >
                <SelectTrigger className="h-7 w-32 text-[11px]" aria-label={`Channel for ${a.name}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHANNELS.map((c) => (
                    <SelectItem key={c} value={c} className="text-xs">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
