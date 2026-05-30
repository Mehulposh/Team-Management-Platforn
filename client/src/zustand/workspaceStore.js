import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { workspacesAPI, projectsAPI } from '../api/apiFunctions.js';

export const useWorkspaceStore = create(
  persist(
    (set, get) => ({
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

          const current = get().activeWorkspace;

          if (data.workspaces.length === 0) {
            // New user — no workspaces yet, clear everything
            set({ activeWorkspace: null, projects: [], activeProject: null });
          } else if (!current) {
            // Nothing selected yet — auto-pick first
            await get().setActiveWorkspace(data.workspaces[0]);
          } else {
            // Already have one selected — refresh it and reload its projects
            const refreshed = data.workspaces.find((w) => w._id === current._id);
            if (refreshed) {
              set({ activeWorkspace: refreshed });
              await get().fetchProjects(refreshed._id);
            } else {
              // Previously selected workspace no longer accessible
              await get().setActiveWorkspace(data.workspaces[0]);
            }
          }
        } catch (err) {
          console.error(err)
          set({ isLoading: false });
        }
      },

      setActiveWorkspace: async (workspace) => {
        set({ activeWorkspace: workspace, activeProject: null, projects: [] });
        if (workspace?._id) {
          await get().fetchProjects(workspace._id);
        }
      },

      createWorkspace: async (formData) => {
        const { data: res } = await workspacesAPI.create(formData);
        set((state) => ({ workspaces: [...state.workspaces, res.workspace] }));
        await get().setActiveWorkspace(res.workspace);
        return res.workspace;
      },

      fetchProjects: async (workspaceId) => {
        try {
          const { data } = await projectsAPI.getAll(workspaceId);
          set({ projects: data.projects });
          // Only auto-set activeProject if none is selected yet
          if (!get().activeProject && data.projects.length > 0) {
            set({ activeProject: data.projects[0] });
          }
        } catch (err) {
          console.error(err);
          
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
          projects: state.projects.map((p) => (p._id === id ? { ...p, ...updates } : p)),
          activeProject:
            state.activeProject?._id === id
              ? { ...state.activeProject, ...updates }
              : state.activeProject,
        }));
      },
    }),
    {
      name: 'teamflow-workspace',
      // Only persist IDs — full objects are re-fetched on load
      partialize: (state) => ({
        activeWorkspace: state.activeWorkspace
          ? { _id: state.activeWorkspace._id, name: state.activeWorkspace.name, color: state.activeWorkspace.color }
          : null,
      }),
    }
  )
);