export interface DocumentSection {
  title: string;
  pages: string;
  snippet: string;
}

/** Mock document intelligence. Later: pgvector + LLM extraction. */
export const documentService = {
  async sections(name: string): Promise<DocumentSection[]> {
    return [
      {
        title: "Transmission Planning",
        pages: "pp. 42–71",
        snippet: `${name}: expansion scenarios, reliability criteria and cost allocation for the planning cycle.`,
      },
      {
        title: "Load Forecast Methodology",
        pages: "pp. 88–104",
        snippet: "Weather-normalized peak forecasting inputs and confidence bands by local resource zone.",
      },
      {
        title: "Market Performance",
        pages: "pp. 130–158",
        snippet: "Congestion, uplift and day-ahead versus real-time convergence summaries.",
      },
    ];
  },
};
