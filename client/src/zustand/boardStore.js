import { create } from 'zustand';
import { boardsAPI, tasksAPI } from '../api';

export const useBoardStore = create((set, get) => ({
  board: null,
  columns: [],
  tasksByColumn: {},
  isLoading: false,
  selectedTask: null,

  fetchBoard: async (projectId) => {
    set({ isLoading: true });
    try {
      const { data } = await boardsAPI.getByProject(projectId);
      set({
        board: data.board,
        columns: [...data.board.columns].sort((a, b) => a.order - b.order),
        tasksByColumn: data.tasks,
        isLoading: false,
      });
    } catch (err) { 
        console.log(err);
        
        set({ isLoading: false }); 
    }
  },

  // Optimistic drag-drop move
  moveTask: async ({ taskId, fromColumnId, toColumnId, newIndex }) => {
    const state = get();
    const fromTasks = [...(state.tasksByColumn[fromColumnId] || [])];
    const toTasks = fromColumnId === toColumnId ? fromTasks : [...(state.tasksByColumn[toColumnId] || [])];

    const taskIndex = fromTasks.findIndex((t) => t._id === taskId);
    if (taskIndex === -1) return;
    const [task] = fromTasks.splice(taskIndex, 1);

    if (fromColumnId === toColumnId) {
      fromTasks.splice(newIndex, 0, task);
      set((state) => ({
        tasksByColumn: { ...state.tasksByColumn, [fromColumnId]: fromTasks },
      }));
    } else {
      toTasks.splice(newIndex, 0, { ...task, columnId: toColumnId });
      set((state) => ({
        tasksByColumn: {
          ...state.tasksByColumn,
          [fromColumnId]: fromTasks,
          [toColumnId]: toTasks,
        },
      }));
    }

    // Re-assign order values
    const moves = [];
    const updatedCols = fromColumnId === toColumnId ? [fromColumnId] : [fromColumnId, toColumnId];
    updatedCols.forEach((colId) => {
      const tasks = get().tasksByColumn[colId] || [];
      tasks.forEach((t, i) => moves.push({ taskId: t._id, columnId: colId, order: i }));
    });

    try {
      await tasksAPI.reorder({ projectId: state.board.project, moves });
    } catch (err) {
        console.log(err);
        
      // Rollback on error
      get().fetchBoard(state.board.project);
    }
  },

  createTask: async (data) => {
    const { data: res } = await tasksAPI.create(data);
    const colId = res.task.columnId;
    set((state) => ({
      tasksByColumn: {
        ...state.tasksByColumn,
        [colId]: [...(state.tasksByColumn[colId] || []), res.task],
      },
    }));
    return res.task;
  },

  updateTask: (taskId, updates) => {
    set((state) => {
      const newByColumn = { ...state.tasksByColumn };
      for (const colId of Object.keys(newByColumn)) {
        newByColumn[colId] = newByColumn[colId].map((t) =>
          t._id === taskId ? { ...t, ...updates } : t
        );
      }
      return { tasksByColumn: newByColumn };
    });
  },

  deleteTask: async (taskId, columnId) => {
    set((state) => ({
      tasksByColumn: {
        ...state.tasksByColumn,
        [columnId]: (state.tasksByColumn[columnId] || []).filter((t) => t._id !== taskId),
      },
    }));
    await tasksAPI.delete(taskId);
  },

  // Handle inbound socket events
  handleTaskCreated: (task) => {
    const colId = task.columnId;
    set((state) => ({
      tasksByColumn: {
        ...state.tasksByColumn,
        [colId]: [...(state.tasksByColumn[colId] || []), task],
      },
    }));
  },

  handleTaskUpdated: (task) => {
    get().updateTask(task._id, task);
  },

  handleTaskDeleted: (taskId) => {
    set((state) => {
      const newByColumn = { ...state.tasksByColumn };
      for (const colId of Object.keys(newByColumn)) {
        newByColumn[colId] = newByColumn[colId].filter((t) => t._id !== taskId);
      }
      return { tasksByColumn: newByColumn };
    });
  },

  setSelectedTask: (task) => set({ selectedTask: task }),

  addColumn: async (boardId, data) => {
    const { data: res } = await boardsAPI.addColumn(boardId, data);
    set({ columns: [...res.board.columns].sort((a, b) => a.order - b.order) });
  },
}));