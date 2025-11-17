import { TextInput } from "@/components/input/text-input";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol, IconSymbolName } from "@/components/ui/icon-symbol";
import { DayEnum, MonthEnum } from "@/constants";
import { useState } from "react";
import { Pressable, View } from "react-native";
import DatePicker from "react-native-date-picker";
import { StyleSheet } from "react-native-unistyles";

export const formatDate = (
  date: Date | undefined,
  compact: boolean = false
): string => {
  if (!date) return "";
  const dayOfWeek = Object.values(DayEnum)[date.getDay()];
  const month = Object.values(MonthEnum)[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  return compact
    ? `${month.slice(0, 3)} ${day}`
    : `${dayOfWeek.slice(0, 3)}, ${month.slice(0, 3)} ${day}, ${year}`;
};

export const formatTime = (date: Date | undefined): string => {
  if (!date) return "";
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const hoursStr = String(hours).padStart(2, "0");
  const minutesStr = String(minutes).padStart(2, "0");
  return `${hoursStr}:${minutesStr}`;
};

interface FieldProps {
  label: string;
  children: React.ReactNode;
}

interface TextFieldProps {
  label: string;
  value: string;
  onValueChange: any;
  placeholder: string;
  multiline?: boolean;
}

interface DateTimeFieldProps {
  label: string;
  value: Date;
  onValueChange: any;
  icon: IconSymbolName;
  mode: "date" | "time" | "datetime";
  minimumDate?: Date;
}

export const Field: React.FC<FieldProps> = ({ label, children }) => {
  return (
    <View style={styles.container}>
      <ThemedText color="dimmed">{label}</ThemedText>
      {children}
    </View>
  );
};

export const TextField: React.FC<TextFieldProps> = ({
  label,
  value,
  onValueChange,
  placeholder,
  multiline,
}) => {
  return (
    <Field label={label}>
      <TextInput
        placeholder={placeholder}
        value={value}
        onChangeText={onValueChange}
        multiline={multiline}
      />
    </Field>
  );
};

export const DateTimeField: React.FC<DateTimeFieldProps> = ({
  label,
  value,
  onValueChange,
  icon,
  mode,
  minimumDate,
}) => {
  const formatFunction = mode === "date" ? formatDate : formatTime;
  const [open, setOpen] = useState(false);

  return (
    <Field label={label}>
      <Pressable style={styles.input} onPress={() => setOpen(true)}>
        <ThemedText type="h5">{formatFunction(value)}</ThemedText>
        <IconSymbol name={icon} size={20} color="#FFFFFF" />
      </Pressable>

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
    </Field>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    gap: theme.gap(1),
  },
  input: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.colors.foreground,
    borderRadius: theme.gap(2),
    padding: theme.gap(2),
  },
}));
