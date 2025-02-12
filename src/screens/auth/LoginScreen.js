import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../utils/theme';

export default function LoginScreen({ navigation }) {
  const { login, loading: authLoading, error: authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Reset error message when inputs change
    setErrorMessage('');
  }, [email, password]);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateInputs = () => {
    console.log('Validating inputs...');
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please fill in all fields');
      return false;
    }

    if (!validateEmail(email)) {
      setErrorMessage('Please enter a valid email address');
      return false;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long');
      return false;
    }

    if (loginAttempts >= 5) {
      setErrorMessage('Too many login attempts. Please try again later.');
      return false;
    }

    return true;
  };

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      setErrorMessage('');

      if (!validateInputs()) {
        return;
      }

      console.log('Attempting login with email:', email);
      await login(email.trim(), password);
      console.log('Login successful');
      setLoginAttempts(0); // Reset attempts on success
    } catch (error) {
      console.error('Login error:', error);
      setLoginAttempts(prev => prev + 1);
      
      // Handle specific error cases
      if (error.code === 'auth/too-many-requests') {
        setErrorMessage('Too many failed attempts. Please try again later.');
      } else if (error.code === 'auth/network-request-failed') {
        setErrorMessage('Network error. Please check your internet connection and try again.');
      } else if (error.code === 'auth/internal-error') {
        setErrorMessage('Service temporarily unavailable. Please try again in a few minutes.');
      } else {
        setErrorMessage(error.message || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
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

        {errorMessage ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <TextInput
          style={[styles.input, errorMessage && styles.inputError]}
          placeholder="Email"
          placeholderTextColor={theme.colors.neutral2}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!isLoading}
          autoCorrect={false}
          textContentType="emailAddress"
          autoComplete="email"
        />

        <TextInput
          style={[styles.input, errorMessage && styles.inputError]}
          placeholder="Password"
          placeholderTextColor={theme.colors.neutral2}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!isLoading}
          textContentType="password"
          autoComplete="password"
        />

        <TouchableOpacity
          style={[
            styles.button,
            (isLoading || loginAttempts >= 5) && styles.buttonDisabled
          ]}
          onPress={handleLogin}
          disabled={isLoading || loginAttempts >= 5}
        >
          {isLoading ? (
            <ActivityIndicator color={theme.colors.secondary} />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('Signup')}
          disabled={isLoading}
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
  errorContainer: {
    backgroundColor: theme.colors.error + '20',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 14,
    textAlign: 'center',
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
  inputError: {
    borderColor: theme.colors.error,
  },
  button: {
    backgroundColor: theme.colors.accent1,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    marginTop: theme.spacing.md,
    ...theme.shadows.medium,
    minHeight: 48,
    justifyContent: 'center',
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