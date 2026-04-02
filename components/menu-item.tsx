import { View } from "react-native";
import { StyleSheet, UnistylesVariants } from "react-native-unistyles";
import { IconSymbol, IconSymbolName } from "./icon-symbol";
import { Pressable } from "./pressable";
import { ThemedText, styles as textStyles } from "./themed-text";

type ProfileMenuItemProps = {
  icon: IconSymbolName;
  title?: string | null;
  subtitle?: string | null;
  onPress?: () => void;
  showChevron?: boolean;
} & UnistylesVariants<typeof textStyles>;

export function MenuItem({
  icon,
  title,
  subtitle,
  onPress,
  showChevron = true,
  color,
}: ProfileMenuItemProps) {
  textStyles.useVariants({ type: "h5", color });

  return (
    <Pressable style={styles.container} onPress={onPress}>
      <IconSymbol style={textStyles.style} name={icon} />
      <View style={styles.textContainer}>
        {title && (
          <ThemedText
            style={[textStyles.style]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {title}
          </ThemedText>
        )}
        {subtitle && (
          <ThemedText color="dimmed" numberOfLines={1} ellipsizeMode="tail">
            {subtitle}
          </ThemedText>
        )}
      </View>
      {showChevron && (
        <IconSymbol style={textStyles.style} name="chevron-forward" />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.gap(2),
    gap: theme.gap(2),
    borderRadius: theme.gap(2),
    backgroundColor: theme.colors.foreground,
  },
  textContainer: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-start",
  },
}));
