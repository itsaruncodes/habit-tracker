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

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <Text style={styles.email}>{item.email}</Text>
      <Text style={styles.meta}>
        {item.role} · joined {new Date(item.created_at).toLocaleDateString()}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.title}>Admin — Students</Text>
        <TouchableOpacity onPress={() => supabase.auth.signOut()}>
          <Text style={styles.signOut}>Log out</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.note}>
        Passwords are never stored or shown here — Supabase hashes them and
        nobody, including you, can read them back.
      </Text>

      <FlatList
        data={profiles}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshing={loading}
        onRefresh={loadProfiles}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading && <Text style={styles.emptyText}>No accounts yet.</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7fb', paddingHorizontal: 16, paddingTop: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '700', color: '#1a1a1a' },
  signOut: { color: '#c00', fontSize: 14 },
  note: { fontSize: 12, color: '#888', marginBottom: 16 },
  list: { paddingBottom: 24 },
  row: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#e0e0e6' },
  email: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  meta: { fontSize: 13, color: '#888', marginTop: 2, textTransform: 'capitalize' },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 15 },
});
