import type { Pipeline } from "./types";

const KEY = "miso-navigator:pipeline:v1";

/** Hand-off of the single shared pipeline between the result view and the canvas. */
export const pipelineStore = {
  save(pipeline: Pipeline) {
    if (typeof window !== "undefined") window.sessionStorage.setItem(KEY, JSON.stringify(pipeline));
  },
  load(): Pipeline | null {
    if (typeof window === "undefined") return null;
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Pipeline;
    } catch {
      return null;
    }
  },
};
