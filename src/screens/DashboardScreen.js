import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../utils/theme';

export default function DashboardScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.header}>My Grows</Text>
        <View style={styles.growCard}>
          <Text style={styles.growTitle}>Golden Teacher</Text>
          <Text style={styles.growDetails}>Inoculated: Jan 15, 2024</Text>
          <Text style={styles.growDetails}>Stage: Colonization</Text>
        </View>
        <Text style={styles.sectionHeader}>Environmental Data</Text>
        <View style={styles.envCard}>
          <Text style={styles.envTitle}>Current Conditions</Text>
          <Text style={styles.envDetails}>Temperature: -- °F</Text>
          <Text style={styles.envDetails}>Humidity: -- %</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.secondary,
  },
  scrollView: {
    flex: 1,
    padding: theme.spacing.md,
  },
  header: {
    ...theme.typography.h1,
    marginBottom: theme.spacing.lg,
  },
  growCard: {
    backgroundColor: theme.colors.neutral3,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.medium,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.accent1,
  },
  growTitle: {
    ...theme.typography.h2,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  growDetails: {
    ...theme.typography.body,
    color: theme.colors.neutral2,
    marginBottom: theme.spacing.xs,
  },
  sectionHeader: {
    ...theme.typography.h2,
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.md,
  },
  envCard: {
    backgroundColor: theme.colors.neutral3,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.small,
  },
  envTitle: {
    ...theme.typography.h2,
    fontSize: 20,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  envDetails: {
    ...theme.typography.body,
    color: theme.colors.neutral2,
    marginBottom: theme.spacing.xs,
  },
}); 