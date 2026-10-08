/**
 * Band Session Modal Helper.
 *
 * Formats roles, session states, and member profiles for the live band
 * synchronization UI and stage mode views.
 *
 * 100% proprietary clean-room TypeScript code.
 */

import type { BandMember, BandMemberRole, BandSessionState } from './bandSync';
import type { ExportableSong } from './setlistExport';

export interface BandSessionStatusInfo {
  statusLabel: string;
  isHost: boolean;
  memberCount: number;
  currentSongTitle?: string;
}

/**
 * Returns user-friendly localized names for musical and stage roles.
 *
 * @param role BandMemberRole
 * @returns Formatted human-readable role name
 */
export function formatBandRole(role: BandMemberRole): string {
  switch (role) {
    case 'director':
      return 'Director / Líder';
    case 'guitar':
      return 'Guitarrista';
    case 'bass':
      return 'Bajista';
    case 'piano':
      return 'Pianista / Teclados';
    case 'drums':
      return 'Baterista';
    case 'vocalist':
      return 'Vocalista / Coros';
    case 'tech':
      return 'Sonido / Multimedia';
    case 'musician':
    default:
      return 'Músico';
  }
}

/**
 * Creates a validated local BandMember representation.
 *
 * @param userId Member unique user ID
 * @param name Member display name
 * @param role Assigned role in the band
 * @param isHost Whether this member is initiating as session host/director
 * @returns BandMember
 */
export function createLocalBandMember(
  userId: string,
  name: string,
  role: BandMemberRole,
  isHost: boolean
): BandMember {
  return {
    id: userId,
    name,
    role,
    isHost,
    joinedAt: new Date().toISOString(),
  };
}

/**
 * Summarizes the active band session status for the UI.
 *
 * @param session Active session state
 * @param currentUserId Logged-in user identifier
 * @param songs Setlist of songs
 * @returns BandSessionStatusInfo
 */
export function getBandSessionStatus(
  session: BandSessionState,
  currentUserId: string,
  songs: ExportableSong[] = []
): BandSessionStatusInfo {
  const hostMember = session.members.find((m) => m.id === session.hostId);
  const isHost = session.hostId === currentUserId;
  const activeSong = songs[session.activeSongIndex];

  let statusLabel: string;
  if (isHost) {
    statusLabel = 'Anfitrión / Director';
  } else if (hostMember) {
    statusLabel = `Conectado a ${hostMember.name}`;
  } else {
    statusLabel = 'Conectado a la Sesión';
  }

  return {
    statusLabel,
    isHost,
    memberCount: session.members.length,
    currentSongTitle: activeSong?.title,
  };
}
