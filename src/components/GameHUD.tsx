import React, { useRef, useState, useEffect } from 'react';
import { Pause, Volume2, VolumeX, Coins, Gem, Apple, Flame, Clock } from 'lucide-react';
import { ControlType } from '../game/types';
import { soundManager } from '../game/audio';

interface GameHUDProps {
  score: number;
  apples: number;
  combo: number;
  coins: number;
  diamonds: number;
  timer?: number;
  levelGoalText?: string;
  soundEnabled: boolean;
  controlType: ControlType;
  onPause: () => void;
  onToggleSound: () => void;
  onJoystickMove: (dx: number, dy: number) => void;
  onSwipe: (direction: 'up' | 'down' | 'left' | 'right') => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  score,
  apples,
  combo,
  coins,
  diamonds,
  timer,
  levelGoalText,
  soundEnabled,
  controlType,
  onPause,
  onToggleSound,
  onJoystickMove,
  onSwipe,
}) => {
  // Virtual Joystick state
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const [joystickActive, setJoystickActive] = useState(false);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  // Swipe detection touch state
  const swipeStartPos = useRef<{ x: number; y: number; time: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    if (controlType === 'swipe') {
      swipeStartPos.current = { x: clientX, y: clientY, time: performance.now() };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
    if (controlType === 'swipe' && swipeStartPos.current) {
      const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
      const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : e.clientY;

      const dx = clientX - swipeStartPos.current.x;
      const dy = clientY - swipeStartPos.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 25) {
        if (Math.abs(dx) > Math.abs(dy)) {
          onSwipe(dx > 0 ? 'right' : 'left');
        } else {
          onSwipe(dy > 0 ? 'down' : 'up');
        }
      }
      swipeStartPos.current = null;
    }
  };

  // Joystick touch handlers
  const handleJoystickStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.stopPropagation();
    setJoystickActive(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    touchStartPos.current = { x: clientX, y: clientY };
  };

  const handleJoystickMove = (e: TouchEvent | MouseEvent) => {
    if (!joystickActive || !touchStartPos.current) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const maxRadius = 45;
    let dx = clientX - touchStartPos.current.x;
    let dy = clientY - touchStartPos.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }

    setKnobPos({ x: dx, y: dy });
    onJoystickMove(dx / maxRadius, dy / maxRadius);
  };

  const handleJoystickEnd = () => {
    setJoystickActive(false);
    setKnobPos({ x: 0, y: 0 });
    touchStartPos.current = null;
  };

  useEffect(() => {
    if (joystickActive) {
      window.addEventListener('touchmove', handleJoystickMove);
      window.addEventListener('touchend', handleJoystickEnd);
      window.addEventListener('mousemove', handleJoystickMove);
      window.addEventListener('mouseup', handleJoystickEnd);
    }
    return () => {
      window.removeEventListener('touchmove', handleJoystickMove);
      window.removeEventListener('touchend', handleJoystickEnd);
      window.removeEventListener('mousemove', handleJoystickMove);
      window.removeEventListener('mouseup', handleJoystickEnd);
    };
  }, [joystickActive]);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 select-none overflow-hidden z-20"
    >
      {/* Top Status Cluster (Unobstructed Viewport <15% occlusion) */}
      <div className="w-full flex items-center justify-between gap-2 pointer-events-auto">
        {/* Left: Score & Multiplier */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-emerald-500/40 rounded-full px-3 py-1 shadow-md">
            <span className="text-[10px] uppercase font-bold text-emerald-400">Score</span>
            <span className="text-base font-black text-white font-mono tabular-nums">
              {score.toLocaleString()}
            </span>
            {combo > 1 && (
              <span className="flex items-center gap-0.5 text-[11px] font-black text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded-full animate-bounce">
                <Flame className="w-3 h-3 text-amber-400" />
                {combo}x
              </span>
            )}
          </div>

          {/* Optional Level Goal / Timer */}
          {(levelGoalText || timer !== undefined) && (
            <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-slate-900/80 px-2 py-0.5 rounded-md border border-emerald-500/20 self-start">
              {timer !== undefined && (
                <div className="flex items-center gap-1 text-cyan-300">
                  <Clock className="w-3 h-3" />
                  <span className="font-mono tabular-nums">{timer}s</span>
                </div>
              )}
              {levelGoalText && <span>{levelGoalText}</span>}
            </div>
          )}
        </div>

        {/* Center: Currency pickups this run */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-900/80 border border-slate-800 rounded-full px-2 py-1 text-xs">
            <Apple className="w-3.5 h-3.5 text-red-500" />
            <span className="font-bold text-white font-mono tabular-nums">{apples}</span>
          </div>
          <div className="flex items-center gap-1 bg-slate-900/80 border border-amber-500/30 rounded-full px-2 py-1 text-xs">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-bold text-amber-300 font-mono tabular-nums">{coins}</span>
          </div>
          {diamonds > 0 && (
            <div className="flex items-center gap-1 bg-slate-900/80 border border-cyan-500/30 rounded-full px-2 py-1 text-xs">
              <Gem className="w-3 h-3 text-cyan-400" />
              <span className="font-bold text-cyan-300 font-mono tabular-nums">{diamonds}</span>
            </div>
          )}
        </div>

        {/* Right: Audio Toggle & Pause Button */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              soundManager.playButton();
              onToggleSound();
            }}
            className="p-2 rounded-full bg-slate-900/90 border border-slate-700 text-slate-300 hover:text-white transition shadow-sm"
            aria-label="Toggle Sound"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          <button
            onClick={() => {
              soundManager.playButton();
              onPause();
            }}
            className="p-2 rounded-full bg-slate-900/90 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-950/80 transition shadow-sm"
            aria-label="Pause Game"
          >
            <Pause className="w-4 h-4 fill-emerald-400" />
          </button>
        </div>
      </div>

      {/* Bottom Control Zone: Virtual Joystick or Swipe Prompt */}
      <div className="w-full flex items-end justify-between pb-3 pointer-events-none">
        {controlType === 'joystick' ? (
          <div className="pointer-events-auto mx-auto mb-2 flex flex-col items-center">
            {/* Virtual Joystick Base */}
            <div
              ref={joystickBaseRef}
              onTouchStart={handleJoystickStart}
              onMouseDown={handleJoystickStart}
              className="relative w-28 h-28 rounded-full border-2 border-emerald-400/40 bg-slate-950/70 shadow-2xl flex items-center justify-center cursor-pointer touch-none"
            >
              {/* Inner Guide Crosshairs */}
              <div className="absolute w-full h-[1px] bg-emerald-500/20" />
              <div className="absolute h-full w-[1px] bg-emerald-500/20" />

              {/* Joystick Moveable Knob */}
              <div
                className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 border border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.8)] flex items-center justify-center transform transition-transform duration-75"
                style={{
                  transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
                }}
              >
                <div className="w-3 h-3 rounded-full bg-slate-950/80" />
              </div>
            </div>
            <span className="text-[10px] text-emerald-400/70 font-semibold tracking-wider mt-1 uppercase">
              Drag to Steer
            </span>
          </div>
        ) : (
          <div className="mx-auto bg-slate-900/80 border border-emerald-500/30 rounded-full px-4 py-1 text-center mb-2">
            <span className="text-[11px] font-semibold text-emerald-300">
              Swipe in any direction to turn
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
