import { PostgrestError } from "@supabase/postgrest-js";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { router } from "expo-router";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Button } from "./input/button";
import { ButtonGroup } from "./input/button-group";
import { ThemedActivityIndicator } from "./themed-activity-indicator";
import { ThemedText } from "./themed-text";
import { useRole } from "@/hooks";

function isRetryable(error: unknown) {
  if (error instanceof PostgrestError) return false;
  return true;
}

export function Boundary({ children }: { children: React.ReactNode }) {
  const role = useRole((state) => state.role.toLowerCase());

  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          fallbackRender={({ error, resetErrorBoundary }) => (
            <View style={styles.container}>
              <ThemedText type="h5" color="dimmed">
                Something went wrong
              </ThemedText>
              <ButtonGroup direction="column" style={styles.buttonGroup}>
                {isRetryable(error) ? (
                  <Button
                    label="Try Again"
                    onPress={() => resetErrorBoundary()}
                  />
                ) : null}
                <Button
                  label="Return Home"
                  outlined
                  onPress={() => {
                    resetErrorBoundary();
                    if (router.canDismiss()) router.dismissAll();
                    router.navigate(`/(${role})/(home)`);
                  }}
                />
              </ButtonGroup>
            </View>
          )}
        >
          <Suspense
            fallback={
              <View style={styles.container}>
                <ThemedActivityIndicator size="large" />
              </View>
            }
          >
            {children}
          </Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: theme.gap(2),
  },
  buttonGroup: {
    width: theme.gap(20),
  },
}));
