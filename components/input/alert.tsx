import { useAlert } from "@/hooks/useAlert";
import { Modal, Pressable, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { ThemedText } from "../themed-text";
import { Button } from "./button";

type AlertProps = {
  visible: boolean;
  title?: string;
  message: string;
  onClose: () => void;
  /** Optional label for the confirm/primary action button */
  confirmLabel?: string;
  /** If provided, shows a confirm button alongside dismiss */
  onConfirm?: () => void;
};

export const Alert: React.FunctionComponent<AlertProps> = ({
  visible,
  title,
  message,
  onClose,
  confirmLabel,
  onConfirm,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="overFullScreen"
      transparent={true}
      onRequestClose={onClose}
    >
      <Pressable style={styles.container} onPress={onClose} />
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
                onPress={onClose}
              />
              <Button
                style={styles.button}
                label={confirmLabel ?? "Confirm"}
                onPress={onConfirm}
              />
            </>
          ) : (
            <Button style={styles.button} label="OK" onPress={onClose} />
          )}
        </View>
      </View>
    </Modal>
  );
};

export const GlobalAlert = () => {
  const { visible, title, message, hide } = useAlert();
  return (
    <Alert visible={visible} title={title} message={message} onClose={hide} />
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
