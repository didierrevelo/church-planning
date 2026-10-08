import { Platform } from 'react-native';

export interface SecureStorageInterface {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

class WebSecureStorage implements SecureStorageInterface {
  private prefix = 'cp_sec_';

  async getItem(key: string): Promise<string | null> {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage.getItem(this.prefix + key);
  }

  async setItem(key: string, value: string): Promise<void> {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(this.prefix + key, value);
    }
  }

  async removeItem(key: string): Promise<void> {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(this.prefix + key);
    }
  }
}

class NativeSecureStorage implements SecureStorageInterface {
  async getItem(key: string): Promise<string | null> {
    try {
      const SecureStore = require('expo-secure-store');
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      const SecureStore = require('expo-secure-store');
      await SecureStore.setItemAsync(key, value);
    } catch (err) {
      console.warn('SecureStore setItem failed:', err);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      const SecureStore = require('expo-secure-store');
      await SecureStore.deleteItemAsync(key);
    } catch (err) {
      console.warn('SecureStore removeItem failed:', err);
    }
  }
}

export const secureStorage: SecureStorageInterface =
  Platform.OS === 'web' ? new WebSecureStorage() : new NativeSecureStorage();

export default secureStorage;
