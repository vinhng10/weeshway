import { Button } from "@/components/button";
import { Header } from "@/components/header";
import {
  DateTimeBoxInput,
  formatDate,
  formatTime,
} from "@/components/input/box-input";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import React, { useState } from "react";
import { Modal, Pressable, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

interface DateTimeProps {
  label: string;
  startDateTime?: Date;
  endDateTime?: Date;
  editable?: boolean;
  onValueChange?: any;
}

export const DateTimeInput: React.FunctionComponent<DateTimeProps> = ({
  label,
  startDateTime,
  endDateTime,
  onValueChange,
  editable = true,
}) => {
  const [visible, setVisible] = useState(false);
  const [date, setDate] = useState(startDateTime ?? new Date());
  const [startTime, setStartTime] = useState(startDateTime ?? new Date());
  const [endTime, setEndTime] = useState(endDateTime ?? new Date());

  const handleModal = () => {
    setVisible(!visible);
  };

  const handleSave = () => {
    // Combine date from date with time from startTime
    const finalStartTime = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      startTime.getHours(),
      startTime.getMinutes()
    );

    // Combine date from date with time from endTime
    const finalEndTime = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      endTime.getHours(),
      endTime.getMinutes()
    );

    onValueChange(finalStartTime, finalEndTime);
    setVisible(false);
  };

  return (
    <>
      <Pressable
        style={styles.container}
        onPress={handleModal}
        disabled={!editable}
      >
        <View style={styles.iconContainer}>
          <IconSymbol
            style={styles.icon}
            name={"timer.circle.fill"}
            size={24}
          />
        </View>
        <View style={styles.content}>
          <ThemedText color="dimmed">{label}</ThemedText>
          <ThemedText type="h5">
            {startDateTime && endDateTime
              ? `${formatDate(startDateTime, true)}, ${formatTime(
                  startDateTime
                )} - ${formatTime(endDateTime)}`
              : ""}
          </ThemedText>
        </View>
      </Pressable>

      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="overFullScreen"
        transparent={true}
        onRequestClose={handleModal}
      >
        <View style={styles.modalContainer}>
          <Header title="Date & Time" onPress={handleModal} />

          <View style={styles.modalContent}>
            {/* Date Input */}
            <DateTimeBoxInput
              label="Date"
              value={date}
              onValueChange={setDate}
              icon="calendar"
              mode="date"
              minimumDate={new Date()}
            />

            {/* Time Inputs */}
            <View style={styles.row}>
              <DateTimeBoxInput
                label="Start Time"
                value={startTime}
                onValueChange={setStartTime}
                icon="timer.circle.fill"
                mode="time"
              />
              <DateTimeBoxInput
                label="End Time"
                value={endTime}
                onValueChange={setEndTime}
                icon="timer.circle.fill"
                mode="time"
                minimumDate={startTime}
              />
            </View>
          </View>
        </View>

        <Button stickyBottom label="Save" onPress={handleSave} />
      </Modal>
    </>
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
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    opacity: 0.95,
  },
  modalContent: {
    gap: theme.gap(2),
    padding: theme.gap(2),
  },
  row: {
    flexDirection: "row",
    gap: theme.gap(2),
  },
}));
