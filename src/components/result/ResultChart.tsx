import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PipelineResult } from "@/lib/pipeline/types";

const SERIES_COLORS = ["var(--primary)", "var(--uncertain)", "var(--valid)"];

export function ResultChart({
  result,
  type,
  legend,
  grid,
}: {
  result: PipelineResult;
  type: string;
  legend: boolean;
  grid: boolean;
}) {
  const data = result.chartRows;
  const axis = {
    dataKey: "bucket",
    tick: { fontSize: 10 },
    stroke: "var(--muted-foreground)",
    minTickGap: 32,
  } as const;

  const common = [
    grid ? <CartesianGrid key="grid" stroke="var(--border)" vertical={false} /> : null,
    <XAxis key="x" {...axis} />,
    <YAxis key="y" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" width={56} />,
    <Tooltip
      key="tip"
      contentStyle={{
        borderRadius: 0,
        border: "1px solid var(--border)",
        fontSize: 12,
        background: "var(--card)",
      }}
    />,
    legend ? <Legend key="legend" wrapperStyle={{ fontSize: 11 }} /> : null,
  ];


  return (
    <div className="h-72 w-full sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        {type === "Bar chart" ? (
          <BarChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
            {common}
            {result.locations.map((loc, i) => (
              <Bar key={loc} dataKey={loc} fill={SERIES_COLORS[i % SERIES_COLORS.length]} />
            ))}
          </BarChart>
        ) : type === "Area chart" ? (
          <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
            {common}
            {result.locations.map((loc, i) => (
              <Area
                key={loc}
                dataKey={loc}
                stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
                fill={SERIES_COLORS[i % SERIES_COLORS.length]}
                fillOpacity={0.12}
                strokeWidth={1.75}
              />
            ))}
          </AreaChart>
        ) : (
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
            {common}
            {result.locations.map((loc, i) => (
              <Line
                key={loc}
                type="monotone"
                dataKey={loc}
                dot={false}
                stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
                strokeWidth={1.75}
              />
            ))}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
