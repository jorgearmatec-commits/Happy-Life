import React, { useState } from 'react';
import { SpanishCard, SpanishSuit } from './MinigamesSection';

interface SpanishCardViewProps {
  card: SpanishCard;
  isSelected?: boolean;
  isHinted?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  isFaceDown?: boolean;
}

export const SpanishCardView: React.FC<SpanishCardViewProps> = ({
  card,
  isSelected = false,
  isHinted = false,
  onClick,
  size = 'md',
  disabled = false,
  isFaceDown = false,
}) => {
  const { suit, rank, value } = card;
  const [imgError, setImgError] = useState(false);

  // Dimensiones ampliadas y cómodas según solicitud del usuario
  const sizeClasses = {
    sm: 'w-14 h-22 sm:w-16 sm:h-24',
    md: 'w-22 h-34 sm:w-26 sm:h-40 md:w-28 md:h-44',
    lg: 'w-28 h-44 sm:w-32 sm:h-50 md:w-36 md:h-54',
  }[size];

  // Paleta de colores tradicionales de la baraja española
  const suitColors: Record<SpanishSuit, { primary: string; secondary: string; border: string; name: string }> = {
    oros: { primary: '#eab308', secondary: '#ca8a04', border: '#ca8a04', name: 'Oros' },
    copas: { primary: '#ef4444', secondary: '#b91c1c', border: '#b91c1c', name: 'Copas' },
    espadas: { primary: '#0284c7', secondary: '#0369a1', border: '#0369a1', name: 'Espadas' },
    bastos: { primary: '#15803d', secondary: '#166534', border: '#166534', name: 'Bastos' },
  };

  const colors = suitColors[suit];
  const webpUrl = `/cards/${suit}_${rank}.webp`;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative ${sizeClasses} rounded-2xl flex flex-col items-center justify-center p-1 transition-all select-none cursor-pointer group ${
        isSelected
          ? 'scale-108 -translate-y-3 ring-4 ring-amber-400 shadow-[0_20px_35px_rgba(245,158,11,0.65)] z-20'
          : isHinted
          ? 'scale-104 -translate-y-1.5 ring-3 ring-lime-400 shadow-[0_15px_30px_rgba(132,204,22,0.5)] z-10'
          : 'hover:-translate-y-1.5 hover:shadow-2xl'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      style={{
        filter: isSelected
          ? 'drop-shadow(0 0 12px rgba(245, 158, 11, 0.8))'
          : isHinted
          ? 'drop-shadow(0 0 10px rgba(132, 204, 22, 0.8))'
          : 'drop-shadow(0 6px 12px rgba(0, 0, 0, 0.45))',
      }}
    >
      {/* CARTA BARAJA ESPAÑOLA (REVERSO O IMAGEN WEBP AUTÉNTICA) */}
      {isFaceDown ? (
        <div className="w-full h-full rounded-xl bg-gradient-to-br from-[#4a0d0d] via-[#1a1118] to-[#12080a] border-2 border-amber-500/60 flex flex-col items-center justify-center p-2 shadow-inner text-center select-none">
          <div className="w-8 h-8 rounded-full border border-amber-400/60 flex items-center justify-center bg-black/60 mb-1 shadow-md">
            <span className="text-sm">🎴</span>
          </div>
          <span className="text-[9px] font-black tracking-widest text-amber-300 font-serif uppercase">
            Baraja
          </span>
          <span className="text-[7px] text-amber-400/70 font-mono tracking-tighter">
            Española
          </span>
        </div>
      ) : !imgError ? (
        <img
          src={webpUrl}
          alt={`${rank} de ${colors.name}`}
          className="w-full h-full object-contain pointer-events-none rounded-xl"
          loading="eager"
          decoding="async"
          onError={() => setImgError(true)}
        />
      ) : (
        /* Fallback elegante si no carga la imagen webp */
        <div
          className="w-full h-full rounded-xl bg-[#fffef0] border-2 flex flex-col justify-between p-2 shadow-inner"
          style={{ borderColor: colors.border }}
        >
          <div className="flex justify-between items-center text-xs font-black">
            <span className="font-serif text-slate-900">{rank}</span>
            <span className="text-[9px] uppercase" style={{ color: colors.secondary }}>
              {colors.name}
            </span>
          </div>
          <div className="flex flex-col items-center justify-center my-auto">
            <span className="text-xl font-black font-serif text-slate-900">{rank}</span>
            <span className="text-[10px] font-black" style={{ color: colors.secondary }}>
              {colors.name}
            </span>
          </div>
          <div className="flex justify-between items-center text-[10px] font-black border-t border-slate-200 pt-0.5">
            <span className="text-slate-600 bg-slate-100 px-1 rounded-sm">Suma: {value}</span>
            <span className="font-serif text-slate-900">{rank}</span>
          </div>
        </div>
      )}
    </button>
  );
};
