import { ITaskRepository } from '../repositories/ITaskRepository';

/**
 * CompleteTaskUseCase — Marks a task as completed.
 */
export class CompleteTaskUseCase {
  constructor(private taskRepository: ITaskRepository) {}

  async execute(taskId: string): Promise<void> {
    return this.taskRepository.completeTask(taskId);
  }
}
