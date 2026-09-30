"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { formatCurrency, formatDay } from "@/lib/utils";

export function RevenueChart({
  data,
}: {
  data: { day: string; revenue: number; orders: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#b8b8b8" />
        <XAxis dataKey="day" fontSize={11} tickFormatter={formatDay} />
        <YAxis fontSize={11} />
        <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="#D02020"
          strokeWidth={3}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
