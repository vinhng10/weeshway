import { Chip, IconSymbolName } from "@/components";
import { ProjectStatusEnum } from "@/constants";
import { ProjectEnrichedType } from "@/types";

interface ProjectStatusProps {
  data: ProjectEnrichedType;
}

export function ProjectStatus({ data }: ProjectStatusProps) {
  let icon: IconSymbolName | undefined;
  let label: string | undefined;

  switch (data.status) {
    case ProjectStatusEnum.Draft:
      icon = "heart";
      label = "10";
      break;
    case ProjectStatusEnum.Release:
      icon = "person.fill";
      label = data.bookings
        ? `${data.bookings.length} | ${data.spots}`
        : `${data.spots}`;
      break;
  }

  return icon && label && <Chip color="danger" icon={icon} label={label} />;
}
