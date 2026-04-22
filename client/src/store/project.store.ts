import { create } from "zustand";
import type { Project } from "../types";

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;

  setProjects: (projects: Project[]) => void;
  setCurrentProject: (project: Project | null) => void;
  addProject: (project: Project) => void;
  updateProject: (project: Project) => void;
  removeProject: (projectId: string) => void;
  updateProjectMembers: (projectId: string, members: Project["members"]) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  currentProject: null,

  setProjects: (projects) => set({ projects }),

  setCurrentProject: (project) => set({ currentProject: project }),

  addProject: (project) =>
    set((state) => ({
      projects: state.projects.some((p) => p._id === project._id)
        ? state.projects.map((p) => (p._id === project._id ? project : p))
        : [...state.projects, project],
    })),

  updateProject: (project) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p._id === project._id ? project : p
      ),
      currentProject:
        state.currentProject?._id === project._id ? project : state.currentProject,
    })),

  removeProject: (projectId) =>
    set((state) => ({
      projects: state.projects.filter((p) => p._id !== projectId),
      currentProject:
        state.currentProject?._id === projectId ? null : state.currentProject,
    })),

  updateProjectMembers: (projectId, members) =>
    set((state) => ({
      projects: state.projects.map((project) =>
        project._id === projectId ? { ...project, members } : project
      ),
      currentProject:
        state.currentProject?._id === projectId
          ? { ...state.currentProject, members }
          : state.currentProject,
    })),
}));
