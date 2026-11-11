import React, { useState } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { usePlayerStore } from '../stores/usePlayerStore';
import { Settings as SettingsIcon, Sliders, ShieldCheck, UserCheck, HardDrive } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const { volume, setVolume } = usePlayerStore();

  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [savedMsg, setSavedMsg] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({ username, email });
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2500);
  };

  return (
    <div className="max-w-2xl space-y-8 animate-in fade-in duration-200">
      <div className="flex items-center gap-3">
        <SettingsIcon className="w-6 h-6 text-spotify-green" />
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">Settings & Preferences</h1>
      </div>

      {/* Account Settings */}
      <div className="bg-[#181818] p-6 rounded-2xl border border-neutral-800 space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-base">
          <UserCheck className="w-5 h-5 text-spotify-green" />
          <span>Profile Information</span>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-spotify-subtext mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#242424] text-white px-3 py-2 rounded-lg text-sm border border-neutral-700 focus:outline-none focus:border-spotify-green"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-spotify-subtext mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#242424] text-white px-3 py-2 rounded-lg text-sm border border-neutral-700 focus:outline-none focus:border-spotify-green"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="submit"
              className="px-6 py-2 bg-spotify-green text-black font-bold text-sm rounded-full hover:scale-105 transition-transform"
            >
              Save Profile
            </button>
            {savedMsg && (
              <span className="text-xs text-spotify-green font-semibold animate-pulse">
                Changes saved successfully!
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Playback Controls */}
      <div className="bg-[#181818] p-6 rounded-2xl border border-neutral-800 space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-base">
          <Sliders className="w-5 h-5 text-spotify-green" />
          <span>Playback Defaults</span>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-neutral-800">
          <div>
            <p className="text-sm font-semibold text-white">Default Volume</p>
            <p className="text-xs text-spotify-subtext">Set audio level on player launch</p>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={(e) => setVolume(parseInt(e.target.value, 10))}
            className="w-32 accent-spotify-green"
          />
        </div>

        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-semibold text-white">Autoplay next track</p>
            <p className="text-xs text-spotify-subtext">Continuously play music from queue</p>
          </div>
          <span className="text-xs text-spotify-green font-bold">Enabled</span>
        </div>
      </div>

      {/* Compliance & API */}
      <div className="bg-[#181818] p-6 rounded-2xl border border-neutral-800 space-y-2">
        <div className="flex items-center gap-2 text-white font-bold text-base">
          <ShieldCheck className="w-5 h-5 text-spotify-green" />
          <span>YouTube API Compliance</span>
        </div>
        <p className="text-xs text-spotify-subtext leading-relaxed">
          YouTune adheres strictly to the YouTube Developer Terms of Service. Streams are played directly via the official embedded YouTube IFrame Player with standard attribution and viewing controls.
        </p>
      </div>
    </div>
  );
};
