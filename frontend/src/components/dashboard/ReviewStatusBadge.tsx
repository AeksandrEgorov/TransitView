// This file has the review status badge component.

import type { ReviewStatus } from "../../types/vehicle";

interface Props {
  status: ReviewStatus;
}

const labels: Record<ReviewStatus, string> = {
  Ootel: "Ootel",
  Kinnitatud: "Kinnitatud",
  Tagasi_lukatud: "Tagasi lükatud",
};

const classes: Record<ReviewStatus, string> = {
  Ootel: "bg-amber-50 text-amber-700 ring-amber-200",
  Kinnitatud: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Tagasi_lukatud: "bg-rose-50 text-rose-700 ring-rose-200",
};

function ReviewStatusBadge({ status }: Props) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${classes[status]}`}
    >
      {labels[status]}
    </span>
  );
}

export default ReviewStatusBadge;