import React, { useState } from 'react';
import { Sparkles, Check, Music, Globe, Headphones, ArrowRight, User } from 'lucide-react';
import { usePreferencesStore } from '../../stores/usePreferencesStore';

const AVAILABLE_LANGUAGES = [
  { id: 'Telugu', label: 'తెలుగు (Telugu)', flag: '🇮🇳' },
  { id: 'Hindi', label: 'हिन्दी (Hindi)', flag: '🇮🇳' },
  { id: 'English', label: 'English (International)', flag: '🌐' },
  { id: 'Tamil', label: 'தமிழ் (Tamil)', flag: '🇮🇳' },
  { id: 'Punjabi', label: 'ਪੰਜਾਬੀ (Punjabi)', flag: '🇮🇳' },
  { id: 'Malayalam', label: 'മലയാളം (Malayalam)', flag: '🇮🇳' },
  { id: 'Kannada', label: 'ಕನ್ನಡ (Kannada)', flag: '🇮🇳' },
  { id: 'Korean', label: 'K-Pop (Korean)', flag: '🇰🇷' },
  { id: 'Spanish', label: 'Spanish / Latin', flag: '🇪🇸' },
];

const AVAILABLE_GENRES = [
  { id: 'Tollywood Hits', label: 'Tollywood Mass & Hits', color: '#E11D48' },
  { id: 'Melody & Soul', label: 'Melody & Soul', color: '#9333EA' },
  { id: 'Party & Dance', label: 'DJ Party & Dance', color: '#2563EB' },
  { id: 'Romantic', label: 'Romantic & Love', color: '#EC4899' },
  { id: 'EDM & Electronic', label: 'EDM & Electronic', color: '#06B6D4' },
  { id: 'Hip-Hop & Rap', label: 'Hip-Hop & Rap', color: '#F59E0B' },
  { id: 'Rock & Classics', label: 'Rock & Classics', color: '#84CC16' },
  { id: 'Lofi & Chill', label: 'Lofi & Chill Vibes', color: '#10B981' },
  { id: 'Devotional', label: 'Devotional & Spiritual', color: '#F97316' },
  { id: 'Workout & Energy', label: 'Workout & Energy', color: '#EF4444' },
];

export const OnboardingModal: React.FC = () => {
  const { hasCompletedOnboarding, completeOnboarding } = usePreferencesStore();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['Telugu', 'Hindi']);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(['Tollywood Hits', 'Melody & Soul']);
  const [name, setName] = useState('');
  const [appLanguage, setAppLanguage] = useState('English');

  if (hasCompletedOnboarding) return null;

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const handleFinish = () => {
    completeOnboarding({
      songLanguages: selectedLanguages.length > 0 ? selectedLanguages : ['Telugu', 'English'],
      genres: selectedGenres.length > 0 ? selectedGenres : ['Tollywood Hits', 'Melody & Soul'],
      appLanguage,
      userName: name.trim() || 'YouTune Listener',
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
      <div className="bg-[#181818] border border-neutral-700/80 rounded-3xl w-full max-w-lg p-6 md:p-8 shadow-2xl relative my-auto">
        {/* Progress header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-spotify-green/20 text-spotify-green flex items-center justify-center font-bold text-sm border border-spotify-green/30">
              {step}/3
            </span>
            <span className="text-xs font-semibold text-spotify-subtext uppercase tracking-wider">
              {step === 1 ? 'Music Languages' : step === 2 ? 'Favorite Genres' : 'Profile & App Setup'}
            </span>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3].map((s) => (
              <span
                key={s}
                className={`w-5 h-1.5 rounded-full transition-all ${
                  s === step ? 'bg-spotify-green w-7' : s < step ? 'bg-spotify-green/50' : 'bg-neutral-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* STEP 1: Music Languages */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                <Globe className="w-6 h-6 text-spotify-green" />
                What music do you listen to?
              </h2>
              <p className="text-xs text-spotify-subtext mt-1">
                Select one or more languages to tailor your daily discovery and trending charts.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
              {AVAILABLE_LANGUAGES.map((lang) => {
                const isSelected = selectedLanguages.includes(lang.id);
                return (
                  <button
                    key={lang.id}
                    onClick={() => toggleLanguage(lang.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-spotify-green/15 border-spotify-green text-white font-semibold'
                        : 'bg-[#242424] border-transparent text-gray-300 hover:bg-[#2e2e2e]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="text-lg">{lang.flag}</span>
                      <span className="text-sm truncate">{lang.label}</span>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-spotify-green text-black flex items-center justify-center flex-shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={selectedLanguages.length === 0}
              className="w-full mt-4 py-3 bg-spotify-green hover:bg-spotify-green-light disabled:opacity-40 text-black font-bold text-sm rounded-full transition-transform hover:scale-[1.02] flex items-center justify-center gap-2 shadow-lg"
            >
              <span>Continue to Genres</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: Favorite Genres & Vibes */}
        {step === 2 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                <Headphones className="w-6 h-6 text-spotify-green" />
                Pick your favorite vibes
              </h2>
              <p className="text-xs text-spotify-subtext mt-1">
                Choose the genres that match your mood. We'll build your daily mix around these.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
              {AVAILABLE_GENRES.map((g) => {
                const isSelected = selectedGenres.includes(g.id);
                return (
                  <button
                    key={g.id}
                    onClick={() => toggleGenre(g.id)}
                    className={`relative p-3.5 rounded-xl border text-left overflow-hidden transition-all ${
                      isSelected
                        ? 'border-white font-bold scale-[1.02] shadow-md'
                        : 'border-transparent opacity-80 hover:opacity-100 hover:scale-[1.01]'
                    }`}
                    style={{ backgroundColor: g.color }}
                  >
                    <div className="relative z-10 flex items-center justify-between">
                      <span className="text-sm text-white drop-shadow leading-snug">{g.label}</span>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-white text-black flex items-center justify-center flex-shrink-0 ml-1">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep(1)}
                className="w-1/3 py-3 bg-[#282828] text-white font-semibold text-sm rounded-full hover:bg-[#333333] transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={selectedGenres.length === 0}
                className="w-2/3 py-3 bg-spotify-green hover:bg-spotify-green-light disabled:opacity-40 text-black font-bold text-sm rounded-full transition-transform hover:scale-[1.02] flex items-center justify-center gap-2 shadow-lg"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Profile & App Language */}
        {step === 3 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-spotify-green" />
                Personalize your experience
              </h2>
              <p className="text-xs text-spotify-subtext mt-1">
                Tell us your name so we can personalize greetings and your daily playlists.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-spotify-subtext mb-1.5">
                  Your Name or Nickname
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-spotify-subtext" />
                  <input
                    type="text"
                    placeholder="Enter your name (e.g. Rahul, Sneha, Alex)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#282828] text-white pl-10 pr-4 py-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-spotify-green border border-neutral-700"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-spotify-subtext mb-1.5">
                  App Interface Language
                </label>
                <select
                  value={appLanguage}
                  onChange={(e) => setAppLanguage(e.target.value)}
                  className="w-full bg-[#282828] text-white px-3 py-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-spotify-green border border-neutral-700 cursor-pointer"
                >
                  <option value="English">English</option>
                  <option value="Telugu">Telugu (తెలుగు)</option>
                  <option value="Hindi">Hindi (हिन्दी)</option>
                </select>
              </div>
            </div>

            <div className="bg-emerald-950/40 border border-emerald-500/20 p-3.5 rounded-xl text-xs text-emerald-300">
              💡 You can always change your languages, preferred genres, or name later in <strong>Settings</strong>.
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep(2)}
                className="w-1/3 py-3 bg-[#282828] text-white font-semibold text-sm rounded-full hover:bg-[#333333] transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleFinish}
                className="w-2/3 py-3 bg-spotify-green hover:bg-spotify-green-light text-black font-black text-sm rounded-full transition-transform hover:scale-[1.02] flex items-center justify-center gap-2 shadow-xl"
              >
                <span>Start Listening</span>
                <Check className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
