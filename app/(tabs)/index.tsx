/**
 * Dashboard (Home) Screen — Shows nearby tasks, location status,
 * and a FAB to add new tasks.
 */
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/src/presentation/stores/useAuthStore';
import { useTaskStore } from '@/src/presentation/stores/useTaskStore';
import { useLocationStore } from '@/src/presentation/stores/useLocationStore';
import { useLocation } from '@/src/presentation/hooks/useLocation';
import { useNearbyTasks } from '@/src/presentation/hooks/useNearbyTasks';
import { TaskCard } from '@/src/presentation/components/TaskCard';
import { EmptyState } from '@/src/presentation/components/EmptyState';
import { Colors } from '@/src/theme/colors';
import { Typography } from '@/src/theme/typography';
import { Spacing, Radius } from '@/src/theme/spacing';
import { Shadows } from '@/src/theme/shadows';
import { GeohashService } from '@/src/data/services/GeohashService';

const geohashService = new GeohashService();

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { currentLocation } = useLocation();
  const { nearbyTasks, isLoading, refresh } = useNearbyTasks(5);

  const getDistance = (taskLat: number, taskLng: number): number => {
    if (!currentLocation) return Infinity;
    return geohashService.distanceMeters(
      { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
      { latitude: taskLat, longitude: taskLng },
    );
  };

  return (
    <View style={styles.container}>
      {/* Location Status Bar */}
      <View style={styles.locationBar}>
        <View style={styles.locationDot} />
        <Text style={styles.locationText}>
          {currentLocation
            ? `${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}`
            : 'Getting location...'}
        </Text>
        {currentLocation && (
          <View style={styles.accuracyChip}>
            <Text style={styles.accuracyText}>
              ±{Math.round(currentLocation.accuracy || 0)}m
            </Text>
          </View>
        )}
      </View>

      {/* Nearby Tasks Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Nearby Tasks</Text>
        <Text style={styles.sectionCount}>
          {nearbyTasks.length} {nearbyTasks.length === 1 ? 'task' : 'tasks'}
        </Text>
      </View>

      {/* Task List */}
      <FlatList
        data={nearbyTasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            distanceMeters={getDistance(item.location.latitude, item.location.longitude)}
            onComplete={() => useTaskStore.getState().completeTask(item.id)}
            onDelete={() => useTaskStore.getState().deleteTask(item.id)}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refresh}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="location-outline"
              title="No nearby tasks"
              description="Create a task with a location to get reminded when you're nearby"
              actionLabel="Add Task"
              onAction={() => router.push('/add-task')}
            />
          ) : (
            <View style={styles.loadingCenter}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          )
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/add-task')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color={Colors.onPrimary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surfaceContainer,
    gap: Spacing.sm,
  },
  locationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.secondary,
  },
  locationText: {
    ...Typography.bodySmall,
    color: Colors.onSurfaceVariant,
    flex: 1,
  },
  accuracyChip: {
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  accuracyText: {
    ...Typography.labelSmall,
    color: Colors.secondary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.titleLarge,
    color: Colors.onSurface,
  },
  sectionCount: {
    ...Typography.bodySmall,
    color: Colors.onSurfaceVariant,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.level3,
  },
});
