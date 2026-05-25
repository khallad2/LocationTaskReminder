/**
 * StatusChip — Category pill chip with low-opacity tint.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Radius } from '../../theme/spacing';
import { TaskCategory } from '../../domain/entities/Task';

interface StatusChipProps {
  category: TaskCategory;
}

const categoryConfig: Record<TaskCategory, { label: string; color: string }> = {
  grocery: { label: '🛒 Grocery', color: Colors.grocery },
  personal: { label: '👤 Personal', color: Colors.personal },
  routine: { label: '🔄 Routine', color: Colors.routine },
  work: { label: '💼 Work', color: Colors.work },
};

export function StatusChip({ category }: StatusChipProps) {
  const config = categoryConfig[category];

  return (
    <View style={[styles.chip, { backgroundColor: `${config.color}12` }]}>
      <Text style={[styles.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  text: {
    ...Typography.labelSmall,
    fontWeight: '600',
  },
});
