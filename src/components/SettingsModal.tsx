import React from 'react';
import { X, Volume2, VolumeX, Music, Smartphone, Gauge, RotateCcw } from 'lucide-react';
import { ControlType, PlayerProgress } from '../game/types';
import { soundManager } from '../game/audio';

interface SettingsModalProps {
  progress: PlayerProgress;
  onUpdateSettings: (updates: Partial<PlayerProgress>) => void;
  onResetProgress: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  progress,
  onUpdateSettings,
  onResetProgress,
  onClose,
}) => {
  return (
    <div className="absolute inset-0 bg-slate-950/95 z-50 flex flex-col justify-between p-4 overflow-hidden select-none animate-fadeIn">
      {/* Header */}
      <div className="w-full flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-lg font-black text-white tracking-wide uppercase">
            Game Settings
          </h2>
          <p className="text-[11px] text-slate-400">
            Audio, mobile controls & performance
          </p>
        </div>

        <button
          onClick={() => {
            soundManager.playButton();
            onClose();
          }}
          className="p-1.5 rounded-full bg-slate-900 border border-slate-700 text-slate-400 hover:text-white"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Settings List */}
      <div className="flex-1 overflow-y-auto py-3 space-y-3.5 pr-1 text-xs">
        {/* Audio FX */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-950 rounded-xl text-emerald-400">
              {progress.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </div>
            <div>
              <div className="font-bold text-white text-sm">Sound Effects (SFX)</div>
              <div className="text-[10px] text-slate-400">Eating, bonus chimes, collisions</div>
            </div>
          </div>

          <button
            onClick={() => {
              const next = !progress.soundEnabled;
              soundManager.setSoundEnabled(next);
              soundManager.playButton();
              onUpdateSettings({ soundEnabled: next });
            }}
            className={`w-12 h-6 rounded-full transition-colors p-0.5 flex items-center ${
              progress.soundEnabled ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-white shadow-md" />
          </button>
        </div>

        {/* Music */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-950 rounded-xl text-purple-400">
              <Music className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">Background Synth BGM</div>
              <div className="text-[10px] text-slate-400">Atmospheric world rhythm track</div>
            </div>
          </div>

          <button
            onClick={() => {
              const next = !progress.musicEnabled;
              soundManager.setMusicEnabled(next);
              soundManager.playButton();
              onUpdateSettings({ musicEnabled: next });
            }}
            className={`w-12 h-6 rounded-full transition-colors p-0.5 flex items-center ${
              progress.musicEnabled ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-white shadow-md" />
          </button>
        </div>

        {/* Mobile Control Mode */}
        <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-950 rounded-xl text-cyan-400">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">Mobile Controls Mode</div>
              <div className="text-[10px] text-slate-400">Choose your preferred one-hand steering method</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            {(['joystick', 'swipe'] as ControlType[]).map((type) => (
              <button
                key={type}
                onClick={() => {
                  soundManager.playButton();
                  onUpdateSettings({ controlType: type });
                }}
                className={`py-2 px-3 rounded-xl border text-xs font-bold uppercase transition flex items-center justify-center gap-1.5 ${
                  progress.controlType === type
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                }`}
              >
                <span>{type === 'joystick' ? '🕹️ Virtual Joystick' : '👆 Swipe Gestures'}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Graphics Quality */}
        <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-950 rounded-xl text-amber-400">
              <Gauge className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">Graphics Quality</div>
              <div className="text-[10px] text-slate-400">Optimized for low-end to high-end Android phones</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 pt-1">
            {(['high', 'medium', 'low'] as const).map((q) => (
              <button
                key={q}
                onClick={() => {
                  soundManager.playButton();
                  onUpdateSettings({ graphicsQuality: q });
                }}
                className={`py-1.5 rounded-xl border text-[11px] font-bold uppercase transition ${
                  progress.graphicsQuality === q
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Reset Progress */}
        <div className="pt-2">
          <button
            onClick={() => {
              if (window.confirm('Reset all coins, skins, and high scores to defaults?')) {
                soundManager.playCrash();
                onResetProgress();
              }
            }}
            className="w-full py-2.5 rounded-xl border border-red-500/30 text-red-400 bg-red-950/20 hover:bg-red-950/40 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Save Data to Default</span>
          </button>
        </div>
      </div>

      {/* Done Button */}
      <div className="pt-2 border-t border-slate-800">
        <button
          onClick={() => {
            soundManager.playButton();
            onClose();
          }}
          className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm uppercase tracking-wider transition shadow-lg shadow-emerald-500/20"
        >
          Save & Close
        </button>
      </div>
    </div>
  );
};
