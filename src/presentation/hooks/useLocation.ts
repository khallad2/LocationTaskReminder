/**
 * useLocation — Presentation hook for location permissions and tracking.
 * Safely handles mount/unmount lifecycle for location watching.
 */
import { useEffect, useRef } from 'react';
import { useLocationStore } from '../stores/useLocationStore';

export function useLocation() {
  const store = useLocationStore();
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    // Request permissions and start watching on mount
    (async () => {
      try {
        await store.requestPermissions();
        if (!mountedRef.current) return;
        await store.fetchCurrentLocation();
        if (!mountedRef.current) return;
        await store.startWatching();
      } catch (err) {
        console.warn('[useLocation] Setup failed:', err);
      }
    })();

    return () => {
      mountedRef.current = false;
      try {
        store.stopWatching();
      } catch (err) {
        console.warn('[useLocation] Cleanup failed (safe to ignore):', err);
      }
    };
  }, []);

  return {
    currentLocation: store.currentLocation,
    permissions: store.permissions,
    isLoading: store.isLoading,
    error: store.error,
  };
}
