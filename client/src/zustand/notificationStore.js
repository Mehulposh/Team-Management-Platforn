import { create } from 'zustand';
import { notificationsAPI } from '../api/apiFunctions.js';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetch: async () => {
    set({ isLoading: true });
    try {
      const { data } = await notificationsAPI.getAll({ limit: 30 });
      set({ notifications: data.notifications, unreadCount: data.unreadCount, isLoading: false });
    } catch (err) { 
        console.log(err);
        
        set({ isLoading: false }); 
    }
  },

  addNew: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  markRead: async (id) => {
    await notificationsAPI.markRead(id);
    set((state) => ({
      notifications: state.notifications.map((n) => n._id === id ? { ...n, isRead: true } : n),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllRead: async () => {
    await notificationsAPI.markAllRead();
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
  },

  remove: async (id) => {
    const n = get().notifications.find((n) => n._id === id);
    await notificationsAPI.delete(id);
    set((state) => ({
      notifications: state.notifications.filter((n) => n._id !== id),
      unreadCount: n && !n.isRead ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
    }));
  },
}));