import { ThemedView } from "@/components/themed-view";
import type { IProject } from "@/hooks/useProjectStore";
import { useProjectStore } from "@/hooks/useProjectStore";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { StyleSheet } from "react-native-unistyles";

const ProjectItem = ({ project }: { project: IProject }) => {
  const removeProject = useProjectStore((state) => state.removeProject);
  const router = useRouter();

  const handleOpenProject = () => {
    router.push({
      pathname: "/(tabs)/project/[projectId]",
      params: { projectId: project.id },
    });
  };

  const handlePlayProject = (type: "music" | "count") => {
    if (!project.sources[type]) {
      Alert.alert(
        "Audio not loaded",
        `Load a ${type === "music" ? "music" : "count"} track before playing.`
      );
      return;
    }
    router.push({
      pathname: "/(tabs)/project/[projectId]",
      params: {
        projectId: project.id,
        type,
        autoplay: "1",
      },
    });
  };

  const handleDeleteProject = () => {
    Alert.alert(
      "Delete Project",
      `Are you sure you want to delete "${project.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            removeProject(project.id);
          },
        },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={styles.projectItem}
      onPress={() => handleOpenProject()}
      activeOpacity={0.8}
    >
      <ThemedView style={styles.projectInfo}>
        <Text style={styles.projectName}>{project.name}</Text>
        <Text style={styles.projectMeta}>
          {`${project.items.music?.length ?? 0} music segments · ${
            project.items.count?.length ?? 0
          } count segments`}
        </Text>
      </ThemedView>
      <ThemedView style={styles.projectActions}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => handlePlayProject("music")}
        >
          <MaterialIcons name="music-note" size={22} color="#FFD700" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => handlePlayProject("count")}
        >
          <MaterialIcons
            name="format-list-numbered"
            size={22}
            color="#00BFFF"
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleDeleteProject}
        >
          <Ionicons name="trash" size={22} color="#FF6B6B" />
        </TouchableOpacity>
      </ThemedView>
    </TouchableOpacity>
  );
};

export default function ProjectListScreen() {
  const projects = useProjectStore((state) => state.projects);
  const addProject = useProjectStore((state) => state.addProject);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const router = useRouter();

  const handleCreateProject = () => {
    setNewProjectName("");
    setShowCreateModal(true);
  };

  const handleSubmitProject = () => {
    const trimmed = newProjectName.trim();
    if (!trimmed) {
      Alert.alert("Invalid name", "Please enter a project name.");
      return;
    }
    const projectId = addProject(trimmed);
    setShowCreateModal(false);
    setNewProjectName("");
    router.push({
      pathname: "/(tabs)/project/[projectId]",
      params: { projectId },
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedView style={styles.projectListHeader}>
        <Text style={styles.projectListTitle}>Projects</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateProject}
        >
          <Ionicons name="add" size={20} color="#ffffff" />
          <Text style={styles.createButtonText}>New Project</Text>
        </TouchableOpacity>
      </ThemedView>
      {projects.length === 0 ? (
        <ThemedView style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>No projects yet</Text>
          <Text style={styles.emptyStateSubtitle}>
            Create your first project to start editing audio.
          </Text>
          <TouchableOpacity
            style={[styles.createButton, styles.emptyCreateButton]}
            onPress={handleCreateProject}
          >
            <Ionicons name="add" size={20} color="#ffffff" />
            <Text style={styles.createButtonText}>Create Project</Text>
          </TouchableOpacity>
        </ThemedView>
      ) : (
        <FlatList
          data={projects}
          renderItem={({ item }) => <ProjectItem project={item} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.projectList}
        />
      )}

      <Modal
        visible={showCreateModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowCreateModal(false)}
      >
        <ThemedView style={styles.modalBackdrop}>
          <ThemedView style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Project</Text>
            <TextInput
              style={styles.modalInput}
              value={newProjectName}
              onChangeText={setNewProjectName}
              placeholder="Project name"
              placeholderTextColor="#999999"
              autoFocus
            />
            <ThemedView style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={handleSubmitProject}
              >
                <Text style={styles.modalButtonText}>Create</Text>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    marginTop: rt.insets.top,
    paddingHorizontal: theme.gap(2),
  },
  projectListHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  projectListTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#ffffff",
  },
  projectList: {
    paddingBottom: 24,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#2b6be6",
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 12,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: "#b5b5b5",
    textAlign: "center",
    marginBottom: 24,
  },
  emptyCreateButton: {
    backgroundColor: "#2b6be6",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    backgroundColor: "#1d1d1d",
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 16,
  },
  modalInput: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333333",
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#ffffff",
    backgroundColor: "#121212",
    fontSize: 16,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 24,
  },
  modalButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    marginLeft: 12,
  },
  modalCancelButton: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  modalConfirmButton: {
    backgroundColor: "#2b6be6",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
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
}));
