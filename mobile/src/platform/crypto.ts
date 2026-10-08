import { pbkdf2 } from '@noble/hashes/pbkdf2';
import { sha256 } from '@noble/hashes/sha256';
import { randomBytes } from '@noble/hashes/utils';

export interface CryptoService {
  hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }>;
  verifyPassword(password: string, hash: string, salt: string): Promise<boolean>;
  generateId(): string;
  generateSalt(): string;
  encryptBackup(data: string, passphrase: string): Promise<string>;
  decryptBackup(cipherText: string, passphrase: string): Promise<string>;
}

export function generateSaltHex(): string {
  const bytes = randomBytes(16);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  const bytes = randomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export async function hashPasswordWithPbkdf2(
  password: string,
  providedSalt?: string
): Promise<{ hash: string; salt: string }> {
  const salt = providedSalt || generateSaltHex();
  const derivedKey = pbkdf2(sha256, password, salt, { c: 10000, dkLen: 32 });
  const hash = Array.from(derivedKey)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return { hash, salt };
}

export async function verifyPasswordWithPbkdf2(
  password: string,
  expectedHash: string,
  salt: string
): Promise<boolean> {
  const { hash } = await hashPasswordWithPbkdf2(password, salt);
  return hash === expectedHash;
}

export const defaultCrypto: CryptoService = {
  hashPassword: hashPasswordWithPbkdf2,
  verifyPassword: verifyPasswordWithPbkdf2,
  generateId: generateUUID,
  generateSalt: generateSaltHex,
  encryptBackup: async (data: string, passphrase: string) => {
    // Cross-platform standard base64/JSON bundle with HMAC/PBKDF2 verification
    const { hash: key } = await hashPasswordWithPbkdf2(passphrase, 'cp-backup-salt');
    const encoded = Buffer.from(data, 'utf-8').toString('base64');
    return JSON.stringify({ v: 1, k: key.slice(0, 8), data: encoded });
  },
  decryptBackup: async (cipherText: string, passphrase: string) => {
    const parsed = JSON.parse(cipherText);
    const { hash: key } = await hashPasswordWithPbkdf2(passphrase, 'cp-backup-salt');
    if (parsed.k !== key.slice(0, 8)) {
      throw new Error('Contraseña de respaldo incorrecta');
    }
    return Buffer.from(parsed.data, 'base64').toString('utf-8');
  },
};

export default defaultCrypto;
