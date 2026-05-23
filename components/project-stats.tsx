import { BOOKING_ACTIVE_STATUSES, PROJECT_STATUS } from "@/constants";
import { ProjectEnrichedType } from "@/types";
import React from "react";
import { Chip } from "./chip";
import { IconSymbolName } from "./icon-symbol";

interface ProjectStatsProps {
  data: ProjectEnrichedType;
}

export const ProjectStats = React.memo(
  function ProjectStats({ data }: ProjectStatsProps) {
    let icon: IconSymbolName | undefined;
    let label: string | undefined;

    switch (data.status) {
      case PROJECT_STATUS.DRAFT:
        icon = "heart";
        label = `${data.watchings.length}`;
        break;
      case PROJECT_STATUS.RELEASED:
        icon = "person-sharp";
        const succeededCount =
          data.bookings
            ?.filter((b) => BOOKING_ACTIVE_STATUSES.includes(b.status))
            .reduce((acc, b) => acc + (b.spots || 0), 0) ?? 0;
        label = `${succeededCount}/${data.spots}`;
        break;
    }

    return icon && label && <Chip color="danger" icon={icon} label={label} />;
  },
  (prev, next) =>
    prev.data.id === next.data.id &&
    prev.data.status === next.data.status &&
    prev.data.bookings?.length === next.data.bookings?.length &&
    (prev.data.bookings ?? []).every(
      (b, i) =>
        b.id === next.data.bookings?.[i]?.id &&
        b.status === next.data.bookings?.[i]?.status &&
        b.spots === next.data.bookings?.[i]?.spots,
    ) &&
    prev.data.watchings?.length === next.data.watchings?.length,
);
