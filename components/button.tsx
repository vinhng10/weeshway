import { Pressable, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { ThemedText } from "./themed-text";

interface ButtonProps {
  label: string;
  onPress(): void;
}

export const Button: React.FunctionComponent<ButtonProps> = ({
  label,
  onPress,
}) => {
  return (
    <Pressable onPress={onPress}>
      <View style={style.button}>
        <ThemedText bold type="h3" style={style.label}>
          {label}
        </ThemedText>
      </View>
    </Pressable>
  );
};

const style = StyleSheet.create((theme) => ({
  button: {
    width: "100%",
    height: theme.gap(6),
    paddingHorizontal: theme.gap(2),
    justifyContent: "center",
    alignItems: "center",
    borderRadius: theme.gap(2),
    backgroundColor: "#FFFFFF",
  },
  label: {
    color: "#000000",
  },
}));
