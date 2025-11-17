import { Button } from "@/components/button";
import { Header } from "@/components/header";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import React, { useState } from "react";
import { Modal, Pressable, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { DateTimeField, formatDate, formatTime } from "@/components/field";

interface DateTimeProps {
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
          <DateTimeField
            label="Date"
            value={date}
            onValueChange={setDate}
            icon="calendar"
            mode="date"
            minimumDate={new Date()}
          />

          {/* Time Inputs */}
          <View style={modalStyles.row}>
            <View style={modalStyles.timeField}>
              <DateTimeField
                label="Start Time"
                value={startTime}
                onValueChange={setStartTime}
                icon="timer.circle.fill"
                mode="time"
              />
            </View>
            <View style={modalStyles.timeField}>
              <DateTimeField
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
      </View>

      <Button stickyBottom label="Save" onPress={handleSave} />
    </Modal>
  );
};

export const DateTimeInput: React.FunctionComponent<DateTimeProps> = ({
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
  timeField: {
    flex: 1,
    gap: theme.gap(1),
  },
  row: {
    flexDirection: "row",
    gap: theme.gap(2),
  },
}));
