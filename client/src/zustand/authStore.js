import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '../api/apiFunctions.js';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      isAuthenticated: false,

      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),

      // Clears state only — no API call. Used by the axios interceptor to
      // avoid triggering another request (which would loop back into the interceptor).
      clearAuth: () => set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
     
      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const { data } = await authAPI.login(credentials);
          set({
            user: data.user,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
          return { success: true };
        } catch (err) {
          console.error('Login failed',err);
          
          set({ isLoading: false });
          return { success: false, error: err.response?.data?.error || 'Login failed' };
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const { data: res } = await authAPI.register(data);
          set({
            user: res.user,
            accessToken: res.accessToken,
            refreshToken: res.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
          return { success: true };
        } catch (err) {
          set({ isLoading: false });
          return { success: false, error: err.response?.data?.error || 'Registration failed' };
        }
      },


      // Full logout — fires the API call to invalidate server-side session,
      // then clears local state. Only called by user action (clicking logout),
      // never by the axios interceptor.
      logout: async () => {
         const token = get().accessToken;
        if (token) {
          try { await authAPI.logout(); } catch (err) {console.error(err);
          }
        }
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },

      updateUser: (updates) => set((state) => ({ user: { ...state.user, ...updates } })),

      fetchMe: async () => {
        try {
          const { data } = await authAPI.getMe();
          set({ user: data.user, isAuthenticated: true });
        } catch (err) {
            console.log(err);
            
          set({ user: null, isAuthenticated: false, accessToken: null, refreshToken: null });
        }
      },
    }),
    {
      name: 'teamflow-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);