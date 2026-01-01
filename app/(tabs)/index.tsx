import Classes from "@/app/(tabs)/classes";
import Explore from "@/app/(tabs)/explore";
import { RoleEnum } from "@/constants";
import { useRole } from "@/hooks/useRole";
import React from "react";

export default function Home() {
  const role = useRole((state) => state.role);
  return role === RoleEnum.Student ? <Classes /> : <Explore />;
}
