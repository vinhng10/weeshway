import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface IDisplayAreaProps {
  recognizing: boolean;
  transcript: string;
}

export const DisplayArea: React.FC<IDisplayAreaProps> = ({
  recognizing,
  transcript,
}) => {
  return (
    <View style={styles.displayArea}>
      <Text style={styles.text}>Placeholder</Text>
      {recognizing && (
        <View style={styles.transcriptBox}>
          <Text style={styles.transcriptText}>
            {transcript || "Listening..."}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  displayArea: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  transcriptBox: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    backgroundColor: "rgba(0,0,0,0.8)",
    maxWidth: "90%",
  },
  transcriptText: {
    color: "white",
    fontSize: 16,
  },
});
