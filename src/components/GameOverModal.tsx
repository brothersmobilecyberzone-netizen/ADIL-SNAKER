import React from 'react';
import { RotateCcw, Home, Trophy, Coins, Gem, Apple, Flame, Sparkles, ArrowRight } from 'lucide-react';
import { soundManager } from '../game/audio';

interface GameOverModalProps {
  isVictory?: boolean;
  score: number;
  bestScore: number;
  applesEaten: number;
  coinsEarned: number;
  diamondsEarned: number;
  reason?: string;
  level?: number;
  onRestart: () => void;
  onNextLevel?: () => void;
  onHome: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isVictory = false,
  score,
  bestScore,
  applesEaten,
  coinsEarned,
  diamondsEarned,
  reason = 'Game Over',
  level,
  onRestart,
  onNextLevel,
  onHome,
}) => {
  const isNewRecord = score > bestScore;

  return (
    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-6 select-none animate-fadeIn">
      <div className="w-full max-w-xs bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center">
        {/* Header Icon */}
        <div
          className={`p-3.5 rounded-2xl mb-3 border ${
            isVictory
              ? 'bg-emerald-950/90 border-emerald-400 text-emerald-400 shadow-lg shadow-emerald-500/30'
              : 'bg-red-950/80 border-red-500/50 text-red-400'
          }`}
        >
          {isVictory ? <Sparkles className="w-8 h-8" /> : <Flame className="w-8 h-8" />}
        </div>

        <h2 className="text-2xl font-black text-white tracking-wide uppercase">
          {isVictory ? `Level ${level} Complete!` : 'Game Over'}
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          {isVictory ? 'Outstanding serpent mastery!' : reason}
        </p>

        {/* New Record Flag */}
        {isNewRecord && (
          <div className="mt-2 flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-400 rounded-full text-xs font-black text-amber-300 animate-pulse">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>NEW BEST RECORD!</span>
          </div>
        )}

        {/* Scores & Stats Grid */}
        <div className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-3 mt-4 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Final Score:</span>
            <span className="font-black text-base text-white font-mono tabular-nums">
              {score.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between border-t border-slate-850 pt-1.5">
            <span className="text-slate-400 flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              Best Score:
            </span>
            <span className="font-bold text-amber-300 font-mono tabular-nums">
              {Math.max(score, bestScore).toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between border-t border-slate-850 pt-1.5">
            <span className="text-slate-400 flex items-center gap-1">
              <Apple className="w-3.5 h-3.5 text-red-500" />
              Apples Eaten:
            </span>
            <span className="font-bold text-white font-mono tabular-nums">
              {applesEaten}
            </span>
          </div>

          <div className="flex items-center justify-between border-t border-slate-850 pt-1.5">
            <span className="text-slate-400 flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              Coins Earned:
            </span>
            <span className="font-bold text-amber-400 font-mono tabular-nums">
              +{coinsEarned}
            </span>
          </div>

          {diamondsEarned > 0 && (
            <div className="flex items-center justify-between border-t border-slate-850 pt-1.5">
              <span className="text-slate-400 flex items-center gap-1">
                <Gem className="w-3.5 h-3.5 text-cyan-400" />
                Diamonds:
              </span>
              <span className="font-bold text-cyan-400 font-mono tabular-nums">
                +{diamondsEarned}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="w-full space-y-2 mt-5">
          {isVictory && onNextLevel ? (
            <button
              onClick={() => {
                soundManager.playButton();
                onNextLevel();
              }}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 via-green-400 to-lime-400 text-slate-950 font-black rounded-xl shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 uppercase tracking-wider text-sm transition"
            >
              <span>Next Level</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => {
                soundManager.playButton();
                onRestart();
              }}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 via-green-400 to-lime-400 text-slate-950 font-black rounded-xl shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 uppercase tracking-wider text-sm transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Play Again</span>
            </button>
          )}

          <button
            onClick={() => {
              soundManager.playButton();
              onHome();
            }}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold rounded-xl flex items-center justify-center gap-2 text-xs transition"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return to Home</span>
          </button>
        </div>
      </div>
    </div>
  );
};
