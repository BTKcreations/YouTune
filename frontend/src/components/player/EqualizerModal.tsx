import React, { useState } from 'react';
import { Sliders, Volume2, Sparkles, Check } from 'lucide-react';
import { EQ_FREQUENCIES, EQ_PRESETS, EqualizerPreset, equalizerManager } from '../../services/equalizerService';

interface EqualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EqualizerModal: React.FC<EqualizerModalProps> = ({ isOpen, onClose }) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('flat');
  const [gains, setGains] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

  if (!isOpen) return null;

  const handlePresetSelect = (preset: EqualizerPreset) => {
    setSelectedPreset(preset.id);
    setGains([...preset.gains]);
    equalizerManager.applyPreset(preset);
  };

  const handleSliderChange = (idx: number, val: number) => {
    setSelectedPreset('custom');
    const updated = [...gains];
    updated[idx] = val;
    setGains(updated);
    equalizerManager.setGain(idx, val);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#181818] border border-neutral-800 rounded-3xl w-full max-w-lg p-6 md:p-8 shadow-2xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-spotify-green" />
            <h2 className="text-xl font-bold text-white">Audio Equalizer & Presets</h2>
          </div>
          <button
            onClick={onClose}
            className="text-spotify-subtext hover:text-white text-sm px-3 py-1 bg-neutral-800 rounded-full"
          >
            Done
          </button>
        </div>

        {/* Presets Pills */}
        <div>
          <span className="text-xs font-bold text-spotify-subtext uppercase tracking-wider block mb-2.5">
            Sound Profiles
          </span>
          <div className="flex flex-wrap gap-2">
            {EQ_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => handlePresetSelect(p)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedPreset === p.id
                    ? 'bg-spotify-green text-black font-bold shadow'
                    : 'bg-[#252525] text-gray-300 hover:text-white hover:bg-[#303030]'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* 10-Band Sliders */}
        <div className="bg-[#121212] p-4 rounded-2xl border border-neutral-800/80">
          <div className="flex items-center justify-between text-[11px] text-spotify-subtext mb-4">
            <span>Bass</span>
            <span>Mids</span>
            <span>Treble</span>
          </div>

          <div className="flex items-center justify-between gap-2 h-44">
            {EQ_FREQUENCIES.map((freq, idx) => {
              const label = freq >= 1000 ? `${freq / 1000}k` : `${freq}`;
              const val = gains[idx];
              return (
                <div key={freq} className="flex-1 flex flex-col items-center h-full justify-between">
                  <span className="text-[10px] text-spotify-subtext font-mono">
                    {val > 0 ? `+${val}` : val}
                  </span>
                  <div className="flex-1 flex items-center justify-center my-2">
                    <input
                      type="range"
                      min={-12}
                      max={12}
                      step={1}
                      value={val}
                      onChange={(e) => handleSliderChange(idx, parseInt(e.target.value, 10))}
                      className="h-28 w-2 appearance-none bg-neutral-800 rounded-full accent-spotify-green cursor-pointer [writing-mode:vertical-lr] [direction:rtl]"
                    />
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 font-mono">{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-spotify-subtext">
          <span>Web Audio API • 32-bit Floating Filter</span>
          <button
            onClick={() => handlePresetSelect(EQ_PRESETS[0])}
            className="hover:text-white text-xs underline"
          >
            Reset to Flat
          </button>
        </div>
      </div>
    </div>
  );
};
