import React from 'react';
import { X, Gift, Coins, Gem, Check, Sparkles } from 'lucide-react';
import { getDailyRewardForDay } from '../game/rules';
import { soundManager } from '../game/audio';

interface DailyRewardsModalProps {
  currentStreak: number;
  canClaimToday: boolean;
  onClaim: () => void;
  onClose: () => void;
}

export const DailyRewardsModal: React.FC<DailyRewardsModalProps> = ({
  currentStreak,
  canClaimToday,
  onClaim,
  onClose,
}) => {
  const currentDay = (currentStreak % 7) + 1;

  const handleClaim = () => {
    soundManager.playBonus();
    onClaim();
  };

  return (
    <div className="absolute inset-0 bg-slate-950/95 z-50 flex flex-col justify-between p-4 overflow-hidden select-none animate-fadeIn">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-950 border border-emerald-500/40 rounded-xl text-emerald-400">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-white tracking-wide uppercase">
              Daily Login Rewards
            </h2>
            <p className="text-[11px] text-emerald-400 font-semibold">
              Current Streak: {currentStreak} Days
            </p>
          </div>
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

      {/* 7-Day Calendar Grid */}
      <div className="flex-1 overflow-y-auto py-3">
        <div className="grid grid-cols-2 gap-2.5">
          {[1, 2, 3, 4, 5, 6, 7].map((day) => {
            const reward = getDailyRewardForDay(day);
            const isToday = day === currentDay && canClaimToday;
            const isClaimed = day < currentDay || (day === currentDay && !canClaimToday);
            const isJackpot = day === 7;

            return (
              <div
                key={day}
                className={`relative p-3 rounded-2xl border flex flex-col items-center text-center justify-between transition ${
                  isJackpot ? 'col-span-2 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-amber-950/80 border-amber-400' : ''
                } ${
                  isToday
                    ? 'bg-slate-900 border-emerald-400 ring-2 ring-emerald-400/80 shadow-lg shadow-emerald-500/20'
                    : isClaimed
                    ? 'bg-slate-950/60 border-slate-800 opacity-60'
                    : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                {/* Day Header */}
                <div className="w-full flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
                  <span>DAY {day}</span>
                  {isClaimed && (
                    <span className="flex items-center gap-0.5 text-emerald-400">
                      <Check className="w-3 h-3" />
                      CLAIMED
                    </span>
                  )}
                  {isToday && (
                    <span className="text-amber-400 font-black animate-pulse">
                      READY!
                    </span>
                  )}
                </div>

                {/* Reward Graphic */}
                <div className="my-1.5 p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                  {isJackpot ? (
                    <Sparkles className="w-7 h-7 text-amber-400 animate-spin" />
                  ) : (
                    <Gift className="w-5 h-5 text-emerald-400" />
                  )}
                </div>

                {/* Reward Values */}
                <div className="space-y-0.5">
                  <div className="text-xs font-black text-amber-300 font-mono flex items-center justify-center gap-1">
                    <Coins className="w-3 h-3 text-amber-400" />
                    +{reward.coins} Coins
                  </div>
                  {reward.diamonds > 0 && (
                    <div className="text-[11px] font-black text-cyan-300 font-mono flex items-center justify-center gap-1">
                      <Gem className="w-3 h-3 text-cyan-400" />
                      +{reward.diamonds} Diamonds
                    </div>
                  )}
                </div>

                <div className="text-[9px] font-semibold text-slate-400 mt-1">
                  {reward.badge}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Claim Button */}
      <div className="pt-2 border-t border-slate-800">
        <button
          onClick={handleClaim}
          disabled={!canClaimToday}
          className={`w-full py-3 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition ${
            canClaimToday
              ? 'bg-gradient-to-r from-emerald-500 via-green-400 to-lime-400 text-slate-950 shadow-lg shadow-emerald-500/30'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          {canClaimToday ? (
            <>
              <Gift className="w-4 h-4" />
              <span>Claim Today's Reward!</span>
            </>
          ) : (
            <span>Already Claimed Today (Come back tomorrow)</span>
          )}
        </button>
      </div>
    </div>
  );
};
