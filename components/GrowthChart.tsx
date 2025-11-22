
import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface GrowthChartProps {
  data: { name: string; value: number }[];
  height?: number | string;
}

export const GrowthChart: React.FC<GrowthChartProps> = ({ data, height = "100%" }) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#CBA35A" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#CBA35A" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#CBA35A" opacity={0.1} />
        <XAxis dataKey="name" stroke="#A0A0A0" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#A0A0A0" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
        <Tooltip 
          contentStyle={{ backgroundColor: '#10121B', borderColor: '#CBA35A', borderRadius: '8px' }}
          itemStyle={{ color: '#E8E3D0' }}
          formatter={(value: any) => {
              const num = parseFloat(value);
              return [`₹${isNaN(num) ? '0' : num.toLocaleString('en-IN')}`, 'Value'];
          }}
        />
        <Area type="monotone" dataKey="value" stroke="#CBA35A" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
      </AreaChart>
    </ResponsiveContainer>
  );
};
