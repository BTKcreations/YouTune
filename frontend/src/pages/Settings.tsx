import React, { useState } from 'react';
import { User, Globe, Headphones, Volume2, ShieldCheck, RotateCcw, Check, Sparkles } from 'lucide-react';
import { usePreferencesStore } from '../stores/usePreferencesStore';

const ALL_LANGUAGES = [
  'Telugu', 'Hindi', 'English', 'Tamil', 'Punjabi', 'Malayalam', 'Kannada', 'Korean', 'Spanish'
];

const ALL_GENRES = [
  'Tollywood Hits', 'Melody & Soul', 'Party & Dance', 'Romantic',
  'EDM & Electronic', 'Hip-Hop & Rap', 'Rock & Classics', 'Lofi & Chill', 'Devotional', 'Workout & Energy'
];

export const SettingsPage: React.FC = () => {
  const {
    userName,
    songLanguages,
    genres,
    appLanguage,
    audioQuality,
    updatePreferences,
    resetOnboarding,
  } = usePreferencesStore();

  const [savedMessage, setSavedMessage] = useState(false);
  const [localName, setLocalName] = useState(userName);

  const handleToggleLang = (lang: string) => {
    const updated = songLanguages.includes(lang)
      ? songLanguages.filter((l) => l !== lang)
      : [...songLanguages, lang];
    updatePreferences({ songLanguages: updated.length ? updated : [lang] });
    triggerSaved();
  };

  const handleToggleGenre = (g: string) => {
    const updated = genres.includes(g)
      ? genres.filter((x) => x !== g)
      : [...genres, g];
    updatePreferences({ genres: updated.length ? updated : [g] });
    triggerSaved();
  };

  const triggerSaved = () => {
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-200 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-3xl font-black text-white">Settings & Profile</h1>
          <p className="text-xs text-spotify-subtext mt-1">
            Customize your music discovery preferences, languages, and profile
          </p>
        </div>
        {savedMessage && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-spotify-green/20 text-spotify-green text-xs font-bold rounded-full border border-spotify-green/30 animate-in fade-in">
            <Check className="w-3.5 h-3.5" />
            <span>Preferences Saved</span>
          </div>
        )}
      </div>

      {/* Profile Card */}
      <div className="bg-[#181818] p-6 rounded-2xl border border-neutral-800 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <User className="w-5 h-5 text-spotify-green" />
          User Profile
        </h2>

        <div>
          <label className="block text-xs font-semibold text-spotify-subtext mb-1">
            Display Name
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              className="flex-1 bg-[#242424] text-white px-4 py-2.5 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-spotify-green border border-neutral-700"
            />
            <button
              onClick={() => {
                updatePreferences({ userName: localName.trim() || 'YouTune Listener' });
                triggerSaved();
              }}
              className="px-5 py-2.5 bg-spotify-green text-black font-bold text-xs rounded-xl hover:scale-105 transition-transform"
            >
              Save Name
            </button>
          </div>
        </div>
      </div>

      {/* Song Languages Preference */}
      <div className="bg-[#181818] p-6 rounded-2xl border border-neutral-800 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-spotify-green" />
            Song Languages
          </h2>
          <p className="text-xs text-spotify-subtext mt-0.5">
            Your personalized feeds and mixes prioritize these languages
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {ALL_LANGUAGES.map((lang) => {
            const isSelected = songLanguages.includes(lang);
            return (
              <button
                key={lang}
                onClick={() => handleToggleLang(lang)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  isSelected
                    ? 'bg-spotify-green text-black border-spotify-green font-bold shadow'
                    : 'bg-[#242424] border-neutral-700 text-gray-300 hover:text-white hover:bg-[#2c2c2c]'
                }`}
              >
                {lang} {isSelected && '✓'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Preferred Genres */}
      <div className="bg-[#181818] p-6 rounded-2xl border border-neutral-800 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Headphones className="w-5 h-5 text-spotify-green" />
            Preferred Music Genres
          </h2>
          <p className="text-xs text-spotify-subtext mt-0.5">
            Select the music styles you love most
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {ALL_GENRES.map((g) => {
            const isSelected = genres.includes(g);
            return (
              <button
                key={g}
                onClick={() => handleToggleGenre(g)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  isSelected
                    ? 'bg-spotify-green text-black border-spotify-green font-bold shadow'
                    : 'bg-[#242424] border-neutral-700 text-gray-300 hover:text-white hover:bg-[#2c2c2c]'
                }`}
              >
                {g} {isSelected && '✓'}
              </button>
            );
          })}
        </div>
      </div>

      {/* App Language & Audio Quality */}
      <div className="bg-[#181818] p-6 rounded-2xl border border-neutral-800 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-spotify-green" />
          Playback & App Preferences
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-spotify-subtext mb-1">
              App Language
            </label>
            <select
              value={appLanguage}
              onChange={(e) => {
                updatePreferences({ appLanguage: e.target.value });
                triggerSaved();
              }}
              className="w-full bg-[#242424] text-white px-3 py-2.5 rounded-xl text-sm font-medium border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-spotify-green cursor-pointer"
            >
              <option value="English">English</option>
              <option value="Telugu">Telugu (తెలుగు)</option>
              <option value="Hindi">Hindi (हिन्दी)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-spotify-subtext mb-1">
              Audio Streaming Quality
            </label>
            <select
              value={audioQuality}
              onChange={(e) => {
                updatePreferences({ audioQuality: e.target.value as any });
                triggerSaved();
              }}
              className="w-full bg-[#242424] text-white px-3 py-2.5 rounded-xl text-sm font-medium border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-spotify-green cursor-pointer"
            >
              <option value="high">High Fidelity (Best Bitrate)</option>
              <option value="medium">Standard (Balanced Data)</option>
              <option value="low">Data Saver (Low Bandwidth)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Rerun Onboarding */}
      <div className="flex items-center justify-between p-4 bg-[#181818] rounded-xl border border-neutral-800">
        <div>
          <h3 className="text-sm font-bold text-white">Reset Onboarding Questionnaire</h3>
          <p className="text-xs text-spotify-subtext">Restart the welcome setup questions</p>
        </div>
        <button
          onClick={() => {
            resetOnboarding();
            window.location.reload();
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#2c2c2c] hover:bg-[#383838] text-white text-xs font-bold rounded-xl transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restart Setup</span>
        </button>
      </div>
    </div>
  );
};
