import { ROLE } from "@/constants";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect } from "react";
import { useAuth } from "./useAuth";
import { useRole } from "./useRole";

export const useNotificationObserver = (): void => {
  const isLoggedIn = useAuth((state) => !!state.session && !!state.profile);
  const isLoading = useAuth((state) => state.isLoading);
  const role = useRole((state) => state.role);

  useEffect(() => {
    // Wait until auth has resolved, onboarding is completed, and the role-gated
    // navigation stack is mounted. Otherwise, router navigation will drop silently on cold start.
    if (isLoading || !isLoggedIn || !role) return;

    const redirect = (notification: Notifications.Notification) => {
      const data = notification.request.content.data;

      // Defer one tick so the (role)/index <Redirect> can run its
      // router.replace first; otherwise the redirect races with this push
      // and clobbers it, leaving the user on /(home).
      setTimeout(() => {
        if (data?.projectId) {
          if (role === ROLE.TEACHER) {
            router.navigate(
              `/(teacher)/(projects)/projects/${data.projectId}`,
              {
                withAnchor: true,
              },
            );
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
      }, 0);
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
  }, [isLoading, isLoggedIn, role]);
};
