/**
 * useLocationStore — Zustand store for GPS location state.
 */
import { create } from 'zustand';
import { UserLocation, LocationPermissionStatus } from '../../domain/entities/Location';
import { container } from '../../infrastructure/di/container';

interface LocationState {
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
  currentLocation: null,
  permissions: null,
  isLoading: false,
  error: null,
  watchCleanup: null,

  requestPermissions: async () => {
    try {
      const permissions = await container.locationRepository.requestPermissions();
      set({ permissions });
    } catch (err: any) {
      set({ error: err.message || 'Failed to request permissions' });
    }
  },

  fetchCurrentLocation: async () => {
    set({ isLoading: true, error: null });
    try {
      const location = await container.getCurrentLocationUseCase.execute();
      set({ currentLocation: location, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to get location', isLoading: false });
    }
  },

  startWatching: async () => {
    const { watchCleanup } = get();
    if (watchCleanup) return; // Already watching

    try {
      const cleanup = await container.locationRepository.watchLocation((location) => {
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
