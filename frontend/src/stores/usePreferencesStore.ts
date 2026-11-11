import { create } from 'zustand';

export interface UserPreferences {
  songLanguages: string[]; // e.g. ['Telugu', 'Hindi', 'English', 'Tamil']
  genres: string[]; // e.g. ['Tollywood Hits', 'Melody', 'EDM', 'Hip-Hop']
  appLanguage: string; // e.g. 'English', 'Telugu'
  userName: string;
  avatarSeed: string;
  hasCompletedOnboarding: boolean;
  audioQuality: 'high' | 'medium' | 'low';
}

interface PreferencesStore extends UserPreferences {
  completeOnboarding: (data: {
    songLanguages: string[];
    genres: string[];
    appLanguage: string;
    userName: string;
  }) => void;
  updatePreferences: (partial: Partial<UserPreferences>) => void;
  resetOnboarding: () => void;
}

const STORAGE_KEY = 'youtune_user_preferences_v1';

const getInitialState = (): UserPreferences => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Failed reading preferences', e);
  }

  return {
    songLanguages: ['Telugu', 'Hindi', 'English'],
    genres: ['Tollywood Hits', 'Melody', 'Party & Dance', 'Romantic'],
    appLanguage: 'English',
    userName: 'Music Lover',
    avatarSeed: 'music_lover',
    hasCompletedOnboarding: false,
    audioQuality: 'high',
  };
};

export const usePreferencesStore = create<PreferencesStore>((set, get) => ({
  ...getInitialState(),

  completeOnboarding: (data) => {
    const updated: UserPreferences = {
      ...get(),
      ...data,
      hasCompletedOnboarding: true,
    };
    set(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },

  updatePreferences: (partial) => {
    const updated: UserPreferences = {
      ...get(),
      ...partial,
    };
    set(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },

  resetOnboarding: () => {
    const updated: UserPreferences = {
      ...get(),
      hasCompletedOnboarding: false,
    };
    set(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },
}));
