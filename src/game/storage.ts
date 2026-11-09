/**
 * Local Player Progress Storage for ADIL-SNAKER-PANEL
 * Complete offline persistence for Android & Web
 */

import { PlayerProgress, SkinId, WorldId } from './types';

const STORAGE_KEY = 'adil_snaker_panel_progress_v1';

export const DEFAULT_PLAYER_PROGRESS: PlayerProgress = {
  coins: 200,
  diamonds: 10,
  selectedSkin: 'green',
  selectedWorld: 'jungle',
  selectedMode: 'classic',
  unlockedSkins: ['green'],
  unlockedWorlds: ['jungle'],
  highScores: {
    classic: 0,
    survival: 0,
    time_challenge: 0,
    level: 0,
  },
  totalApplesEaten: 0,
  currentLevel: 1,
  dailyStreak: 0,
  lastDailyClaimTimestamp: 0,
  soundEnabled: true,
  musicEnabled: true,
  hapticsEnabled: true,
  controlType: 'joystick',
  graphicsQuality: 'high',
};

export function loadPlayerProgress(): PlayerProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PLAYER_PROGRESS };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PLAYER_PROGRESS,
      ...parsed,
      highScores: {
        ...DEFAULT_PLAYER_PROGRESS.highScores,
        ...(parsed.highScores || {}),
      },
      unlockedSkins: Array.from(new Set(['green' as SkinId, ...(parsed.unlockedSkins || [])])),
      unlockedWorlds: Array.from(new Set(['jungle' as WorldId, ...(parsed.unlockedWorlds || [])])),
    };
  } catch (e) {
    console.warn('Failed to load player progress from localStorage', e);
    return { ...DEFAULT_PLAYER_PROGRESS };
  }
}

export function savePlayerProgress(progress: PlayerProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.warn('Failed to save player progress to localStorage', e);
  }
}
