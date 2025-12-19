import { Chip } from "@/components/chip";
import { IconSymbolName } from "@/components/ui/icon-symbol";
import { ProjectStatusEnum } from "@/constants";
import { ProjectType } from "@/types";

interface ProjectStatusProps {
  data: ProjectType;
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
      label = `5 | ${data.spots}`;
      break;
  }

  return icon && label && <Chip color="danger" icon={icon} label={label} />;
}
