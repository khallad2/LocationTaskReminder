/**
 * DI Container — Simple dependency injection for Clean Architecture.
 * Initializes repositories and use cases, and injects them into Zustand stores.
 */
import { TaskRepositoryImpl } from '../../data/repositories/TaskRepositoryImpl';
import { AuthRepositoryImpl } from '../../data/repositories/AuthRepositoryImpl';
import { LocationRepositoryImpl } from '../../data/repositories/LocationRepositoryImpl';
import { ITaskRepository } from '../../domain/repositories/ITaskRepository';
import { IAuthRepository } from '../../domain/repositories/IAuthRepository';
import { ILocationRepository } from '../../domain/repositories/ILocationRepository';

// Task Use Cases
import { CreateTaskUseCase } from '../../domain/usecases/CreateTaskUseCase';
import { GetNearbyTasksUseCase } from '../../domain/usecases/GetNearbyTasksUseCase';
import { CompleteTaskUseCase } from '../../domain/usecases/CompleteTaskUseCase';
import { GetTasksUseCase } from '../../domain/usecases/GetTasksUseCase';
import { DeleteTaskUseCase } from '../../domain/usecases/DeleteTaskUseCase';

// Auth Use Cases
import { LoginUseCase, RegisterUseCase } from '../../domain/usecases/LoginUseCase';
import {
  SignInWithGoogleUseCase,
  SignInAnonymouslyUseCase,
  SignOutUseCase,
  SubscribeToAuthStateUseCase
} from '../../domain/usecases/AuthUseCases';

// Location Use Cases
import { GetCurrentLocationUseCase } from '../../domain/usecases/GetCurrentLocationUseCase';
import { RequestLocationPermissionsUseCase, WatchLocationUseCase } from '../../domain/usecases/LocationUseCases';

// Store Injectors
import { injectTaskStoreDeps } from '../../presentation/stores/useTaskStore';
import { injectAuthStoreDeps } from '../../presentation/stores/useAuthStore';
import { injectLocationStoreDeps } from '../../presentation/stores/useLocationStore';

// ── Repository Singletons ──
const taskRepository: ITaskRepository = new TaskRepositoryImpl();
const authRepository: IAuthRepository = new AuthRepositoryImpl();
const locationRepository: ILocationRepository = new LocationRepositoryImpl();

// ── Inject Store Dependencies ──
injectTaskStoreDeps({
  getTasksUseCase: new GetTasksUseCase(taskRepository),
  getNearbyTasksUseCase: new GetNearbyTasksUseCase(taskRepository, locationRepository),
  createTaskUseCase: new CreateTaskUseCase(taskRepository),
  completeTaskUseCase: new CompleteTaskUseCase(taskRepository),
  deleteTaskUseCase: new DeleteTaskUseCase(taskRepository),
});

injectAuthStoreDeps({
  loginUseCase: new LoginUseCase(authRepository),
  registerUseCase: new RegisterUseCase(authRepository),
  signInWithGoogleUseCase: new SignInWithGoogleUseCase(authRepository),
  signInAnonymouslyUseCase: new SignInAnonymouslyUseCase(authRepository),
  signOutUseCase: new SignOutUseCase(authRepository),
  subscribeToAuthStateUseCase: new SubscribeToAuthStateUseCase(authRepository),
});

injectLocationStoreDeps({
  getCurrentLocationUseCase: new GetCurrentLocationUseCase(locationRepository),
  requestLocationPermissionsUseCase: new RequestLocationPermissionsUseCase(locationRepository),
  watchLocationUseCase: new WatchLocationUseCase(locationRepository),
});

export const container = {
  taskRepository,
  authRepository,
  locationRepository,
};
