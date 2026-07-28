import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { supabase } from '../supabaseClient';
import { colors, spacing, radius, type, shadow } from '../theme';
import OwnerTag from '../components/OwnerTag';

export default function AdminDashboard() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadProfiles = useCallback(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      Alert.alert('Could not load accounts', error.message);
    } else {
      setProfiles(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const toggleRole = (item) => {
    const nextRole = item.role === 'admin' ? 'student' : 'admin';
    Alert.alert(
      nextRole === 'admin' ? 'Make admin?' : 'Remove admin?',
      `${item.email} will become ${nextRole === 'admin' ? 'an admin' : 'a student'}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            const { error } = await supabase
              .from('profiles')
              .update({ role: nextRole })
              .eq('id', item.id);
            if (error) {
              Alert.alert('Could not update', error.message);
              return;
            }
            setProfiles((prev) =>
              prev.map((p) => (p.id === item.id ? { ...p, role: nextRole } : p))
            );
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.email.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.rowInfo}>
        <Text style={styles.email} numberOfLines={1}>{item.email}</Text>
        <Text style={styles.meta}>
          joined {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.roleBadge, item.role === 'admin' && styles.roleBadgeAdmin]}
        onPress={() => toggleRole(item)}
      >
        <Text style={[styles.roleText, item.role === 'admin' && styles.roleTextAdmin]}>
          {item.role === 'admin' ? 'Admin' : 'Student'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Accounts</Text>
          <Text style={styles.subtitle}>
            {profiles.length} registered · tap a badge to change role
          </Text>
        </View>
        <TouchableOpacity onPress={() => supabase.auth.signOut()}>
          <Text style={styles.signOut}>Log out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.note}>
        <Text style={styles.noteText}>
          Passwords are hashed by Supabase and never shown here — not to you, not to anyone.
        </Text>
      </View>

      <FlatList
        data={profiles}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshing={loading}
        onRefresh={loadProfiles}
        contentContainerStyle={styles.list}
        ListFooterComponent={<OwnerTag />}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No accounts yet</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
  title: { ...type.h1, fontSize: 24, color: colors.text },
  subtitle: { ...type.caption, color: colors.textMuted, marginTop: 2 },
  signOut: { color: colors.danger, fontSize: 14, fontWeight: '600', marginTop: 4 },
  note: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.lg,
  },
  noteText: { ...type.caption, color: colors.primaryDark },
  list: { paddingBottom: spacing.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: { color: colors.primaryDark, fontWeight: '800', fontSize: 15 },
  rowInfo: { flex: 1 },
  email: { fontSize: 15, fontWeight: '700', color: colors.text },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  roleBadge: {
    backgroundColor: colors.bg,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleBadgeAdmin: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  roleText: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  roleTextAdmin: { color: colors.primaryDark },
  emptyState: { alignItems: 'center', marginTop: 64 },
  emptyText: { ...type.h2, color: colors.text },
});
