/**
 * useTaskStore — Zustand store for task management.
 * Dependencies are injected by the DI container.
 */
import { create } from 'zustand';
import { Task, TaskCategory, GeoPoint, createTask } from '../../domain/entities/Task';
import { GetTasksUseCase } from '../../domain/usecases/GetTasksUseCase';
import { GetNearbyTasksUseCase } from '../../domain/usecases/GetNearbyTasksUseCase';
import { CreateTaskUseCase } from '../../domain/usecases/CreateTaskUseCase';
import { CompleteTaskUseCase } from '../../domain/usecases/CompleteTaskUseCase';
import { DeleteTaskUseCase } from '../../domain/usecases/DeleteTaskUseCase';

export interface TaskStoreDeps {
  getTasksUseCase: GetTasksUseCase | null;
  getNearbyTasksUseCase: GetNearbyTasksUseCase | null;
  createTaskUseCase: CreateTaskUseCase | null;
  completeTaskUseCase: CompleteTaskUseCase | null;
  deleteTaskUseCase: DeleteTaskUseCase | null;
}

interface TaskState extends TaskStoreDeps {
  tasks: Task[];
  nearbyTasks: Task[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchTasks: (userId: string) => Promise<void>;
  fetchNearbyTasks: (userId: string, radiusKm?: number) => Promise<void>;
  addTask: (params: {
    userId: string;
    title: string;
    description: string;
    locationName: string;
    location: GeoPoint;
    reminderRadiusMeters: number;
    category: TaskCategory;
    dueDate?: Date;
  }) => Promise<boolean>;
  completeTask: (taskId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  clearError: () => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  // Dependencies (injected later)
  getTasksUseCase: null,
  getNearbyTasksUseCase: null,
  createTaskUseCase: null,
  completeTaskUseCase: null,
  deleteTaskUseCase: null,

  // State
  tasks: [],
  nearbyTasks: [],
  isLoading: false,
  error: null,

  fetchTasks: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const { getTasksUseCase } = get();
      if (!getTasksUseCase) throw new Error('getTasksUseCase not injected');
      
      const tasks = await getTasksUseCase.execute(userId);
      set({ tasks, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch tasks', isLoading: false });
    }
  },

  fetchNearbyTasks: async (userId, radiusKm = 5) => {
    set({ isLoading: true, error: null });
    try {
      const { getNearbyTasksUseCase } = get();
      if (!getNearbyTasksUseCase) throw new Error('getNearbyTasksUseCase not injected');

      const nearbyTasks = await getNearbyTasksUseCase.execute(userId, radiusKm);
      set({ nearbyTasks, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch nearby tasks', isLoading: false });
    }
  },

  addTask: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const { createTaskUseCase } = get();
      if (!createTaskUseCase) throw new Error('createTaskUseCase not injected');

      const taskData = createTask(params);
      const newTask = await createTaskUseCase.execute(taskData);
      set((state) => ({
        tasks: [newTask, ...state.tasks],
        isLoading: false,
      }));
      return true;
    } catch (err: any) {
      console.error('[useTaskStore] addTask failed:', err);
      set({ error: err.message || 'Failed to add task', isLoading: false });
      return false;
    }
  },

  completeTask: async (taskId) => {
    try {
      const { completeTaskUseCase } = get();
      if (!completeTaskUseCase) throw new Error('completeTaskUseCase not injected');

      await completeTaskUseCase.execute(taskId);
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === taskId ? { ...t, status: 'completed' as const } : t,
        ),
        nearbyTasks: state.nearbyTasks.filter((t) => t.id !== taskId),
      }));
    } catch (err: any) {
      set({ error: err.message || 'Failed to complete task' });
    }
  },

  deleteTask: async (taskId) => {
    try {
      const { deleteTaskUseCase } = get();
      if (!deleteTaskUseCase) throw new Error('deleteTaskUseCase not injected');

      await deleteTaskUseCase.execute(taskId);
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== taskId),
        nearbyTasks: state.nearbyTasks.filter((t) => t.id !== taskId),
      }));
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete task' });
    }
  },

  clearError: () => set({ error: null }),
}));

export const injectTaskStoreDeps = (deps: TaskStoreDeps) => {
  useTaskStore.setState(deps);
};
