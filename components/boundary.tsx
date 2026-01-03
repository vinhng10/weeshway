import { Button } from "@/components/input/button";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { ActivityIndicator, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export function Boundary({ children }: { children: React.ReactNode }) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          fallbackRender={({ resetErrorBoundary }) => (
            <View style={styles.container}>
              <Button label="Try Again" onPress={() => resetErrorBoundary()} />
            </View>
          )}
        >
          <Suspense
            fallback={
              <View style={styles.container}>
                <ActivityIndicator size="large" color="#FFFFFF" />
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
  },
}));
