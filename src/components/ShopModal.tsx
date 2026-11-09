import React, { useState } from 'react';
import { X, Check, Lock, Coins, Gem, Sparkles } from 'lucide-react';
import { PlayerProgress, SkinId } from '../game/types';
import { SKINS_LIST, SNAKE_SKINS } from '../game/skins';
import { soundManager } from '../game/audio';

interface ShopModalProps {
  progress: PlayerProgress;
  onEquipSkin: (skinId: SkinId) => void;
  onUnlockSkin: (skinId: SkinId, costCoins: number, costDiamonds: number) => boolean;
  onClose: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  progress,
  onEquipSkin,
  onUnlockSkin,
  onClose,
}) => {
  const [activeSkinId, setActiveSkinId] = useState<SkinId>(progress.selectedSkin);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  const selectedSkinDef = SNAKE_SKINS[activeSkinId];
  const isUnlocked = progress.unlockedSkins.includes(activeSkinId);
  const isEquipped = progress.selectedSkin === activeSkinId;

  const handleSelectSkin = (id: SkinId) => {
    soundManager.playButton();
    setActiveSkinId(id);
    setPurchaseError(null);
  };

  const handleBuyOrEquip = () => {
    if (isEquipped) return;

    if (isUnlocked) {
      soundManager.playButton();
      onEquipSkin(activeSkinId);
    } else {
      // Attempt unlock
      const success = onUnlockSkin(
        activeSkinId,
        selectedSkinDef.priceCoins,
        selectedSkinDef.priceDiamonds
      );
      if (success) {
        soundManager.playCoin();
        setPurchaseError(null);
      } else {
        setPurchaseError('Not enough Coins or Diamonds!');
        soundManager.playCrash();
      }
    }
  };

  return (
    <div className="absolute inset-0 bg-slate-950/95 z-50 flex flex-col justify-between p-4 overflow-hidden select-none animate-fadeIn">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-lg font-black text-white tracking-wide flex items-center gap-1.5 uppercase">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Snake Shop (15 Skins)
          </h2>
          <p className="text-[11px] text-slate-400">
            Equip custom 3D serpent finishes & perks
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* User Currency Badges */}
          <div className="flex items-center gap-1 text-xs font-bold text-amber-300 font-mono">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>{progress.coins.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-cyan-300 font-mono">
            <Gem className="w-3.5 h-3.5 text-cyan-400" />
            <span>{progress.diamonds.toLocaleString()}</span>
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
      </div>

      {/* Selected Skin Hero Showcase Card */}
      <div className="my-3 p-3.5 bg-slate-900 border border-emerald-500/30 rounded-2xl flex items-center gap-4 shadow-lg">
        {/* Color Orb / Segment Preview */}
        <div className="relative w-16 h-16 rounded-2xl p-1 bg-slate-950 border-2 border-emerald-400/60 flex items-center justify-center shadow-inner">
          <div
            className="w-12 h-12 rounded-xl shadow-md transform hover:rotate-12 transition-transform duration-300"
            style={{
              background: `linear-gradient(135deg, ${selectedSkinDef.primaryColor}, ${selectedSkinDef.secondaryColor})`,
              boxShadow: `0 0 15px ${selectedSkinDef.emissiveColor}`,
            }}
          />
        </div>

        {/* Skin Info */}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white">{selectedSkinDef.name}</h3>
            {isEquipped && (
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-500/40">
                ACTIVE
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-300 line-clamp-1 mt-0.5">
            {selectedSkinDef.description}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400">
            <span className="bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
              Perk: {selectedSkinDef.perk}
            </span>
          </div>
        </div>
      </div>

      {purchaseError && (
        <div className="mb-2 text-center text-xs font-bold text-red-400 bg-red-950/60 border border-red-500/30 py-1 rounded-lg">
          {purchaseError}
        </div>
      )}

      {/* 15 Skins Grid */}
      <div className="flex-1 overflow-y-auto pr-1">
        <div className="grid grid-cols-3 gap-2 pb-2">
          {SKINS_LIST.map((skin) => {
            const unlocked = progress.unlockedSkins.includes(skin.id);
            const isCurrent = activeSkinId === skin.id;
            const isEq = progress.selectedSkin === skin.id;

            return (
              <button
                key={skin.id}
                onClick={() => handleSelectSkin(skin.id)}
                className={`relative p-2 rounded-xl border flex flex-col items-center text-center transition ${
                  isCurrent
                    ? 'bg-slate-800 border-emerald-400 shadow-md ring-1 ring-emerald-400'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Equipped Badge */}
                {isEq && (
                  <span className="absolute top-1 left-1 w-2 h-2 rounded-full bg-emerald-400 ring-1 ring-slate-950" />
                )}

                {/* Lock icon if locked */}
                {!unlocked && (
                  <div className="absolute top-1 right-1 p-0.5 rounded bg-slate-950/80 text-slate-400">
                    <Lock className="w-2.5 h-2.5" />
                  </div>
                )}

                {/* Skin Swatch */}
                <div
                  className="w-8 h-8 rounded-lg shadow-sm mb-1.5"
                  style={{
                    background: `linear-gradient(135deg, ${skin.primaryColor}, ${skin.secondaryColor})`,
                  }}
                />

                <span className="text-[10px] font-bold text-white truncate w-full">
                  {skin.name}
                </span>

                {/* Price indicator */}
                <div className="mt-1 flex items-center justify-center gap-1 text-[9px] font-mono font-bold">
                  {unlocked ? (
                    <span className="text-emerald-400">UNLOCKED</span>
                  ) : skin.priceDiamonds > 0 ? (
                    <span className="text-cyan-400 flex items-center gap-0.5">
                      <Gem className="w-2.5 h-2.5" />
                      {skin.priceDiamonds}
                    </span>
                  ) : (
                    <span className="text-amber-400 flex items-center gap-0.5">
                      <Coins className="w-2.5 h-2.5" />
                      {skin.priceCoins}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Equip / Unlock CTA Button */}
      <div className="pt-2 border-t border-slate-800">
        <button
          onClick={handleBuyOrEquip}
          disabled={isEquipped}
          className={`w-full py-3 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition ${
            isEquipped
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : isUnlocked
              ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/30'
              : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-lg shadow-amber-500/30'
          }`}
        >
          {isEquipped ? (
            <>
              <Check className="w-4 h-4" />
              <span>Equipped</span>
            </>
          ) : isUnlocked ? (
            <>
              <span>Equip This Skin</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              <span>
                Unlock ({selectedSkinDef.priceDiamonds > 0 ? `${selectedSkinDef.priceDiamonds} Diamonds` : `${selectedSkinDef.priceCoins} Coins`})
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
