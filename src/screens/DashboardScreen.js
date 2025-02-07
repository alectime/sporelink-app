import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    backgroundColor: '#F6F6F6',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 20,
  },
  growCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  growTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  growDetails: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  sectionHeader: {
    fontSize: 22,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 16,
  },
  envCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  envTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  envDetails: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
}); 