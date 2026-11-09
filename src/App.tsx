/**
 * ADIL-SNAKER-PANEL
 * Official 3D Android Mobile Game by ADIL PANEL
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AndroidFrame } from './components/AndroidFrame';
import { SplashScreen } from './components/SplashScreen';
import { HomeScreen } from './components/HomeScreen';
import { GameHUD } from './components/GameHUD';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';
import { ShopModal } from './components/ShopModal';
import { WorldsModal } from './components/WorldsModal';
import { DailyRewardsModal } from './components/DailyRewardsModal';
import { SettingsModal } from './components/SettingsModal';
import { AndroidExportModal } from './components/AndroidExportModal';

import { ThreeSnakeGame } from './game/ThreeSnakeGame';
import { GameMode, PlayerProgress, SkinId, WorldId } from './game/types';
import { DEFAULT_PLAYER_PROGRESS, loadPlayerProgress, savePlayerProgress } from './game/storage';
import { soundManager } from './game/audio';
import { getDailyRewardForDay } from './game/rules';

export default function App() {
  // Check for ultra-mode ?autostart=1
  const searchParams = new URLSearchParams(window.location.search);
  const autostart = searchParams.get('autostart') === '1';

  // State
  const [screen, setScreen] = useState<'splash' | 'home' | 'playing' | 'paused' | 'gameover' | 'level_victory'>(
    autostart ? 'playing' : 'splash'
  );

  const [progress, setProgress] = useState<PlayerProgress>(() => loadPlayerProgress());

  // Active Modals
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isWorldsOpen, setIsWorldsOpen] = useState(false);
  const [isDailyRewardsOpen, setIsDailyRewardsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAndroidExportOpen, setIsAndroidExportOpen] = useState(false);

  // In-game score & metrics
  const [score, setScore] = useState(0);
  const [apples, setApples] = useState(0);
  const [combo, setCombo] = useState(1);
  const [sessionCoins, setSessionCoins] = useState(0);
  const [sessionDiamonds, setSessionDiamonds] = useState(0);
  const [timer, setTimer] = useState<number | undefined>(undefined);
  const [gameOverReason, setGameOverReason] = useState('Game Over');

  // References
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const gameEngineRef = useRef<ThreeSnakeGame | null>(null);
  const progressRef = useRef(progress);
  progressRef.current = progress;

  // Initialize audio settings from loaded progress
  useEffect(() => {
    soundManager.setSoundEnabled(progress.soundEnabled);
    soundManager.setMusicEnabled(progress.musicEnabled);
  }, []);

  // Save progress helper
  const updateProgress = useCallback((updates: Partial<PlayerProgress>) => {
    setProgress((prev) => {
      const next = { ...prev, ...updates };
      savePlayerProgress(next);
      return next;
    });
  }, []);

  // Check daily reward eligibility
  const isDailyClaimAvailable = useCallback(() => {
    const lastClaim = progress.lastDailyClaimTimestamp;
    if (!lastClaim) return true;
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    return now - lastClaim >= dayMs;
  }, [progress.lastDailyClaimTimestamp]);

  const handleClaimDailyReward = useCallback(() => {
    const currentStreak = progress.dailyStreak;
    const reward = getDailyRewardForDay(currentStreak + 1);

    updateProgress({
      coins: progress.coins + reward.coins,
      diamonds: progress.diamonds + reward.diamonds,
      dailyStreak: currentStreak + 1,
      lastDailyClaimTimestamp: Date.now(),
    });
  }, [progress.dailyStreak, progress.coins, progress.diamonds, updateProgress]);

  // Start 3D Game Session
  const startGame = useCallback((mode: GameMode = progress.selectedMode) => {
    setScreen('playing');
    setScore(0);
    setApples(0);
    setCombo(1);
    setSessionCoins(0);
    setSessionDiamonds(0);
    setTimer(mode === 'time_challenge' ? 120 : undefined);

    if (canvasMountRef.current && !gameEngineRef.current) {
      gameEngineRef.current = new ThreeSnakeGame(canvasMountRef.current, {
        onScoreUpdate: (newScore, newApples, newCombo, newCoins, newDiamonds) => {
          setScore(newScore);
          setApples(newApples);
          setCombo(newCombo);
          setSessionCoins(newCoins);
          setSessionDiamonds(newDiamonds);
        },
        onGameOver: (finalScore, applesEaten, coinsEarned, diamondsEarned, reason) => {
          setGameOverReason(reason);
          setScreen('gameover');

          // Save high score and rewards
          const currentMode = progressRef.current.selectedMode;
          const prevHigh = progressRef.current.highScores[currentMode] || 0;
          const newHigh = Math.max(prevHigh, finalScore);

          updateProgress({
            coins: progressRef.current.coins + coinsEarned,
            diamonds: progressRef.current.diamonds + diamondsEarned,
            totalApplesEaten: progressRef.current.totalApplesEaten + applesEaten,
            highScores: {
              ...progressRef.current.highScores,
              [currentMode]: newHigh,
            },
          });
        },
        onLevelComplete: (lvl, finalScore, coinsEarned, diamondsEarned) => {
          setScreen('level_victory');
          const nextLvl = Math.min(20, lvl + 1);

          updateProgress({
            coins: progressRef.current.coins + coinsEarned,
            diamonds: progressRef.current.diamonds + diamondsEarned,
            currentLevel: nextLvl,
            highScores: {
              ...progressRef.current.highScores,
              level: Math.max(progressRef.current.highScores.level || 0, finalScore),
            },
          });
        },
        onTimerUpdate: (remaining) => {
          setTimer(remaining);
        },
      });
    }

    if (gameEngineRef.current) {
      gameEngineRef.current.initGame(
        mode,
        progress.selectedWorld,
        progress.selectedSkin,
        progress.currentLevel
      );
      gameEngineRef.current.start();
    }
  }, [progress.selectedMode, progress.selectedWorld, progress.selectedSkin, progress.currentLevel, updateProgress]);

  // Autostart effect
  useEffect(() => {
    if (autostart) {
      startGame('classic');
    }
  }, [autostart, startGame]);

  // Cleanup WebGL engine on unmount
  useEffect(() => {
    return () => {
      if (gameEngineRef.current) {
        gameEngineRef.current.dispose();
        gameEngineRef.current = null;
      }
    };
  }, []);

  // Control handlers
  const handleJoystickMove = (dx: number, dy: number) => {
    if (gameEngineRef.current) {
      gameEngineRef.current.setJoystickInput(dx, dy);
    }
  };

  const handleSwipe = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (gameEngineRef.current) {
      gameEngineRef.current.handleSwipe(direction);
    }
  };

  const handlePause = () => {
    if (gameEngineRef.current) {
      gameEngineRef.current.setPaused(true);
    }
    setScreen('paused');
  };

  const handleResume = () => {
    if (gameEngineRef.current) {
      gameEngineRef.current.setPaused(false);
    }
    setScreen('playing');
  };

  const handleRestart = () => {
    startGame(progress.selectedMode);
  };

  const handleNextLevel = () => {
    startGame('level');
  };

  const handleHome = () => {
    if (gameEngineRef.current) {
      gameEngineRef.current.stop();
    }
    setScreen('home');
  };

  const handleToggleSound = () => {
    const next = !progress.soundEnabled;
    soundManager.setSoundEnabled(next);
    updateProgress({ soundEnabled: next });
  };

  // Shop Unlock
  const handleUnlockSkin = (skinId: SkinId, costCoins: number, costDiamonds: number): boolean => {
    if (progress.coins >= costCoins && progress.diamonds >= costDiamonds) {
      updateProgress({
        coins: progress.coins - costCoins,
        diamonds: progress.diamonds - costDiamonds,
        unlockedSkins: [...progress.unlockedSkins, skinId],
        selectedSkin: skinId,
      });
      return true;
    }
    return false;
  };

  // World Unlock
  const handleUnlockWorld = (worldId: WorldId, costCoins: number): boolean => {
    if (progress.coins >= costCoins) {
      updateProgress({
        coins: progress.coins - costCoins,
        unlockedWorlds: [...progress.unlockedWorlds, worldId],
        selectedWorld: worldId,
      });
      return true;
    }
    return false;
  };

  return (
    <AndroidFrame>
      <div
        className="relative w-full h-full overflow-hidden bg-slate-950 font-sans"
        data-state={screen}
        data-testid="game-root"
      >
        {/* Isolated WebGL 3D Canvas Mount Point */}
        <div
          ref={canvasMountRef}
          className={`absolute inset-0 w-full h-full ${
            screen === 'playing' || screen === 'paused' || screen === 'gameover' || screen === 'level_victory'
              ? 'opacity-100 pointer-events-auto'
              : 'opacity-0 pointer-events-none'
          }`}
          data-testid="webgl-canvas-container"
        />

        {/* 1. Splash Screen */}
        {screen === 'splash' && (
          <SplashScreen onComplete={() => setScreen('home')} />
        )}

        {/* 2. Home Screen */}
        {screen === 'home' && (
          <HomeScreen
            progress={progress}
            onPlay={(mode) => {
              updateProgress({ selectedMode: mode });
              startGame(mode);
            }}
            onOpenShop={() => setIsShopOpen(true)}
            onOpenWorlds={() => setIsWorldsOpen(true)}
            onOpenDailyRewards={() => setIsDailyRewardsOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenAndroidExport={() => setIsAndroidExportOpen(true)}
          />
        )}

        {/* 3. In-Game 3D HUD (Low-occlusion overlay) */}
        {(screen === 'playing' || screen === 'paused') && (
          <GameHUD
            score={score}
            apples={apples}
            combo={combo}
            coins={sessionCoins}
            diamonds={sessionDiamonds}
            timer={timer}
            levelGoalText={
              progress.selectedMode === 'level'
                ? `Lvl ${progress.currentLevel} Goal: ${apples}/${5 + progress.currentLevel * 2} Apples`
                : undefined
            }
            soundEnabled={progress.soundEnabled}
            controlType={progress.controlType}
            onPause={handlePause}
            onToggleSound={handleToggleSound}
            onJoystickMove={handleJoystickMove}
            onSwipe={handleSwipe}
          />
        )}

        {/* 4. Pause Modal */}
        {screen === 'paused' && (
          <PauseModal
            onResume={handleResume}
            onRestart={handleRestart}
            onHome={handleHome}
            soundEnabled={progress.soundEnabled}
            onToggleSound={handleToggleSound}
          />
        )}

        {/* 5. Game Over / Level Complete Modal */}
        {(screen === 'gameover' || screen === 'level_victory') && (
          <GameOverModal
            isVictory={screen === 'level_victory'}
            score={score}
            bestScore={progress.highScores[progress.selectedMode] || 0}
            applesEaten={apples}
            coinsEarned={sessionCoins}
            diamondsEarned={sessionDiamonds}
            reason={gameOverReason}
            level={progress.currentLevel}
            onRestart={handleRestart}
            onNextLevel={handleNextLevel}
            onHome={handleHome}
          />
        )}

        {/* Modals & Menus */}
        {isShopOpen && (
          <ShopModal
            progress={progress}
            onEquipSkin={(skinId) => updateProgress({ selectedSkin: skinId })}
            onUnlockSkin={handleUnlockSkin}
            onClose={() => setIsShopOpen(false)}
          />
        )}

        {isWorldsOpen && (
          <WorldsModal
            progress={progress}
            onSelectWorld={(worldId) => updateProgress({ selectedWorld: worldId })}
            onUnlockWorld={handleUnlockWorld}
            onClose={() => setIsWorldsOpen(false)}
          />
        )}

        {isDailyRewardsOpen && (
          <DailyRewardsModal
            currentStreak={progress.dailyStreak}
            canClaimToday={isDailyClaimAvailable()}
            onClaim={handleClaimDailyReward}
            onClose={() => setIsDailyRewardsOpen(false)}
          />
        )}

        {isSettingsOpen && (
          <SettingsModal
            progress={progress}
            onUpdateSettings={updateProgress}
            onResetProgress={() => {
              setProgress(DEFAULT_PLAYER_PROGRESS);
              savePlayerProgress(DEFAULT_PLAYER_PROGRESS);
            }}
            onClose={() => setIsSettingsOpen(false)}
          />
        )}

        {isAndroidExportOpen && (
          <AndroidExportModal onClose={() => setIsAndroidExportOpen(false)} />
        )}
      </div>
    </AndroidFrame>
  );
}
