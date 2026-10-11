import React from 'react';
import { Card } from './Card';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    label: string;
    positive?: boolean;
  };
  colorVariant?: 'navy' | 'emerald' | 'amber' | 'rose' | 'blue';
  onClick?: () => void;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  colorVariant = 'navy',
  onClick,
}: StatCardProps) {
  const iconColors = {
    navy: 'bg-[#0B2858]/10 text-[#0B2858]',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-slate-100 text-slate-700',
    blue: 'bg-blue-50 text-blue-600',
  };

  return (
    <Card
      onClick={onClick}
      className={`p-5 relative overflow-hidden ${onClick ? 'cursor-pointer hover:border-slate-400' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
          <div className="text-2xl font-bold text-slate-900 mt-1.5 tracking-tight">{value}</div>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
          {trend && (
            <div className="flex items-center gap-1 mt-2 text-xs">
              <span
                className={`font-medium ${
                  trend.positive ? 'text-emerald-600' : 'text-slate-600'
                }`}
              >
                {trend.label}
              </span>
            </div>
          )}
        </div>
        <div className={`p-2.5 rounded-lg ${iconColors[colorVariant]}`}>{icon}</div>
      </div>
    </Card>
  );
}
