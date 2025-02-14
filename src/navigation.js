import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { TouchableOpacity } from 'react-native';
import { Icon } from './components/Icon';

import { useAuth } from './context/AuthContext';
import { theme } from './utils/theme';

// Auth Screens
import LoginScreen from './screens/auth/LoginScreen';
import SignupScreen from './screens/auth/SignupScreen';

// App Screens
import DashboardScreen from './screens/DashboardScreen';
// import CommunityScreen from './screens/CommunityScreen'; // Preserved for V2
import ProfileScreen from './screens/ProfileScreen';
import GrowDetailsScreen from './screens/GrowDetailsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function AppStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="MainTabs" 
        component={AppTabs} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="GrowDetails" 
        component={GrowDetailsScreen}
        options={{ 
          headerShown: false,
          presentation: 'modal'
        }}
      />
    </Stack.Navigator>
  );
}

function AppTabs() {
  const { logout } = useAuth();

  const LogoutButton = () => (
    <TouchableOpacity
      onPress={logout}
      style={{ marginRight: theme.spacing.md }}
    >
      <Icon name="log-out-outline" size={24} color={theme.colors.secondary} />
    </TouchableOpacity>
  );

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.accent1,
        tabBarInactiveTintColor: theme.colors.neutral2,
        tabBarStyle: {
          paddingBottom: theme.spacing.sm,
          paddingTop: theme.spacing.sm,
          height: 60,
          backgroundColor: theme.colors.secondary,
          borderTopColor: theme.colors.neutral1,
        },
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.secondary,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerRight: () => <LogoutButton />,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{
          title: 'My Grows',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
      />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: theme.colors.secondary }
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
}

export default function Navigation() {
  const { user } = useAuth();

  return (
    <NavigationContainer>
      {user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
} 