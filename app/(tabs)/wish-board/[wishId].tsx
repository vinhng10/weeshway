import { Button } from "@/components/button";
import { Header } from "@/components/header";
import { TextBoxInput, TextInput } from "@/components/input";
import { SongCard } from "@/components/song-card";
import { ThemedText } from "@/components/themed-text";
import { useQuery } from "@/hooks/useQuery";
import { supabase } from "@/supabase";
import { WishEnrichedType } from "@/types";
import { useLocalSearchParams } from "expo-router";
import { ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export default function Wish() {
  const { wishId } = useLocalSearchParams<{ wishId: string }>();

  const { data, isPending, error } = useQuery<WishEnrichedType>({
    queryKey: ["wishes", "board", wishId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wishes")
        .select(`*, song:songs(*)`)
        .eq("id", wishId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!wishId,
  });

  if (error || !data) {
    return (
      <View style={styles.container}>
        <Header title="Wish" />
        <View style={styles.scrollContainer}>
          <ThemedText>Wish not found</ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Wish" />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
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
      </ScrollView>

      <Button label="Create Project" onPress={() => {}} stickyBottom />
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
    gap: theme.gap(2),
  },
}));
