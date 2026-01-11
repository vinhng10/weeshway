import { SongCard, TextBoxInput, TextInput } from "@/components";
import { WishEnrichedType } from "@/types";
import { ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

interface WishInfoProps {
  data: WishEnrichedType;
}

export function WishInfo({ data }: WishInfoProps) {
  return (
    <View style={styles.container}>
      {/* Song Card */}
      <View style={styles.cardContainer}>
        <SongCard data={data.song} />
      </View>

      {/* Style and Level Selects */}
      <View style={styles.row}>
        <TextBoxInput label="Style" value={data.style} editable={false} />
        <TextBoxInput label="Level" value={data.level} editable={false} />
      </View>

      {/* Wish Description */}
      <TextInput
        multiline
        numberOfLines={4}
        value={data.description}
        editable={false}
      />
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    gap: theme.gap(2),
  },
  cardContainer: {
    alignSelf: "center",
  },
  row: {
    flexDirection: "row",
    gap: theme.gap(2),
  },
}));
