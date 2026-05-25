/**
 * useTaskStore — Zustand store for task management.
 */
import { create } from 'zustand';
import { Task, TaskCategory, GeoPoint, createTask } from '../../domain/entities/Task';
import { container } from '../../infrastructure/di/container';
import { GeohashService } from '../../data/services/GeohashService';

const geohashService = new GeohashService();

interface TaskState {
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
  tasks: [],
  nearbyTasks: [],
  isLoading: false,
  error: null,

  fetchTasks: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const tasks = await container.taskRepository.getTasksByUser(userId);
      set({ tasks, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch tasks', isLoading: false });
    }
  },

  fetchNearbyTasks: async (userId, radiusKm = 5) => {
    set({ isLoading: true, error: null });
    try {
      const nearbyTasks = await container.getNearbyTasksUseCase.execute(userId, radiusKm);
      set({ nearbyTasks, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch nearby tasks', isLoading: false });
    }
  },

  addTask: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const geohash = geohashService.encode(params.location);
      const taskData = createTask({ ...params, geohash });
      const newTask = await container.createTaskUseCase.execute(taskData);
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
      await container.completeTaskUseCase.execute(taskId);
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
      await container.taskRepository.deleteTask(taskId);
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
