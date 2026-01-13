import { DAY, MONTH } from "@/constants";
import React, { useRef, useState } from "react";
import { Pressable, View } from "react-native";
import DatePicker from "react-native-date-picker";
import { StyleSheet } from "react-native-unistyles";
import { ThemedText } from "../themed-text";
import { IconSymbol, IconSymbolName } from "../ui/icon-symbol";
import { Options } from "./options";
import { TextInput, TextInputProps } from "./text-input";

export const formatDate = (date?: Date, compact: boolean = false): string => {
  if (!date) return "";
  const dayOfWeek = Object.values(DAY)[date.getDay()];
  const month = Object.values(MONTH)[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  return compact
    ? `${month.slice(0, 3)} ${day}`
    : `${dayOfWeek.slice(0, 3)}, ${month.slice(0, 3)} ${day}, ${year}`;
};

export const formatTime = (date?: Date): string => {
  if (!date) return "";
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const hoursStr = String(hours).padStart(2, "0");
  const minutesStr = String(minutes).padStart(2, "0");
  return `${hoursStr}:${minutesStr}`;
};

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
  editable = true,
  ...rest
}) => {
  return (
    <BaseBoxInput label={label} editable={editable}>
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
      icon={editable ? "chevron.down" : undefined}
      onPress={handlePress}
      editable={editable}
    >
      <ThemedText type="h5">{value}</ThemedText>
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
interface IntBoxInputProps extends BaseBoxInputProps {
  placeholder?: string;
}

export const IntBoxInput: React.FunctionComponent<IntBoxInputProps> = ({
  label,
  value,
  onValueChange,
  placeholder,
  editable = true,
}) => {
  const textInputRef = useRef<any>(null);

  const handlePress = () => {
    if (editable) {
      textInputRef.current?.focus();
    }
  };

  const handleTextChange = (text: string) => {
    if (!onValueChange) return;

    const regex = /^\d*$/;
    if (regex.test(text) || text === "") {
      const parsed = text === "" ? "" : String(parseInt(text) || 0);
      onValueChange(parsed);
    }
  };

  return (
    <BaseBoxInput label={label} onPress={handlePress} editable={editable}>
      <TextInput
        ref={textInputRef}
        type="h5"
        value={value}
        onChangeText={handleTextChange}
        placeholder={placeholder}
        style={styles.textInput}
        editable={editable}
        keyboardType="numeric"
      />
    </BaseBoxInput>
  );
};

// FloatBoxInput variant
interface FloatBoxInputProps extends BaseBoxInputProps {
  placeholder?: string;
}

export const FloatBoxInput: React.FunctionComponent<FloatBoxInputProps> = ({
  label,
  value,
  onValueChange,
  placeholder,
  editable = true,
}) => {
  const textInputRef = useRef<any>(null);

  const handlePress = () => {
    if (editable) {
      textInputRef.current?.focus();
    }
  };

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
    <BaseBoxInput label={label} onPress={handlePress} editable={editable}>
      <TextInput
        ref={textInputRef}
        type="h5"
        value={value}
        onChangeText={handleTextChange}
        placeholder={placeholder}
        style={styles.textInput}
        editable={editable}
        keyboardType="numeric"
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
    gap: theme.gap(1),
    borderRadius: theme.gap(2),
    padding: theme.gap(1.5),
    backgroundColor: theme.colors.foreground,
  },
  labelContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: theme.gap(0.5),
  },
  icon: {
    color: theme.colors.dimmed,
  },
  textInput: {
    padding: 0,
  },
}));
