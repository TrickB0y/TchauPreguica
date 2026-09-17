import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from './src/screens/HomeScreen';
import CaptureScreen from './src/screens/CaptureScreen';
import HistoryScreen from './src/screens/HistoryScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: '#ccc',
          headerShown: false,
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: '🏠 Início',
            tabBarLabel: 'Início',
          }}
        />
        <Tab.Screen
          name="Captura"
          component={CaptureScreen}
          options={{
            title: '📸 Capturar',
            tabBarLabel: 'Capturar',
          }}
        />
        <Tab.Screen
          name="Histórico"
          component={HistoryScreen}
          options={{
            title: '📋 Histórico',
            tabBarLabel: 'Histórico',
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}