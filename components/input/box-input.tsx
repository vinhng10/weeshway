import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import React from "react";
import { Pressable, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { TextInput } from "./text-input";

interface BoxInputOption {
  label: string;
  value: string;
}

interface BoxInputProps {
  label: string;
  value: string;
  options?: BoxInputOption[];
  onValueChange?: any;
  placeholder?: string;
  type?: "select" | "type";
  editable?: boolean;
}

export const BoxInput: React.FunctionComponent<BoxInputProps> = ({
  label,
  value,
  options,
  onValueChange,
  placeholder,
  type,
  editable = true,
}) => {
  const selectedOption = options?.find((opt) => opt.value === value);

  return (
    <Pressable
      style={styles.container}
      onPress={onValueChange}
      disabled={!editable}
    >
      <View style={styles.labelContainer}>
        <ThemedText color="dimmed">{label}</ThemedText>
        {type === "select" && (
          <IconSymbol style={styles.icon} name="chevron.down" size={16} />
        )}
      </View>

      {type === "select" ? (
        <View style={styles.valueContainer}>
          <ThemedText type="h5">
            {selectedOption?.label || placeholder || ""}
          </ThemedText>
        </View>
      ) : (
        <TextInput
          type="h5"
          value={value}
          onChangeText={onValueChange}
          placeholder={placeholder}
          style={styles.textInput}
          editable={editable}
        />
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: theme.gap(1),
    backgroundColor: theme.colors.foreground,
    borderRadius: theme.gap(2),
    padding: theme.gap(1.5),
  },
  labelContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: theme.gap(0.5),
  },
  valueContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    color: theme.colors.dimmed,
  },
  textInput: {
    textAlign: "center",
    padding: 0,
  },
}));
