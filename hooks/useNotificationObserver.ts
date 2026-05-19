import { ROLE } from "@/constants";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect } from "react";
import { useRole } from "./useRole";

export const useNotificationObserver = (): void => {
  const role = useRole((state) => state.role);

  useEffect(() => {
    const redirect = (notification: Notifications.Notification) => {
      const data = notification.request.content.data;
      if (data?.projectId) {
        if (role === ROLE.TEACHER) {
          router.navigate(`/(teacher)/(projects)/projects/${data.projectId}`, {
            withAnchor: true,
          });
        } else {
          router.navigate(`/(student)/(bookings)/classes/${data.projectId}`, {
            withAnchor: true,
          });
        }
      } else if (data?.wishId) {
        router.navigate(`/(student)/(wishes)/wishes/${data.wishId}`, {
          withAnchor: true,
        });
      }
    };

    const response = Notifications.getLastNotificationResponse();
    if (response?.notification) {
      redirect(response.notification);
    }

    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        redirect(response.notification);
      },
    );

    return () => {
      subscription.remove();
    };
  }, [role]);
};
