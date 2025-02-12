import { Platform } from 'react-native';
import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';

export const loadFonts = async () => {
  if (Platform.OS === 'web') {
    await Font.loadAsync(Ionicons.font);
  }
}; 