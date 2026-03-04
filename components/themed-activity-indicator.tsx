import { ActivityIndicator, type ActivityIndicatorProps } from "react-native";
import { useUnistyles } from "react-native-unistyles";

export function ThemedActivityIndicator(props: ActivityIndicatorProps) {
  const { theme } = useUnistyles();
  return <ActivityIndicator color={theme.colors.typography} {...props} />;
}
