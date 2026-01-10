import { PROJECT_STATUS } from "@/constants";
import { ProjectEnrichedType } from "@/types";
import { Chip } from "./chip";
import { IconSymbolName } from "./ui/icon-symbol";

interface ProjectStatusProps {
  data: ProjectEnrichedType;
}

export function ProjectStatus({ data }: ProjectStatusProps) {
  let icon: IconSymbolName | undefined;
  let label: string | undefined;

  switch (data.status) {
    case PROJECT_STATUS.DRAFT:
      icon = "heart";
      label = `${data.wishings.length}`;
      break;
    case PROJECT_STATUS.RELEASE:
      icon = "person.fill";
      label = data.bookings
        ? `${data.bookings.length} | ${data.spots}`
        : `${data.spots}`;
      break;
  }

  return icon && label && <Chip color="danger" icon={icon} label={label} />;
}
