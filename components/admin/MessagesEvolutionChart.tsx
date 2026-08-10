"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type MessagesByMonthPoint = {
  month: string;
  label: string;
  count: number;
};

export function MessagesEvolutionChart({
  data,
}: {
  data: MessagesByMonthPoint[];
}) {
  const total = data.reduce((sum, point) => sum + point.count, 0);

  return (
    <section className="rounded-[14px] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_20px_rgba(15,23,42,0.06)] sm:p-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight text-[#1e293b]">
            Évolution des messages
          </h2>
          <p className="mt-1 text-sm text-[#94a3b8]">
            Messages reçus via le formulaire de contact, par mois
          </p>
        </div>
        <p className="text-sm text-[#64748b]">
          Total période :{" "}
          <span className="font-semibold text-[#1e293b]">{total}</span>
        </p>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
          >
            <defs>
              <linearGradient id="messagesFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#102c27" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#102c27" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e2e8f0"
            />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              dy={8}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              width={36}
            />
            <Tooltip
              cursor={{ stroke: "#cbd5e1", strokeDasharray: "4 4" }}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                boxShadow: "0 8px 20px rgba(15,23,42,0.08)",
                fontSize: 13,
              }}
              labelStyle={{ color: "#64748b", marginBottom: 4 }}
              formatter={(value) => [
                typeof value === "number" ? value : Number(value ?? 0),
                "Messages",
              ]}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#102c27"
              strokeWidth={2.5}
              fill="url(#messagesFill)"
              dot={{ r: 3.5, fill: "#102c27", strokeWidth: 0 }}
              activeDot={{ r: 5, fill: "#3d8b7a", strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
