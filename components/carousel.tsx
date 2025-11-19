import { ClassCard } from "@/components/class-card";
import { ProjectEnrichedType } from "@/types";
import * as React from "react";
import { View } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import RNCarousel, {
  ICarouselInstance,
  Pagination,
} from "react-native-reanimated-carousel";
import { StyleSheet } from "react-native-unistyles";

interface CarouselProps {
  data: ProjectEnrichedType[];
  onBook?: any;
  onPress?: any;
}

export const Carousel: React.FunctionComponent<CarouselProps> = ({
  data,
  onBook,
  onPress,
}) => {
  const ref = React.useRef<ICarouselInstance>(null);
  const progress = useSharedValue<number>(0);

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <View>
      <RNCarousel
        ref={ref}
        loop={true}
        width={360}
        height={360}
        snapEnabled={true}
        pagingEnabled={true}
        data={data}
        onProgressChange={progress}
        style={styles.carousel}
        mode="parallax"
        modeConfig={{
          parallaxScrollingScale: 1.0,
          parallaxScrollingOffset: 45,
          parallaxAdjacentItemScale: 0.8,
        }}
        onSnapToItem={(index: number) => {}}
        renderItem={({ item }: { item: ProjectEnrichedType }) => (
          <View style={styles.carouselItem}>
            <ClassCard data={item} onBook={onBook} onPress={onPress} />
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
    width: "100%",
    justifyContent: "center",
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
