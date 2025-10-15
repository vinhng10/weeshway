import { Directory, File, Paths } from "expo-file-system";
import Storage from "expo-native-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { IItem } from "../types";

type ProjectSources = { [type: string]: string | null };
type ProjectItems = { [type: string]: IItem[] };

export interface IProject {
  id: string;
  name: string;
  items: ProjectItems;
  sources: ProjectSources;
}

interface IProjectState {
  projects: IProject[];
  addProject: (name: string) => string;
  removeProject: (projectId: string) => void;
  initialize: (projectId: string, type: string, duration: number) => void;
  split: (projectId: string, type: string, splitTime: number) => void;
  merge: (projectId: string, type: string) => void;
  setSelected: (projectId: string, type: string, index: number) => void;
  getSelected: (projectId: string, type: string) => IItem[];
  setSelectedByIndices: (
    projectId: string,
    type: string,
    indices: number[]
  ) => void;
  setSource: (projectId: string, type: string, uri: string) => void;
}

const createProject = (name: string): IProject => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
  name,
  items: { music: [], count: [] },
  sources: { music: null, count: null },
});

const updateProject = (
  projects: IProject[],
  projectId: string,
  updater: (project: IProject) => IProject
) =>
  projects.map((project) =>
    project.id === projectId ? updater(project) : project
  );

export const useItemStore = create<IProjectState>()(
  persist(
    (set, get) => ({
      projects: [],
      addProject: (name: string) => {
        const project = createProject(name);
        set((state) => ({
          projects: [...state.projects, project],
        }));
        return project.id;
      },
      removeProject: (projectId: string) => {
        set((state) => ({
          projects: state.projects.filter((project) => project.id !== projectId),
        }));
      },
      initialize: (projectId: string, type: string, duration: number) => {
        set((state) => ({
          projects: updateProject(state.projects, projectId, (project) => ({
            ...project,
            items: {
              ...project.items,
              [type]: [
                {
                  startTime: 0,
                  endTime: duration,
                  selected: false,
                },
              ],
            },
          })),
        }));
      },
      split: (projectId: string, type: string, time: number) => {
        const project = get().projects.find((p) => p.id === projectId);
        if (!project) return;
        const items = project.items[type] || [];

        const itemIndex = items.findIndex(
          (seg) => time > seg.startTime && time < seg.endTime
        );
        if (itemIndex === -1) return;
        const itemToSplit = items[itemIndex];

        const newItems = [...items];
        newItems.splice(
          itemIndex,
          1,
          {
            startTime: itemToSplit.startTime,
            endTime: time,
            selected: false,
          },
          {
            startTime: time,
            endTime: itemToSplit.endTime,
            selected: false,
          }
        );

        set((state) => ({
          projects: updateProject(state.projects, projectId, (proj) => ({
            ...proj,
            items: {
              ...proj.items,
              [type]: newItems,
            },
          })),
        }));
      },
      merge: (projectId: string, type: string) => {
        const project = get().projects.find((p) => p.id === projectId);
        if (!project) return;
        const items = project.items[type] || [];

        const selectedIndices = items
          .map((item, index) => (item.selected ? index : -1))
          .filter((index) => index !== -1)
          .sort((a, b) => a - b);

        if (selectedIndices.length < 2) return;

        for (let i = 1; i < selectedIndices.length; i++)
          if (selectedIndices[i] !== selectedIndices[i - 1] + 1) return;

        const firstIndex = selectedIndices[0];
        const lastIndex = selectedIndices[selectedIndices.length - 1];
        const itemsToMerge = items.slice(firstIndex, lastIndex + 1);

        const merged: IItem = {
          startTime: itemsToMerge[0].startTime,
          endTime: itemsToMerge[itemsToMerge.length - 1].endTime,
          selected: true,
        };

        const newItems = [
          ...items.slice(0, firstIndex),
          merged,
          ...items.slice(lastIndex + 1),
        ];

        set((state) => ({
          projects: updateProject(state.projects, projectId, (proj) => ({
            ...proj,
            items: {
              ...proj.items,
              [type]: newItems,
            },
          })),
        }));
      },
      setSelectedByIndices: (
        projectId: string,
        type: string,
        indices: number[]
      ) =>
        set((state) => ({
          projects: updateProject(state.projects, projectId, (project) => ({
            ...project,
            items: {
              ...project.items,
              [type]: (project.items[type] || []).map((item, index) => ({
                ...item,
                selected: indices.includes(index),
              })),
            },
          })),
        })),
      setSelected: (projectId: string, type: string, index: number) =>
        set((state) => ({
          projects: updateProject(state.projects, projectId, (project) => ({
            ...project,
            items: {
              ...project.items,
              [type]: (project.items[type] || []).map((item, i) =>
                i === index ? { ...item, selected: !item.selected } : item
              ),
            },
          })),
        })),
      getSelected: (projectId: string, type: string) => {
        const project = get().projects.find((p) => p.id === projectId);
        if (!project) return [];
        return (project.items[type] || []).filter((item) => item.selected);
      },
      setSource: async (projectId: string, type: string, uri: string) => {
        const project = get().projects.find((p) => p.id === projectId);
        if (!project) return;

        const sourceFile = new File(uri);
        const { md5 } = sourceFile.info({ md5: true });

        const appDir = new Directory(Paths.document, "audio_files");

        if (!appDir.exists) {
          appDir.create({ intermediates: true });
        }

        const uniqueName = `${md5}.${uri.split(".").pop()}`;
        const destinationFile = new File(appDir, uniqueName);

        if (!destinationFile.exists) {
          sourceFile.copy(destinationFile);
        }

        const shouldKeepItems =
          destinationFile.uri === (project.sources[type] || null);
        const newItems = shouldKeepItems ? project.items[type] : [];

        set((state) => ({
          projects: updateProject(state.projects, projectId, (proj) => ({
            ...proj,
            sources: {
              ...proj.sources,
              [type]: destinationFile.uri,
            },
            items: {
              ...proj.items,
              [type]: newItems,
            },
          })),
        }));
      },
    }),
    {
      name: "item-storage",
      storage: createJSONStorage(() => Storage),
      partialize: (state) => ({
        projects: state.projects,
      }),
    }
  )
);
