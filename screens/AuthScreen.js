import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { supabase } from '../supabaseClient';

const GMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
// 8+ chars, at least one lowercase letter, at least one number, lowercase-only letters
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[0-9])[a-z0-9]{8,}$/;

export default function AuthScreen() {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!GMAIL_REGEX.test(email.trim())) {
      Alert.alert('Invalid email', 'Please use a valid @gmail.com address.');
      return false;
    }
    if (!PASSWORD_REGEX.test(password)) {
      Alert.alert(
        'Invalid password',
        'Password must be at least 8 characters, using only lowercase letters and numbers, with at least one of each.'
      );
      return false;
    }
    return true;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) {
      Alert.alert('Sign up failed', error.message);
      return;
    }
    Alert.alert(
      'Check your email',
      'Confirm your email if prompted, then log in below.'
    );
    setMode('login');
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing info', 'Enter your email and password.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) {
      Alert.alert('Login failed', error.message);
    }
    // On success, the onAuthStateChange listener in App.js takes over routing.
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>Habit Tracker</Text>
      <Text style={styles.subtitle}>
        {mode === 'login' ? 'Log in' : 'Create an account'}
      </Text>

      <TextInput
        style={styles.input}
        placeholder="you@gmail.com"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="password (e.g. abc12345)"
        autoCapitalize="none"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {mode === 'signup' && (
        <Text style={styles.hint}>
          8+ characters, lowercase letters and numbers only, at least one of
          each.
        </Text>
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={mode === 'login' ? handleLogin : handleSignup}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {mode === 'login' ? 'Log in' : 'Sign up'}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}
      >
        <Text style={styles.switchText}>
          {mode === 'login'
            ? "Don't have an account? Sign up"
            : 'Already have an account? Log in'}
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7fb',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginTop: 6,
    marginBottom: 28,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e6',
    marginBottom: 12,
  },
  hint: {
    fontSize: 12,
    color: '#888',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#5b5bf0',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  switchText: {
    textAlign: 'center',
    color: '#5b5bf0',
    marginTop: 18,
    fontSize: 14,
  },
});
