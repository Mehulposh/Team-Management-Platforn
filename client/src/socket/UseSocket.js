import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../zustand/authStore.js';
import { useBoardStore } from '../zustand/boardStore.js';
import { useNotificationStore } from '../zustand/notificationStore.js';

let socketInstance = null;

export const useSocket = (projectId) => {
  const accessToken = useAuthStore((s) => s.accessToken);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { handleTaskCreated, handleTaskUpdated, handleTaskDeleted } = useBoardStore();
  const { addNew: addNotification } = useNotificationStore();
  const connected = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    if (!socketInstance) {
      socketInstance = io('/', {
        auth: { token: accessToken },
        transports: ['websocket', 'polling'],
      });
    }

    const socket = socketInstance;

    socket.on('connect', () => {
      connected.current = true;
      if (projectId) socket.emit('project:join', projectId);
    });

    socket.on('disconnect', () => { connected.current = false; });

    // Board events
    socket.on('task:created', ({ task }) => handleTaskCreated(task));
    socket.on('task:updated', ({ task }) => handleTaskUpdated(task));
    socket.on('task:deleted', ({ taskId }) => handleTaskDeleted(taskId));

    // Notifications
    socket.on('notification:new', (notification) => addNotification(notification));

    return () => {
      if (projectId) socket.emit('project:leave', projectId);
      socket.off('task:created');
      socket.off('task:updated');
      socket.off('task:deleted');
      socket.off('notification:new');
    };
  }, [isAuthenticated, accessToken, projectId]);

  return socketInstance;
};

export const getSocket = () => socketInstance;

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};