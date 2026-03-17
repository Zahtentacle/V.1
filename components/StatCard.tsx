import React from 'react';

interface Props {
  label: string;
  value: number | string;
  icon: any;
  color: string;
}

const StatCard: React.FC<Props> = ({ label, value, icon: Icon, color }) => {
  return (
    <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
      <div className="flex justify-between items-center">
        <span className="text-sm">{label}</span>
        <Icon className={color} size={18} />
      </div>
      <div className="text-xl font-bold mt-2">{value}</div>
    </div>
  );
};

export default StatCard;
