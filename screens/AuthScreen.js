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
  ScrollView,
} from 'react-native';
import { supabase } from '../supabaseClient';
import { colors, spacing, radius, type, shadow } from '../theme';
import OwnerTag from '../components/OwnerTag';

const GMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[0-9])[a-z0-9]{8,}$/;

export default function AuthScreen() {
  const [mode, setMode] = useState('login');
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
        'Password must be at least 8 characters, lowercase letters and numbers only, with at least one of each.'
      );
      return false;
    }
    return true;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      Alert.alert('Sign up failed', error.message);
      return;
    }
    Alert.alert('Account created', 'You can log in now.');
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
    if (error) Alert.alert('Login failed', error.message);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.badge}>
          <Text style={styles.badgeText}>✓</Text>
        </View>
        <Text style={styles.title}>Habit Tracker</Text>
        <Text style={styles.subtitle}>
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
        </Text>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@gmail.com"
            placeholderTextColor={colors.textFaint}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.fieldLabel}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="8+ chars, letters + numbers"
            placeholderTextColor={colors.textFaint}
            autoCapitalize="none"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {mode === 'signup' && (
            <Text style={styles.hint}>
              Lowercase letters and numbers only — at least one of each.
            </Text>
          )}

          <TouchableOpacity
            style={styles.button}
            onPress={mode === 'login' ? handleLogin : handleSignup}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {mode === 'login' ? 'Log in' : 'Sign up'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}>
          <Text style={styles.switchText}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <Text style={styles.switchTextBold}>
              {mode === 'login' ? 'Sign up' : 'Log in'}
            </Text>
          </Text>
        </TouchableOpacity>

        <OwnerTag />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.xxl },
  badge: {
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadow.card,
  },
  badgeText: { color: '#fff', fontSize: 26, fontWeight: '800' },
  title: { ...type.h1, textAlign: 'center', color: colors.text },
  subtitle: { ...type.body, textAlign: 'center', color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.xl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  fieldLabel: { ...type.label, color: colors.textMuted, marginBottom: spacing.xs, marginTop: spacing.sm },
  input: {
    backgroundColor: colors.bg,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hint: { ...type.caption, color: colors.textFaint, marginTop: spacing.sm },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  switchText: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl, fontSize: 14 },
  switchTextBold: { color: colors.primary, fontWeight: '700' },
});
