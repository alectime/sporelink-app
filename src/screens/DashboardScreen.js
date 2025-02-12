import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '../utils/theme';
import { useAuth } from '../context/AuthContext';
import { db } from '../utils/firebaseConfig';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  doc,
  updateDoc,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';

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

export default function DashboardScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [environmentData, setEnvironmentData] = useState({
    temperature: '--',
    humidity: '--',
    lastUpdate: null,
    notes: '',
    history: []
  });
  const [showEnvModal, setShowEnvModal] = useState(false);
  const [tempInput, setTempInput] = useState('');
  const [humidityInput, setHumidityInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  // New Grow Modal State
  const [showNewGrowModal, setShowNewGrowModal] = useState(false);
  const [speciesInput, setSpeciesInput] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [dateInput, setDateInput] = useState(formatDate(new Date()));
  const [selectedStage, setSelectedStage] = useState(GROW_STAGES[0]);
  const [activeGrows, setActiveGrows] = useState([]);

  // Load user's grows from Firestore
  useEffect(() => {
    const loadGrows = async () => {
      try {
        const growsRef = collection(db, 'grows');
        const q = query(
          growsRef,
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const grows = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          startDate: doc.data().startDate.toDate(),
          createdAt: doc.data().createdAt.toDate()
        }));
        
        setActiveGrows(grows);
      } catch (error) {
        console.error('Error loading grows:', error);
        Alert.alert('Error', 'Failed to load your grows');
      } finally {
        setLoading(false);
      }
    };

    loadGrows();
  }, [user]);

  // Load environment data from Firestore
  useEffect(() => {
    const loadEnvironmentData = async () => {
      try {
        const envRef = doc(db, 'environments', user.uid);
        const envDoc = await getDocs(envRef);
        
        if (envDoc.exists()) {
          const data = envDoc.data();
          setEnvironmentData({
            temperature: data.temperature || '--',
            humidity: data.humidity || '--',
            lastUpdate: data.lastUpdate ? data.lastUpdate.toDate() : null,
            notes: data.notes || '',
            history: data.history.map(h => ({
              ...h,
              timestamp: h.timestamp.toDate()
            }))
          });
        }
      } catch (error) {
        console.error('Error loading environment data:', error);
      }
    };

    loadEnvironmentData();
  }, [user]);

  const formatDate = (date) => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const calculateDaysSince = (startDate) => {
    const now = new Date();
    const start = new Date(startDate);
    const diffTime = Math.abs(now - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const validateAndParseDate = (dateString) => {
    // Accept format MM/DD/YY or MM/DD/YYYY
    const dateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/(\d{2}|\d{4})$/;
    if (!dateRegex.test(dateString)) {
      return null;
    }

    const [month, day, year] = dateString.split('/').map(num => parseInt(num, 10));
    const fullYear = year < 100 ? 2000 + year : year;
    const date = new Date(fullYear, month - 1, day);

    // Validate the date is real (e.g., not 02/31/2024)
    if (date.getMonth() !== month - 1 || date.getDate() !== day || date.getFullYear() !== fullYear) {
      return null;
    }

    return date;
  };

  const handleDateInputChange = (text) => {
    // Allow typing the date
    setDateInput(text);
    
    // Auto-add slashes
    if (text.length === 2 && dateInput.length === 1) {
      setDateInput(text + '/');
    } else if (text.length === 5 && dateInput.length === 4) {
      setDateInput(text + '/');
    }
    
    // Validate and update the actual date
    const date = validateAndParseDate(text);
    if (date) {
      setStartDate(date);
    }
  };

  const handleAddNewGrow = async () => {
    if (!speciesInput.trim()) {
      Alert.alert('Missing Information', 'Please enter a species name');
      return;
    }

    const date = validateAndParseDate(dateInput);
    if (!date) {
      Alert.alert('Invalid Date', 'Please enter a valid date in MM/DD/YY format');
      return;
    }

    try {
      setLoading(true);
      
      const now = new Date();
      const newGrow = {
        userId: user.uid,
        species: speciesInput.trim(),
        startDate: date,
        stage: selectedStage,
        createdAt: now,
        updatedAt: now
      };

      // Add to local state first for immediate feedback
      const tempId = 'temp-' + now.getTime();
      setActiveGrows(prevGrows => [{
        id: tempId,
        ...newGrow
      }, ...prevGrows]);

      // Reset form and close modal immediately
      setSpeciesInput('');
      setDateInput(formatDate(new Date()));
      setStartDate(new Date());
      setSelectedStage(GROW_STAGES[0]);
      setShowNewGrowModal(false);
      
      // Then update Firestore
      const docRef = await addDoc(collection(db, 'grows'), newGrow);
      
      // Update the temporary ID with the real one
      setActiveGrows(prevGrows => prevGrows.map(grow => 
        grow.id === tempId ? { ...grow, id: docRef.id } : grow
      ));
      
    } catch (error) {
      console.error('Error adding grow:', error);
      Alert.alert('Error', 'Failed to save your grow');
      setActiveGrows(prevGrows => prevGrows.filter(grow => !grow.id.startsWith('temp-')));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEnvironment = async () => {
    // Validate inputs
    const temp = parseFloat(tempInput);
    const humidity = parseFloat(humidityInput);

    if (isNaN(temp) || isNaN(humidity)) {
      Alert.alert('Invalid Input', 'Please enter valid numbers for temperature and humidity');
      return;
    }

    if (humidity < 0 || humidity > 100) {
      Alert.alert('Invalid Humidity', 'Humidity must be between 0 and 100%');
      return;
    }

    if (temp < 0 || temp > 120) {
      Alert.alert('Invalid Temperature', 'Temperature must be between 0°F and 120°F');
      return;
    }

    try {
      setLoading(true);
      const timestamp = new Date();
      const newReading = {
        temperature: temp.toString(),
        humidity: humidity.toString(),
        timestamp,
        notes: notesInput
      };

      const envRef = doc(db, 'environments', user.uid);
      await updateDoc(envRef, {
        temperature: temp.toString(),
        humidity: humidity.toString(),
        lastUpdate: timestamp,
        notes: notesInput,
        history: [newReading, ...environmentData.history.slice(0, 9)] // Keep last 10 readings
      });

      setEnvironmentData(prev => ({
        ...prev,
        temperature: temp.toString(),
        humidity: humidity.toString(),
        lastUpdate: timestamp,
        notes: notesInput,
        history: [newReading, ...prev.history].slice(0, 10)
      }));
      
      setShowEnvModal(false);
      setTempInput('');
      setHumidityInput('');
      setNotesInput('');
    } catch (error) {
      console.error('Error updating environment:', error);
      Alert.alert('Error', 'Failed to update environment data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.accent1} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.headerContainer}>
          <Text style={styles.header}>My Grows</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowNewGrowModal(true)}
          >
            <Ionicons name="add-circle" size={24} color={theme.colors.accent1} />
            <Text style={styles.addButtonText}>New Grow</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.activeGrowsSection}>
          <Text style={styles.sectionHeader}>Active Grows</Text>
          {activeGrows.length === 0 ? (
            <Text style={styles.noGrowsText}>No active grows. Start a new grow!</Text>
          ) : (
            activeGrows.map(grow => (
              <View key={grow.id} style={styles.growCard}>
                <View style={styles.growHeader}>
                  <Text style={styles.growTitle}>{grow.species}</Text>
                  <TouchableOpacity>
                    <Ionicons name="ellipsis-horizontal" size={24} color={theme.colors.neutral2} />
                  </TouchableOpacity>
                </View>
                <View style={styles.growDetails}>
                  <View style={styles.detailItem}>
                    <Ionicons name="calendar-outline" size={20} color={theme.colors.accent1} />
                    <Text style={styles.detailText}>Started: {formatDate(new Date(grow.startDate))}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="leaf-outline" size={20} color={theme.colors.accent1} />
                    <Text style={styles.detailText}>Stage: {grow.stage}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="time-outline" size={20} color={theme.colors.accent1} />
                    <Text style={styles.detailText}>Day {calculateDaysSince(grow.startDate)}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.updateButton}>
                  <Text style={styles.updateButtonText}>Update Progress</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        <View style={styles.environmentSection}>
          <Text style={styles.sectionHeader}>Environment</Text>
          <View style={styles.envCard}>
            <View style={styles.envRow}>
              <View style={styles.envItem}>
                <Ionicons name="thermometer-outline" size={24} color={theme.colors.accent1} />
                <Text style={styles.envLabel}>Temperature</Text>
                <Text style={styles.envValue}>{environmentData.temperature}°F</Text>
              </View>
              <View style={styles.envItem}>
                <Ionicons name="water-outline" size={24} color={theme.colors.accent1} />
                <Text style={styles.envLabel}>Humidity</Text>
                <Text style={styles.envValue}>{environmentData.humidity}%</Text>
              </View>
            </View>
            
            {environmentData.lastUpdate && (
              <Text style={styles.lastUpdate}>
                Last updated: {environmentData.lastUpdate.toLocaleString()}
              </Text>
            )}
            
            {environmentData.notes && (
              <View style={styles.notesContainer}>
                <Text style={styles.notesLabel}>Notes:</Text>
                <Text style={styles.notesText}>{environmentData.notes}</Text>
              </View>
            )}

            <View style={styles.envButtonsContainer}>
              <TouchableOpacity 
                style={styles.updateButton}
                onPress={() => setShowEnvModal(true)}
              >
                <Text style={styles.updateButtonText}>Update Environment</Text>
              </TouchableOpacity>

              {environmentData.history.length > 0 && (
                <TouchableOpacity 
                  style={[styles.updateButton, styles.historyButton]}
                  onPress={() => setShowHistory(true)}
                >
                  <Text style={styles.updateButtonText}>View History</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Environment Update Modal */}
        <Modal
          visible={showEnvModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowEnvModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Update Environment</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Temperature (°F)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={tempInput}
                  onChangeText={setTempInput}
                  placeholder="Enter temperature"
                  placeholderTextColor={theme.colors.neutral2}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Humidity (%)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={humidityInput}
                  onChangeText={setHumidityInput}
                  placeholder="Enter humidity"
                  placeholderTextColor={theme.colors.neutral2}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.notesInput]}
                  value={notesInput}
                  onChangeText={setNotesInput}
                  placeholder="Add notes about conditions..."
                  placeholderTextColor={theme.colors.neutral2}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.updateButton, styles.cancelButton]}
                  onPress={() => setShowEnvModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.updateButton}
                  onPress={handleUpdateEnvironment}
                >
                  <Text style={styles.updateButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* History Modal */}
        <Modal
          visible={showHistory}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowHistory(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Reading History</Text>
              
              <ScrollView style={styles.historyList}>
                {environmentData.history.map((reading, index) => (
                  <View key={index} style={styles.historyItem}>
                    <Text style={styles.historyDate}>
                      {reading.timestamp.toLocaleString()}
                    </Text>
                    <View style={styles.historyReadings}>
                      <Text style={styles.historyText}>
                        Temp: {reading.temperature}°F
                      </Text>
                      <Text style={styles.historyText}>
                        Humidity: {reading.humidity}%
                      </Text>
                    </View>
                    {reading.notes && (
                      <Text style={styles.historyNotes}>{reading.notes}</Text>
                    )}
                  </View>
                ))}
              </ScrollView>

              <TouchableOpacity 
                style={styles.updateButton}
                onPress={() => setShowHistory(false)}
              >
                <Text style={styles.updateButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* New Grow Modal */}
        <Modal
          visible={showNewGrowModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowNewGrowModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Start New Grow</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Species Name</Text>
                <TextInput
                  style={styles.input}
                  value={speciesInput}
                  onChangeText={setSpeciesInput}
                  placeholder="Enter species name"
                  placeholderTextColor={theme.colors.neutral2}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Start Date (MM/DD/YY)</Text>
                <TextInput
                  style={styles.input}
                  value={dateInput}
                  onChangeText={handleDateInputChange}
                  placeholder="MM/DD/YY"
                  keyboardType="numeric"
                  maxLength={8}
                />
              </View>

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

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.updateButton, styles.cancelButton]}
                  onPress={() => setShowNewGrowModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.updateButton}
                  onPress={handleAddNewGrow}
                >
                  <Text style={styles.updateButtonText}>Start Grow</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  header: {
    ...theme.typography.h1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
  },
  addButtonText: {
    ...theme.typography.body,
    color: theme.colors.accent1,
    marginLeft: theme.spacing.xs,
  },
  activeGrowsSection: {
    padding: theme.spacing.md,
  },
  sectionHeader: {
    ...theme.typography.h2,
    marginBottom: theme.spacing.md,
  },
  growCard: {
    backgroundColor: theme.colors.neutral3,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.medium,
  },
  growHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  growTitle: {
    ...theme.typography.h2,
    color: theme.colors.primary,
  },
  growDetails: {
    marginBottom: theme.spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  detailText: {
    ...theme.typography.body,
    marginLeft: theme.spacing.sm,
    color: theme.colors.neutral2,
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
  environmentSection: {
    padding: theme.spacing.md,
  },
  envCard: {
    backgroundColor: theme.colors.neutral3,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.small,
  },
  envRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  envItem: {
    alignItems: 'center',
  },
  envLabel: {
    ...theme.typography.caption,
    color: theme.colors.neutral2,
    marginTop: theme.spacing.xs,
  },
  envValue: {
    ...theme.typography.h2,
    color: theme.colors.primary,
    marginTop: theme.spacing.xs,
  },
  envButtonsContainer: {
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  lastUpdate: {
    ...theme.typography.caption,
    color: theme.colors.neutral2,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
  notesContainer: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.sm,
  },
  notesLabel: {
    ...theme.typography.caption,
    color: theme.colors.neutral2,
    marginBottom: theme.spacing.xs,
  },
  notesText: {
    ...theme.typography.body,
    color: theme.colors.primary,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  historyButton: {
    backgroundColor: theme.colors.accent2,
  },
  historyList: {
    maxHeight: 400,
    marginVertical: theme.spacing.md,
  },
  historyItem: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.neutral3,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  historyDate: {
    ...theme.typography.caption,
    color: theme.colors.neutral2,
    marginBottom: theme.spacing.xs,
  },
  historyReadings: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  historyText: {
    ...theme.typography.body,
    color: theme.colors.primary,
  },
  historyNotes: {
    ...theme.typography.body,
    color: theme.colors.neutral2,
    fontStyle: 'italic',
    marginTop: theme.spacing.xs,
  },
  cancelButton: {
    backgroundColor: theme.colors.neutral1,
  },
  cancelButtonText: {
    color: theme.colors.primary,
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
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.lg,
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
  noGrowsText: {
    ...theme.typography.body,
    color: theme.colors.neutral2,
    textAlign: 'center',
    padding: theme.spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.secondary,
  },
}); 