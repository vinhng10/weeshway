import { useAlert } from "@/hooks/useAlert";
import { Modal, Pressable, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { ThemedText } from "../themed-text";
import { Button } from "./button";

export const Alert = () => {
  const { visible, title, message, confirmLabel, onConfirm, hide } =
    useAlert();

  const handleConfirm = () => {
    hide();
    onConfirm?.();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="overFullScreen"
      transparent={true}
      onRequestClose={hide}
    >
      <Pressable style={styles.container} onPress={hide} />
      <View style={styles.sheet}>
        {title && <ThemedText type="h4">{title}</ThemedText>}
        <ThemedText type="h5" color="dimmed">
          {message}
        </ThemedText>
        <View style={styles.row}>
          {onConfirm ? (
            <>
              <Button
                style={styles.button}
                outlined
                label="Cancel"
                onPress={hide}
              />
              <Button
                style={styles.button}
                label={confirmLabel ?? "Confirm"}
                onPress={handleConfirm}
              />
            </>
          ) : (
            <Button style={styles.button} label="OK" onPress={hide} />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    marginTop: rt.insets.top + theme.gap(1),
    backgroundColor: theme.colors.background,
    opacity: 0.8,
  },
  sheet: {
    padding: theme.gap(2),
    borderTopLeftRadius: theme.gap(2),
    borderTopRightRadius: theme.gap(2),
    gap: theme.gap(2),
    backgroundColor: theme.colors.foreground,
  },
  row: {
    flexDirection: "row",
    gap: theme.gap(2),
  },
  button: {
    flex: 1,
  },
}));
