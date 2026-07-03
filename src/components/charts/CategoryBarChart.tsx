'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';
import { CategoryStat } from '@/types';

interface CategoryBarChartProps {
  data: CategoryStat[];
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-white/10 px-3 py-2 text-xs" style={{ background: '#1e1e35' }}>
        <p className="font-medium text-white mb-1">{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const SHORT_LABELS: Record<string, string> = {
  'Vendor Contract': 'Vendor',
  'Compliance Certificate': 'Compliance',
  'Safety Training': 'Safety',
  'Insurance Policy': 'Insurance',
  'Inspection Report': 'Inspection',
  'Government License': 'Gov. License',
  Other: 'Other',
};

export function CategoryBarChart({ data }: CategoryBarChartProps) {
  const chartData = data.map((d) => ({
    name: SHORT_LABELS[d.category] ?? d.category,
    Active: d.active,
    'Expiring Soon': d.expiring_soon,
    Expired: d.expired,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} barSize={14} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Bar dataKey="Active" fill="#72a382" radius={[4, 4, 0, 0]} opacity={1} />
        <Bar dataKey="Expiring Soon" fill="#d9b461" radius={[4, 4, 0, 0]} opacity={1} />
        <Bar dataKey="Expired" fill="#d97068" radius={[4, 4, 0, 0]} opacity={1} />
      </BarChart>
    </ResponsiveContainer>
  );
}
