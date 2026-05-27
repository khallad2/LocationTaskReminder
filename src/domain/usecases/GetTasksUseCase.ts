import { Task } from '../entities/Task';
import { ITaskRepository } from '../repositories/ITaskRepository';

/**
 * GetTasksUseCase — Orchestrates retrieving tasks for a specific user.
 */
export class GetTasksUseCase {
  constructor(private taskRepository: ITaskRepository) {}

  async execute(userId: string): Promise<Task[]> {
    return this.taskRepository.getTasksByUser(userId);
  }
}
