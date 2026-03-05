import { ActivityIndicator, type ActivityIndicatorProps } from "react-native";
import { withUnistyles } from "react-native-unistyles";

const UniActivityIndicator = withUnistyles(ActivityIndicator, (theme) => ({
  color: theme.colors.typography,
}));

export function ThemedActivityIndicator(props: ActivityIndicatorProps) {
  return <UniActivityIndicator {...props} />;
}
