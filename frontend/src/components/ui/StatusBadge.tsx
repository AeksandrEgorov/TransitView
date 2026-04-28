import React from 'react';
import { type VehicleCondition } from '../../types/vehicle';
import { formatVehicleCondition } from '../../utils/formatters';

interface StatusBadgeProps {
  condition: VehicleCondition;
}
const StatusBadge: React.FC<StatusBadgeProps> = ({ condition }) => {
  const getClasses = (cond: VehicleCondition) => {
    switch (cond) {
      case "Töökorras": return "bg-emerald-50 text-emerald-700 ring-emerald-200";
      case "Ei_tööta": return "bg-amber-50 text-amber-700 ring-amber-200";
      case "Maha_kantud": return "bg-rose-50 text-rose-700 ring-rose-200";
      case "Müüdud": return "bg-violet-50 text-violet-700 ring-violet-200";
      default: return "bg-slate-100 text-slate-700 ring-slate-200";
    }
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${getClasses(condition)}`}>
      {formatVehicleCondition(condition)}
    </span>
  );
};
export default StatusBadge;