import { IconSymbol, IconSymbolName } from "@/components/ui/icon-symbol";
import React from "react";
import { Pressable, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { ThemedText } from "../themed-text";

interface RowInputProps {
  label: string;
  icon: IconSymbolName;
  value: string;
  editable?: boolean;
  onValueChange?: any;
}

export const RowInput: React.FunctionComponent<RowInputProps> = ({
  label,
  icon,
  value,
  editable = true,
  onValueChange,
}) => {
  return (
    <Pressable
      style={styles.container}
      onPress={onValueChange}
      disabled={!editable}
    >
      <View style={styles.iconContainer}>
        <IconSymbol style={styles.icon} name={icon} size={24} />
      </View>
      <View style={styles.content}>
        <ThemedText color="dimmed">{label}</ThemedText>
        <ThemedText type="h5">{value}</ThemedText>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.gap(1),
  },
  iconContainer: {
    height: theme.gap(5),
    width: theme.gap(5),
    backgroundColor: theme.colors.foreground,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: theme.gap(1),
  },
  icon: {
    color: theme.colors.dimmed,
  },
  content: {
    flex: 1,
    gap: theme.gap(1),
  },
}));
