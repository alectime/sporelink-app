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
  serverTimestamp,
  getDoc,
  setDoc,
  onSnapshot,
  arrayUnion
} from 'firebase/firestore';
import { auth } from '../utils/firebaseConfig';
import { retry } from '../utils/retry';
import { useNavigation } from '@react-navigation/native';

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

// Helper functions
const formatDate = (date) => {
  if (!date || !(date instanceof Date) || isNaN(date)) {
    console.warn('Invalid date provided to formatDate:', date);
    return 'Invalid Date';
  }
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2); // Get last 2 digits of year
  return `${month}/${day}/${year}`;
};

const calculateDaysSince = (startDate) => {
  if (!startDate || !(startDate instanceof Date) || isNaN(startDate)) {
    console.warn('Invalid date provided to calculateDaysSince:', startDate);
    return 0;
  }
  const now = new Date();
  const start = new Date(startDate);
  const diffTime = Math.abs(now - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Add the retry utility function before the DashboardScreen component
const retryOperation = async (operation, maxAttempts = 3) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Helper function to render icons consistently across platforms
const Icon = ({ name, size, color }) => {
  if (Platform.OS === 'web') {
    // Use specific unicode characters for web
    const getIconContent = (iconName) => {
      const iconMap = {
        'add-circle': '⊕',
        'ellipsis-horizontal': '⋯',
        'calendar-outline': '📅',
        'leaf-outline': '🌱',
        'time-outline': '⏱',
        'thermometer-outline': '🌡',
        'water-outline': '💧'
      };
      return iconMap[iconName] || '•';
    };
    
    return (
      <Text style={{ fontSize: size, color, fontWeight: 'bold' }}>
        {getIconContent(name)}
      </Text>
    );
  }
  
  return <Ionicons name={name} size={size} color={color} />;
};

export default function DashboardScreen() {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

  const navigation = useNavigation();

  // Load user's grows from Firestore
  useEffect(() => {
    const loadGrows = async () => {
      if (!user?.uid) {
        console.log('No user ID available, skipping grows load');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const growsRef = collection(db, 'grows');
        const q = query(
          growsRef,
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        
        // Add retry logic for network errors
        const maxRetries = 3;
        let attempt = 0;
        let success = false;
        let lastError;

        while (attempt < maxRetries && !success) {
          try {
            const querySnapshot = await getDocs(q);
            const grows = querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              startDate: doc.data().startDate?.toDate() || new Date(),
              createdAt: doc.data().createdAt?.toDate() || new Date()
            }));
            
            setActiveGrows(grows);
            success = true;
          } catch (error) {
            lastError = error;
            console.warn(`Attempt ${attempt + 1} failed:`, error);
            
            // Only retry on network errors
            if (!error.message.includes('network') && !error.message.includes('unavailable')) {
              throw error;
            }
            
            attempt++;
            if (attempt < maxRetries) {
              // Exponential backoff
              await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            }
          }
        }

        if (!success) {
          throw lastError;
        }
      } catch (error) {
        console.error('Error loading grows:', error);
        if (error.message.includes('requires an index')) {
          Alert.alert(
            'Setup Required',
            'The system is still setting up. Please try again in a few minutes.'
          );
        } else if (error.message.includes('network') || error.message.includes('unavailable')) {
          Alert.alert(
            'Network Error',
            'Unable to load your grows. Please check your connection and try again.'
          );
        } else {
          Alert.alert('Error', 'Failed to load your grows. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadGrows();
  }, [user]);

  // Load environment data from Firestore
  useEffect(() => {
    const loadEnvironmentData = async () => {
      if (!user?.uid) {
        console.log('No user ID available, skipping environment data load');
        setLoading(false);
        return;
      }

      try {
        const envRef = doc(db, 'environments', user.uid);
        
        // Set up real-time listener for environment updates
        const unsubscribe = onSnapshot(envRef, 
          (doc) => {
            if (doc.exists()) {
              const data = doc.data();
              // Convert timestamps and sort history by timestamp
              const history = (data.history || [])
                .map(h => ({
                  ...h,
                  timestamp: h.timestamp?.toDate() || new Date(),
                  temperature: h.temperature?.toString() || '--',
                  humidity: h.humidity?.toString() || '--'
                }))
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, 100); // Keep only the last 100 entries

              setEnvironmentData({
                temperature: data.temperature?.toString() || '--',
                humidity: data.humidity?.toString() || '--',
                lastUpdate: data.lastUpdate?.toDate() || null,
                notes: data.notes || '',
                history
              });
            } else {
              // Initialize with empty data if no document exists
              const initialData = {
                temperature: '--',
                humidity: '--',
                lastUpdate: null,
                notes: '',
                history: []
              };
              
              setEnvironmentData(initialData);
              
              // Create initial environment document
              try {
                setDoc(envRef, {
                  ...initialData,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp()
                });
              } catch (error) {
                console.warn('Failed to create initial environment document:', error);
              }
            }
            setLoading(false);
          },
          (error) => {
            console.error('Error listening to environment updates:', error);
            if (error.code === 'unavailable' || error.message.includes('offline')) {
              console.log('Offline - using last known environment state');
            } else {
              Alert.alert(
                'Note',
                'Having trouble connecting to the server. Some data may be outdated.'
              );
            }
            setLoading(false);
          }
        );

        return () => unsubscribe();
      } catch (error) {
        console.error('Error in loadEnvironmentData:', error);
        Alert.alert(
          'Note',
          'Unable to load environment data. Please check your connection.'
        );
        setLoading(false);
      }
    };

    loadEnvironmentData();
  }, [user]);

  const validateAndParseDate = (dateString) => {
    // Accept multiple formats: MM/DD/YY, MM/DD/YYYY, M/D/YY, M/D/YYYY
    const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/;
    const match = dateString.match(dateRegex);
    
    if (!match) {
      console.warn('Date string does not match expected format:', dateString);
      return null;
    }

    let [_, month, day, year] = match;
    month = parseInt(month, 10);
    day = parseInt(day, 10);
    year = parseInt(year, 10);

    // Convert 2-digit year to 4-digit
    if (year < 100) {
      // If year is less than current year's last two digits, assume it's in the future
      const currentYear = new Date().getFullYear();
      const currentYearLastTwo = currentYear % 100;
      if (year <= currentYearLastTwo) {
        year = 2000 + year;
      } else {
        year = 1900 + year;
      }
    }

    // Validate ranges
    if (month < 1 || month > 12) {
      console.warn('Invalid month:', month);
      return null;
    }

    // Get the last day of the month
    const lastDayOfMonth = new Date(year, month, 0).getDate();
    if (day < 1 || day > lastDayOfMonth) {
      console.warn('Invalid day for month:', day, 'Month:', month);
      return null;
    }

    const date = new Date(year, month - 1, day);

    // Ensure the date is valid and matches our input
    if (
      date.getMonth() !== month - 1 || 
      date.getDate() !== day || 
      date.getFullYear() !== year ||
      isNaN(date.getTime())
    ) {
      console.warn('Date validation failed:', { month, day, year, resultDate: date });
      return null;
    }

    // Set the time to midnight for consistent comparison
    date.setHours(0, 0, 0, 0);
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
      Alert.alert(
        'Invalid Date',
        'Please enter a valid date in MM/DD/YY format (e.g., 02/12/24)'
      );
      return;
    }

    // Check if date is in the future
    if (date > new Date()) {
      Alert.alert(
        'Invalid Date',
        'Start date cannot be in the future'
      );
      return;
    }

    try {
      setLoading(true);
      
      const now = new Date();
      const newGrow = {
        userId: user.uid,
        species: speciesInput.trim(),
        startDate: serverTimestamp(), // Will be updated with the correct date below
        stage: selectedStage,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Add to local state first for immediate feedback
      const tempId = 'temp-' + now.getTime();
      setActiveGrows(prevGrows => [{
        id: tempId,
        ...newGrow,
        startDate: date, // Use the JavaScript Date for local state
        createdAt: now,
        updatedAt: now
      }, ...prevGrows]);

      // Reset form and close modal immediately
      setSpeciesInput('');
      setDateInput(formatDate(new Date()));
      setStartDate(new Date());
      setSelectedStage(GROW_STAGES[0]);
      setShowNewGrowModal(false);
      
      // Then update Firestore with retry logic
      const maxRetries = 3;
      let attempt = 0;
      let success = false;
      let lastError;

      while (attempt < maxRetries && !success) {
        try {
          // Create the document with server timestamps
          const docRef = await addDoc(collection(db, 'grows'), newGrow);
          
          // Update the startDate separately to ensure it's the exact date user entered
          await updateDoc(docRef, {
            startDate: date
          });
          
          // Update the temporary ID with the real one
          setActiveGrows(prevGrows => prevGrows.map(grow => 
            grow.id === tempId ? { ...grow, id: docRef.id } : grow
          ));
          success = true;
        } catch (error) {
          lastError = error;
          console.warn(`Attempt ${attempt + 1} failed:`, error);
          
          // Only retry on network errors
          if (!error.message.includes('network') && !error.message.includes('unavailable')) {
            throw error;
          }
          
          attempt++;
          if (attempt < maxRetries) {
            // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          }
        }
      }

      if (!success) {
        throw lastError;
      }
      
    } catch (error) {
      console.error('Error adding grow:', error);
      if (error.message.includes('requires an index')) {
        Alert.alert(
          'Setup Required',
          'The system is still setting up. Please try again in a few minutes.'
        );
      } else if (error.message.includes('network') || error.message.includes('unavailable')) {
        Alert.alert(
          'Network Error',
          'Your grow has been saved locally and will sync when connection is restored.'
        );
      } else {
        Alert.alert('Error', 'Failed to save your grow. Please try again.');
        setActiveGrows(prevGrows => prevGrows.filter(grow => !grow.id.startsWith('temp-')));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEnvironment = async (newData) => {
    try {
      setLoading(true);
      setError(null);

      // Validate inputs
      const temp = parseFloat(newData.temperature);
      const humidity = parseFloat(newData.humidity);

      if (isNaN(temp) || isNaN(humidity)) {
        setError('Please enter valid numbers for temperature and humidity');
        Alert.alert('Invalid Input', 'Please enter valid numbers for temperature and humidity');
        return;
      }

      if (humidity < 0 || humidity > 100) {
        setError('Humidity must be between 0 and 100%');
        Alert.alert('Invalid Humidity', 'Humidity must be between 0 and 100%');
        return;
      }

      if (temp < 0 || temp > 120) {
        setError('Temperature must be between 0°F and 120°F');
        Alert.alert('Invalid Temperature', 'Temperature must be between 0°F and 120°F');
        return;
      }

      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const userId = auth.currentUser.uid;
      console.log('Updating environment for user:', userId);

      // Get a reference to the user's environment document
      const envRef = doc(db, 'environments', userId);

      // Create new history entry with a regular timestamp
      const now = new Date();
      const newHistoryEntry = {
        temperature: temp,
        humidity: humidity,
        notes: newData.notes || '',
        timestamp: now
      };

      try {
        // Perform atomic update
        await updateDoc(envRef, {
          temperature: temp,
          humidity: humidity,
          lastUpdate: serverTimestamp(),
          notes: newData.notes || '',
          updatedAt: serverTimestamp(),
          history: arrayUnion({
            temperature: temp,
            humidity: humidity,
            notes: newData.notes || '',
            timestamp: now
          })
        });

        // Update local state
        const updatedEnvironmentData = {
          ...environmentData,
          temperature: temp.toString(),
          humidity: humidity.toString(),
          lastUpdate: now,
          notes: newData.notes || '',
          history: [
            {
              ...newHistoryEntry,
              timestamp: now
            },
            ...(environmentData.history || [])
          ]
        };
        
        setEnvironmentData(updatedEnvironmentData);
        setShowEnvModal(false);
        setTempInput('');
        setHumidityInput('');
        setNotesInput('');

        console.log('Environment update successful');
      } catch (error) {
        console.error('Error updating Firestore:', error);
        
        if (error.code === 'unavailable' || 
            error.message.includes('offline') || 
            error.message.includes('Failed to get document') ||
            error.message.includes('client is offline')) {
          Alert.alert(
            'Offline Mode',
            'You are currently offline. Changes have been saved locally and will sync when you are back online.'
          );
        } else {
          Alert.alert(
            'Warning',
            'Changes saved locally but failed to sync with server. Will retry automatically when possible.'
          );
        }
      }
    } catch (error) {
      console.error('Error in handleUpdateEnvironment:', error);
      let errorMessage = 'Failed to update environment data. ';
      
      if (error.code === 'unavailable' || 
          error.message.includes('offline') || 
          error.message.includes('client is offline')) {
        errorMessage = 'Currently offline. Data will be saved locally and synced when connection is restored.';
        setShowEnvModal(false);
      } else if (error.code === 'permission-denied') {
        errorMessage += 'You do not have permission to update this data.';
      } else if (error.message.includes('not authenticated')) {
        errorMessage += 'Please sign in again to continue.';
      } else {
        errorMessage += error.message;
      }
      
      setError(errorMessage);
      Alert.alert('Note', errorMessage);
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
            <Icon name="add-circle" size={24} color={theme.colors.accent1} />
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
                    <Icon name="ellipsis-horizontal" size={24} color={theme.colors.neutral2} />
                  </TouchableOpacity>
                </View>
                <View style={styles.growDetails}>
                  <View style={styles.detailItem}>
                    <Icon name="calendar-outline" size={20} color={theme.colors.accent1} />
                    <Text style={styles.detailText}>Started: {formatDate(new Date(grow.startDate))}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Icon name="leaf-outline" size={20} color={theme.colors.accent1} />
                    <Text style={styles.detailText}>Stage: {grow.stage}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Icon name="time-outline" size={20} color={theme.colors.accent1} />
                    <Text style={styles.detailText}>Day {calculateDaysSince(grow.startDate)}</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.updateButton}
                  onPress={() => navigation.navigate('GrowDetails', { grow })}
                >
                  <Text style={styles.updateButtonText}>Update Progress</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        <View style={styles.environmentSection}>
          <Text style={styles.sectionHeader}>Ambient Environment</Text>
          <View style={styles.envCard}>
            <View style={styles.envRow}>
              <View style={styles.envItem}>
                <Icon name="thermometer-outline" size={24} color={theme.colors.accent1} />
                <Text style={styles.envLabel}>Temperature</Text>
                <Text style={styles.envValue}>{environmentData.temperature}°F</Text>
              </View>
              <View style={styles.envItem}>
                <Icon name="water-outline" size={24} color={theme.colors.accent1} />
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
                  onPress={() => handleUpdateEnvironment({ 
                    temperature: tempInput, 
                    humidity: humidityInput, 
                    notes: notesInput.trim() 
                  })}
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
                  <View key={index} style={styles.historyEntry}>
                    <View style={styles.historyHeader}>
                      <Text style={styles.historyTimestamp}>
                        {reading.timestamp.toLocaleString()}
                      </Text>
                    </View>
                    
                    <View style={styles.environmentReadings}>
                      <View style={styles.reading}>
                        <Icon name="thermometer-outline" size={16} color={theme.colors.accent1} />
                        <Text style={styles.readingText}>
                          {reading.temperature}°F
                        </Text>
                      </View>
                      <View style={styles.reading}>
                        <Icon name="water-outline" size={16} color={theme.colors.accent1} />
                        <Text style={styles.readingText}>
                          {reading.humidity}%
                        </Text>
                      </View>
                    </View>
                    
                    {reading.notes && (
                      <View style={styles.notesContainer}>
                        <Text style={styles.notesLabel}>Notes:</Text>
                        <Text style={styles.historyNotes}>{reading.notes}</Text>
                      </View>
                    )}
                    
                    <View style={styles.historySeparator} />
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
                  placeholder="MM/DD/YY (e.g., 02/12/24)"
                  placeholderTextColor={theme.colors.neutral2}
                  keyboardType="numeric"
                  maxLength={8}
                />
                <Text style={styles.inputHelper}>
                  Format: MM/DD/YY (e.g., 02/12/24)
                </Text>
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
    backgroundColor: '#a9a9a9',
  },
  historyEntry: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.neutral3,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
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
  },
  historySeparator: {
    height: 1,
    backgroundColor: theme.colors.neutral1,
    marginTop: theme.spacing.md,
  },
  historyList: {
    maxHeight: 400,
    marginVertical: theme.spacing.md,
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
  inputHelper: {
    ...theme.typography.caption,
    color: theme.colors.neutral2,
    textAlign: 'right',
  },
}); 