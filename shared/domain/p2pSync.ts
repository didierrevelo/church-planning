/**
 * Peer-to-Peer (P2P) Offline Local Synchronization Protocol.
 *
 * Implements deterministic delta synchronization between church devices
 * operating over local Wi-Fi / LAN when internet connectivity is unavailable.
 *
 * Enforces tenant isolation (churchId matching), protocol version validation,
 * incremental change extraction, and deterministic Last-Write-Wins (LWW) conflict resolution.
 *
 * 100% proprietary clean-room TypeScript code (Free of copyleft restrictions).
 */

export const CURRENT_P2P_PROTOCOL_VERSION = 1;

/**
 * Handshake payload sent during initial peer connection establishment.
 */
export interface P2PHandshakeRequest {
  protocolVersion: number;
  churchId: string;
  deviceId: string;
  lastSyncTimestamp?: string | null;
}

/**
 * Result of validating an incoming handshake request.
 */
export interface HandshakeValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Common shape for any database record participating in delta sync.
 */
export interface SyncableEntity {
  id: string;
  updatedAt: string;
  [key: string]: any;
}

/**
 * Creates a formatted handshake request packet.
 *
 * @param churchId Tenant church identifier
 * @param deviceId Unique local device identifier
 * @param lastSyncTimestamp Timestamp of last successful sync
 * @returns Formatted P2PHandshakeRequest
 */
export function createHandshakeRequest(
  churchId: string,
  deviceId: string,
  lastSyncTimestamp?: string | null
): P2PHandshakeRequest {
  return {
    protocolVersion: CURRENT_P2P_PROTOCOL_VERSION,
    churchId,
    deviceId,
    lastSyncTimestamp: lastSyncTimestamp ?? null,
  };
}

/**
 * Validates an incoming peer handshake against tenant boundaries and supported protocol version.
 *
 * @param request Incoming handshake packet
 * @param expectedChurchId Local church identifier to protect tenant privacy
 * @returns HandshakeValidationResult
 */
export function validateHandshake(
  request: P2PHandshakeRequest,
  expectedChurchId: string
): HandshakeValidationResult {
  if (!request || typeof request !== 'object') {
    return { valid: false, error: 'Malformed handshake packet' };
  }

  if (request.protocolVersion !== CURRENT_P2P_PROTOCOL_VERSION) {
    return {
      valid: false,
      error: `Unsupported protocol version: ${request.protocolVersion} (expected ${CURRENT_P2P_PROTOCOL_VERSION})`,
    };
  }

  if (request.churchId !== expectedChurchId) {
    return {
      valid: false,
      error: `Church mismatch: Peer belongs to church '${request.churchId}', expected '${expectedChurchId}'`,
    };
  }

  return { valid: true };
}

/**
 * Extracts entities that have been modified after a given timestamp.
 *
 * @param items List of syncable entities
 * @param lastSyncTimestamp Base timestamp in ISO format, or null/undefined
 * @returns Filtered array of changed entities
 */
export function extractDeltaSince<T extends SyncableEntity>(
  items: T[],
  lastSyncTimestamp?: string | null
): T[] {
  if (!items || items.length === 0) {
    return [];
  }

  if (!lastSyncTimestamp) {
    return [...items];
  }

  const thresholdMs = new Date(lastSyncTimestamp).getTime();

  return items.filter((item) => {
    const itemMs = new Date(item.updatedAt).getTime();
    return itemMs > thresholdMs;
  });
}

/**
 * Merges incoming delta entities into a local set using Last-Write-Wins (LWW) conflict resolution.
 *
 * If an incoming entity has a newer `updatedAt` timestamp than the local entity with the same `id`,
 * the incoming entity replaces the local one. Otherwise, the local entity is preserved.
 * Any new incoming entities are appended.
 *
 * @param localItems Current local entity collection
 * @param incomingDeltas Remote changed entities to apply
 * @returns Merged list of entities
 */
export function mergeEntityDeltas<T extends SyncableEntity>(
  localItems: T[],
  incomingDeltas: T[]
): T[] {
  const mergedMap = new Map<string, T>();

  // Initialize with local records
  for (const item of localItems) {
    mergedMap.set(item.id, item);
  }

  // Apply incoming deltas
  for (const delta of incomingDeltas) {
    const existing = mergedMap.get(delta.id);

    if (!existing) {
      // Brand new entity
      mergedMap.set(delta.id, delta);
    } else {
      const existingMs = new Date(existing.updatedAt).getTime();
      const deltaMs = new Date(delta.updatedAt).getTime();

      // Last-Write-Wins resolution
      if (deltaMs > existingMs) {
        mergedMap.set(delta.id, delta);
      }
    }
  }

  return Array.from(mergedMap.values());
}
