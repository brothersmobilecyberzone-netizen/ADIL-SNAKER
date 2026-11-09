import React, { useState } from 'react';
import {
  Play,
  ShoppingBag,
  Globe2,
  Gift,
  Settings,
  Coins,
  Gem,
  Trophy,
  Flame,
  Clock,
  Swords,
  Layers,
  DownloadCloud,
} from 'lucide-react';
import { GameMode, PlayerProgress } from '../game/types';
import { WORLDS } from '../game/worlds';
import { SNAKE_SKINS } from '../game/skins';
import { soundManager } from '../game/audio';

interface HomeScreenProps {
  progress: PlayerProgress;
  onPlay: (mode: GameMode) => void;
  onOpenShop: () => void;
  onOpenWorlds: () => void;
  onOpenDailyRewards: () => void;
  onOpenSettings: () => void;
  onOpenAndroidExport: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  progress,
  onPlay,
  onOpenShop,
  onOpenWorlds,
  onOpenDailyRewards,
  onOpenSettings,
  onOpenAndroidExport,
}) => {
  const [selectedMode, setSelectedMode] = useState<GameMode>(progress.selectedMode || 'classic');

  const activeSkin = SNAKE_SKINS[progress.selectedSkin] || SNAKE_SKINS.green;
  const activeWorld = WORLDS[progress.selectedWorld] || WORLDS.jungle;

  const modeDescriptions: Record<GameMode, { title: string; desc: string; icon: React.ReactNode }> = {
    classic: {
      title: 'Classic Mode',
      desc: 'Endless arena. Eat apples, grow long, break high scores.',
      icon: <Trophy className="w-4 h-4 text-emerald-400" />,
    },
    survival: {
      title: 'Survival Mode',
      desc: 'High obstacles density and fast hazards. Survive!',
      icon: <Flame className="w-4 h-4 text-orange-400" />,
    },
    time_challenge: {
      title: 'Time Challenge',
      desc: '2-Minute frenzy! Golden apples & combo multipliers.',
      icon: <Clock className="w-4 h-4 text-cyan-400" />,
    },
    level: {
      title: `Level Mode (Lvl ${progress.currentLevel})`,
      desc: 'Complete 20 progressive missions with unique objectives.',
      icon: <Layers className="w-4 h-4 text-purple-400" />,
    },
  };

  const handleStartGame = () => {
    soundManager.playButton();
    onPlay(selectedMode);
  };

  return (
    <div className="relative w-full h-full bg-slate-950 flex flex-col justify-between p-4 overflow-y-auto overflow-x-hidden select-none">
      {/* Top Header: Currencies & Settings */}
      <div className="w-full flex items-center justify-between gap-2 z-10">
        {/* Currencies */}
        <div className="flex items-center gap-2">
          {/* Coins */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-amber-500/40 rounded-full px-2.5 py-1 shadow-sm">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-amber-300 font-mono tabular-nums">
              {progress.coins.toLocaleString()}
            </span>
          </div>

          {/* Diamonds */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-cyan-500/40 rounded-full px-2.5 py-1 shadow-sm">
            <Gem className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-bold text-cyan-300 font-mono tabular-nums">
              {progress.diamonds.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Top Right Actions */}
        <div className="flex items-center gap-2">
          {/* Daily Gift Button */}
          <button
            onClick={() => {
              soundManager.playButton();
              onOpenDailyRewards();
            }}
            className="relative p-2 rounded-full bg-slate-900/90 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-950/60 transition shadow-sm"
            aria-label="Daily Rewards"
          >
            <Gift className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-slate-950" />
          </button>

          {/* Settings Button */}
          <button
            onClick={() => {
              soundManager.playButton();
              onOpenSettings();
            }}
            className="p-2 rounded-full bg-slate-900/90 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition shadow-sm"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hero Mascot & Title Section */}
      <div className="my-auto py-2 flex flex-col items-center text-center z-10">
        <div className="relative mb-3">
          {/* Glowing Aura Ring */}
          <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500 via-green-400 to-lime-500 rounded-full blur-xl opacity-40 animate-pulse pointer-events-none" />
          <div className="relative w-28 h-28 rounded-full border-2 border-emerald-400 p-1 bg-slate-900 shadow-2xl">
            <img
              src="/src/assets/images/adil_panel_logo_1794206854855.jpg"
              alt="ADIL PANEL Snake"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
        </div>

        <h1 className="text-2xl font-black tracking-tight text-white drop-shadow-[0_0_12px_rgba(16,185,129,0.7)]">
          ADIL-SNAKER-PANEL
        </h1>
        <p className="text-xs font-bold tracking-widest text-emerald-400 uppercase mt-0.5">
          Official 3D Android Game
        </p>

        {/* Selected Skin & World Badge */}
        <div className="mt-2.5 flex items-center gap-2">
          <div
            onClick={onOpenShop}
            className="cursor-pointer flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-emerald-500/40 text-[11px] font-semibold text-emerald-300 hover:border-emerald-400 transition"
          >
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: activeSkin.primaryColor }}
            />
            <span>{activeSkin.name}</span>
          </div>

          <div
            onClick={onOpenWorlds}
            className="cursor-pointer flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-amber-500/40 text-[11px] font-semibold text-amber-300 hover:border-amber-400 transition"
          >
            <Globe2 className="w-3 h-3 text-amber-400" />
            <span>{activeWorld.name}</span>
          </div>
        </div>

        {/* High Score Banner */}
        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-300 bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-1">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>Best Score:</span>
          <span className="font-bold text-white font-mono tabular-nums">
            {(progress.highScores[selectedMode] || 0).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Mode Selector Tabs */}
      <div className="z-10 space-y-2 mb-3">
        <div className="grid grid-cols-4 gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          {(['classic', 'survival', 'time_challenge', 'level'] as GameMode[]).map((m) => (
            <button
              key={m}
              onClick={() => {
                soundManager.playButton();
                setSelectedMode(m);
              }}
              className={`py-1.5 px-1 rounded-lg text-[10px] font-bold uppercase transition flex flex-col items-center justify-center gap-1 ${
                selectedMode === m
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {m === 'classic' && <Trophy className="w-3 h-3" />}
              {m === 'survival' && <Flame className="w-3 h-3" />}
              {m === 'time_challenge' && <Clock className="w-3 h-3" />}
              {m === 'level' && <Layers className="w-3 h-3" />}
              <span className="truncate">{m.replace('_', ' ')}</span>
            </button>
          ))}
        </div>

        {/* Mode Description Card */}
        <div className="bg-slate-900/60 border border-emerald-500/20 rounded-xl px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {modeDescriptions[selectedMode].icon}
            <div>
              <div className="text-xs font-bold text-white">
                {modeDescriptions[selectedMode].title}
              </div>
              <div className="text-[10px] text-slate-400">
                {modeDescriptions[selectedMode].desc}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Action CTAs */}
      <div className="space-y-2 z-10">
        {/* Play Game Button (Large Glowing CTA) */}
        <button
          onClick={handleStartGame}
          className="w-full py-3.5 bg-gradient-to-r from-emerald-500 via-green-400 to-lime-400 hover:from-emerald-400 hover:to-lime-300 text-slate-950 font-black text-lg tracking-wider rounded-2xl shadow-[0_0_25px_rgba(34,197,94,0.5)] active:scale-[0.98] transition flex items-center justify-center gap-2 uppercase"
        >
          <Play className="w-5 h-5 fill-slate-950" />
          <span>Play Game</span>
        </button>

        {/* Secondary Navigation Grid */}
        <div className="grid grid-cols-3 gap-2">
          {/* Shop */}
          <button
            onClick={() => {
              soundManager.playButton();
              onOpenShop();
            }}
            className="py-2.5 px-2 bg-slate-900/90 border border-emerald-500/30 hover:border-emerald-400/80 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-200 hover:text-white transition group"
          >
            <ShoppingBag className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
            <span className="text-[11px] font-bold">15 Skins</span>
          </button>

          {/* Worlds */}
          <button
            onClick={() => {
              soundManager.playButton();
              onOpenWorlds();
            }}
            className="py-2.5 px-2 bg-slate-900/90 border border-emerald-500/30 hover:border-emerald-400/80 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-200 hover:text-white transition group"
          >
            <Globe2 className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition" />
            <span className="text-[11px] font-bold">5 Worlds</span>
          </button>

          {/* Android Export APK */}
          <button
            onClick={() => {
              soundManager.playButton();
              onOpenAndroidExport();
            }}
            className="py-2.5 px-2 bg-slate-900/90 border border-emerald-500/30 hover:border-emerald-400/80 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-200 hover:text-white transition group"
          >
            <DownloadCloud className="w-4 h-4 text-lime-400 group-hover:scale-110 transition" />
            <span className="text-[11px] font-bold">Android APK</span>
          </button>
        </div>
      </div>
    </div>
  );
};
