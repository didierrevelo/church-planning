/**
 * Stage Mode and Live Performance Helpers.
 *
 * Provides timing, metronome, scroll speed calculations, and navigation
 * logic for musicians performing live on stage.
 */

export const MIN_SCROLL_SPEED = 1;
export const MAX_SCROLL_SPEED = 5;
export const DEFAULT_SCROLL_SPEED = 3;

/**
 * Calculates timer tick interval (in milliseconds) for smooth auto-scrolling
 * based on selected speed level (1 to 5).
 *
 * @param speed Speed level from 1 (slow) to 5 (fast)
 * @returns Milliseconds between 1px scroll steps
 */
export function calculateAutoScrollInterval(speed: number): number {
  const clampedSpeed = Math.max(MIN_SCROLL_SPEED, Math.min(MAX_SCROLL_SPEED, speed));
  // Speed 1 -> 50ms, Speed 2 -> 40ms, Speed 3 -> 30ms, Speed 4 -> 20ms, Speed 5 -> 10ms
  return (6 - clampedSpeed) * 10;
}

/**
 * Calculates interval in milliseconds between metronome beats given Beats Per Minute (BPM).
 *
 * @param bpm Beats per minute (e.g. 60, 72, 120)
 * @returns Milliseconds per beat (default 1000ms if invalid)
 */
export function calculateMetronomeInterval(bpm?: number | null): number {
  if (!bpm || bpm <= 0 || !Number.isFinite(bpm)) {
    return 1000;
  }
  return (60 / bpm) * 1000;
}

/**
 * Navigates forward in a setlist without exceeding bounds.
 *
 * @param currentIndex Current song index
 * @param totalSongs Total number of songs in the setlist
 * @returns Next valid index
 */
export function getNextSongIndex(currentIndex: number, totalSongs: number): number {
  if (totalSongs <= 1 || currentIndex < 0) return 0;
  return Math.min(currentIndex + 1, totalSongs - 1);
}

/**
 * Navigates backward in a setlist without falling below zero.
 *
 * @param currentIndex Current song index
 * @param totalSongs Total number of songs in the setlist
 * @returns Previous valid index
 */
export function getPrevSongIndex(currentIndex: number, totalSongs: number): number {
  if (totalSongs <= 1 || currentIndex <= 0) return 0;
  return Math.max(currentIndex - 1, 0);
}
