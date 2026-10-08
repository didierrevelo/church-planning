import { Platform } from 'react-native';

export interface FileStorageInterface {
  saveFile(name: string, contentBase64: string): Promise<{ uri: string; size: number }>;
  readFile(uri: string): Promise<string>;
  deleteFile(uri: string): Promise<void>;
  listLocalFiles(): Promise<string[]>;
}

class WebFileStorage implements FileStorageInterface {
  private prefix = 'cp_file_';

  async saveFile(name: string, contentBase64: string): Promise<{ uri: string; size: number }> {
    const key = this.prefix + name;
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, contentBase64);
    }
    const size = Math.round((contentBase64.length * 3) / 4);
    return { uri: `local-web://${name}`, size };
  }

  async readFile(uri: string): Promise<string> {
    const name = uri.replace('local-web://', '');
    const key = this.prefix + name;
    return (typeof window !== 'undefined' && window.localStorage?.getItem(key)) || '';
  }

  async deleteFile(uri: string): Promise<void> {
    const name = uri.replace('local-web://', '');
    const key = this.prefix + name;
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  }

  async listLocalFiles(): Promise<string[]> {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(this.prefix)) {
        keys.push(k.replace(this.prefix, ''));
      }
    }
    return keys;
  }
}

class NativeFileStorage implements FileStorageInterface {
  private getDir(): string {
    const FileSystem = require('expo-file-system');
    return `${FileSystem.documentDirectory}church_files/`;
  }

  private async ensureDir(): Promise<void> {
    const FileSystem = require('expo-file-system');
    const dir = this.getDir();
    const info = await FileSystem.getInfoAsync(dir);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }
  }

  async saveFile(name: string, contentBase64: string): Promise<{ uri: string; size: number }> {
    const FileSystem = require('expo-file-system');
    await this.ensureDir();
    const fileUri = `${this.getDir()}${name}`;
    await FileSystem.writeAsStringAsync(fileUri, contentBase64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const info = await FileSystem.getInfoAsync(fileUri);
    return { uri: fileUri, size: info.size || 0 };
  }

  async readFile(uri: string): Promise<string> {
    const FileSystem = require('expo-file-system');
    return await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  }

  async deleteFile(uri: string): Promise<void> {
    const FileSystem = require('expo-file-system');
    await FileSystem.deleteAsync(uri, { idempotent: true });
  }

  async listLocalFiles(): Promise<string[]> {
    const FileSystem = require('expo-file-system');
    await this.ensureDir();
    return await FileSystem.readDirectoryAsync(this.getDir());
  }
}

export const fileStorage: FileStorageInterface =
  Platform.OS === 'web' ? new WebFileStorage() : new NativeFileStorage();

export default fileStorage;
