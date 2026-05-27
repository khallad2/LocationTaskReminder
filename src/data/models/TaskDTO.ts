import { Task, TaskCategory, TaskStatus, GeoPoint } from '../../domain/entities/Task';

/**
 * TaskDTO — Data Transfer Object mapping between Firestore documents
 * and domain entities. Handles timestamp conversion.
 */
export interface TaskDTO {
  userId: string;
  title: string;
  description: string;
  locationName: string;
  lat: number;
  lng: number;
  geohash: string;
  reminderRadiusMeters: number;
  category: TaskCategory;
  status: TaskStatus;
  dueDate?: number | null; // epoch ms
  createdAt: number;       // epoch ms
  updatedAt: number;       // epoch ms
}

export function toTask(id: string, dto: TaskDTO): Task {
  return {
    id,
    userId: dto.userId,
    title: dto.title,
    description: dto.description,
    locationName: dto.locationName,
    location: { latitude: dto.lat, longitude: dto.lng },
    reminderRadiusMeters: dto.reminderRadiusMeters,
    category: dto.category,
    status: dto.status,
    dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
  };
}

export function toDTO(task: Omit<Task, 'id'>, geohash: string): TaskDTO {
  return {
    userId: task.userId,
    title: task.title,
    description: task.description,
    locationName: task.locationName,
    lat: task.location.latitude,
    lng: task.location.longitude,
    geohash,
    reminderRadiusMeters: task.reminderRadiusMeters,
    category: task.category,
    status: task.status,
    dueDate: task.dueDate ? task.dueDate.getTime() : null,
    createdAt: task.createdAt.getTime(),
    updatedAt: task.updatedAt.getTime(),
  };
}
