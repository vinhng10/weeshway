import { Pressable, PressableStateCallbackType, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { ThemedText } from "./themed-text";

type SettingTileProps = {
  settingName: string;
  selectedValue: string;
  description: string;
  onPress(): void;
};

export const SettingTile: React.FunctionComponent<SettingTileProps> = ({
  settingName,
  selectedValue,
  description,
  onPress,
}) => {
  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View>
        <ThemedText bold>{settingName}</ThemedText>
        <ThemedText dimmed>{description}</ThemedText>
      </View>
      <ThemedText>{selectedValue}</ThemedText>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: (state: PressableStateCallbackType) => ({
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    opacity: state.pressed ? 0.75 : 1,
  }),
});
