import { formatDate, formatTime } from "@/utils";
import React, { useState } from "react";
import { Keyboard, Pressable, View } from "react-native";
import DatePicker from "react-native-date-picker";
import { StyleSheet } from "react-native-unistyles";
import { IconSymbol, IconSymbolName } from "../icon-symbol";
import { ThemedText } from "../themed-text";
import { Options } from "./options";
import { TextInput, TextInputProps } from "./text-input";

interface BoxInputBaseProps {
  label: string;
  icon?: IconSymbolName;
  onPress?: () => void;
  editable?: boolean;
  children: React.ReactNode;
}

const BaseBoxInput: React.FunctionComponent<BoxInputBaseProps> = ({
  label,
  icon,
  onPress,
  editable,
  children,
}) => {
  return (
    <Pressable style={styles.container} onPress={onPress} disabled={!editable}>
      <View style={styles.labelContainer}>
        <ThemedText color="dimmed">{label}</ThemedText>
        {icon && <IconSymbol style={styles.icon} name={icon} size={16} />}
      </View>
      {children}
    </Pressable>
  );
};

// Shared props for all BoxInput variants
interface BaseBoxInputProps {
  label: string;
  value?: string;
  onValueChange?: any;
  editable?: boolean;
}

// TextBoxInput variant
interface TextBoxInputProps extends BaseBoxInputProps, TextInputProps {}

export const TextBoxInput: React.FunctionComponent<TextBoxInputProps> = ({
  label,
  onValueChange,
  ...rest
}) => {
  return (
    <BaseBoxInput label={label} editable={rest.editable}>
      <TextInput
        type="h5"
        onChangeText={onValueChange}
        style={styles.textInput}
        {...rest}
      />
    </BaseBoxInput>
  );
};

// SelectBoxInput variant
interface SelectBoxInputProps extends BaseBoxInputProps {
  options?: Record<string, string>;
  renderFunction?: (item: any) => string;
}

export const SelectBoxInput: React.FunctionComponent<SelectBoxInputProps> = ({
  label,
  value,
  options,
  onValueChange,
  editable = true,
  renderFunction,
}) => {
  const [visible, setVisible] = useState(false);

  const handlePress = () => {
    if (editable) {
      Keyboard.dismiss();
      setVisible(true);
    }
  };

  const handleCloseModal = () => {
    setVisible(false);
  };

  const handleSelect = (selectedValue?: string) => {
    if (onValueChange) {
      onValueChange(selectedValue);
    }
  };

  return (
    <BaseBoxInput
      label={label}
      icon={editable ? "chevron-down" : undefined}
      onPress={handlePress}
      editable={editable}
    >
      <ThemedText type="h5">{value || " "}</ThemedText>
      {options && onValueChange && (
        <Options
          visible={visible}
          onClose={handleCloseModal}
          onSelect={handleSelect}
          options={options}
          title={label}
          currentValue={value}
          renderFunction={renderFunction}
        />
      )}
    </BaseBoxInput>
  );
};

// IntBoxInput variant
interface IntBoxInputProps extends BaseBoxInputProps, TextInputProps {}

export const IntBoxInput: React.FunctionComponent<IntBoxInputProps> = ({
  label,
  onValueChange,
  ...rest
}) => {
  const handleTextChange = (text: string) => {
    if (!onValueChange) return;

    const regex = /^\d*$/;
    if (regex.test(text) || text === "") {
      const parsed = text === "" ? "" : String(parseInt(text) || 0);
      onValueChange(parsed);
    }
  };

  return (
    <BaseBoxInput label={label} editable={rest.editable}>
      <TextInput
        type="h5"
        onChangeText={handleTextChange}
        style={styles.textInput}
        keyboardType="numeric"
        {...rest}
      />
    </BaseBoxInput>
  );
};

// FloatBoxInput variant
interface FloatBoxInputProps extends BaseBoxInputProps, TextInputProps {}

export const FloatBoxInput: React.FunctionComponent<FloatBoxInputProps> = ({
  label,
  onValueChange,
  ...rest
}) => {
  const handleTextChange = (text: string) => {
    if (!onValueChange) return;

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
  };

  return (
    <BaseBoxInput label={label} editable={rest.editable}>
      <TextInput
        type="h5"
        onChangeText={handleTextChange}
        style={styles.textInput}
        keyboardType="numeric"
        {...rest}
      />
    </BaseBoxInput>
  );
};

// DateTimeBoxInput variant
interface DateTimeBoxInputProps {
  label: string;
  value: Date;
  onValueChange: (date: Date) => void;
  icon: IconSymbolName;
  mode: "date" | "time" | "datetime";
  minimumDate?: Date;
  editable?: boolean;
}

export const DateTimeBoxInput: React.FunctionComponent<
  DateTimeBoxInputProps
> = ({
  label,
  value,
  onValueChange,
  icon,
  mode,
  minimumDate,
  editable = true,
}) => {
  const formatFunction = mode === "date" ? formatDate : formatTime;
  const [open, setOpen] = useState(false);

  const handlePress = () => {
    if (editable) {
      Keyboard.dismiss();
      setOpen(true);
    }
  };

  return (
    <BaseBoxInput
      label={label}
      icon={icon}
      onPress={handlePress}
      editable={editable}
    >
      <ThemedText type="h5">{formatFunction(value)}</ThemedText>
      <DatePicker
        modal
        open={open}
        date={value}
        mode={mode}
        onConfirm={(datetime: Date) => {
          onValueChange(datetime);
          setOpen(false);
        }}
        onCancel={() => setOpen(false)}
        minimumDate={minimumDate}
      />
    </BaseBoxInput>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-start",
    gap: theme.gap(0.5),
    borderRadius: theme.gap(2),
    padding: theme.gap(1.5),
    backgroundColor: theme.colors.foreground,
  },
  labelContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: theme.gap(0.2),
  },
  icon: {
    color: theme.colors.dimmed,
  },
  textInput: {
    padding: 0,
  },
}));
