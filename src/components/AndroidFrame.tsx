import React, { useState } from 'react';
import { Smartphone, Maximize2, Wifi, BatteryCharging, Signal } from 'lucide-react';

interface AndroidFrameProps {
  children: React.ReactNode;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({ children }) => {
  const [deviceFrameEnabled, setDeviceFrameEnabled] = useState(true);

  return (
    <div className="relative w-full h-screen bg-slate-950 flex flex-col items-center justify-center overflow-hidden font-sans select-none">
      {/* Subtle ambient cyber glow background for desktop view */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-950/20 via-slate-950 to-slate-950 pointer-events-none" />

      {/* Frame / Fullscreen toggle bar (visible on wide screens) */}
      <div className="hidden md:flex absolute top-3 right-4 z-50 items-center gap-2 bg-slate-900/90 border border-emerald-500/30 rounded-full px-3 py-1.5 shadow-lg backdrop-blur-md">
        <span className="text-xs text-emerald-400 font-medium">Android Preview:</span>
        <button
          onClick={() => setDeviceFrameEnabled(!deviceFrameEnabled)}
          className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition ${
            deviceFrameEnabled
              ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/50'
              : 'bg-slate-800 text-slate-300 hover:text-white'
          }`}
          title="Toggle Android Phone Frame"
        >
          {deviceFrameEnabled ? <Smartphone className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          {deviceFrameEnabled ? '9:16 Phone' : 'Fullscreen'}
        </button>
      </div>

      {/* Main Container: either simulated 9:16 Android Phone Frame or full viewport */}
      <div
        className={`relative flex flex-col overflow-hidden transition-all duration-300 ${
          deviceFrameEnabled
            ? 'w-full max-w-[430px] h-full max-h-[880px] md:rounded-[42px] md:border-[10px] md:border-slate-800 md:shadow-[0_0_50px_rgba(16,185,129,0.25)] ring-1 ring-emerald-500/30'
            : 'w-full h-full'
        }`}
      >
        {/* Android Status Bar */}
        <div className="h-7 w-full bg-slate-950/95 flex items-center justify-between px-6 z-40 text-[11px] text-slate-300 font-semibold tracking-wider border-b border-slate-900/50">
          <div className="flex items-center gap-1">
            <span>12:00</span>
          </div>

          {/* Android Punch-hole front camera simulation */}
          <div className="w-3.5 h-3.5 rounded-full bg-black border border-slate-700/60 shadow-inner" />

          <div className="flex items-center gap-1.5 text-emerald-400">
            <Signal className="w-3 h-3 text-slate-300" />
            <Wifi className="w-3 h-3 text-slate-300" />
            <span className="text-[10px] text-slate-200">98%</span>
            <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        </div>

        {/* Viewport Content */}
        <div className="relative flex-1 w-full h-[calc(100%-28px)] overflow-hidden bg-slate-950">
          {children}
        </div>
      </div>
    </div>
  );
};
