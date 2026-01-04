import { ProjectEnrichedType } from "@/types";
import * as React from "react";
import { Dimensions, View } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import RNCarousel, {
  ICarouselInstance,
  Pagination,
} from "react-native-reanimated-carousel";
import { StyleSheet } from "react-native-unistyles";
import { ProjectCard } from "./project-card";

const { width: screenWidth } = Dimensions.get("window");

interface CarouselProps {
  data: ProjectEnrichedType[];
}

export const Carousel: React.FunctionComponent<CarouselProps> = ({ data }) => {
  const ref = React.useRef<ICarouselInstance>(null);
  const progress = useSharedValue<number>(0);
  const carouselSize = screenWidth * 0.9; // 90% of screen width
  const offset = carouselSize * 0.15;

  if (!data || data.length === 0) return null;

  return (
    <View>
      <RNCarousel
        ref={ref}
        loop={true}
        width={carouselSize}
        height={carouselSize}
        snapEnabled={true}
        pagingEnabled={true}
        data={data}
        onProgressChange={progress}
        style={styles.carousel}
        mode="parallax"
        modeConfig={{
          parallaxScrollingScale: 0.95,
          parallaxScrollingOffset: offset,
          parallaxAdjacentItemScale: 0.8,
        }}
        onSnapToItem={(index: number) => {}}
        renderItem={({ item }: { item: ProjectEnrichedType }) => (
          <View style={styles.carouselItem}>
            <ProjectCard data={item} />
          </View>
        )}
      />
      <Pagination.Basic
        progress={progress}
        data={data}
        dotStyle={styles.dotStyle}
        activeDotStyle={styles.activeDotStyle}
        containerStyle={styles.dotContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  carousel: {
    alignSelf: "center",
  },
  carouselItem: {
    padding: theme.gap(1),
    alignSelf: "center",
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
