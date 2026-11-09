import React, { useEffect, useState } from 'react';
import { AdilLogo } from './AdilLogo';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Initializing 3D Engine...');

  useEffect(() => {
    const stages = [
      { at: 20, text: 'Compiling 3D Shader Cache...' },
      { at: 45, text: 'Generating Snake Textures...' },
      { at: 70, text: 'Loading 5 Worlds & 15 Skins...' },
      { at: 90, text: 'Synthesizing Cyber Audio...' },
      { at: 100, text: 'ADIL PANEL Ready!' },
    ];

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 3;
        const currentStage = stages.find((s) => next >= s.at && prev < s.at);
        if (currentStage) {
          setStatusText(currentStage.text);
        }
        if (next >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            onComplete();
          }, 350);
          return 100;
        }
        return next;
      });
    }, 45);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div
      onClick={onComplete}
      className="relative w-full h-full bg-gradient-to-b from-slate-950 via-emerald-950/40 to-slate-950 flex flex-col items-center justify-between p-8 cursor-pointer select-none overflow-hidden"
    >
      {/* Background Animated Cyber Matrix Rays */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none animate-pulse" />

      {/* Top Tag */}
      <div className="pt-6 text-center">
        <span className="text-[11px] font-bold tracking-[0.25em] uppercase text-emerald-400/80 border border-emerald-500/30 px-3 py-1 rounded-full bg-emerald-950/30">
          Official Android 3D Game
        </span>
      </div>

      {/* Center Hero Logo & Title Lockup */}
      <div className="flex flex-col items-center justify-center my-auto">
        <AdilLogo size="xl" showSubtitle={false} className="mb-6 transform hover:scale-105 transition duration-500" />

        <div className="text-center space-y-1">
          <h1 className="text-2xl font-black tracking-tight text-white drop-shadow-[0_0_15px_rgba(34,197,94,0.6)]">
            ADIL-SNAKER-PANEL
          </h1>
          <p className="text-sm font-semibold tracking-wider text-emerald-400">
            BY ADIL PANEL
          </p>
        </div>
      </div>

      {/* Bottom Loading Progress Bar */}
      <div className="w-full max-w-xs pb-8 flex flex-col items-center gap-3">
        <div className="w-full flex justify-between text-xs font-semibold text-emerald-400/90">
          <span className="truncate pr-2">{statusText}</span>
          <span className="tabular-nums font-mono">{progress}%</span>
        </div>

        {/* Glowing Progress Track */}
        <div className="w-full h-2.5 bg-slate-900 border border-emerald-500/40 rounded-full overflow-hidden p-0.5 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-green-400 to-lime-400 rounded-full transition-all duration-100 shadow-[0_0_12px_rgba(34,197,94,0.8)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        <button
          onClick={onComplete}
          className="text-[11px] text-slate-400 hover:text-emerald-400 transition underline decoration-dotted mt-1"
        >
          Tap anywhere to skip
        </button>
      </div>
    </div>
  );
};
