/**
 * useLocationStore — Zustand store for GPS location state.
 * Dependencies are injected by the DI container.
 */
import { create } from 'zustand';
import { UserLocation, LocationPermissionStatus } from '../../domain/entities/Location';
import { GetCurrentLocationUseCase } from '../../domain/usecases/GetCurrentLocationUseCase';
import { RequestLocationPermissionsUseCase, WatchLocationUseCase } from '../../domain/usecases/LocationUseCases';

export interface LocationStoreDeps {
  getCurrentLocationUseCase: GetCurrentLocationUseCase | null;
  requestLocationPermissionsUseCase: RequestLocationPermissionsUseCase | null;
  watchLocationUseCase: WatchLocationUseCase | null;
}

interface LocationState extends LocationStoreDeps {
  currentLocation: UserLocation | null;
  permissions: LocationPermissionStatus | null;
  isLoading: boolean;
  error: string | null;
  watchCleanup: (() => void) | null;

  // Actions
  requestPermissions: () => Promise<void>;
  fetchCurrentLocation: () => Promise<void>;
  startWatching: () => Promise<void>;
  stopWatching: () => void;
}

export const useLocationStore = create<LocationState>((set, get) => ({
  getCurrentLocationUseCase: null,
  requestLocationPermissionsUseCase: null,
  watchLocationUseCase: null,

  currentLocation: null,
  permissions: null,
  isLoading: false,
  error: null,
  watchCleanup: null,

  requestPermissions: async () => {
    try {
      const { requestLocationPermissionsUseCase } = get();
      if (!requestLocationPermissionsUseCase) throw new Error('requestLocationPermissionsUseCase not injected');

      const permissions = await requestLocationPermissionsUseCase.execute();
      set({ permissions });
    } catch (err: any) {
      set({ error: err.message || 'Failed to request permissions' });
    }
  },

  fetchCurrentLocation: async () => {
    set({ isLoading: true, error: null });
    try {
      const { getCurrentLocationUseCase } = get();
      if (!getCurrentLocationUseCase) throw new Error('getCurrentLocationUseCase not injected');

      const location = await getCurrentLocationUseCase.execute();
      set({ currentLocation: location, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to get location', isLoading: false });
    }
  },

  startWatching: async () => {
    const { watchCleanup, watchLocationUseCase } = get();
    if (watchCleanup) return; // Already watching

    try {
      if (!watchLocationUseCase) throw new Error('watchLocationUseCase not injected');

      const cleanup = await watchLocationUseCase.execute((location) => {
        set({ currentLocation: location });
      });
      set({ watchCleanup: cleanup });
    } catch (err: any) {
      set({ error: err.message || 'Failed to start location watch' });
    }
  },

  stopWatching: () => {
    const { watchCleanup } = get();
    if (watchCleanup) {
      watchCleanup();
      set({ watchCleanup: null });
    }
  },
}));

export const injectLocationStoreDeps = (deps: LocationStoreDeps) => {
  useLocationStore.setState(deps);
};
