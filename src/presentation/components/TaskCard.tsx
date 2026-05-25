/**
 * TaskCard — Main task list item with location info, category chip,
 * proximity badge, and swipe-to-complete gesture.
 * Matches Stitch: white bg, Level 1 shadow, 16px radius.
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Task } from '../../domain/entities/Task';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, Radius } from '../../theme/spacing';
import { Shadows } from '../../theme/shadows';
import { NearbyBadge } from './NearbyBadge';
import { StatusChip } from './StatusChip';

interface TaskCardProps {
  task: Task;
  distanceMeters?: number;
  onPress?: () => void;
  onComplete?: () => void;
  onDelete?: () => void;
}

export function TaskCard({
  task,
  distanceMeters,
  onPress,
  onComplete,
  onDelete,
}: TaskCardProps) {
  const isCompleted = task.status === 'completed';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
        isCompleted && styles.cardCompleted,
      ]}
      onPress={onPress}
    >
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <Ionicons
            name={isCompleted ? 'checkmark-circle' : 'location'}
            size={20}
            color={isCompleted ? Colors.secondary : Colors.primary}
          />
        </View>
        <View style={styles.headerText}>
          <Text
            style={[
              styles.title,
              isCompleted && styles.titleCompleted,
            ]}
            numberOfLines={1}
          >
            {task.title}
          </Text>
          <View style={styles.locationRow}>
            <Ionicons name="pin" size={12} color={Colors.onSurfaceVariant} />
            <Text style={styles.locationText} numberOfLines={1}>
              {task.locationName}
            </Text>
          </View>
        </View>
        {distanceMeters !== undefined && (
          <NearbyBadge distanceMeters={distanceMeters} />
        )}
      </View>

      {/* Description */}
      {task.description ? (
        <Text style={styles.description} numberOfLines={2}>
          {task.description}
        </Text>
      ) : null}

      {/* Footer */}
      <View style={styles.footer}>
        <StatusChip category={task.category} />
        <View style={styles.actions}>
          {!isCompleted && onComplete && (
            <TouchableOpacity onPress={onComplete} style={styles.actionBtn}>
              <Ionicons name="checkmark-circle-outline" size={22} color={Colors.secondary} />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity onPress={onDelete} style={styles.actionBtn}>
              <Ionicons name="trash-outline" size={20} color={Colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.level1,
  },
  cardPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.99 }],
  },
  cardCompleted: {
    opacity: 0.6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...Typography.titleMedium,
    color: Colors.onSurface,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.onSurfaceVariant,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    ...Typography.bodySmall,
    color: Colors.onSurfaceVariant,
  },
  description: {
    ...Typography.bodyMedium,
    color: Colors.onSurfaceVariant,
    marginTop: Spacing.sm,
    marginLeft: 52, // align with title (icon 40 + gap 12)
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionBtn: {
    padding: Spacing.xs,
  },
});
