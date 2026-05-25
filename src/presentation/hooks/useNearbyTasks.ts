/**
 * useNearbyTasks — Combines location and task stores to
 * fetch tasks near the user's current position.
 */
import { useEffect } from 'react';
import { useTaskStore } from '../stores/useTaskStore';
import { useLocationStore } from '../stores/useLocationStore';
import { useAuthStore } from '../stores/useAuthStore';

export function useNearbyTasks(radiusKm: number = 5) {
  const { nearbyTasks, isLoading, error, fetchNearbyTasks } = useTaskStore();
  const { currentLocation } = useLocationStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user && currentLocation) {
      fetchNearbyTasks(user.uid, radiusKm);
    }
  }, [user?.uid, currentLocation?.latitude, currentLocation?.longitude, radiusKm]);

  return {
    nearbyTasks,
    isLoading,
    error,
    refresh: () => user && fetchNearbyTasks(user.uid, radiusKm),
  };
}
