import { ClassCard } from "@/components/card";
import { ClassType } from "@/types";
import * as React from "react";
import { View } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import Carousel, {
  ICarouselInstance,
  Pagination,
} from "react-native-reanimated-carousel";
import { StyleSheet } from "react-native-unistyles";

interface ClassCarouselProps {
  classes: ClassType[];
  onBook?: (classId: number) => void;
  onPlay?: (classId: number) => void;
}

export const ClassCarousel: React.FunctionComponent<ClassCarouselProps> = ({
  classes,
  onBook,
  onPlay,
}) => {
  const ref = React.useRef<ICarouselInstance>(null);
  const progress = useSharedValue<number>(0);

  const onPressPagination = (index: number) => {
    ref.current?.scrollTo({
      count: index - progress.value,
      animated: true,
    });
  };

  const handleBook = (classId: number) => {
    onBook?.(classId);
  };

  const handlePlay = (classId: number) => {
    onPlay?.(classId);
  };

  if (!classes || classes.length === 0) {
    return null;
  }

  return (
    <View>
      <Carousel
        ref={ref}
        loop={true}
        width={360}
        height={360}
        snapEnabled={true}
        pagingEnabled={true}
        data={classes}
        onProgressChange={progress}
        style={styles.carousel}
        mode="parallax"
        modeConfig={{
          parallaxScrollingScale: 1.0,
          parallaxScrollingOffset: 45,
          parallaxAdjacentItemScale: 0.8,
        }}
        onSnapToItem={(index: number) => console.log("current index:", index)}
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
        data={classes}
        dotStyle={styles.dotStyle}
        activeDotStyle={styles.activeDotStyle}
        containerStyle={styles.dotContainer}
        onPress={onPressPagination}
      />
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  carousel: {
    width: "100%",
  },
  carouselItem: {
    padding: theme.gap(1),
    justifyContent: "center",
    alignItems: "center",
  },
  dotContainer: {
    gap: theme.gap(1),
  },
  dotStyle: {
    backgroundColor: theme.colors.dimmed,
    borderRadius: 999,
  },
  activeDotStyle: {
    backgroundColor: theme.colors.typography,
    borderRadius: 999,
  },
}));
