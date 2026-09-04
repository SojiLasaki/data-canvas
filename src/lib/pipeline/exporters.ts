import type { PipelineResult } from "./types";

function download(name: string, content: string, mime: string) {
  if (typeof window === "undefined") return;
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function toCsv(result: PipelineResult): string {
  const head = "timestamp,location,value,unit";
  const body = result.rows.map((r) => `${r.bucket},${r.location},${r.value},${r.unit}`).join("\n");
  return `${head}\n${body}`;
}

export const exporters = {
  csv(result: PipelineResult) {
    download(`${slug(result.title)}.csv`, toCsv(result), "text/csv");
  },
  excel(result: PipelineResult) {
    // Excel opens tab-separated .xls content natively — no native binaries needed.
    const rows = result.rows.map((r) => `${r.bucket}\t${r.location}\t${r.value}\t${r.unit}`).join("\n");
    download(`${slug(result.title)}.xls`, `Timestamp\tLocation\tValue\tUnit\n${rows}`, "application/vnd.ms-excel");
  },
  json(result: PipelineResult) {
    download(
      `${slug(result.title)}.json`,
      JSON.stringify({ title: result.title, subtitle: result.subtitle, rows: result.rows }, null, 2),
      "application/json",
    );
  },
  async copy(result: PipelineResult) {
    await navigator.clipboard?.writeText(toCsv(result));
  },
};

function slug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "miso-result";
}
