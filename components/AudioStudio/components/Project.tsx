import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import {
  GestureResponderEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { IProject } from "../hooks/useState";

interface ProjectProps {
  project: IProject;
  onOpen: (projectId: string) => void;
  onPlay: (projectId: string, type: "music" | "count") => void;
  onDelete: (projectId: string) => void;
}

export const Project = ({
  project,
  onOpen,
  onPlay,
  onDelete,
}: ProjectProps) => {
  const handlePlay =
    (type: "music" | "count") => (event: GestureResponderEvent) => {
      event.stopPropagation();
      onPlay(project.id, type);
    };

  const handleDelete = (event: GestureResponderEvent) => {
    event.stopPropagation();
    onDelete(project.id);
  };

  return (
    <TouchableOpacity
      style={styles.projectItem}
      onPress={() => onOpen(project.id)}
      activeOpacity={0.8}
    >
      <View style={styles.projectInfo}>
        <Text style={styles.projectName}>{project.name}</Text>
        <Text style={styles.projectMeta}>
          {`${project.items.music?.length ?? 0} music segments · ${
            project.items.count?.length ?? 0
          } count segments`}
        </Text>
      </View>
      <View style={styles.projectActions}>
        <TouchableOpacity style={styles.iconButton} onPress={handlePlay("music")}>
          <Ionicons name="musical-notes" size={22} color="#FFD700" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={handlePlay("count")}>
          <Ionicons name="mic" size={22} color="#00BFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={handleDelete}>
          <Ionicons name="trash" size={22} color="#FF6B6B" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  projectItem: {
    backgroundColor: "#1b1b1b",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 6,
  },
  projectMeta: {
    fontSize: 14,
    color: "#b5b5b5",
  },
  projectActions: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
  },
  iconButton: {
    marginLeft: 12,
    padding: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
});
