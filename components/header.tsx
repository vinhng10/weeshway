import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

type HeaderProps = {
  title: string;
};

export const Header: React.FunctionComponent<HeaderProps> = ({ title }) => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <IconSymbol name="chevron.left" size={32} color="#FFFFFF" />
      </Pressable>
      <ThemedText bold type="h4">
        {title}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.gap(2),
    paddingVertical: theme.gap(1),
    position: "relative",
  },
  backButton: {
    position: "absolute",
    left: theme.gap(1),
    justifyContent: "center",
    alignItems: "center",
  },
}));
