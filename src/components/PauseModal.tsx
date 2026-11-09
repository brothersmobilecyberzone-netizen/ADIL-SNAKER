import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX, ShieldAlert } from 'lucide-react';
import { soundManager } from '../game/audio';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onHome: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onHome,
  soundEnabled,
  onToggleSound,
}) => {
  return (
    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-6 select-none animate-fadeIn">
      <div className="w-full max-w-xs bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center">
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 rounded-2xl mb-3">
          <ShieldAlert className="w-7 h-7 text-emerald-400" />
        </div>

        <h2 className="text-xl font-black text-white tracking-wide uppercase">
          Game Paused
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Take a breath, snake commander!
        </p>

        {/* Buttons */}
        <div className="w-full space-y-2.5 mt-6">
          <button
            onClick={() => {
              soundManager.playButton();
              onResume();
            }}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-slate-950 font-black rounded-xl shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 uppercase tracking-wider text-sm transition"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>Resume</span>
          </button>

          <button
            onClick={() => {
              soundManager.playButton();
              onRestart();
            }}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-xs transition"
          >
            <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
            <span>Restart Arena</span>
          </button>

          <button
            onClick={() => {
              soundManager.playButton();
              onToggleSound();
            }}
            className="w-full py-2.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold rounded-xl flex items-center justify-center gap-2 text-xs transition"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
            <span>Sound: {soundEnabled ? 'ON' : 'MUTED'}</span>
          </button>

          <button
            onClick={() => {
              soundManager.playButton();
              onHome();
            }}
            className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white font-semibold rounded-xl flex items-center justify-center gap-2 text-xs transition"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Quit to Home</span>
          </button>
        </div>
      </div>
    </div>
  );
};
