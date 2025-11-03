import { ClassCard } from "@/components/card";
import { ThemedText } from "@/components/themed-text";
import { Tile } from "@/components/tile";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { wishes } from "@/mocks/wishes";
import { ClassType } from "@/types";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as React from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import Carousel, {
  ICarouselInstance,
  Pagination,
} from "react-native-reanimated-carousel";
import { StyleSheet } from "react-native-unistyles";

export default function Class() {
  const { wishId } = useLocalSearchParams<{ wishId: string }>();
  const router = useRouter();

  // Find the wish by ID
  const wish = wishes.find((w) => w.id === Number(wishId));

  if (!wish) {
    return (
      <View style={styles.container}>
        <ThemedText>Wish not found</ThemedText>
      </View>
    );
  }

  const handleBook = (classId: number) => {
    console.log("Book class:", classId);
    // Add booking logic here
  };

  const handlePlay = (classId: number) => {
    console.log("Play class:", classId);
    // Add play logic here
  };

  const ref = React.useRef<ICarouselInstance>(null);
  const progress = useSharedValue<number>(0);
  const onPressPagination = (index: number) => {
    ref.current?.scrollTo({
      count: index - progress.value,
      animated: true,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={32} color="#FFFFFF" />
        </Pressable>
        <ThemedText bold type="h4">
          Wish
        </ThemedText>
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* Top Classes Container */}
        {wish.classes && wish.classes.length > 0 && (
          <View>
            <ThemedText bold type="h4">
              {wish.status === "available"
                ? "Your top classes"
                : "Granted classes"}
            </ThemedText>
            <Carousel
              ref={ref}
              loop={true}
              width={360}
              height={360}
              snapEnabled={true}
              pagingEnabled={true}
              data={wish.classes}
              onProgressChange={progress}
              style={styles.carousel}
              mode="parallax"
              modeConfig={{
                parallaxScrollingScale: 0.9,
                parallaxScrollingOffset: 50,
              }}
              onSnapToItem={(index: number) =>
                console.log("current index:", index)
              }
              renderItem={({ item }: { item: ClassType }) => (
                <View style={styles.carouselItem}>
                  <ClassCard
                    classData={item}
                    onBook={() => handleBook(item.id)}
                    onPlay={() => handlePlay(item.id)}
                  />
                </View>
              )}
            />
            <Pagination.Basic
              progress={progress}
              data={wish.classes}
              dotStyle={styles.dotStyle}
              activeDotStyle={styles.activeDotStyle}
              containerStyle={styles.paginationContainer}
              onPress={onPressPagination}
            />
          </View>
        )}

        <View style={styles.wishContainer}>
          <Tile
            imageSource={{ uri: wish.imageUrl }}
            title={wish.title}
            subtitle={wish.artist}
            metadata={`${wish.style} • ${wish.level}`}
            onPress={() => console.log("Navigate to class")}
          />
          <View style={styles.descriptionContainer}>
            <ThemedText>{wish.description}</ThemedText>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    marginTop: rt.insets.top + theme.gap(1),
  },
  contentContainer: {
    flex: 1,
    gap: theme.gap(2),
    padding: theme.gap(2),
  },
  headerContainer: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.gap(2),
    position: "relative",
  },
  backButton: {
    position: "absolute",
    left: theme.gap(1),
    justifyContent: "center",
    alignItems: "center",
  },
  carousel: {
    width: "100%",
  },
  carouselItem: {
    padding: theme.gap(1),
    justifyContent: "center",
    alignItems: "center",
  },
  paginationContainer: {
    gap: theme.gap(1),
    marginTop: -theme.gap(2),
  },
  dotStyle: {
    backgroundColor: theme.colors.dimmed,
    borderRadius: 999,
  },
  activeDotStyle: {
    backgroundColor: theme.colors.typography,
    borderRadius: 999,
  },
  descriptionContainer: {
    height: theme.gap(12),
    padding: theme.gap(1),
    backgroundColor: theme.colors.foreground,
    borderRadius: theme.gap(2),
  },
  wishContainer: {
    gap: theme.gap(1),
  },
}));
