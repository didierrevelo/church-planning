/**
 * Unit tests for Stage Mode logic and helpers.
 * Following Test-Driven Development (TDD).
 */

import {
  calculateAutoScrollInterval,
  calculateMetronomeInterval,
  getNextSongIndex,
  getPrevSongIndex,
  DEFAULT_SCROLL_SPEED,
  MIN_SCROLL_SPEED,
  MAX_SCROLL_SPEED,
} from '../domain/stageMode';

describe('Stage Mode Helpers', () => {
  describe('calculateAutoScrollInterval', () => {
    it('should calculate scroll step interval based on speed level', () => {
      // Speed 1 (slow) -> higher delay between ticks
      const intervalSlow = calculateAutoScrollInterval(1);
      // Speed 5 (fast) -> lower delay between ticks
      const intervalFast = calculateAutoScrollInterval(5);

      expect(intervalSlow).toBeGreaterThan(intervalFast);
      expect(intervalSlow).toBe(50);
      expect(intervalFast).toBe(10);
    });

    it('should clamp speeds outside allowed bounds', () => {
      expect(calculateAutoScrollInterval(0)).toBe(calculateAutoScrollInterval(MIN_SCROLL_SPEED));
      expect(calculateAutoScrollInterval(10)).toBe(calculateAutoScrollInterval(MAX_SCROLL_SPEED));
    });
  });

  describe('calculateMetronomeInterval', () => {
    it('should calculate milliseconds between beats based on BPM', () => {
      // 60 BPM = 1 beat per second = 1000ms
      expect(calculateMetronomeInterval(60)).toBe(1000);
      // 120 BPM = 2 beats per second = 500ms
      expect(calculateMetronomeInterval(120)).toBe(500);
      // 72 BPM = (60 / 72) * 1000 = ~833ms
      expect(calculateMetronomeInterval(72)).toBeCloseTo(833.33, 1);
    });

    it('should return fallback interval for invalid or zero BPM', () => {
      expect(calculateMetronomeInterval(0)).toBe(1000);
      expect(calculateMetronomeInterval(undefined)).toBe(1000);
      expect(calculateMetronomeInterval(null)).toBe(1000);
    });
  });

  describe('getNextSongIndex & getPrevSongIndex', () => {
    it('should navigate forward in setlist without overflow', () => {
      expect(getNextSongIndex(0, 3)).toBe(1);
      expect(getNextSongIndex(1, 3)).toBe(2);
      expect(getNextSongIndex(2, 3)).toBe(2); // At the end, stays at last song
    });

    it('should navigate backward in setlist without underflow', () => {
      expect(getPrevSongIndex(2, 3)).toBe(1);
      expect(getPrevSongIndex(1, 3)).toBe(0);
      expect(getPrevSongIndex(0, 3)).toBe(0); // At the beginning, stays at 0
    });

    it('should handle single song or empty setlists gracefully', () => {
      expect(getNextSongIndex(0, 1)).toBe(0);
      expect(getPrevSongIndex(0, 1)).toBe(0);
      expect(getNextSongIndex(0, 0)).toBe(0);
    });
  });
});
