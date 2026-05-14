// This file has the status badge component.

import { getConditionStyles } from "../../utils/conditionStyles";
import { type VehicleCondition } from "../../types/vehicle";
import { formatVehicleCondition } from "../../utils/formatters";

interface StatusBadgeProps {
  condition: VehicleCondition;
  className?: string;
}

function StatusBadge({ condition, className = "" }: StatusBadgeProps) {
  const classes = [
    "inline-flex items-center rounded-full px-3 py-1.5 text-xs font-extrabold shadow-sm ring-1 ring-inset",
    getConditionStyles(condition),
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes}>
      {formatVehicleCondition(condition)}
    </span>
  );
}

export default StatusBadge;
