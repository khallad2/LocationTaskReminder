/**
 * TaskRepositoryImpl — Implements ITaskRepository by delegating
 * to FirestoreTaskDataSource. Encodes geohash before creation.
 */
import { Task, GeoPoint } from '../../domain/entities/Task';
import { ITaskRepository } from '../../domain/repositories/ITaskRepository';
import { FirestoreTaskDataSource } from '../datasources/firebase/FirestoreTaskDataSource';
import { GeohashService } from '../services/GeohashService';

export class TaskRepositoryImpl implements ITaskRepository {
  private dataSource = new FirestoreTaskDataSource();
  private geohashService = new GeohashService();

  async createTask(task: Omit<Task, 'id'>): Promise<Task> {
    // Ensure geohash is computed
    const geohash = this.geohashService.encode(task.location);
    return this.dataSource.create({ ...task, geohash });
  }

  async getTasksByUser(userId: string): Promise<Task[]> {
    return this.dataSource.getByUser(userId);
  }

  async getNearbyTasks(userId: string, center: GeoPoint, radiusKm: number): Promise<Task[]> {
    return this.dataSource.getNearby(userId, center, radiusKm);
  }

  async getTaskById(taskId: string): Promise<Task | null> {
    return this.dataSource.getById(taskId);
  }

  async updateTask(task: Task): Promise<void> {
    // Re-encode geohash if location changed
    const geohash = this.geohashService.encode(task.location);
    return this.dataSource.update({ ...task, geohash });
  }

  async deleteTask(taskId: string): Promise<void> {
    return this.dataSource.delete(taskId);
  }

  async completeTask(taskId: string): Promise<void> {
    return this.dataSource.complete(taskId);
  }
}
