import { Boundary, Button, Header, WishInfo } from "@/components";
import { useSuspenseQuery } from "@/hooks";
import { supabase } from "@/supabase";
import { WishEnrichedType } from "@/types";
import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";
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
    <>
      <WishInfo data={data} />
      <Button label="Create Project" onPress={() => {}} stickyBottom />
    </>
  );
}

export default function WishBoard() {
  return (
    <View style={styles.container}>
      <Header title="Wish" />
      <Boundary>
        <WishBoardContent />
      </Boundary>
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
    alignSelf: "center",
  },
  row: {
    flexDirection: "row",
    gap: theme.gap(2),
  },
}));
