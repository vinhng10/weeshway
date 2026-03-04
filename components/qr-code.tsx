import { Modal, Pressable, View } from "react-native";
import QRCodeSVG from "react-native-qrcode-svg";
import { StyleSheet } from "react-native-unistyles";
import { Button } from "./input/button";
import { ThemedText } from "./themed-text";

type QRModalProps = {
  visible: boolean;
  onClose: () => void;
  value: string;
  title?: string;
  description?: string;
};

export const QRCode: React.FunctionComponent<QRModalProps> = ({
  visible,
  onClose,
  value,
  title,
  description,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="overFullScreen"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={styles.sheet}>
        {title && <ThemedText type="h4">{title}</ThemedText>}
        {description && (
          <ThemedText type="h5" color="dimmed">
            {description}
          </ThemedText>
        )}
        <View style={styles.qrContainer}>
          <QRCodeSVG value={value} size={200} />
        </View>
        <Button label="Close" onPress={onClose} />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create((theme, rt) => ({
  overlay: {
    flex: 1,
    marginTop: rt.insets.top + theme.gap(1),
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
  qrContainer: {
    alignSelf: "center",
    padding: theme.gap(3),
    backgroundColor: "#FFFFFF",
    borderRadius: theme.gap(2),
  },
}));
