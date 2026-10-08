/**
 * Band Session Controller & Live Stage Orchestrator.
 *
 * Coordinates real-time band synchronization, active setlist state,
 * stage event dispatching, and presentation export generation.
 *
 * Implements observer pattern for reactive UI updates and deterministic
 * state replication across devices on a local area network (LAN).
 *
 * 100% clean-room TypeScript code (Free of copyleft restrictions).
 */

import {
  createBandSession,
  createSyncMessage,
  reduceBandSession,
  parseSyncPacket,
  type BandMember,
  type BandSessionState,
  type BandSyncMessage,
} from './bandSync';
import {
  exportToFreeShowFormat,
  type ExportableSong,
  type FreeShowExport,
  type SlideOptions,
} from './setlistExport';

export type SessionStateListener = (state: BandSessionState) => void;

/**
 * High-level state manager for live stage performance sessions.
 */
export class BandSessionController {
  private state: BandSessionState;
  private readonly member: BandMember;
  private readonly songs: ExportableSong[];
  private listeners: Set<SessionStateListener> = new Set();

  /**
   * Initializes a band session controller.
   *
   * @param serviceId Associated service identifier
   * @param member Current user's band member profile
   * @param songs Optional initial setlist of songs
   * @param hostId Optional known host user identifier
   */
  constructor(
    serviceId: string,
    member: BandMember,
    songs: ExportableSong[] = [],
    hostId?: string
  ) {
    this.member = member;
    this.songs = [...songs];
    const initialHost: BandMember = hostId
      ? {
          id: hostId,
          name: 'Host Director',
          role: 'director',
          isHost: true,
          joinedAt: new Date().toISOString(),
        }
      : member;

    this.state = createBandSession(serviceId, initialHost);
    if (hostId && hostId !== member.id) {
      this.state.members.push({ ...member, isHost: false });
    }
  }

  /**
   * Returns a snapshot of the current session state.
   */
  public getState(): BandSessionState {
    return { ...this.state };
  }

  /**
   * Returns current local member info.
   */
  public getMember(): BandMember {
    return { ...this.member };
  }

  /**
   * Returns the setlist of songs loaded into the session.
   */
  public getSongs(): ExportableSong[] {
    return [...this.songs];
  }

  /**
   * Subscribes a listener callback to session state changes.
   *
   * @param listener Callback function receiving the updated state
   * @returns Unsubscribe function
   */
  public subscribe(listener: SessionStateListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notifies all registered listeners of a state change.
   */
  private notifyListeners(): void {
    const snapshot = this.getState();
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }

  /**
   * Changes the active song in the session (Director/Host only).
   *
   * @param songIndex Zero-based index into the setlist
   * @returns Broadcastable BandSyncMessage or null if not authorized
   */
  public changeSong(songIndex: number): BandSyncMessage | null {
    if (!this.member.isHost) {
      return null;
    }

    if (songIndex < 0 || songIndex >= this.songs.length) {
      return null;
    }

    const song = this.songs[songIndex];
    const msg = createSyncMessage('CHANGE_SONG', this.member.id, this.state.version, {
      songIndex,
      songId: song.title,
      key: song.key || null,
      bpm: song.bpm ?? null,
    });

    this.state = reduceBandSession(this.state, msg);
    this.notifyListeners();
    return msg;
  }

  /**
   * Transposes the current song key globally across the band (Director/Host only).
   *
   * @param newKey New target musical key (e.g. "G", "C#", "Am")
   * @returns Broadcastable BandSyncMessage or null if not authorized
   */
  public transposeKey(newKey: string): BandSyncMessage | null {
    if (!this.member.isHost) {
      return null;
    }

    const msg = createSyncMessage('TRANSPOSE', this.member.id, this.state.version, {
      key: newKey,
    });

    this.state = reduceBandSession(this.state, msg);
    this.notifyListeners();
    return msg;
  }

  /**
   * Toggles auto-scroll synchronization (Director/Host only).
   *
   * @param active Whether auto-scroll should be active
   * @returns Broadcastable BandSyncMessage or null if not authorized
   */
  public toggleAutoScroll(active: boolean): BandSyncMessage | null {
    if (!this.member.isHost) {
      return null;
    }

    const msg = createSyncMessage('TOGGLE_SCROLL', this.member.id, this.state.version, {
      isAutoScrolling: active,
    });

    this.state = reduceBandSession(this.state, msg);
    this.notifyListeners();
    return msg;
  }

  /**
   * Sets auto-scroll speed globally (Director/Host only).
   *
   * @param speed Speed multiplier (1x to 5x)
   * @returns Broadcastable BandSyncMessage or null if not authorized
   */
  public setScrollSpeed(speed: number): BandSyncMessage | null {
    if (!this.member.isHost) {
      return null;
    }

    const msg = createSyncMessage('SET_SPEED', this.member.id, this.state.version, {
      speed,
    });

    this.state = reduceBandSession(this.state, msg);
    this.notifyListeners();
    return msg;
  }

  /**
   * Ingests and processes an incoming synchronization message packet.
   *
   * @param rawOrMessage Raw JSON string or parsed BandSyncMessage
   * @returns True if packet was applied and state transitioned
   */
  public receiveMessage(rawOrMessage: string | BandSyncMessage): boolean {
    const msg =
      typeof rawOrMessage === 'string'
        ? parseSyncPacket(rawOrMessage)
        : rawOrMessage;

    if (!msg) {
      return false;
    }

    if (!this.member.isHost && this.state.hostId !== msg.senderId) {
      this.state.hostId = msg.senderId;
    }

    const previousVersion = this.state.version;
    this.state = reduceBandSession(this.state, msg);

    if (this.state.version > previousVersion) {
      this.notifyListeners();
      return true;
    }

    return false;
  }

  /**
   * Exports the currently active song into FreeShow slide projection format.
   *
   * @param options Slide generation options
   * @returns FreeShowExport document or null if no active song
   */
  public exportCurrentSongSlides(options?: SlideOptions): FreeShowExport | null {
    const activeSong = this.songs[this.state.activeSongIndex];
    if (!activeSong) return null;

    // Use transposed key if available
    const songToExport: ExportableSong = {
      ...activeSong,
      key: this.state.currentKey || activeSong.key,
      bpm: this.state.bpm ?? activeSong.bpm,
    };

    return exportToFreeShowFormat(songToExport, options);
  }

  /**
   * Exports all setlist songs into an array of FreeShow presentation documents.
   *
   * @param options Slide generation options
   * @returns Array of FreeShowExport documents
   */
  public exportAllSetlistSlides(options?: SlideOptions): FreeShowExport[] {
    return this.songs.map((song) => exportToFreeShowFormat(song, options));
  }
}
