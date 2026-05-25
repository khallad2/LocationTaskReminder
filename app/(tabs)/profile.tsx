import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/src/presentation/stores/useAuthStore';
import { useTaskStore } from '@/src/presentation/stores/useTaskStore';
import { Colors } from '@/src/theme/colors';
import { Typography } from '@/src/theme/typography';
import { Spacing, Radius } from '@/src/theme/spacing';
import { Shadows } from '@/src/theme/shadows';
import { useEffect } from 'react';

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();
  const { tasks, fetchTasks } = useTaskStore();
  useEffect(() => { if (user) fetchTasks(user.uid); }, [user?.uid]);
  const active = tasks.filter(t => t.status === 'active').length;
  const done = tasks.filter(t => t.status === 'completed').length;

  return (
    <ScrollView style={s.root} contentContainerStyle={s.body}>
      <View style={s.avatarWrap}>
        <View style={s.avatar}><Ionicons name={user?.isAnonymous ? 'person-outline' : 'person'} size={40} color={Colors.primary} /></View>
        <Text style={s.name}>{user?.displayName || (user?.isAnonymous ? 'Guest' : 'User')}</Text>
        <Text style={s.email}>{user?.email || 'Anonymous'}</Text>
      </View>
      <View style={s.statsRow}>
        {[{ n: active, l: 'Active' }, { n: done, l: 'Done' }, { n: tasks.length, l: 'Total' }].map(x => (
          <View key={x.l} style={s.stat}><Text style={s.statN}>{x.n}</Text><Text style={s.statL}>{x.l}</Text></View>
        ))}
      </View>
      <TouchableOpacity style={s.signOut} onPress={signOut}><Ionicons name="log-out-outline" size={20} color={Colors.error} /><Text style={s.signOutTxt}>Sign Out</Text></TouchableOpacity>
      <Text style={s.ver}>LocTask v1.0.0</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },
  body: { padding: Spacing['2xl'], paddingBottom: 80 },
  avatarWrap: { alignItems: 'center', marginBottom: 32 },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.primaryContainer, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  name: { ...Typography.headlineSmall, color: Colors.onSurface },
  email: { ...Typography.bodyMedium, color: Colors.onSurfaceVariant, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  stat: { flex: 1, backgroundColor: '#FFF', borderRadius: Radius.lg, padding: 16, alignItems: 'center', ...Shadows.level1 },
  statN: { ...Typography.headlineMedium, color: Colors.primary },
  statL: { ...Typography.labelSmall, color: Colors.onSurfaceVariant },
  signOut: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.error },
  signOutTxt: { ...Typography.labelLarge, color: Colors.error },
  ver: { ...Typography.bodySmall, color: Colors.outline, textAlign: 'center', marginTop: 24 },
});
