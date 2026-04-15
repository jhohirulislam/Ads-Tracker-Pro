import React from 'react';
import { cn, formatCurrency } from '@/src/lib/utils';
import { motion } from 'motion/react';

interface StatsCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  type?: 'default' | 'success' | 'danger' | 'warning' | 'info';
  icon?: React.ReactNode;
}

export const StatsCard: React.FC<StatsCardProps> = ({ label, value, subValue, type = 'default', icon }) => {
  const colors = {
    default: 'bg-white border-slate-200 text-slate-900',
    success: 'bg-emerald-50 border-emerald-100 text-emerald-600',
    danger: 'bg-rose-50 border-rose-100 text-rose-600',
    warning: 'bg-amber-50 border-amber-100 text-amber-600',
    info: 'bg-blue-50 border-blue-100 text-blue-600',
  };

  const iconColors = {
    default: 'bg-slate-100 text-slate-500',
    success: 'bg-emerald-500 text-white',
    danger: 'bg-rose-500 text-white',
    warning: 'bg-amber-500 text-white',
    info: 'bg-blue-500 text-white',
  };

  return (
    <motion.div 
      whileHover={{ y: -4, shadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}
      className={cn(
        "card p-4 flex flex-col gap-3 relative overflow-hidden group border-2",
        colors[type]
      )}
    >
      <div className="flex items-center justify-between">
        {icon && (
          <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-500 group-hover:rotate-12", iconColors[type])}>
            {icon}
          </div>
        )}
        <div className="text-[9px] font-black uppercase tracking-widest opacity-40">{type}</div>
      </div>
      
      <div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">{label}</p>
        <h3 className="text-lg font-black tracking-tight leading-none">
          {typeof value === 'number' ? `৳${formatCurrency(value)}` : value}
        </h3>
        {subValue && (
          <div className="mt-1 text-[10px] font-bold opacity-70">
            {subValue}
          </div>
        )}
      </div>

      <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-current opacity-[0.03] rounded-full blur-2xl" />
    </motion.div>
  );
};
