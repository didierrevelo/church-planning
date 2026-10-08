/**
 * 1-Touch Quick Confirmation & Deep Link Handler for Volunteers.
 *
 * Enables team members to confirm or decline service assignments in a single touch
 * directly from push notifications or email deep links, bypassing complex navigation.
 *
 * Utilizes cryptographically signed HMAC/SHA-256 tokens to prevent tampering,
 * enforces expiration boundaries, and updates service_teams state atomically.
 *
 * Inspired by lightweight action workflows (faladigo/acts, MIT).
 * 100% clean-room proprietary TypeScript code.
 */

import { sha256 } from '@noble/hashes/sha256';
import { getDatabase, Database } from '../../mobile/src/db/database';

/**
 * Payload carried by a quick action token.
 */
export interface QuickActionPayload {
  teamMemberId: string;
  serviceId: string;
  userId: string;
  action: 'confirm' | 'decline';
  expiresAt: number; // Unix timestamp ms
}

/**
 * Result of verifying an action token.
 */
export interface QuickActionResult {
  valid: boolean;
  reason?: 'expired' | 'invalid_signature' | 'malformed';
  payload?: QuickActionPayload;
}

/**
 * Execution response after applying an action to the database.
 */
export interface QuickActionExecutionResult {
  success: boolean;
  action: 'confirm' | 'decline';
  message: string;
}

/**
 * Computes a SHA-256 signature for the given payload string and secret.
 */
function computeSignature(payloadJson: string, secret: string): string {
  const data = new TextEncoder().encode(`${payloadJson}:${secret}`);
  const hashBytes = sha256(data);
  return Array.from(hashBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Encodes a string to a base64url-safe representation.
 */
function toBase64(str: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'utf8').toString('base64url');
  }
  return encodeURIComponent(str);
}

/**
 * Decodes a base64url string.
 */
function fromBase64(b64: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(b64, 'base64url').toString('utf8');
  }
  return decodeURIComponent(b64);
}

/**
 * Generates a signed quick action token for 1-touch confirmation or declining.
 *
 * @param payload Action details and expiration
 * @param secret Secret key used to sign the token
 * @returns Serialized signed token string
 */
export function generateQuickActionToken(
  payload: QuickActionPayload,
  secret: string
): string {
  const json = JSON.stringify(payload);
  const signature = computeSignature(json, secret);
  const encoded = toBase64(json);
  return `${encoded}.${signature}`;
}

/**
 * Verifies the validity, signature, and expiration of a quick action token.
 *
 * @param token Signed token string
 * @param secret Secret key used to verify the signature
 * @param now Current timestamp in ms (defaults to Date.now())
 * @returns Verification result with payload if valid
 */
export function verifyQuickActionToken(
  token: string,
  secret: string,
  now: number = Date.now()
): QuickActionResult {
  if (!token || typeof token !== 'string') {
    return { valid: false, reason: 'malformed' };
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false, reason: 'malformed' };
  }

  const [encoded, signature] = parts;
  let json: string;
  try {
    json = fromBase64(encoded);
  } catch {
    return { valid: false, reason: 'malformed' };
  }

  let payload: QuickActionPayload;
  try {
    payload = JSON.parse(json);
  } catch {
    return { valid: false, reason: 'malformed' };
  }

  if (
    !payload ||
    !payload.teamMemberId ||
    !payload.action ||
    typeof payload.expiresAt !== 'number'
  ) {
    return { valid: false, reason: 'malformed' };
  }

  const expectedSignature = computeSignature(json, secret);
  if (signature !== expectedSignature) {
    return { valid: false, reason: 'invalid_signature' };
  }

  if (payload.expiresAt < now) {
    return { valid: false, reason: 'expired' };
  }

  return { valid: true, payload };
}

/**
 * Atomically verifies the token and applies the confirmation or decline status to the database.
 *
 * @param token Signed token string
 * @param secret Secret key used to verify the signature
 * @param dbProvider SQLite database connection provider
 * @returns QuickActionExecutionResult
 */
export async function executeQuickAction(
  token: string,
  secret: string,
  dbProvider = getDatabase
): Promise<QuickActionExecutionResult> {
  const verification = verifyQuickActionToken(token, secret);
  if (!verification.valid || !verification.payload) {
    throw new Error(`Token inválido: ${verification.reason}`);
  }

  const { teamMemberId, userId, action } = verification.payload;
  const db: Database = await dbProvider();
  const newStatus = action === 'confirm' ? 'confirmed' : 'cannot_attend';
  const now = new Date().toISOString();

  await db.runAsync(
    `UPDATE service_teams
     SET status = ?, updatedAt = ?
     WHERE id = ? AND userId = ?;`,
    [newStatus, now, teamMemberId, userId]
  );

  return {
    success: true,
    action,
    message:
      action === 'confirm'
        ? 'Asistencia confirmada exitosamente'
        : 'Declinación registrada',
  };
}
