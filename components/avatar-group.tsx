import { Avatar, ThemedText } from "@/components";
import { View, type ViewProps } from "react-native";
import { StyleSheet, type UnistylesVariants } from "react-native-unistyles";

export type AvatarGroupProps = ViewProps &
  UnistylesVariants<typeof styles> & {
    avatars: string[];
    max?: number;
  };

export function AvatarGroup({ avatars, max, size, ...rest }: AvatarGroupProps) {
  styles.useVariants({ size });

  const totalCount = avatars.length;
  const uniqueAvatars = [...new Set(avatars)];

  // Limit the number of avatars to display if max is specified
  const avatarsToShow =
    max && uniqueAvatars.length > max
      ? uniqueAvatars.slice(0, max)
      : uniqueAvatars;
  const overflowCount = max && totalCount > max ? totalCount - max : 0;

  return (
    <View style={styles.container} {...rest}>
      {avatarsToShow.map((source, index) => (
        <View
          key={index}
          style={[styles.avatarWrapper, index > 0 && styles.overlap]}
        >
          <Avatar source={source} size={size} bordered shape="circle" />
        </View>
      ))}
      {overflowCount > 0 && (
        <View style={[styles.avatarWrapper, styles.overlap]}>
          <ThemedText style={styles.overflowBadge}>+{overflowCount}</ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarWrapper: {
    position: "relative",
  },
  overlap: {
    variants: {
      size: {
        default: {
          marginLeft: -theme.gap(2),
        },
        large: {
          marginLeft: -theme.gap(4),
        },
      },
    },
  },
  overflowBadge: {
    color: theme.colors.typographyContrast,
    backgroundColor: theme.colors.contrast,
    borderRadius: 999,
    textAlign: "center",
    textAlignVertical: "center",
    overflow: "hidden",
    variants: {
      size: {
        default: {
          width: theme.gap(3.5),
          height: theme.gap(3.5),
        },
        large: {
          width: theme.gap(5),
          height: theme.gap(5),
        },
      },
    },
  },
}));
