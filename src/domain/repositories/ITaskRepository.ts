import { Task, GeoPoint } from '../entities/Task';

/**
 * Task Repository Interface — Domain layer contract.
 * Data layer must implement this without leaking framework details.
 */
export interface ITaskRepository {
  createTask(task: Omit<Task, 'id'>): Promise<Task>;
  getTasksByUser(userId: string): Promise<Task[]>;
  getNearbyTasks(userId: string, center: GeoPoint, radiusKm: number): Promise<Task[]>;
  getTaskById(taskId: string): Promise<Task | null>;
  updateTask(task: Task): Promise<void>;
  deleteTask(taskId: string): Promise<void>;
  completeTask(taskId: string): Promise<void>;
}
