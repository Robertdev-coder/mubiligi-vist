"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { REGISTRATION_STATUS_LABEL } from "@/shared/constants";
import type { RegistrationStatus, TrendPoint } from "@/shared/types";

const STATUS_COLORS: Record<RegistrationStatus, string> = {
  pending: "#F59E0B",
  confirmed: "#1456A0",
  cancelled: "#DC2626",
  completed: "#16A34A",
};

export function ActivityChart({ data }: { data: TrendPoint[] }) {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="registrationsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1456A0" stopOpacity={0.22} />
              <stop offset="100%" stopColor="#1456A0" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="arrivalsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#16A34A" stopOpacity={0.18} />
              <stop offset="100%" stopColor="#16A34A" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 4" stroke="#E3E8F2" vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#94A3B8", fontSize: 11 }}
            dy={6}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#94A3B8", fontSize: 11 }}
            allowDecimals={false}
            width={36}
          />
          <Tooltip
            cursor={{ stroke: "#CBD5E1", strokeDasharray: "4 4" }}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #E3E8F2",
              boxShadow: "0 12px 30px -16px rgba(7,26,61,0.35)",
              fontSize: 12,
            }}
            labelStyle={{ fontWeight: 600, color: "#071A3D" }}
          />
          <Area
            type="monotone"
            dataKey="registrations"
            name="Registrations"
            stroke="#1456A0"
            strokeWidth={2.2}
            fill="url(#registrationsFill)"
            dot={{ r: 3, fill: "#1456A0", strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
          <Area
            type="monotone"
            dataKey="arrivals"
            name="Arrivals"
            stroke="#16A34A"
            strokeWidth={2}
            fill="url(#arrivalsFill)"
            dot={{ r: 2.5, fill: "#16A34A", strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StatusPie({
  data,
}: {
  data: { status: RegistrationStatus; count: number }[];
}) {
  const filtered = data.filter((item) => item.count > 0);
  const total = data.reduce((sum, item) => sum + item.count, 0);

  if (total === 0) {
    return (
      <div className="flex h-[240px] flex-col items-center justify-center text-center">
        <div className="flex size-16 items-center justify-center rounded-full border-8 border-slate-100 text-[10px] font-semibold uppercase tracking-wide text-slate-300">
          Empty
        </div>
        <p className="mt-3 text-xs text-slate-400">No registrations for this day yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative h-[180px] w-full max-w-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={filtered}
              dataKey="count"
              nameKey="status"
              innerRadius={54}
              outerRadius={80}
              paddingAngle={3}
              stroke="none"
            >
              {filtered.map((entry) => (
                <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #E3E8F2",
                fontSize: 12,
              }}
              formatter={(value, name) => [
                `${value} registrations`,
                REGISTRATION_STATUS_LABEL[name as RegistrationStatus] ?? name,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold text-navy">{total}</span>
          <span className="text-[10px] uppercase tracking-wide text-slate-400">Total</span>
        </div>
      </div>

      <div className="w-full space-y-2">
        {data.map((item) => (
          <div key={item.status} className="flex items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-2 text-slate-600">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: STATUS_COLORS[item.status] }}
              />
              {REGISTRATION_STATUS_LABEL[item.status]}
            </span>
            <span className="font-semibold text-navy">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
