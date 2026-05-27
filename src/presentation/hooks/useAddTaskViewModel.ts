import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../stores/useAuthStore';
import { useTaskStore } from '../stores/useTaskStore';
import { useLocationStore } from '../stores/useLocationStore';
import { TaskCategory } from '../../domain/entities/Task';

export function useAddTaskViewModel() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { addTask, isLoading, error: taskError, clearError } = useTaskStore();

  const currentLocation = useLocationStore((s) => s.currentLocation);
  const fetchCurrentLocation = useLocationStore((s) => s.fetchCurrentLocation);
  const requestPermissions = useLocationStore((s) => s.requestPermissions);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('Current Location');
  const [category, setCategory] = useState<TaskCategory>('personal');
  const [radius, setRadius] = useState(250);
  const [localError, setLocalError] = useState<string | null>(null);

  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');

  useEffect(() => {
    if (!currentLocation) {
      (async () => {
        await requestPermissions();
        await fetchCurrentLocation();
      })();
    }
  }, [currentLocation, requestPermissions, fetchCurrentLocation]);

  const resolvedLat = currentLocation?.latitude ?? (manualLat ? parseFloat(manualLat) : NaN);
  const resolvedLng = currentLocation?.longitude ?? (manualLng ? parseFloat(manualLng) : NaN);
  const hasLocation = !isNaN(resolvedLat) && !isNaN(resolvedLng);

  const handleSubmit = async () => {
    setLocalError(null);
    clearError();

    if (!title.trim() || title.trim().length < 2) {
      setLocalError('Title must be at least 2 characters');
      return;
    }
    if (!user) {
      setLocalError('Please sign in first');
      return;
    }
    if (!hasLocation) {
      setLocalError('Location is required. Grant GPS permissions or enter coordinates manually.');
      return;
    }

    const success = await addTask({
      userId: user.uid,
      title: title.trim(),
      description: description.trim(),
      locationName,
      location: { latitude: resolvedLat, longitude: resolvedLng },
      reminderRadiusMeters: radius,
      category,
    });

    if (success) {
      router.back();
    }
  };

  const clearLocalError = () => {
    setLocalError(null);
    clearError();
  };

  return {
    // State
    title,
    description,
    locationName,
    category,
    radius,
    manualLat,
    manualLng,
    currentLocation,
    hasLocation,
    resolvedLat,
    resolvedLng,
    isLoading,
    displayError: localError || taskError,

    // Setters
    setTitle,
    setDescription,
    setLocationName,
    setCategory,
    setRadius,
    setManualLat,
    setManualLng,

    // Actions
    handleSubmit,
    clearLocalError,
  };
}
