import { create } from 'zustand';
import { workspacesAPI, projectsAPI } from '../api/apiFunctions.js';

export const useWorkspaceStore = create((set, get) => ({
  workspaces: [],
  activeWorkspace: null,
  projects: [],
  activeProject: null,
  isLoading: false,

  fetchWorkspaces: async () => {
    set({ isLoading: true });
    try {
      const { data } = await workspacesAPI.getAll();
      set({ workspaces: data.workspaces, isLoading: false });
      // Auto-select first
      if (!get().activeWorkspace && data.workspaces.length > 0) {
        get().setActiveWorkspace(data.workspaces[0]);
      }
    } catch (err) { 
        console.log(err);
        
        set({ isLoading: false }); 
    }
  },

  setActiveWorkspace: async (workspace) => {
    set({ activeWorkspace: workspace, activeProject: null, projects: [] });
    if (workspace) {
      await get().fetchProjects(workspace._id);
    }
  },

  createWorkspace: async (data) => {
    const { data: res } = await workspacesAPI.create(data);
    set((state) => ({ workspaces: [...state.workspaces, res.workspace] }));
    get().setActiveWorkspace(res.workspace);
    return res.workspace;
  },

  fetchProjects: async (workspaceId) => {
    try {
      const { data } = await projectsAPI.getAll(workspaceId);
      set({ projects: data.projects });
      if (!get().activeProject && data.projects.length > 0) {
        set({ activeProject: data.projects[0] });
      }
    } catch (err) {
        console.log(err);
        
    }
  },

  setActiveProject: (project) => set({ activeProject: project }),

  createProject: async (data) => {
    const { data: res } = await projectsAPI.create(data);
    set((state) => ({ projects: [...state.projects, res.project] }));
    set({ activeProject: res.project });
    return res.project;
  },

  updateProject: (id, updates) => {
    set((state) => ({
      projects: state.projects.map((p) => p._id === id ? { ...p, ...updates } : p),
      activeProject: state.activeProject?._id === id ? { ...state.activeProject, ...updates } : state.activeProject,
    }));
  },
}));