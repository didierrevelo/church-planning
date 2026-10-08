import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppNavigator from './src/navigation/AppNavigator';
import ResponsiveContainer from './src/components/ResponsiveContainer';
import ErrorBoundary from './src/components/ErrorBoundary';
import { ToastProvider } from './src/contexts/ToastContext';
import { getDatabase } from './src/db/database';

function AppContent() {
  useEffect(() => {
    const init = async () => {
      try {
        await getDatabase();
      } catch (err) {
        console.error('Error inicializando base de datos local:', err);
      }
    };
    init();
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <ToastProvider>
        <AppNavigator />
      </ToastProvider>
    </>
  );
}

export default function App() {
  const app = (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );

  if (Platform.OS === 'web') {
    return (
      <SafeAreaProvider>
        <ResponsiveContainer padded={false}>
          {app}
        </ResponsiveContainer>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      {app}
    </SafeAreaProvider>
  );
}
