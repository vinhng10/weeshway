import * as React from "react";
import { Dimensions, View } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import RNCarousel, {
  ICarouselInstance,
  Pagination,
} from "react-native-reanimated-carousel";
import { StyleSheet } from "react-native-unistyles";

const { width: screenWidth } = Dimensions.get("window");

interface CarouselProps<T> {
  data: T[];
  renderItem: (item: T) => React.ReactElement;
  width?: number;
  height?: number;
  onSnapToItem?: (index: number) => void;
  parallaxScrollingScale?: number;
  parallaxScrollingOffset?: number;
  parallaxAdjacentItemScale?: number;
}

export function Carousel<T>({
  data,
  renderItem,
  width,
  height,
  onSnapToItem,
  parallaxScrollingScale,
  parallaxScrollingOffset,
  parallaxAdjacentItemScale,
}: CarouselProps<T>) {
  const ref = React.useRef<ICarouselInstance>(null);
  const progress = useSharedValue<number>(0);
  const carouselWidth = width ?? screenWidth * 0.9;
  const carouselHeight = height ?? carouselWidth;
  const offset = carouselWidth * 0.17;

  if (!data || data.length === 0) return null;

  return (
    <View>
      <RNCarousel
        ref={ref}
        loop={true}
        width={carouselWidth}
        height={carouselHeight}
        snapEnabled={true}
        pagingEnabled={true}
        data={data}
        onProgressChange={progress}
        onSnapToItem={onSnapToItem}
        style={styles.carousel}
        mode="parallax"
        modeConfig={{
          parallaxScrollingScale: parallaxScrollingScale ?? 0.9,
          parallaxScrollingOffset: parallaxScrollingOffset ?? offset,
          parallaxAdjacentItemScale: parallaxAdjacentItemScale ?? 0.8,
        }}
        renderItem={({ item }: { item: T }) => (
          <View style={styles.carouselItem}>{renderItem(item)}</View>
        )}
      />
      <Pagination.Basic
        progress={progress}
        data={data as object[]}
        dotStyle={styles.dotStyle}
        activeDotStyle={styles.activeDotStyle}
        containerStyle={styles.dotContainer}
      />
    </View>
  );
}

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
