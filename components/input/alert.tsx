import { useAlert } from "@/hooks/useAlert";
import { Modal, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Pressable } from "../pressable";
import { ThemedText } from "../themed-text";
import { Button } from "./button";

export const Alert = () => {
  const { visible, title, message, confirmLabel, onConfirm, hideAlert } =
    useAlert();

  const handleConfirm = () => {
    hideAlert();
    onConfirm?.();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="overFullScreen"
      transparent={true}
      onRequestClose={hideAlert}
    >
      <Pressable style={styles.container} onPress={hideAlert} />
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
                onPress={hideAlert}
              />
              <Button
                style={styles.button}
                label={confirmLabel ?? "Confirm"}
                onPress={handleConfirm}
              />
            </>
          ) : (
            <Button style={styles.button} label="OK" onPress={hideAlert} />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    marginTop: rt.insets.top,
    backgroundColor: theme.colors.background,
    opacity: 0.95,
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
