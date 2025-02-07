import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../utils/theme';

export default function SignupScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();

  const handleSignup = async () => {
    console.log('Starting signup process...');
    
    if (!email || !password || !confirmPassword || !username) {
      console.log('Missing fields:', { email: !!email, password: !!password, confirmPassword: !!confirmPassword, username: !!username });
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      console.log('Password mismatch');
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      console.log('Attempting to create user with email:', email);
      setLoading(true);
      
      const userData = {
        username,
        displayName: username,
        photoURL: null,
        bio: '',
        membershipType: 'free',
        grows: [],
        badges: [],
        joinedAt: new Date().toISOString()
      };
      
      console.log('User data prepared:', userData);
      
      const result = await signup(email, password, userData);
      console.log('Signup successful:', result);
      
      Alert.alert('Success', 'Account created successfully!');
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert(
        'Error',
        error.message || 'An error occurred during signup. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join the SporeLink community</Text>

          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor={theme.colors.neutral2}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />

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

          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor={theme.colors.neutral2}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Creating Account...' : 'Sign Up'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.linkText}>
              Already have an account? Sign in
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.secondary,
  },
  scrollContent: {
    flexGrow: 1,
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