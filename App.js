import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { supabase } from './supabaseClient';
import AuthScreen from './screens/AuthScreen';
import StudentDashboard from './screens/StudentDashboard';
import AdminDashboard from './screens/AdminDashboard';

export default function App() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchRole(session.user.id);
      else setChecking(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setChecking(true);
        fetchRole(session.user.id);
      } else {
        setRole(null);
        setChecking(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const fetchRole = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    if (!error && data) {
      setRole(data.role);
    }
    setChecking(false);
  };

  if (checking) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#5b5bf0" />
      </View>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  return role === 'admin' ? (
    <AdminDashboard />
  ) : (
    <StudentDashboard session={session} />
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7f7fb' },
});
