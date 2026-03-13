import { WishEnrichedType } from "@/types";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { TextBoxInput, TextInput } from "./input";
import { SongCard } from "./song-card";
import { ThemedText } from "./themed-text";

interface WishInfoProps {
  data: WishEnrichedType;
  similarWishCount?: number;
}

export function WishInfo({ data, similarWishCount }: WishInfoProps) {
  return (
    <View style={styles.container}>
      {/* Song Card */}
      <SongCard data={data.song} />

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

      {/* {similarWishCount != null && similarWishCount > 0 && (
        <ThemedText type="h5" color="primary">
          {similarWishCount} similar{" "}
          {similarWishCount === 1 ? "wish" : "wishes"} nearby
        </ThemedText>
      )} */}
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    gap: theme.gap(2),
  },
  row: {
    flexDirection: "row",
    gap: theme.gap(2),
  },
}));
