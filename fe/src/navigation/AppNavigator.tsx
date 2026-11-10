import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import type { AppStackParamList } from './types';
import { HomeScreen } from '../screens/HomeScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { theme } from '../theme';

const Tab = createBottomTabNavigator<AppStackParamList>();

export function AppNavigator(): React.JSX.Element {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.text,
        tabBarStyle: { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border },
        tabBarActiveTintColor: theme.colors.brand,
        tabBarInactiveTintColor: theme.colors.textMuted,
        // Ícono simple con texto — en semanas futuras usaremos react-native-vector-icons
        tabBarIcon: ({ color }) => {
          const icons: Record<string, string> = {
            Home: '🏟️',
            Profile: '👤',
          };
          return <Text style={{ fontSize: 18 }}>{icons[route.name] ?? '•'}</Text>;
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Concesiones' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Mi Perfil' }}
      />
    </Tab.Navigator>
  );
}
