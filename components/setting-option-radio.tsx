import { Pressable, PressableStateCallbackType, View } from "react-native";
import { StyleSheet, type UnistylesVariants } from "react-native-unistyles";
import { ThemedText } from "./themed-text";

interface SettingOptionRadioProps extends UnistylesVariants<typeof style> {
  label: string;
  onPress(): void;
}

export const SettingOptionRadio: React.FunctionComponent<
  SettingOptionRadioProps
> = ({ label, isSelected, onPress }) => {
  style.useVariants({
    isSelected,
  });

  return (
    <Pressable onPress={onPress} style={style.container}>
      <ThemedText type="subtitle">{label}</ThemedText>
      <View style={style.radio}>
        {isSelected && <View style={style.radioInner} />}
      </View>
    </Pressable>
  );
};

const style = StyleSheet.create((theme) => ({
  container: (state: PressableStateCallbackType) => ({
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    borderRadius: theme.gap(1),
    padding: theme.gap(2),
    borderWidth: 1,
    borderColor: theme.colors.dimmed,
    opacity: state.pressed ? 0.75 : 1,
  }),
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    variants: {
      isSelected: {
        true: {
          borderColor: theme.colors.tint,
        },
        false: {
          borderColor: theme.colors.dimmed,
        },
      },
    },
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.tint,
  },
}));
