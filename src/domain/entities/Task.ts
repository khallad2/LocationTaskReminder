/**
 * Task Entity — Pure domain model with no framework dependencies.
 * Represents a location-bound task that triggers reminders
 * when the user is within a specified radius.
 */

export type TaskCategory = 'grocery' | 'personal' | 'routine' | 'work';
export type TaskStatus = 'active' | 'completed' | 'archived';

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  locationName: string;
  location: GeoPoint;
  reminderRadiusMeters: number;
  category: TaskCategory;
  status: TaskStatus;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ── Factory & Validation ──────────────────────────────────────────

export function createTask(params: {
  userId: string;
  title: string;
  description: string;
  locationName: string;
  location: GeoPoint;
  reminderRadiusMeters: number;
  category: TaskCategory;
  dueDate?: Date;
}): Omit<Task, 'id'> {
  validateTitle(params.title);
  validateLocation(params.location);
  validateRadius(params.reminderRadiusMeters);

  const now = new Date();
  return {
    ...params,
    status: 'active' as TaskStatus,
    createdAt: now,
    updatedAt: now,
  };
}

export function validateTitle(title: string): void {
  if (!title || title.trim().length < 2) {
    throw new Error('Task title must be at least 2 characters');
  }
  if (title.length > 200) {
    throw new Error('Task title must be at most 200 characters');
  }
}

export function validateLocation(location: GeoPoint): void {
  if (
    location.latitude < -90 ||
    location.latitude > 90 ||
    location.longitude < -180 ||
    location.longitude > 180
  ) {
    throw new Error('Invalid coordinates');
  }
}

export function validateRadius(radius: number): void {
  if (radius < 50 || radius > 5000) {
    throw new Error('Reminder radius must be between 50m and 5000m');
  }
}
