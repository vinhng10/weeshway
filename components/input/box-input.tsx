import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import React, { useRef, useState } from "react";
import { Pressable, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { OptionsModal } from "../options-modal";
import { TextInput } from "./text-input";

interface BoxInputProps {
  label: string;
  value?: string;
  options?: Record<string, string>;
  onValueChange?: any;
  placeholder?: string;
  type: "text" | "select" | "int" | "float";
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
  const keyboardType =
    type === "int" || type === "float" ? "numeric" : "default";
  const [modalVisible, setModalVisible] = useState(false);
  const textInputRef = useRef<any>(null);

  const handlePress = () => {
    if (!editable) return;

    if (type === "select") {
      setModalVisible(true);
    } else {
      textInputRef.current?.focus();
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  const handleTextChange = (text: string) => {
    if (!onValueChange) return;

    if (type === "int") {
      const regex = /^\d*$/;
      if (regex.test(text) || text === "") {
        const parsed = text === "" ? "" : String(parseInt(text) || 0);
        onValueChange(parsed);
      }
    } else if (type === "float") {
      const regex = /^(\d*\.?\d*)$/;
      if (regex.test(text) || text === "") {
        // Allow trailing dot for better UX while typing
        if (text.endsWith(".")) {
          onValueChange(text);
        } else {
          const parsed = text === "" ? "" : String(parseFloat(text) || 0);
          onValueChange(parsed);
        }
      }
    } else {
      onValueChange(text);
    }
  };

  return (
    <>
      <Pressable
        style={styles.container}
        onPress={handlePress}
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
            <ThemedText type="h5">{value || ""}</ThemedText>
          </View>
        ) : (
          <TextInput
            ref={textInputRef}
            type="h5"
            value={value}
            onChangeText={handleTextChange}
            placeholder={placeholder}
            style={styles.textInput}
            editable={editable}
            keyboardType={keyboardType}
          />
        )}
      </Pressable>

      {type === "select" && options && (
        <OptionsModal
          visible={modalVisible}
          onClose={handleCloseModal}
          onSelect={onValueChange}
          options={options}
          title={label}
        />
      )}
    </>
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
