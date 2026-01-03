import { Boundary } from "@/components/boundary";
import { Button } from "@/components/button";
import { Header } from "@/components/header";
import { TextBoxInput, TextInput } from "@/components/input";
import { SongCard } from "@/components/song-card";
import { useSuspenseQuery } from "@/hooks/useSuspenseQuery";
import { supabase } from "@/supabase";
import { WishEnrichedType } from "@/types";
import { useLocalSearchParams } from "expo-router";
import { ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

function WishBoardContent() {
  const { wishId } = useLocalSearchParams<{ wishId: string }>();

  const { data } = useSuspenseQuery<WishEnrichedType>({
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

export default function WishBoard() {
  return (
    <Boundary>
      <WishBoardContent />
    </Boundary>
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
    alignSelf: "center",
  },
  row: {
    flexDirection: "row",
    gap: theme.gap(2),
  },
}));
