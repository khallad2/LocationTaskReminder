/**
 * NearbyBadge — Emerald pill badge showing proximity status.
 * Matches Stitch design: 10% emerald bg, emerald text, "VERY NEAR" label.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Radius } from '../../theme/spacing';

interface NearbyBadgeProps {
  distanceMeters: number;
}

function getLabel(distance: number): { text: string; bg: string; color: string } {
  if (distance < 100) {
    return { text: 'VERY NEAR', bg: Colors.nearbyBg, color: Colors.nearbyText };
  }
  if (distance < 500) {
    return { text: 'NEARBY', bg: Colors.nearbyBg, color: Colors.nearbyText };
  }
  if (distance < 1000) {
    return { text: `${Math.round(distance)}m`, bg: Colors.warningBg, color: Colors.warningText };
  }
  return { text: `${(distance / 1000).toFixed(1)}km`, bg: 'rgba(67, 70, 85, 0.08)', color: Colors.onSurfaceVariant };
}

export function NearbyBadge({ distanceMeters }: NearbyBadgeProps) {
  const { text, bg, color } = getLabel(distanceMeters);

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  text: {
    ...Typography.labelSmall,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});
