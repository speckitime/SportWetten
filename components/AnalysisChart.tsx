"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { AnalysisRecord } from "@/lib/types";

interface AnalysisChartProps {
  analysis: AnalysisRecord;
  homeTeam: string;
  awayTeam: string;
}

const COLORS = ["#4ade80", "#facc15", "#60a5fa"];

export default function AnalysisChart({
  analysis,
  homeTeam,
  awayTeam,
}: AnalysisChartProps) {
  const pieData = [
    { name: homeTeam, value: parseFloat(analysis.homeWinProb.toFixed(1)) },
    ...(analysis.drawProb && analysis.drawProb > 0
      ? [{ name: "Unentschieden", value: parseFloat(analysis.drawProb.toFixed(1)) }]
      : []),
    { name: awayTeam, value: parseFloat(analysis.awayWinProb.toFixed(1)) },
  ];

  const barData = [
    {
      name: homeTeam.split(" ").slice(-1)[0],
      Wahrscheinlichkeit: parseFloat(analysis.homeWinProb.toFixed(1)),
    },
    ...(analysis.drawProb && analysis.drawProb > 0
      ? [{
          name: "Remis",
          Wahrscheinlichkeit: parseFloat(analysis.drawProb.toFixed(1)),
        }]
      : []),
    {
      name: awayTeam.split(" ").slice(-1)[0],
      Wahrscheinlichkeit: parseFloat(analysis.awayWinProb.toFixed(1)),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Pie Chart */}
      <div>
        <h4 className="text-sm text-gray-400 mb-3 text-center">Wahrscheinlichkeitsverteilung</h4>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
              label={({ name, value }) => `${value}%`}
              labelLine={false}
            >
              {pieData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [`${value}%`, "Wahrscheinlichkeit"]}
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "8px",
                color: "#f3f4f6",
              }}
            />
            <Legend
              formatter={(value) => (
                <span style={{ color: "#9ca3af", fontSize: "12px" }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Bar Chart */}
      <div>
        <h4 className="text-sm text-gray-400 mb-3 text-center">Analyse-Übersicht</h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="name"
              tick={{ fill: "#9ca3af", fontSize: 11 }}
              axisLine={{ stroke: "#374151" }}
            />
            <YAxis
              tick={{ fill: "#9ca3af", fontSize: 11 }}
              axisLine={{ stroke: "#374151" }}
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              formatter={(value) => [`${value}%`, "Wahrscheinlichkeit"]}
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "8px",
                color: "#f3f4f6",
              }}
            />
            <Bar dataKey="Wahrscheinlichkeit" radius={[4, 4, 0, 0]}>
              {barData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
