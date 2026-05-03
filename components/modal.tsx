import {
  ModalProps,
  Modal as RNModal,
  StyleProp,
  View,
  ViewStyle,
} from "react-native";
import { StyleSheet } from "react-native-unistyles";

interface ModalScreenProps extends ModalProps {
  containerStyle?: StyleProp<ViewStyle>;
}

export const Modal = ({
  children,
  containerStyle,
  ...rest
}: ModalScreenProps) => (
  <RNModal
    animationType="slide"
    presentationStyle="overFullScreen"
    transparent={true}
    {...rest}
  >
    <View style={[styles.container, containerStyle]}>{children}</View>
  </RNModal>
);

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    paddingTop: rt.insets.top,
    marginBottom: rt.insets.bottom,
    backgroundColor: theme.colors.background,
  },
}));
