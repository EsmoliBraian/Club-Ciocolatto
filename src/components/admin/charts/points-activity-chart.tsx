"use client";

import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatDayLabel } from "@/lib/format";

const EARNED_COLOR = "#1baf7a";
const REDEEMED_COLOR = "#eda100";

export function PointsActivityChart({ data }: { data: { date: string; earned: number; redeemed: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickFormatter={(d: string) => formatDayLabel(new Date(d))}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          axisLine={{ stroke: "var(--border)" }}
          tickLine={false}
          minTickGap={24}
        />
        <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={40} />
        <Tooltip
          labelFormatter={(d) => formatDayLabel(new Date(String(d)))}
          contentStyle={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line
          type="monotone"
          dataKey="earned"
          name="Puntos otorgados"
          stroke={EARNED_COLOR}
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="redeemed"
          name="Puntos canjeados"
          stroke={REDEEMED_COLOR}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
