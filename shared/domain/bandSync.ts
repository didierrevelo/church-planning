/**
 * Band Live Session Synchronization Protocol.
 *
 * Implements lightweight deterministic LAN/P2P sync for live worship teams,
 * keeping band members aligned on active songs, transposed keys, tempo,
 * and auto-scroll states during rehearsals and services.
 *
 * Inspired by decentralized session architectures (ChordVault / GraceChords).
 * 100% proprietary clean-room TypeScript code (free of copyleft restrictions).
 */

export const MIN_SCROLL_SPEED = 1;
export const MAX_SCROLL_SPEED = 5;

/**
 * Roles a band member can assume in a live session.
 */
export type BandMemberRole = 'director' | 'musician' | 'vocalist' | 'tech';

/**
 * Connected band member metadata.
 */
export interface BandMember {
  id: string;
  name: string;
  role: BandMemberRole;
  isHost: boolean;
  joinedAt: string;
}

/**
 * Real-time synchronization state of a band session.
 */
export interface BandSessionState {
  sessionId: string;
  serviceId: string;
  hostId: string;
  activeSongId: string | null;
  activeSongIndex: number;
  currentKey: string | null;
  bpm: number | null;
  isAutoScrolling: boolean;
  scrollSpeed: number;
  members: BandMember[];
  lastUpdated: string;
  version: number;
}

/**
 * Message types supported by the sync protocol.
 */
export type BandSyncMessageType =
  | 'JOIN'
  | 'LEAVE'
  | 'CHANGE_SONG'
  | 'TRANSPOSE'
  | 'TOGGLE_SCROLL'
  | 'SET_SPEED'
  | 'HEARTBEAT';

/**
 * Synchronized message packet sent across the network.
 */
export interface BandSyncMessage<T = any> {
  type: BandSyncMessageType;
  senderId: string;
  timestamp: string;
  version: number;
  payload: T;
}

/**
 * Initializes a new band sync session with the designated host.
 *
 * @param serviceId Associated service identifier
 * @param host Initial director/host creating the session
 * @returns Fresh session state at version 1
 */
export function createBandSession(
  serviceId: string,
  host: BandMember
): BandSessionState {
  const now = new Date().toISOString();
  return {
    sessionId: `band-session-${Date.now()}`,
    serviceId,
    hostId: host.id,
    activeSongId: null,
    activeSongIndex: 0,
    currentKey: null,
    bpm: null,
    isAutoScrolling: false,
    scrollSpeed: 2,
    members: [{ ...host, isHost: true }],
    lastUpdated: now,
    version: 1,
  };
}

/**
 * Constructs a typed synchronization message packet.
 *
 * @param type Message action type
 * @param senderId Identifier of the sending user
 * @param version Current session version sequence
 * @param payload Action payload
 * @returns Formatted BandSyncMessage
 */
export function createSyncMessage<T = any>(
  type: BandSyncMessageType,
  senderId: string,
  version: number,
  payload: T
): BandSyncMessage<T> {
  return {
    type,
    senderId,
    timestamp: new Date().toISOString(),
    version,
    payload,
  };
}

/**
 * Serializes a sync message into a JSON string for network transport.
 *
 * @param message Message to serialize
 * @returns JSON string
 */
export function serializeSyncPacket(message: BandSyncMessage): string {
  return JSON.stringify(message);
}

const VALID_MESSAGE_TYPES = new Set<BandSyncMessageType>([
  'JOIN',
  'LEAVE',
  'CHANGE_SONG',
  'TRANSPOSE',
  'TOGGLE_SCROLL',
  'SET_SPEED',
  'HEARTBEAT',
]);

/**
 * Parses and validates an incoming raw JSON packet.
 * Returns null if the JSON is malformed or invalid.
 *
 * @param raw Incoming raw string
 * @returns Validated BandSyncMessage or null
 */
export function parseSyncPacket(raw: string): BandSyncMessage | null {
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (!parsed.type || !VALID_MESSAGE_TYPES.has(parsed.type)) return null;
    if (!parsed.senderId || typeof parsed.senderId !== 'string') return null;
    if (typeof parsed.version !== 'number') return null;
    return parsed as BandSyncMessage;
  } catch {
    return null;
  }
}

/**
 * Deterministic state transition reducer for band synchronization.
 *
 * Enforces:
 * 1. Monotonic versioning (ignores out-of-order or stale packets).
 * 2. Host authorization (only host can change song, key, or scroll state).
 * 3. Member list integrity without duplicates.
 * 4. Value boundaries (scroll speed clamping).
 *
 * @param state Current session state
 * @param message Incoming message to apply
 * @returns New updated session state
 */
export function reduceBandSession(
  state: BandSessionState,
  message: BandSyncMessage
): BandSessionState {
  // Reject stale messages
  if (message.version < state.version) {
    return state;
  }

  const isHost = message.senderId === state.hostId;
  const now = new Date().toISOString();
  const nextVersion = state.version + 1;

  switch (message.type) {
    case 'JOIN': {
      const incomingMember: BandMember = message.payload?.member;
      if (!incomingMember || !incomingMember.id) return state;

      const exists = state.members.some((m: BandMember) => m.id === incomingMember.id);
      if (exists) {
        return {
          ...state,
          lastUpdated: now,
        };
      }

      return {
        ...state,
        members: [...state.members, incomingMember],
        lastUpdated: now,
        version: nextVersion,
      };
    }

    case 'LEAVE': {
      return {
        ...state,
        members: state.members.filter((m: BandMember) => m.id !== message.senderId),
        lastUpdated: now,
        version: nextVersion,
      };
    }

    case 'CHANGE_SONG': {
      // Host authorization required
      if (!isHost) return state;

      const { songId, songIndex, key, bpm } = message.payload || {};
      return {
        ...state,
        activeSongId: songId ?? null,
        activeSongIndex: typeof songIndex === 'number' ? songIndex : 0,
        currentKey: key ?? null,
        bpm: bpm ?? null,
        isAutoScrolling: false,
        lastUpdated: now,
        version: nextVersion,
      };
    }

    case 'TRANSPOSE': {
      // Host authorization required
      if (!isHost) return state;

      const { key } = message.payload || {};
      return {
        ...state,
        currentKey: key ?? state.currentKey,
        lastUpdated: now,
        version: nextVersion,
      };
    }

    case 'TOGGLE_SCROLL': {
      // Host authorization required
      if (!isHost) return state;

      const { isAutoScrolling } = message.payload || {};
      return {
        ...state,
        isAutoScrolling: Boolean(isAutoScrolling),
        lastUpdated: now,
        version: nextVersion,
      };
    }

    case 'SET_SPEED': {
      // Host authorization required
      if (!isHost) return state;

      const rawSpeed = Number(message.payload?.speed ?? state.scrollSpeed);
      const clampedSpeed = Math.max(MIN_SCROLL_SPEED, Math.min(MAX_SCROLL_SPEED, rawSpeed));

      return {
        ...state,
        scrollSpeed: clampedSpeed,
        lastUpdated: now,
        version: nextVersion,
      };
    }

    case 'HEARTBEAT': {
      return {
        ...state,
        lastUpdated: now,
      };
    }

    default:
      return state;
  }
}
