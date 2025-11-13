import { Button } from "@/components/button";
import { Header } from "@/components/header";
import { BoxInput, TextInput } from "@/components/input";
import { SongCard } from "@/components/song-card";
import { Level, Style } from "@/constants/options";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export default function MakeAWish() {
  const [searchQuery, setSearchQuery] = useState("");
  const [style, setStyle] = useState<Style>(Style.HipHop);
  const [level, setLevel] = useState<Level>(Level.Beginner);

  return (
    <View style={styles.container}>
      <Header title="Make A Wish" />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Input */}
        <TextInput
          placeholder="Search song..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {/* Song Card */}
        <View style={styles.cardContainer}>
          <SongCard
            title="Midnight Bloom"
            artist="Liam Carter"
            imageUrl="https://i.scdn.co/image/ab67616d0000b2737d469421bb0b23b32b4851da"
            onPlay={() => {}}
          />
        </View>

        {/* Style and Level Selects */}
        <View style={styles.row}>
          <BoxInput
            label="Style"
            type="select"
            value={style}
            options={Style}
            onValueChange={setStyle}
          />
          <BoxInput
            label="Level"
            type="select"
            value={level}
            options={Level}
            onValueChange={setLevel}
          />
        </View>

        {/* Wish Description */}
        <TextInput
          placeholder="What do you wish for?"
          multiline
          numberOfLines={4}
        />
      </ScrollView>

      <Button label="Create" onPress={() => {}} stickyBottom />
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    marginTop: rt.insets.top + theme.gap(1),
  },
  scrollContainer: {
    gap: theme.gap(2),
    padding: theme.gap(2),
    paddingBottom: theme.gap(16),
  },
  cardContainer: {
    width: theme.gap(42),
    height: theme.gap(42),
    alignSelf: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.gap(2),
  },
}));
