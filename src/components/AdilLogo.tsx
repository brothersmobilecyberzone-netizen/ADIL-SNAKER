import React from 'react';

interface AdilLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
}

export const AdilLogo: React.FC<AdilLogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = true,
}) => {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-36 h-36',
  };

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <div className="relative group">
        {/* Glowing cyber aura */}
        <div className="absolute -inset-1.5 bg-gradient-to-r from-emerald-500 via-green-400 to-lime-500 rounded-2xl blur-md opacity-60 group-hover:opacity-90 transition duration-500" />
        
        {/* Official Mascot Logo Image */}
        <div className={`relative ${sizeClasses[size]} rounded-2xl overflow-hidden border-2 border-emerald-400/80 shadow-2xl bg-slate-950 flex items-center justify-center`}>
          <img
            src="/src/assets/images/adil_panel_logo_1794206854855.jpg"
            alt="ADIL PANEL Official Snake Mascot"
            className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              // High fidelity SVG fallback if image cannot load
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                parent.innerHTML = `
                  <svg viewBox="0 0 100 100" class="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="45" fill="#062013" stroke="#10b981" stroke-width="4"/>
                    <path d="M50 20 C65 20, 75 35, 65 50 C55 65, 40 60, 45 75 C48 82, 55 82, 58 78" stroke="#22c55e" stroke-width="8" stroke-linecap="round"/>
                    <circle cx="45" cy="32" r="5" fill="#ffffff"/>
                    <circle cx="45" cy="32" r="2.5" fill="#0f172a"/>
                    <path d="M42 38 Q38 42 32 40" stroke="#f43f5e" stroke-width="2.5" stroke-linecap="round"/>
                    <text x="50" y="93" text-anchor="middle" fill="#4ade80" font-size="9" font-weight="900" font-family="sans-serif">ADIL PANEL</text>
                  </svg>
                `;
              }
            }}
          />
        </div>
      </div>

      {showSubtitle && (
        <div className="mt-2 text-center">
          <div className="text-xs font-black tracking-widest uppercase text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]">
            ADIL PANEL
          </div>
          <div className="text-[10px] text-emerald-500/70 font-semibold tracking-wider">
            OFFICIAL 3D GAME
          </div>
        </div>
      )}
    </div>
  );
};
