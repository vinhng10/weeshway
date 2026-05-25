import { Image } from "expo-image";
import { useState } from "react";
import { Modal, Pressable, useWindowDimensions } from "react-native";
import { StyleSheet } from "react-native-unistyles";

interface PhotoProps {
  source: string | null;
}

export function Photo({ source }: PhotoProps) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const { width, height } = useWindowDimensions();

  return (
    <>
      <Pressable
        style={styles.container}
        onPress={() => source && setViewerOpen(true)}
        disabled={!source}
      >
        {source && <Image source={source} style={styles.container} />}
      </Pressable>

      <Modal
        visible={viewerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setViewerOpen(false)}
        statusBarTranslucent
      >
        <Pressable style={styles.backdrop} onPress={() => setViewerOpen(false)}>
          <Image
            source={source}
            style={{ width, height }}
            contentFit="contain"
          />
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    height: theme.gap(24),
    aspectRatio: 9 / 16,
    borderRadius: theme.gap(2),
    backgroundColor: theme.colors.foreground,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
}));
