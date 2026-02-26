import { BOOKING_ACTIVE_STATUSES, PROJECT_STATUS } from "@/constants";
import { ProjectEnrichedType } from "@/types";
import { Chip } from "./chip";
import { IconSymbolName } from "./icon-symbol";

interface ProjectStatusProps {
  data: ProjectEnrichedType;
}

export function ProjectStatus({ data }: ProjectStatusProps) {
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
}
