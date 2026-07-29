import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppNavigator from './src/navigation/AppNavigator';
import ResponsiveContainer from './src/components/ResponsiveContainer';
import ErrorBoundary from './src/components/ErrorBoundary';
import { ToastProvider } from './src/contexts/ToastContext';
import { notificationsAPI } from './src/services/api';
import { processQueue } from './src/utils/mutationQueue';

function AppContent() {
  useEffect(() => {
    const init = async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      try {
        await processQueue();
      } catch (err) {
        console.error('Mutation queue processing error:', err);
      }

      if (Platform.OS !== 'web') {
        try {
          const expoPushToken = await AsyncStorage.getItem('expoPushToken');
          if (expoPushToken) {
            const churchId = await AsyncStorage.getItem('churchId');
            if (churchId) {
              await notificationsAPI.registerToken(expoPushToken);
            }
          }
        } catch (err) {
          console.error('Push token registration error:', err);
        }
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
