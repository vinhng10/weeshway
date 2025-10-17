import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { IProject } from "../hooks/useProjectStore";
import { Project } from "./Project";

interface ProjectListProps {
  projects: IProject[];
  selectedProjectId: string | null;
  musicPlayer: any;
  countPlayer: any;
  onSetSelectedProjectId: (projectId: string | null) => void;
  onSetPendingPlayback: (
    playback: { projectId: string; type: "music" | "count" } | null
  ) => void;
  onSetCurrentItemIndex: (index: number) => void;
  onSetType: (type: "music" | "count") => void;
  addProject: (name: string) => string;
  removeProject: (projectId: string) => void;
}

export const ProjectList = ({
  projects,
  selectedProjectId,
  musicPlayer,
  countPlayer,
  onSetSelectedProjectId,
  onSetPendingPlayback,
  onSetCurrentItemIndex,
  onSetType,
  addProject,
  removeProject,
}: ProjectListProps) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  const pausePlayers = () => {
    try {
      musicPlayer.pause();
    } catch {}
    try {
      countPlayer.pause();
    } catch {}
  };

  const handleOpenProject = (project: IProject) => {
    pausePlayers();
    onSetSelectedProjectId(project.id);
    onSetPendingPlayback(null);
    onSetCurrentItemIndex(0);
  };

  const handlePlayProject = (
    project: IProject,
    playbackType: "music" | "count"
  ) => {
    if (!project.sources[playbackType]) {
      Alert.alert(
        "Audio not loaded",
        `Load a ${
          playbackType === "music" ? "music" : "count"
        } track before playing.`
      );
      return;
    }
    pausePlayers();
    onSetSelectedProjectId(project.id);
    onSetType(playbackType);
    onSetPendingPlayback({ projectId: project.id, type: playbackType });
  };

  const handleDeleteProject = (project: IProject) => {
    Alert.alert(
      "Delete Project",
      `Are you sure you want to delete "${project.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            pausePlayers();
            if (selectedProjectId === project.id) {
              onSetSelectedProjectId(null);
              onSetPendingPlayback(null);
            }
            removeProject(project.id);
          },
        },
      ]
    );
  };

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
    onSetSelectedProjectId(projectId);
  };

  return (
    <View style={styles.projectListWrapper}>
      <View style={styles.projectListHeader}>
        <Text style={styles.projectListTitle}>Projects</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateProject}
        >
          <Ionicons name="add" size={20} color="#ffffff" />
          <Text style={styles.createButtonText}>New Project</Text>
        </TouchableOpacity>
      </View>
      {projects.length === 0 ? (
        <View style={styles.emptyState}>
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
        </View>
      ) : (
        <FlatList
          data={projects}
          renderItem={({ item }) => (
            <Project
              project={item}
              onOpen={handleOpenProject}
              onPlay={handlePlayProject}
              onDelete={handleDeleteProject}
            />
          )}
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
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Project</Text>
            <TextInput
              style={styles.modalInput}
              value={newProjectName}
              onChangeText={setNewProjectName}
              placeholder="Project name"
              placeholderTextColor="#999999"
              autoFocus
            />
            <View style={styles.modalActions}>
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
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  projectListWrapper: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    backgroundColor: "#0f0f0f",
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
});
