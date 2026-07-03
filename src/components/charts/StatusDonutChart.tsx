'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DashboardStats } from '@/types';

interface StatusDonutChartProps {
  stats: DashboardStats;
}

const COLORS = {
  Active: '#72a382',
  'Expiring Soon': '#d9b461',
  Expired: '#d97068',
};

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-white/10 px-3 py-2 text-sm bg-surface-elevated shadow-lg">
        <p className="font-medium text-white">{payload[0].name}</p>
        <p className="text-slate-400">{payload[0].value} records</p>
      </div>
    );
  }
  return null;
};

// Custom label for the pie chart
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
  const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
  
  if (percent < 0.05) return null; // Don't show labels for tiny slices

  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function StatusDonutChart({ stats }: StatusDonutChartProps) {
  const data = [
    { name: 'Active', value: stats.active },
    { name: 'Expiring Soon', value: stats.expiring_soon },
    { name: 'Expired', value: stats.expired },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-500 text-sm border-2 border-dashed border-white/5 rounded-xl m-2">
        No records yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={85}
          paddingAngle={4}
          dataKey="value"
          strokeWidth={0}
          labelLine={false}
          label={renderCustomizedLabel}
        >
          {data.map((entry) => (
            <Cell
              key={entry.name}
              fill={COLORS[entry.name as keyof typeof COLORS]}
              opacity={1}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => (
            <span style={{ color: '#94a3b8', fontSize: '12px' }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
