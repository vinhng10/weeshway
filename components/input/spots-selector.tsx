import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { IconSymbol } from "../icon-symbol";
import { ThemedText } from "../themed-text";
import { IconButton } from "./icon-button";

type SpotsSelectorProps = {
  spots: number;
  onSpotsChange: (spots: number) => void;
  loading?: boolean;
  disabled?: boolean;
};

export function SpotsSelector({
  spots,
  onSpotsChange,
  loading = false,
  disabled = false,
}: SpotsSelectorProps) {
  const canDecrement = spots > 1 && !loading && !disabled;
  const canIncrement = !loading && !disabled;

  const handleDecrement = () => onSpotsChange(Math.max(1, spots - 1));
  const handleIncrement = () => onSpotsChange(spots + 1);

  return (
    <View style={[styles.row, styles.container]}>
      <View style={[styles.row, styles.spotsLabel]}>
        <IconSymbol name="person-sharp" size={20} />
        <ThemedText type="h3">Spots</ThemedText>
      </View>
      <View style={[styles.row, styles.quantitySelector]}>
        <IconButton
          icon="remove"
          onPress={handleDecrement}
          iconSize={20}
          type="transparent"
          disabled={!canDecrement}
        />
        <ThemedText type="h3">{spots}</ThemedText>
        <IconButton
          icon="add"
          onPress={handleIncrement}
          iconSize={20}
          type="transparent"
          disabled={!canIncrement}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  container: {
    justifyContent: "space-between",
  },
  spotsLabel: {
    gap: theme.gap(1),
  },
  quantitySelector: {
    backgroundColor: theme.colors.foreground,
    borderRadius: theme.gap(2),
    gap: theme.gap(1),
  },
}));
