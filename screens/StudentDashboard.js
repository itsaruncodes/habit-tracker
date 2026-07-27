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
} from 'react-native';
import { supabase } from '../supabaseClient';

function todayString() {
  return new Date().toISOString().split('T')[0];
}
function yesterdayString() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

export default function StudentDashboard({ session }) {
  const [habits, setHabits] = useState([]);
  const [newHabitName, setNewHabitName] = useState('');
  const [loading, setLoading] = useState(true);

  const loadHabits = useCallback(async () => {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      Alert.alert('Connection error', error.message);
    } else {
      setHabits(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
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

  const deleteHabit = (id) => {
    Alert.alert('Delete habit', 'Are you sure?', [
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

    const { error } = await supabase
      .from('habits')
      .update(update)
      .eq('id', habit.id);
    if (error) {
      Alert.alert('Could not update', error.message);
      return;
    }
    setHabits((prev) =>
      prev.map((h) => (h.id === habit.id ? { ...h, ...update } : h))
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.habitRow}>
      <TouchableOpacity
        style={[styles.checkbox, item.completed_today && styles.checkboxChecked]}
        onPress={() => toggleHabit(item)}
      >
        {item.completed_today && <Text style={styles.checkmark}>✓</Text>}
      </TouchableOpacity>

      <View style={styles.habitInfo}>
        <Text style={styles.habitName}>{item.name}</Text>
        <Text style={styles.streakText}>
          🔥 {item.streak} day{item.streak === 1 ? '' : 's'} streak
        </Text>
      </View>

      <TouchableOpacity onPress={() => deleteHabit(item.id)} style={styles.deleteButton}>
        <Text style={styles.deleteText}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.title}>Habit Tracker</Text>
        <TouchableOpacity onPress={() => supabase.auth.signOut()}>
          <Text style={styles.signOut}>Log out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Add a new habit..."
          value={newHabitName}
          onChangeText={setNewHabitName}
          onSubmitEditing={addHabit}
          returnKeyType="done"
        />
        <TouchableOpacity style={styles.addButton} onPress={addHabit}>
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
            <Text style={styles.emptyText}>
              No habits yet. Add one above to get started!
            </Text>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7fb', paddingHorizontal: 16, paddingTop: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '700', color: '#1a1a1a' },
  signOut: { color: '#c00', fontSize: 14 },
  inputRow: { flexDirection: 'row', marginBottom: 16 },
  input: { flex: 1, backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16, borderWidth: 1, borderColor: '#e0e0e6' },
  addButton: { marginLeft: 8, backgroundColor: '#5b5bf0', borderRadius: 10, paddingHorizontal: 18, justifyContent: 'center' },
  addButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  list: { paddingBottom: 24 },
  habitRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  checkbox: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#5b5bf0', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  checkboxChecked: { backgroundColor: '#5b5bf0' },
  checkmark: { color: '#fff', fontWeight: '700' },
  habitInfo: { flex: 1 },
  habitName: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  streakText: { fontSize: 13, color: '#888', marginTop: 2 },
  deleteButton: { padding: 6 },
  deleteText: { color: '#c00', fontSize: 16 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 15 },
});
