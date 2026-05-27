import { ITaskRepository } from '../repositories/ITaskRepository';

/**
 * DeleteTaskUseCase — Orchestrates deleting a task.
 */
export class DeleteTaskUseCase {
  constructor(private taskRepository: ITaskRepository) {}

  async execute(taskId: string): Promise<void> {
    return this.taskRepository.deleteTask(taskId);
  }
}
