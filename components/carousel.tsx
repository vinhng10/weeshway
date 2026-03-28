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
  const offset = carouselSize * 0.17;

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
          parallaxScrollingScale: 0.9,
          parallaxScrollingOffset: offset,
          parallaxAdjacentItemScale: 0.8,
        }}
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
    marginTop: theme.gap(-2),
    alignSelf: "center",
  },
  carouselItem: {
    padding: theme.gap(1),
    alignSelf: "center",
  },
  dotContainer: {
    gap: theme.gap(1),
    marginTop: theme.gap(-2),
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
