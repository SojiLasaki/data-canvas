import type { MisoEdge, MisoNode } from "@/lib/canvas/graph";

const KEY = "miso-navigator:canvas:v1";

export interface SavedCanvas {
  nodes: MisoNode[];
  edges: MisoEdge[];
  notes: string;
  savedAt: string;
}

/** Prototype persistence. Swap localStorage for an API call later. */
export const canvasService = {
  save(payload: Omit<SavedCanvas, "savedAt">): SavedCanvas {
    const record: SavedCanvas = { ...payload, savedAt: new Date().toISOString() };
    if (typeof window !== "undefined") window.localStorage.setItem(KEY, JSON.stringify(record));
    return record;
  },

  load(): SavedCanvas | null {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SavedCanvas;
    } catch {
      return null;
    }
  },

  clear() {
    if (typeof window !== "undefined") window.localStorage.removeItem(KEY);
  },

  exportJson(nodes: MisoNode[], edges: MisoEdge[]): string {
    return JSON.stringify(
      {
        version: 1,
        generatedAt: new Date().toISOString(),
        nodes: nodes.map((n) => ({ id: n.id, position: n.position, data: n.data })),
        edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target, data: e.data })),
      },
      null,
      2,
    );
  },

  exportSvg(nodes: MisoNode[], edges: MisoEdge[]): string {
    const w = 1400;
    const h = 800;
    const pos = new Map(nodes.map((n) => [n.id, n.position]));
    const lines = edges
      .map((e) => {
        const a = pos.get(e.source);
        const b = pos.get(e.target);
        if (!a || !b) return "";
        const state = e.data?.compatibility.state;
        const stroke = state === "invalid" ? "#c0392b" : state === "uncertain" ? "#d99a1c" : "#1f8a4c";
        return `<line x1="${a.x + 240}" y1="${a.y + 44}" x2="${b.x}" y2="${b.y + 44}" stroke="${stroke}" stroke-width="2"/>`;
      })
      .join("\n");
    const boxes = nodes
      .map(
        (n) =>
          `<g><rect x="${n.position.x}" y="${n.position.y}" width="240" height="88" fill="#ffffff" stroke="#0b2340" stroke-width="1.5"/><text x="${n.position.x + 12}" y="${n.position.y + 26}" font-family="sans-serif" font-size="10" fill="#5a6b80">${n.data.kind.toUpperCase()}</text><text x="${n.position.x + 12}" y="${n.position.y + 52}" font-family="sans-serif" font-size="15" fill="#0b2340">${n.data.name}</text></g>`,
      )
      .join("\n");
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#f7f9fb"/>${lines}${boxes}</svg>`;
  },

  download(filename: string, content: string, mime: string) {
    if (typeof window === "undefined") return;
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },
};
