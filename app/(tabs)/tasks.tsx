/**
 * Tasks Screen — Full task list with Proximity/Chronological toggle.
 */
import React, { useEffect, useState } from 'react';
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
import { TaskCard } from '@/src/presentation/components/TaskCard';
import { EmptyState } from '@/src/presentation/components/EmptyState';
import { Colors } from '@/src/theme/colors';
import { Typography } from '@/src/theme/typography';
import { Spacing, Radius } from '@/src/theme/spacing';

type SortMode = 'proximity' | 'chronological';

export default function TasksScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { tasks, isLoading, fetchTasks, completeTask, deleteTask } = useTaskStore();
  const [sortMode, setSortMode] = useState<SortMode>('chronological');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    if (user) {
      fetchTasks(user.uid);
    }
  }, [user?.uid]);

  const filteredTasks = tasks.filter((t) => {
    if (statusFilter === 'all') return true;
    return t.status === statusFilter;
  });

  return (
    <View style={styles.container}>
      {/* Sort Toggle */}
      <View style={styles.toggleRow}>
        <View style={styles.toggleGroup}>
          {(['proximity', 'chronological'] as SortMode[]).map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[
                styles.toggleBtn,
                sortMode === mode && styles.toggleBtnActive,
              ]}
              onPress={() => setSortMode(mode)}
            >
              <Ionicons
                name={mode === 'proximity' ? 'navigate' : 'time'}
                size={14}
                color={sortMode === mode ? Colors.onPrimary : Colors.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.toggleText,
                  sortMode === mode && styles.toggleTextActive,
                ]}
              >
                {mode === 'proximity' ? 'Proximity' : 'Recent'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Status Filter Pills */}
      <View style={styles.filterRow}>
        {(['all', 'active', 'completed'] as const).map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterPill,
              statusFilter === status && styles.filterPillActive,
            ]}
            onPress={() => setStatusFilter(status)}
          >
            <Text
              style={[
                styles.filterPillText,
                statusFilter === status && styles.filterPillTextActive,
              ]}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Task List */}
      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            onComplete={() => completeTask(item.id)}
            onDelete={() => deleteTask(item.id)}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => user && fetchTasks(user.uid)}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="clipboard-outline"
              title="No tasks yet"
              description="Create your first location-based task to get started"
              actionLabel="Create Task"
              onAction={() => router.push('/add-task')}
            />
          ) : (
            <View style={styles.loadingCenter}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  toggleRow: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  toggleGroup: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Radius.full,
    padding: 4,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    gap: 6,
  },
  toggleBtnActive: {
    backgroundColor: Colors.primary,
  },
  toggleText: {
    ...Typography.labelMedium,
    color: Colors.onSurfaceVariant,
  },
  toggleTextActive: {
    color: Colors.onPrimary,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  filterPill: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  filterPillActive: {
    backgroundColor: Colors.primaryContainer,
    borderColor: Colors.primary,
  },
  filterPillText: {
    ...Typography.labelMedium,
    color: Colors.onSurfaceVariant,
  },
  filterPillTextActive: {
    color: Colors.primary,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
});
