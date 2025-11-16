import { Button } from "@/components/button";
import { Header } from "@/components/header";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { DayEnum, MonthEnum } from "@/constants";
import React, { useState } from "react";
import { Modal, Pressable, View } from "react-native";
import DatePicker from "react-native-date-picker";
import { StyleSheet } from "react-native-unistyles";

interface RowInputProps {
  label: string;
  startDateTime?: Date;
  endDateTime?: Date;
  editable?: boolean;
  onValueChange?: any;
}

interface DateTimeModalProps {
  visible: boolean;
  onSave: any;
  onClose: any;
  startDateTime?: Date;
  endDateTime?: Date;
}

const formatDate = (
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

const formatTime = (date: Date | undefined): string => {
  if (!date) return "";
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const hoursStr = String(hours).padStart(2, "0");
  const minutesStr = String(minutes).padStart(2, "0");
  return `${hoursStr}:${minutesStr}`;
};

const DateTimeModal: React.FunctionComponent<DateTimeModalProps> = ({
  visible,
  onSave,
  onClose,
  startDateTime,
  endDateTime,
}) => {
  const [date, setDate] = useState(startDateTime ?? new Date());
  const [startTime, setStartTime] = useState(startDateTime ?? new Date());
  const [endTime, setEndTime] = useState(endDateTime ?? new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

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

    onSave(finalStartTime, finalEndTime);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="overFullScreen"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={modalStyles.container}>
        <Header title="Date & Time" onPress={onClose} />

        <View style={modalStyles.content}>
          {/* Date Input */}
          <View style={modalStyles.field}>
            <ThemedText color="dimmed">Date</ThemedText>
            <Pressable
              style={modalStyles.input}
              onPress={() => setShowDatePicker(true)}
            >
              <ThemedText type="h5">{formatDate(date)}</ThemedText>
              <IconSymbol name="calendar" size={20} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* Time Inputs */}
          <View style={modalStyles.row}>
            {/* Start Time Input */}
            <View style={modalStyles.timeField}>
              <ThemedText color="dimmed">Start Time</ThemedText>
              <Pressable
                style={modalStyles.input}
                onPress={() => setShowStartTimePicker(true)}
              >
                <ThemedText type="h5">{formatTime(startTime)}</ThemedText>
                <IconSymbol
                  name="timer.circle.fill"
                  size={20}
                  color="#FFFFFF"
                />
              </Pressable>
            </View>

            {/* End Time Input */}
            <View style={modalStyles.timeField}>
              <ThemedText color="dimmed">End Time</ThemedText>
              <Pressable
                style={modalStyles.input}
                onPress={() => setShowEndTimePicker(true)}
              >
                <ThemedText type="h5">{formatTime(endTime)}</ThemedText>
                <IconSymbol
                  name="timer.circle.fill"
                  size={20}
                  color="#FFFFFF"
                />
              </Pressable>
            </View>
          </View>

          {/* Date Picker */}
          <DatePicker
            modal
            open={showDatePicker}
            date={date}
            mode="date"
            onConfirm={(datetime: Date) => {
              setDate(datetime);
              setShowDatePicker(false);
            }}
            onCancel={() => setShowDatePicker(false)}
            minimumDate={new Date()}
          />

          {/* Start Time Picker */}
          <DatePicker
            modal
            open={showStartTimePicker}
            date={startTime}
            mode="time"
            onConfirm={(datetime: Date) => {
              setStartTime(datetime);
              setShowStartTimePicker(false);
            }}
            onCancel={() => setShowStartTimePicker(false)}
            minimumDate={date}
          />

          {/* End Time Picker */}
          <DatePicker
            modal
            open={showEndTimePicker}
            date={endTime}
            mode="time"
            onConfirm={(datetime: Date) => {
              setEndTime(datetime);
              setShowEndTimePicker(false);
            }}
            onCancel={() => setShowEndTimePicker(false)}
            minimumDate={startTime}
          />
        </View>
      </View>

      <Button stickyBottom label="Save" onPress={handleSave} />
    </Modal>
  );
};

export const DateTimeInput: React.FunctionComponent<RowInputProps> = ({
  label,
  startDateTime,
  endDateTime,
  onValueChange,
  editable = true,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <Pressable
        style={styles.container}
        onPress={() => setModalVisible(true)}
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

      <DateTimeModal
        visible={modalVisible}
        onSave={onValueChange}
        onClose={() => setModalVisible(false)}
        startDateTime={new Date()}
        endDateTime={new Date()}
      />
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
}));

const modalStyles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    opacity: 0.95,
  },
  content: {
    gap: theme.gap(2),
    padding: theme.gap(2),
  },
  field: {
    gap: theme.gap(1),
  },
  timeField: {
    flex: 1,
    gap: theme.gap(1),
  },
  row: {
    flexDirection: "row",
    gap: theme.gap(2),
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
