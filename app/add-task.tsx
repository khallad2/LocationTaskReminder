/**
 * Add Task Modal — Form with title, description, location, radius, category.
 * Fetches user location on mount, shows errors properly, only navigates
 * back on successful save.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/src/presentation/stores/useAuthStore';
import { useTaskStore } from '@/src/presentation/stores/useTaskStore';
import { useLocationStore } from '@/src/presentation/stores/useLocationStore';
import { TaskCategory } from '@/src/domain/entities/Task';
import { Colors } from '@/src/theme/colors';
import { Typography } from '@/src/theme/typography';
import { Spacing, Radius } from '@/src/theme/spacing';

const CATEGORIES: { key: TaskCategory; label: string; icon: string }[] = [
  { key: 'grocery', label: 'Grocery', icon: '🛒' },
  { key: 'personal', label: 'Personal', icon: '👤' },
  { key: 'routine', label: 'Routine', icon: '🔄' },
  { key: 'work', label: 'Work', icon: '💼' },
];

const RADIUS_OPTIONS = [100, 250, 500, 1000];

export default function AddTaskScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { addTask, isLoading, error: taskError, clearError } = useTaskStore();

  // Read location directly from the global store (shared with Dashboard)
  const currentLocation = useLocationStore((s) => s.currentLocation);
  const locationError = useLocationStore((s) => s.error);
  const fetchCurrentLocation = useLocationStore((s) => s.fetchCurrentLocation);
  const requestPermissions = useLocationStore((s) => s.requestPermissions);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('Current Location');
  const [category, setCategory] = useState<TaskCategory>('personal');
  const [radius, setRadius] = useState(250);
  const [localError, setLocalError] = useState<string | null>(null);

  // Manual coordinates (fallback when GPS unavailable)
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');

  // If no location yet, attempt to fetch it on mount
  useEffect(() => {
    if (!currentLocation) {
      (async () => {
        await requestPermissions();
        await fetchCurrentLocation();
      })();
    }
  }, []);

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
    // If !success, error is shown from taskError in the store
  };

  const displayError = localError || taskError;

  return (
    <>
      <Stack.Screen options={{ title: 'New Task', headerStyle: { backgroundColor: Colors.surface }, headerTintColor: Colors.onSurface }} />
      <ScrollView style={s.container} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        {/* Error banner */}
        {displayError && (
          <View style={s.errorBanner}>
            <Ionicons name="alert-circle" size={16} color={Colors.error} />
            <Text style={s.errorText}>{displayError}</Text>
            <TouchableOpacity onPress={() => { setLocalError(null); clearError(); }}>
              <Ionicons name="close" size={16} color={Colors.error} />
            </TouchableOpacity>
          </View>
        )}

        {/* Title */}
        <View style={s.field}>
          <Text style={s.label}>Title *</Text>
          <TextInput style={s.input} value={title} onChangeText={setTitle} placeholder="e.g. Buy groceries" placeholderTextColor={Colors.outline} />
        </View>

        {/* Description */}
        <View style={s.field}>
          <Text style={s.label}>Description</Text>
          <TextInput style={[s.input, s.textArea]} value={description} onChangeText={setDescription} placeholder="Add details..." placeholderTextColor={Colors.outline} multiline numberOfLines={3} textAlignVertical="top" />
        </View>

        {/* Location */}
        <View style={s.field}>
          <Text style={s.label}>Location</Text>
          <View style={s.locationBox}>
            <Ionicons name="location" size={20} color={hasLocation ? Colors.secondary : Colors.outline} />
            <View style={{ flex: 1 }}>
              <TextInput style={s.locationInput} value={locationName} onChangeText={setLocationName} placeholder="Location name" placeholderTextColor={Colors.outline} />
              {hasLocation ? (
                <Text style={s.coords}>📍 {resolvedLat.toFixed(4)}, {resolvedLng.toFixed(4)}</Text>
              ) : (
                <Text style={[s.coords, { color: Colors.error }]}>⚠ GPS unavailable — enter coordinates below</Text>
              )}
            </View>
          </View>

          {/* Manual coordinate fallback */}
          {!currentLocation && (
            <View style={s.manualRow}>
              <TextInput
                style={[s.input, { flex: 1 }]}
                value={manualLat}
                onChangeText={setManualLat}
                placeholder="Latitude (e.g. 53.55)"
                placeholderTextColor={Colors.outline}
                keyboardType="decimal-pad"
              />
              <TextInput
                style={[s.input, { flex: 1 }]}
                value={manualLng}
                onChangeText={setManualLng}
                placeholder="Longitude (e.g. 9.99)"
                placeholderTextColor={Colors.outline}
                keyboardType="decimal-pad"
              />
            </View>
          )}
        </View>

        {/* Category */}
        <View style={s.field}>
          <Text style={s.label}>Category</Text>
          <View style={s.categoryRow}>
            {CATEGORIES.map(c => (
              <TouchableOpacity key={c.key} style={[s.categoryPill, category === c.key && s.categoryActive]} onPress={() => setCategory(c.key)}>
                <Text style={s.categoryIcon}>{c.icon}</Text>
                <Text style={[s.categoryText, category === c.key && s.categoryTextActive]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Radius */}
        <View style={s.field}>
          <Text style={s.label}>Reminder Radius</Text>
          <View style={s.radiusRow}>
            {RADIUS_OPTIONS.map(r => (
              <TouchableOpacity key={r} style={[s.radiusPill, radius === r && s.radiusActive]} onPress={() => setRadius(r)}>
                <Text style={[s.radiusText, radius === r && s.radiusTextActive]}>{r >= 1000 ? `${r/1000}km` : `${r}m`}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Submit */}
        <TouchableOpacity style={[s.submitBtn, isLoading && { opacity: 0.6 }]} onPress={handleSubmit} disabled={isLoading} activeOpacity={0.85}>
          {isLoading ? <ActivityIndicator color={Colors.onPrimary} /> : <Text style={s.submitText}>Create Task</Text>}
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  content: { padding: Spacing['2xl'], gap: Spacing.lg, paddingBottom: 60 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.errorContainer, padding: Spacing.md, borderRadius: Radius.sm },
  errorText: { ...Typography.bodySmall, color: Colors.error, flex: 1 },
  field: { gap: Spacing.xs },
  label: { ...Typography.labelMedium, color: Colors.onSurfaceVariant, marginLeft: 4 },
  input: { backgroundColor: Colors.surfaceContainerLow, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.outlineVariant, paddingHorizontal: Spacing.md, height: 52, ...Typography.bodyLarge, color: Colors.onSurface },
  textArea: { height: 100, paddingTop: Spacing.md },
  locationBox: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surfaceContainerLow, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.outlineVariant, padding: Spacing.md },
  locationInput: { ...Typography.bodyLarge, color: Colors.onSurface },
  coords: { ...Typography.bodySmall, color: Colors.onSurfaceVariant, marginTop: 2 },
  manualRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
  categoryRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  categoryPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.outlineVariant },
  categoryActive: { backgroundColor: Colors.primaryContainer, borderColor: Colors.primary },
  categoryIcon: { fontSize: 16 },
  categoryText: { ...Typography.labelMedium, color: Colors.onSurfaceVariant },
  categoryTextActive: { color: Colors.primary },
  radiusRow: { flexDirection: 'row', gap: Spacing.sm },
  radiusPill: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.outlineVariant },
  radiusActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  radiusText: { ...Typography.labelMedium, color: Colors.onSurfaceVariant },
  radiusTextActive: { color: Colors.onPrimary },
  submitBtn: { backgroundColor: Colors.primary, height: 56, borderRadius: 100, justifyContent: 'center', alignItems: 'center', marginTop: Spacing.md },
  submitText: { ...Typography.labelLarge, color: Colors.onPrimary },
});
