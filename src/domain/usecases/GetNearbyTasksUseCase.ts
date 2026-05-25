import { Task, GeoPoint } from '../entities/Task';
import { ITaskRepository } from '../repositories/ITaskRepository';
import { ILocationRepository } from '../repositories/ILocationRepository';

/**
 * GetNearbyTasksUseCase — Gets current location, queries tasks
 * within radius, and returns sorted by distance.
 */
export class GetNearbyTasksUseCase {
  constructor(
    private taskRepository: ITaskRepository,
    private locationRepository: ILocationRepository,
  ) {}

  async execute(userId: string, radiusKm: number = 5): Promise<Task[]> {
    const location = await this.locationRepository.getCurrentLocation();
    const center: GeoPoint = {
      latitude: location.latitude,
      longitude: location.longitude,
    };
    return this.taskRepository.getNearbyTasks(userId, center, radiusKm);
  }
}
