import { useState } from "react";
import { Copy, Download, FileJson, FileSpreadsheet, Workflow } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { exporters } from "@/lib/pipeline/exporters";
import type { PipelineResult } from "@/lib/pipeline/types";

export function ResultTable({
  result,
  onOpenInCanvas,
}: {
  result: PipelineResult;
  onOpenInCanvas: () => void;
}) {
  const [limit, setLimit] = useState(12);
  const rows = result.rows.slice(0, limit);

  return (
    <section aria-label="Data table">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
        <h3 className="label-caps text-navy">Data</h3>
        <div className="flex flex-wrap gap-1.5">
          <Button size="sm" variant="outline" onClick={() => exporters.csv(result)}>
            <Download className="mr-1.5 h-3.5 w-3.5" /> CSV
          </Button>
          <Button size="sm" variant="outline" onClick={() => exporters.excel(result)}>
            <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" /> Excel
          </Button>
          <Button size="sm" variant="outline" onClick={() => exporters.json(result)}>
            <FileJson className="mr-1.5 h-3.5 w-3.5" /> JSON
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              void exporters.copy(result);
              toast.success("Data copied to clipboard");
            }}
          >
            <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy
          </Button>
          <Button size="sm" variant="ghost" onClick={onOpenInCanvas}>
            <Workflow className="mr-1.5 h-3.5 w-3.5" /> Open in Canvas
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="text-muted-foreground">
            <tr className="border-b border-border">
              <th scope="col" className="py-2 pr-4 font-medium">Timestamp</th>
              <th scope="col" className="py-2 pr-4 font-medium">Location</th>
              <th scope="col" className="py-2 pr-4 text-right font-medium">Value</th>
              <th scope="col" className="py-2 font-medium">Unit</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={`${r.bucket}-${r.location}-${i}`} className="border-b border-border/60">
                <td className="py-1.5 pr-4 tabular-nums text-navy">{r.bucket}</td>
                <td className="py-1.5 pr-4">{r.location}</td>
                <td className="py-1.5 pr-4 text-right tabular-nums text-navy">
                  {r.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </td>
                <td className="py-1.5 text-muted-foreground">{r.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {limit < result.rows.length && (
        <button
          type="button"
          onClick={() => setLimit((l) => l + 24)}
          className="mt-2 text-xs text-primary hover:underline"
        >
          Show more rows ({result.rows.length - limit} remaining)
        </button>
      )}
    </section>
  );
}
