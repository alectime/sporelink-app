import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../utils/theme';
import { db } from '../utils/firebaseConfig';
import { doc, updateDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { Icon } from '../components/Icon';

export default function GrowDetailsScreen({ route, navigation }) {
  const { grow } = route.params;
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedStage, setSelectedStage] = useState(grow.stage);
  const [notes, setNotes] = useState('');
  const [temperature, setTemperature] = useState('');
  const [humidity, setHumidity] = useState('');

  const GROW_STAGES = [
    'Inoculation',
    'Incubation/Colonization',
    'Fruiting Conditions',
    'Pinning',
    'Fruiting',
    'Harvesting',
    'Spore Printing/Cloning',
    'Substrate Recycling'
  ];

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  const calculateDaysSince = (startDate) => {
    if (!startDate) return 0;
    const now = new Date();
    const start = new Date(startDate);
    const diffTime = Math.abs(now - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp.seconds * 1000).toLocaleString();
  };

  const handleUpdateProgress = async () => {
    try {
      // Validate temperature and humidity if provided
      if (temperature && (isNaN(temperature) || parseFloat(temperature) < 0 || parseFloat(temperature) > 120)) {
        Alert.alert('Invalid Input', 'Temperature must be between 0°F and 120°F');
        return;
      }
      if (humidity && (isNaN(humidity) || parseFloat(humidity) < 0 || parseFloat(humidity) > 100)) {
        Alert.alert('Invalid Input', 'Humidity must be between 0% and 100%');
        return;
      }

      const growRef = doc(db, 'grows', grow.id);
      const updateData = {
        stage: selectedStage,
        updatedAt: serverTimestamp(),
        history: arrayUnion({
          timestamp: serverTimestamp(),
          stage: selectedStage,
          notes: notes.trim(),
          ...(temperature ? { temperature: parseFloat(temperature) } : {}),
          ...(humidity ? { humidity: parseFloat(humidity) } : {})
        })
      };

      if (notes.trim()) {
        updateData.notes = notes.trim();
      }

      await updateDoc(growRef, updateData);

      Alert.alert('Success', 'Grow progress updated successfully');
      setShowUpdateModal(false);
      setNotes('');
      setTemperature('');
      setHumidity('');
    } catch (error) {
      console.error('Error updating grow:', error);
      Alert.alert('Error', 'Failed to update grow progress. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>{grow.species}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick View</Text>
            <View style={styles.infoRow}>
              <Icon name="calendar-outline" size={20} color={theme.colors.accent1} />
              <Text style={styles.infoText}>Started: {formatDate(grow.startDate)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Icon name="time-outline" size={20} color={theme.colors.accent1} />
              <Text style={styles.infoText}>Day {calculateDaysSince(grow.startDate)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Icon name="leaf-outline" size={20} color={theme.colors.accent1} />
              <Text style={styles.infoText}>Current Stage: {grow.stage}</Text>
            </View>
          </View>

          {grow.notes && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text style={styles.notes}>{grow.notes}</Text>
            </View>
          )}

          <TouchableOpacity 
            style={styles.updateButton}
            onPress={() => setShowUpdateModal(true)}
          >
            <Text style={styles.updateButtonText}>Update Progress</Text>
          </TouchableOpacity>
        </View>

        {grow.history && grow.history.length > 0 && (
          <View style={styles.card}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>History</Text>
              {grow.history.map((entry, index) => (
                <View key={index} style={styles.historyEntry}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyTimestamp}>
                      {formatTimestamp(entry.timestamp)}
                    </Text>
                    <Text style={styles.historyStage}>{entry.stage}</Text>
                  </View>
                  
                  {(entry.temperature !== undefined || entry.humidity !== undefined) && (
                    <View style={styles.environmentReadings}>
                      {entry.temperature !== undefined && (
                        <View style={styles.reading}>
                          <Icon name="thermometer-outline" size={16} color={theme.colors.accent1} />
                          <Text style={styles.readingText}>
                            {entry.temperature}°F
                          </Text>
                        </View>
                      )}
                      {entry.humidity !== undefined && (
                        <View style={styles.reading}>
                          <Icon name="water-outline" size={16} color={theme.colors.accent1} />
                          <Text style={styles.readingText}>
                            {entry.humidity}%
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                  
                  {entry.notes && (
                    <Text style={styles.historyNotes}>{entry.notes}</Text>
                  )}
                  
                  <View style={styles.historySeparator} />
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showUpdateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowUpdateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Grow Progress</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Current Stage</Text>
              <ScrollView style={styles.stageSelector}>
                {GROW_STAGES.map((stage) => (
                  <TouchableOpacity
                    key={stage}
                    style={[
                      styles.stageOption,
                      selectedStage === stage && styles.selectedStage
                    ]}
                    onPress={() => setSelectedStage(stage)}
                  >
                    <Text
                      style={[
                        styles.stageText,
                        selectedStage === stage && styles.selectedStageText
                      ]}
                    >
                      {stage}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.environmentContainer}>
              <View style={styles.environmentInput}>
                <Text style={styles.inputLabel}>Temperature (°F)</Text>
                <TextInput
                  style={styles.input}
                  value={temperature}
                  onChangeText={setTemperature}
                  placeholder="Enter temperature"
                  placeholderTextColor={theme.colors.neutral2}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.environmentInput}>
                <Text style={styles.inputLabel}>Humidity (%)</Text>
                <TextInput
                  style={styles.input}
                  value={humidity}
                  onChangeText={setHumidity}
                  placeholder="Enter humidity"
                  placeholderTextColor={theme.colors.neutral2}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Notes</Text>
              <TextInput
                style={[styles.input, styles.notesInput]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Add notes about progress..."
                placeholderTextColor={theme.colors.neutral2}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.updateButton, styles.cancelButton]}
                onPress={() => {
                  setShowUpdateModal(false);
                  setNotes('');
                  setTemperature('');
                  setHumidity('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.updateButton}
                onPress={handleUpdateProgress}
              >
                <Text style={styles.updateButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  backButton: {
    marginRight: theme.spacing.md,
  },
  title: {
    ...theme.typography.h1,
    flex: 1,
  },
  card: {
    backgroundColor: theme.colors.neutral3,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    margin: theme.spacing.md,
    ...theme.shadows.medium,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.h2,
    marginBottom: theme.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  infoText: {
    ...theme.typography.body,
    marginLeft: theme.spacing.sm,
    color: theme.colors.neutral2,
  },
  notes: {
    ...theme.typography.body,
    color: theme.colors.primary,
  },
  updateButton: {
    backgroundColor: theme.colors.accent1,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  updateButtonText: {
    color: theme.colors.secondary,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    width: '90%',
    maxHeight: '80%',
    ...theme.shadows.medium,
  },
  modalTitle: {
    ...theme.typography.h2,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    ...theme.typography.body,
    color: theme.colors.neutral2,
    marginBottom: theme.spacing.xs,
  },
  input: {
    backgroundColor: theme.colors.neutral3,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    fontSize: 16,
    color: theme.colors.primary,
    borderWidth: 1,
    borderColor: theme.colors.neutral1,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  stageSelector: {
    maxHeight: 200,
    backgroundColor: theme.colors.neutral3,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.neutral1,
  },
  stageOption: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral1,
  },
  selectedStage: {
    backgroundColor: theme.colors.accent1,
  },
  stageText: {
    ...theme.typography.body,
    color: theme.colors.primary,
  },
  selectedStageText: {
    color: theme.colors.secondary,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.lg,
  },
  cancelButton: {
    backgroundColor: theme.colors.neutral1,
  },
  cancelButtonText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  environmentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  environmentInput: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
  historyEntry: {
    marginBottom: theme.spacing.md,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  historyTimestamp: {
    ...theme.typography.caption,
    color: theme.colors.neutral2,
  },
  historyStage: {
    ...theme.typography.caption,
    color: theme.colors.accent1,
    fontWeight: '600',
  },
  environmentReadings: {
    flexDirection: 'row',
    marginVertical: theme.spacing.xs,
  },
  reading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  readingText: {
    ...theme.typography.body,
    color: theme.colors.primary,
    marginLeft: theme.spacing.xs,
  },
  historyNotes: {
    ...theme.typography.body,
    color: theme.colors.neutral2,
    marginTop: theme.spacing.xs,
  },
  historySeparator: {
    height: 1,
    backgroundColor: theme.colors.neutral1,
    marginTop: theme.spacing.md,
  },
}); 