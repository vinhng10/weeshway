import { Boundary, Button, Header, WishInfo } from "@/components";
import { useSuspenseQuery, useTempDataStore } from "@/hooks";
import { supabase } from "@/supabase";
import { WishEnrichedType } from "@/types";
import { router, useLocalSearchParams } from "expo-router";
import { RefreshControl, ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

function WishContent() {
  const { wishId } = useLocalSearchParams<{ wishId: string }>();
  const setData = useTempDataStore((state) => state.setData);

  const { data, refetch, isRefetching } = useSuspenseQuery<WishEnrichedType>({
    queryKey: ["wishes", "explore", wishId],
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

  const handleCreateProject = () => {
    // Store the wish data in the temporary data store
    setData<WishEnrichedType>(data);
    // Navigate to create project screen
    router.navigate("/(teacher)/(projects)/create");
  };

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        <WishInfo data={data} />
      </ScrollView>
      <Button
        label="Create Project"
        onPress={handleCreateProject}
        stickyBottom
      />
    </>
  );
}

export default function Wish() {
  return (
    <View style={styles.container}>
      <Header title="Wish" />
      <Boundary>
        <WishContent />
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
