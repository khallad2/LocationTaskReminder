import { Task, GeoPoint } from '../entities/Task';
import { ITaskRepository } from '../repositories/ITaskRepository';

/**
 * CreateTaskUseCase — Orchestrates task creation with geohash encoding.
 */
export class CreateTaskUseCase {
  constructor(private taskRepository: ITaskRepository) {}

  async execute(task: Omit<Task, 'id'>): Promise<Task> {
    return this.taskRepository.createTask(task);
  }
}
