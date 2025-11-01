import {
  Text,
  View,
  type ImageSourcePropType,
  type ViewProps,
} from "react-native";
import { StyleSheet, type UnistylesVariants } from "react-native-unistyles";
import { Avatar } from "./avatar";

export type AvatarGroupProps = ViewProps &
  UnistylesVariants<typeof styles> & {
    avatars: ImageSourcePropType[];
    max?: number;
  };

export function AvatarGroup({
  style,
  avatars,
  max,
  size,
  ...rest
}: AvatarGroupProps) {
  styles.useVariants({
    size,
  });

  // Limit the number of avatars to display if max is specified
  const avatarsToShow =
    max && avatars.length > max ? avatars.slice(0, max) : avatars;
  const overflowCount = max && avatars.length > max ? avatars.length - max : 0;

  return (
    <View style={[styles.container, style]} {...rest}>
      {avatarsToShow.map((source, index) => (
        <View
          key={index}
          style={[styles.avatarWrapper, index > 0 && styles.avatarOverlap]}
        >
          <Avatar source={source} size={size} bordered shape="circle" />
        </View>
      ))}
      {overflowCount > 0 && (
        <View style={[styles.avatarWrapper, styles.overflowAvatar]}>
          <View style={styles.overflowBadge}>
            <Avatar size={size} />
            <View style={styles.overflowText}>
              <Text style={styles.overflowTextInner}>+{overflowCount}</Text>
            </View>
          </View>
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
  avatarOverlap: {
    variants: {
      size: {
        default: {
          marginLeft: -theme.gap(1),
        },
        large: {
          marginLeft: -theme.gap(2),
        },
      },
    },
  },
  overflowAvatar: {
    variants: {
      size: {
        default: {
          marginLeft: -theme.gap(1),
        },
        large: {
          marginLeft: -theme.gap(2),
        },
      },
    },
  },
  overflowBadge: {
    position: "relative",
  },
  overflowAvatarImage: {
    opacity: 0.6,
  },
  overflowText: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  overflowTextInner: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 999,
    paddingHorizontal: theme.gap(1),
    paddingVertical: theme.gap(0.25),
    minWidth: theme.gap(3),
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    overflow: "hidden",
  },
}));
