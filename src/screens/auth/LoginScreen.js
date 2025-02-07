import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../utils/theme';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.formContainer}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={theme.colors.neutral2}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={theme.colors.neutral2}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('Signup')}
        >
          <Text style={styles.linkText}>
            Don't have an account? Sign up
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.secondary,
  },
  formContainer: {
    flex: 1,
    padding: theme.spacing.xl,
    justifyContent: 'center',
  },
  title: {
    ...theme.typography.h1,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.neutral2,
    marginBottom: theme.spacing.xl,
  },
  input: {
    backgroundColor: theme.colors.neutral3,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.primary,
    borderWidth: 1,
    borderColor: theme.colors.neutral1,
    ...theme.shadows.small,
  },
  button: {
    backgroundColor: theme.colors.accent1,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    marginTop: theme.spacing.md,
    ...theme.shadows.medium,
  },
  buttonDisabled: {
    backgroundColor: theme.colors.neutral1,
  },
  buttonText: {
    color: theme.colors.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: theme.spacing.md,
    alignItems: 'center',
  },
  linkText: {
    color: theme.colors.accent1,
    fontSize: 16,
  },
}); 