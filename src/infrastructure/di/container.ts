/**
 * DI Container — Simple dependency injection for Clean Architecture.
 * All repository instances are created once and shared.
 */
import { TaskRepositoryImpl } from '../../data/repositories/TaskRepositoryImpl';
import { AuthRepositoryImpl } from '../../data/repositories/AuthRepositoryImpl';
import { LocationRepositoryImpl } from '../../data/repositories/LocationRepositoryImpl';
import { ITaskRepository } from '../../domain/repositories/ITaskRepository';
import { IAuthRepository } from '../../domain/repositories/IAuthRepository';
import { ILocationRepository } from '../../domain/repositories/ILocationRepository';
import { CreateTaskUseCase } from '../../domain/usecases/CreateTaskUseCase';
import { GetNearbyTasksUseCase } from '../../domain/usecases/GetNearbyTasksUseCase';
import { CompleteTaskUseCase } from '../../domain/usecases/CompleteTaskUseCase';
import { LoginUseCase, RegisterUseCase } from '../../domain/usecases/LoginUseCase';
import { GetCurrentLocationUseCase } from '../../domain/usecases/GetCurrentLocationUseCase';

// ── Repository Singletons ──
const taskRepository: ITaskRepository = new TaskRepositoryImpl();
const authRepository: IAuthRepository = new AuthRepositoryImpl();
const locationRepository: ILocationRepository = new LocationRepositoryImpl();

// ── Use Case Factories ──
export const container = {
  // Repositories
  taskRepository,
  authRepository,
  locationRepository,

  // Use Cases
  createTaskUseCase: new CreateTaskUseCase(taskRepository),
  getNearbyTasksUseCase: new GetNearbyTasksUseCase(taskRepository, locationRepository),
  completeTaskUseCase: new CompleteTaskUseCase(taskRepository),
  loginUseCase: new LoginUseCase(authRepository),
  registerUseCase: new RegisterUseCase(authRepository),
  getCurrentLocationUseCase: new GetCurrentLocationUseCase(locationRepository),
};

export type Container = typeof container;
