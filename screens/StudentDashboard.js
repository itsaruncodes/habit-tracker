import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Alert,
  StatusBar,
  Modal,
} from 'react-native';
import { supabase } from '../supabaseClient';
import { colors, spacing, radius, type, shadow } from '../theme';
import OwnerTag from '../components/OwnerTag';
import {
  requestNotificationPermission,
  scheduleHabitReminder,
  cancelHabitReminder,
} from '../notifications';

const TIME_REGEX = /^([01]?\d|2[0-3]):([0-5]\d)$/;

function todayString() {
  return new Date().toISOString().split('T')[0];
}
function yesterdayString() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

function formatTime12h(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

export default function StudentDashboard({ session }) {
  const [habits, setHabits] = useState([]);
  const [newHabitName, setNewHabitName] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingHabit, setEditingHabit] = useState(null);
  const [editName, setEditName] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('08:00');

  const loadHabits = useCallback(async () => {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      Alert.alert('Connection error', error.message);
    } else {
      setHabits(data);
      // Re-sync every reminder with the OS scheduler, in case the app
      // was reinstalled or the schedule drifted.
      data.forEach((habit) => {
        if (habit.reminder_time) scheduleHabitReminder(habit);
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    requestNotificationPermission();
    loadHabits();
  }, [loadHabits]);

  const addHabit = async () => {
    const name = newHabitName.trim();
    if (!name) return;
    const { data, error } = await supabase
      .from('habits')
      .insert({ name, user_id: session.user.id })
      .select()
      .single();
    if (error) {
      Alert.alert('Could not add habit', error.message);
      return;
    }
    setHabits((prev) => [data, ...prev]);
    setNewHabitName('');
  };

  const openEdit = (habit) => {
    setEditingHabit(habit);
    setEditName(habit.name);
    setReminderEnabled(!!habit.reminder_time);
    setReminderTime(habit.reminder_time || '08:00');
  };

  const saveEdit = async () => {
    const name = editName.trim();
    if (!name || !editingHabit) return;

    if (reminderEnabled && !TIME_REGEX.test(reminderTime)) {
      Alert.alert('Invalid time', 'Enter the reminder time as HH:MM, e.g. 08:00 or 19:30.');
      return;
    }

    const newReminder = reminderEnabled ? reminderTime : null;
    const { error } = await supabase
      .from('habits')
      .update({ name, reminder_time: newReminder })
      .eq('id', editingHabit.id);
    if (error) {
      Alert.alert('Could not save', error.message);
      return;
    }

    const updatedHabit = { ...editingHabit, name, reminder_time: newReminder };
    setHabits((prev) =>
      prev.map((h) => (h.id === editingHabit.id ? updatedHabit : h))
    );

    if (newReminder) {
      const granted = await requestNotificationPermission();
      if (granted) {
        await scheduleHabitReminder(updatedHabit);
      } else {
        Alert.alert(
          'Notifications disabled',
          'Enable notifications for this app in your phone settings to get reminders.'
        );
      }
    } else {
      await cancelHabitReminder(editingHabit.id);
    }

    setEditingHabit(null);
  };

  const deleteHabit = (id) => {
    Alert.alert('Delete habit', 'This can\u2019t be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('habits').delete().eq('id', id);
          if (error) {
            Alert.alert('Could not delete', error.message);
            return;
          }
          await cancelHabitReminder(id);
          setHabits((prev) => prev.filter((h) => h.id !== id));
        },
      },
    ]);
  };

  const toggleHabit = async (habit) => {
    const today = todayString();
    const yesterday = yesterdayString();
    let update;

    if (habit.last_completed_date === today) {
      update = {
        completed_today: false,
        last_completed_date: null,
        streak: Math.max(0, habit.streak - 1),
      };
    } else {
      const continuingStreak = habit.last_completed_date === yesterday;
      update = {
        completed_today: true,
        last_completed_date: today,
        streak: continuingStreak ? habit.streak + 1 : 1,
      };
    }

    const { error } = await supabase.from('habits').update(update).eq('id', habit.id);
    if (error) {
      Alert.alert('Could not update', error.message);
      return;
    }
    setHabits((prev) => prev.map((h) => (h.id === habit.id ? { ...h, ...update } : h)));
  };

  const renderItem = ({ item }) => (
    <View style={styles.habitRow}>
      <TouchableOpacity
        style={[styles.checkbox, item.completed_today && styles.checkboxChecked]}
        onPress={() => toggleHabit(item)}
        activeOpacity={0.7}
      >
        {item.completed_today && <Text style={styles.checkmark}>✓</Text>}
      </TouchableOpacity>

      <View style={styles.habitInfo}>
        <Text style={styles.habitName} numberOfLines={1}>{item.name}</Text>
        <View style={styles.pillRow}>
          <View style={styles.streakPill}>
            <Text style={styles.streakPillText}>
              🔥 {item.streak} day{item.streak === 1 ? '' : 's'}
            </Text>
          </View>
          {item.reminder_time && (
            <View style={styles.reminderPill}>
              <Text style={styles.reminderPillText}>
                ⏰ {formatTime12h(item.reminder_time)}
              </Text>
            </View>
          )}
        </View>
      </View>

      <TouchableOpacity onPress={() => openEdit(item)} style={styles.iconButton}>
        <Text style={styles.editIcon}>✎</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => deleteHabit(item.id)} style={styles.iconButton}>
        <Text style={styles.deleteIcon}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Habits</Text>
          <Text style={styles.subtitle}>
            {habits.length} habit{habits.length === 1 ? '' : 's'} tracked
          </Text>
        </View>
        <TouchableOpacity onPress={() => supabase.auth.signOut()}>
          <Text style={styles.signOut}>Log out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Add a new habit..."
          placeholderTextColor={colors.textFaint}
          value={newHabitName}
          onChangeText={setNewHabitName}
          onSubmitEditing={addHabit}
          returnKeyType="done"
        />
        <TouchableOpacity style={styles.addButton} onPress={addHabit} activeOpacity={0.85}>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={habits}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={loadHabits}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🌱</Text>
              <Text style={styles.emptyText}>No habits yet</Text>
              <Text style={styles.emptySubtext}>Add one above to start your streak.</Text>
            </View>
          )
        }
        ListFooterComponent={<OwnerTag />}
      />

      <Modal visible={!!editingHabit} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit habit</Text>
            <TextInput
              style={styles.modalInput}
              value={editName}
              onChangeText={setEditName}
              autoFocus
            />

            <TouchableOpacity
              style={styles.reminderToggleRow}
              onPress={() => setReminderEnabled((prev) => !prev)}
              activeOpacity={0.8}
            >
              <View style={[styles.switchTrack, reminderEnabled && styles.switchTrackOn]}>
                <View style={[styles.switchThumb, reminderEnabled && styles.switchThumbOn]} />
              </View>
              <Text style={styles.reminderToggleLabel}>Daily reminder alarm</Text>
            </TouchableOpacity>

            {reminderEnabled && (
              <View style={styles.reminderTimeBox}>
                <Text style={styles.reminderTimeLabel}>Time (24-hour, HH:MM)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={reminderTime}
                  onChangeText={setReminderTime}
                  placeholder="08:00"
                  placeholderTextColor={colors.textFaint}
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                />
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setEditingHabit(null)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={saveEdit}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg },
  title: { ...type.h1, color: colors.text },
  subtitle: { ...type.caption, color: colors.textMuted, marginTop: 2 },
  signOut: { color: colors.danger, fontSize: 14, fontWeight: '600', marginTop: 4 },
  inputRow: { flexDirection: 'row', marginBottom: spacing.lg },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addButton: {
    marginLeft: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  addButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  list: { paddingBottom: spacing.xl },
  habitRow: {
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
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  checkboxChecked: { backgroundColor: colors.primary },
  checkmark: { color: '#fff', fontWeight: '800', fontSize: 13 },
  habitInfo: { flex: 1 },
  habitName: { ...type.h2, fontSize: 16, color: colors.text },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  streakPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.streakSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginRight: 6,
    marginTop: 2,
  },
  streakPillText: { fontSize: 12, fontWeight: '700', color: colors.streak },
  reminderPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginTop: 2,
  },
  reminderPillText: { fontSize: 12, fontWeight: '700', color: colors.primaryDark },
  iconButton: { padding: 8, marginLeft: 2 },
  editIcon: { color: colors.textMuted, fontSize: 15 },
  deleteIcon: { color: colors.danger, fontSize: 16, fontWeight: '600' },
  emptyState: { alignItems: 'center', marginTop: 64 },
  emptyEmoji: { fontSize: 40, marginBottom: spacing.sm },
  emptyText: { ...type.h2, color: colors.text },
  emptySubtext: { ...type.body, color: colors.textMuted, marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(20,22,31,0.45)', justifyContent: 'center', paddingHorizontal: spacing.xl },
  modalCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, ...shadow.card },
  modalTitle: { ...type.h2, color: colors.text, marginBottom: spacing.md },
  modalInput: {
    backgroundColor: colors.bg,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reminderToggleRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.lg },
  switchTrack: {
    width: 40,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.border,
    justifyContent: 'center',
    padding: 2,
  },
  switchTrackOn: { backgroundColor: colors.primary },
  switchThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fff',
  },
  switchThumbOn: { alignSelf: 'flex-end' },
  reminderToggleLabel: { marginLeft: spacing.sm, fontSize: 14, fontWeight: '600', color: colors.text },
  reminderTimeBox: { marginTop: spacing.md },
  reminderTimeLabel: { ...type.caption, color: colors.textMuted, marginBottom: spacing.xs },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: spacing.lg },
  modalCancel: { paddingVertical: 10, paddingHorizontal: spacing.md },
  modalCancelText: { color: colors.textMuted, fontWeight: '600' },
  modalSave: { backgroundColor: colors.primary, borderRadius: radius.sm, paddingVertical: 10, paddingHorizontal: spacing.lg, marginLeft: spacing.sm },
  modalSaveText: { color: '#fff', fontWeight: '700' },
});
