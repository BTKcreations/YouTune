import React from 'react';
import { Moon, Clock, Check } from 'lucide-react';
import { usePlayerStore } from '../../stores/usePlayerStore';

interface SleepTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TIMER_OPTIONS = [
  { label: 'Off', minutes: null },
  { label: '5 minutes', minutes: 5 },
  { label: '15 minutes', minutes: 15 },
  { label: '30 minutes', minutes: 30 },
  { label: '45 minutes', minutes: 45 },
  { label: '1 hour', minutes: 60 },
  { label: 'End of Track', minutes: 3 },
];

export const SleepTimerModal: React.FC<SleepTimerModalProps> = ({ isOpen, onClose }) => {
  const { sleepTimerRemaining, setSleepTimer } = usePlayerStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#181818] border border-neutral-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Moon className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Sleep Timer</h2>
          </div>
          {sleepTimerRemaining !== null && (
            <span className="text-xs font-mono text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-500/30">
              {Math.ceil(sleepTimerRemaining / 60)}m left
            </span>
          )}
        </div>

        <div className="space-y-1.5">
          {TIMER_OPTIONS.map((opt) => {
            const isSelected =
              (opt.minutes === null && sleepTimerRemaining === null) ||
              (opt.minutes !== null &&
                sleepTimerRemaining !== null &&
                Math.abs(sleepTimerRemaining - opt.minutes * 60) < 60);

            return (
              <button
                key={opt.label}
                onClick={() => {
                  setSleepTimer(opt.minutes);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                  isSelected
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'bg-[#242424] text-white hover:bg-[#2e2e2e]'
                }`}
              >
                <span>{opt.label}</span>
                {isSelected && <Check className="w-4 h-4 text-indigo-400 stroke-[3]" />}
              </button>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-neutral-800 text-white text-xs font-semibold rounded-full hover:bg-neutral-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
