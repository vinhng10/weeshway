import { formatDate, formatTime } from "@/utils";
import React, { useState } from "react";
import { Keyboard, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Header } from "../header";
import { IconSymbol } from "../icon-symbol";
import { Modal } from "../modal";
import { Pressable } from "../pressable";
import { ThemedText } from "../themed-text";
import { DateTimeBoxInput } from "./box-input";
import { Button } from "./button";

interface DateTimeProps {
  label: string;
  startAt?: Date;
  endAt?: Date;
  editable?: boolean;
  onValueChange?: any;
}

export const DateTimeInput: React.FunctionComponent<DateTimeProps> = ({
  label,
  startAt,
  endAt,
  onValueChange,
  editable = true,
}) => {
  const [visible, setVisible] = useState(false);
  const [date, setDate] = useState(startAt ?? new Date());
  const [startTime, setStartTime] = useState(startAt ?? new Date());
  const [endTime, setEndTime] = useState(endAt ?? new Date());
  const [error, setError] = useState<string>();

  const handlePress = () => {
    Keyboard.dismiss();
    setError(undefined);
    setVisible(true);
  };

  const handleClose = () => {
    setVisible(false);
  };

  const handleSave = () => {
    // Combine date from date with time from startTime
    const finalStartTime = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      startTime.getHours(),
      startTime.getMinutes(),
    );

    // Combine date from date with time from endTime
    const finalEndTime = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      endTime.getHours(),
      endTime.getMinutes(),
    );

    // Validate that start time is not greater than end time
    if (finalStartTime >= finalEndTime) {
      setError("Start time must be before end time");
      return;
    }

    setError(undefined);
    onValueChange(finalStartTime, finalEndTime);
    setVisible(false);
  };

  return (
    <>
      <Pressable style={styles.container} onPress={handlePress}>
        <View style={styles.iconContainer}>
          <IconSymbol style={styles.icon} name="time" size={24} />
        </View>
        <View style={styles.content}>
          <ThemedText color="dimmed">{label}</ThemedText>
          <ThemedText type="h5">
            {startAt && endAt
              ? `${formatDate(startAt, true)}, ${formatTime(
                  startAt,
                )} - ${formatTime(endAt)}`
              : ""}
          </ThemedText>
        </View>
      </Pressable>

      <Modal visible={visible} onRequestClose={handleClose}>
        <Header title="Date & Time" onPress={handleClose} />

        <View style={styles.modalContent}>
          {/* Date Input */}
          <View style={styles.row}>
            <DateTimeBoxInput
              label="Date"
              value={date}
              onValueChange={setDate}
              icon="calendar"
              mode="date"
              minimumDate={new Date()}
              editable={editable}
            />
          </View>

          {/* Time Inputs */}
          <View style={styles.row}>
            <DateTimeBoxInput
              label="Start Time"
              value={startTime}
              onValueChange={(value) => {
                setStartTime(value);
                setError(undefined);
              }}
              icon="time"
              mode="time"
              editable={editable}
            />
            <DateTimeBoxInput
              label="End Time"
              value={endTime}
              onValueChange={(value) => {
                setEndTime(value);
                setError(undefined);
              }}
              icon="time"
              mode="time"
              minimumDate={startTime}
              editable={editable}
            />
          </View>

          {/* Error Message */}
          {error && (
            <ThemedText color="danger" style={styles.errorText}>
              {error}
            </ThemedText>
          )}
        </View>

        {editable && (
          <Button
            position="stickyBottomAbsolute"
            label="Save"
            onPress={handleSave}
          />
        )}
      </Modal>
    </>
  );
};

const styles = StyleSheet.create((theme, rt) => ({
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
    gap: theme.gap(0.5),
  },
  modalContent: {
    gap: theme.gap(2),
    paddingHorizontal: theme.gap(2),
  },
  row: {
    flexDirection: "row",
    gap: theme.gap(2),
  },
  errorText: {
    marginTop: theme.gap(1),
    paddingHorizontal: theme.gap(2),
    textAlign: "center",
  },
}));
