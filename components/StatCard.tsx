import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  subtext?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, color, subtext }) => {
  return (
    <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg flex items-start justify-between hover:border-zinc-700 transition-colors">
      <div>
        <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider">{label}</p>
        <h3 className="text-2xl font-bold text-zinc-100 mt-1">{value}</h3>
        {subtext && <p className="text-zinc-600 text-xs mt-1">{subtext}</p>}
      </div>
      <div className={`p-2 rounded-md bg-opacity-10 ${color.replace('text-', 'bg-')}`}>
        <Icon className={`${color} w-5 h-5`} />
      </div>
    </div>
  );
};

export default StatCard;
