import React, { useState } from 'react';
import { X, Check, Lock, Globe2, Coins } from 'lucide-react';
import { PlayerProgress, WorldId } from '../game/types';
import { WORLDS, WORLDS_LIST } from '../game/worlds';
import { soundManager } from '../game/audio';

interface WorldsModalProps {
  progress: PlayerProgress;
  onSelectWorld: (worldId: WorldId) => void;
  onUnlockWorld: (worldId: WorldId, costCoins: number) => boolean;
  onClose: () => void;
}

export const WorldsModal: React.FC<WorldsModalProps> = ({
  progress,
  onSelectWorld,
  onUnlockWorld,
  onClose,
}) => {
  const [activeWorldId, setActiveWorldId] = useState<WorldId>(progress.selectedWorld);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedWorldDef = WORLDS[activeWorldId];
  const isUnlocked = progress.unlockedWorlds.includes(activeWorldId);
  const isSelected = progress.selectedWorld === activeWorldId;

  const handleSelectWorld = (id: WorldId) => {
    soundManager.playButton();
    setActiveWorldId(id);
    setErrorMsg(null);
  };

  const handleApplyOrUnlock = () => {
    if (isSelected) return;

    if (isUnlocked) {
      soundManager.playButton();
      onSelectWorld(activeWorldId);
    } else {
      const ok = onUnlockWorld(activeWorldId, selectedWorldDef.unlockCostCoins);
      if (ok) {
        soundManager.playCoin();
        setErrorMsg(null);
      } else {
        soundManager.playCrash();
        setErrorMsg('Not enough Coins to unlock this world!');
      }
    }
  };

  return (
    <div className="absolute inset-0 bg-slate-950/95 z-50 flex flex-col justify-between p-4 overflow-hidden select-none animate-fadeIn">
      {/* Header */}
      <div className="w-full flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-lg font-black text-white tracking-wide flex items-center gap-1.5 uppercase">
            <Globe2 className="w-4 h-4 text-cyan-400" />
            Select 3D World (5 Arenas)
          </h2>
          <p className="text-[11px] text-slate-400">
            Unique terrain surfaces, lighting & hazard densities
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

      {errorMsg && (
        <div className="my-2 text-center text-xs font-bold text-red-400 bg-red-950/60 border border-red-500/30 py-1 rounded-lg">
          {errorMsg}
        </div>
      )}

      {/* 5 Worlds Vertical Stack */}
      <div className="flex-1 overflow-y-auto py-2 space-y-2.5 pr-1">
        {WORLDS_LIST.map((w) => {
          const unlocked = progress.unlockedWorlds.includes(w.id);
          const isCurrent = activeWorldId === w.id;
          const isActivelyPlayed = progress.selectedWorld === w.id;

          return (
            <div
              key={w.id}
              onClick={() => handleSelectWorld(w.id)}
              className={`p-3 rounded-2xl border cursor-pointer transition flex items-center justify-between gap-3 ${
                isCurrent
                  ? 'bg-slate-900 border-emerald-400 shadow-md ring-1 ring-emerald-400/80'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* World Theme Swatch */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center border shadow-inner"
                  style={{
                    backgroundColor: w.groundColor,
                    borderColor: w.themeColor,
                  }}
                >
                  <Globe2 className="w-6 h-6" style={{ color: w.themeColor }} />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-white">{w.name}</h3>
                    {isActivelyPlayed && (
                      <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/40">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">{w.subtitle}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Obstacles: {w.obstacleCount} · Size: {w.arenaSize}x{w.arenaSize}m
                  </p>
                </div>
              </div>

              {/* Status / Lock */}
              <div className="text-right">
                {unlocked ? (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/50 px-2 py-1 rounded-md border border-emerald-500/30">
                    UNLOCKED
                  </span>
                ) : (
                  <div className="flex items-center gap-1 text-xs font-mono font-bold text-amber-400 bg-amber-950/50 px-2 py-1 rounded-md border border-amber-500/30">
                    <Lock className="w-3 h-3" />
                    <span>{w.unlockCostCoins}</span>
                    <Coins className="w-3 h-3" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom CTA */}
      <div className="pt-2 border-t border-slate-800">
        <button
          onClick={handleApplyOrUnlock}
          disabled={isSelected}
          className={`w-full py-3 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition ${
            isSelected
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : isUnlocked
              ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/30'
              : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-lg shadow-amber-500/30'
          }`}
        >
          {isSelected ? (
            <>
              <Check className="w-4 h-4" />
              <span>Selected World</span>
            </>
          ) : isUnlocked ? (
            <span>Select This World</span>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              <span>Unlock for {selectedWorldDef.unlockCostCoins} Coins</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
