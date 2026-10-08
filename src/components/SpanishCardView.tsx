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

const SUIT_DATA: Record<
  SpanishSuit,
  {
    name: string;
    symbol: string;
    primaryColor: string;
    darkColor: string;
    badgeBg: string;
    borderColor: string;
    lightBg: string;
  }
> = {
  oros: {
    name: 'Oros',
    symbol: '🪙',
    primaryColor: '#d97706',
    darkColor: '#92400e',
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-400',
    borderColor: '#d97706',
    lightBg: '#fef3c7',
  },
  copas: {
    name: 'Copas',
    symbol: '🏆',
    primaryColor: '#dc2626',
    darkColor: '#991b1b',
    badgeBg: 'bg-rose-100 text-rose-900 border-rose-400',
    borderColor: '#dc2626',
    lightBg: '#ffe4e6',
  },
  espadas: {
    name: 'Espadas',
    symbol: '⚔️',
    primaryColor: '#0284c7',
    darkColor: '#075985',
    badgeBg: 'bg-sky-100 text-sky-900 border-sky-400',
    borderColor: '#0284c7',
    lightBg: '#e0f2fe',
  },
  bastos: {
    name: 'Bastos',
    symbol: '🪵',
    primaryColor: '#16a34a',
    darkColor: '#166534',
    badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-400',
    borderColor: '#16a34a',
    lightBg: '#dcfce7',
  },
};

const getRankLabel = (rank: number): { display: string; name: string } => {
  if (rank === 1) return { display: '1', name: 'As' };
  if (rank === 10) return { display: '10', name: 'Sota' };
  if (rank === 11) return { display: '11', name: 'Caballo' };
  if (rank === 12) return { display: '12', name: 'Rey' };
  return { display: String(rank), name: String(rank) };
};

export const SpanishCardView: React.FC<SpanishCardViewProps> = ({
  card,
  isSelected = false,
  isHinted = false,
  onClick,
  size = 'md',
  disabled = false,
  isFaceDown = false,
}) => {
  const { suit, rank, value, id } = card;
  const [imgError, setImgError] = useState(false);

  const suitInfo = SUIT_DATA[suit] || SUIT_DATA.oros;
  const { display: rankDisplay, name: rankName } = getRankLabel(rank);

  // Mapeo exacto de las 40 imágenes WebP por el ID real de la carta (/cards/${card.id}.webp)
  const webpUrl = `/cards/${id || `${suit}_${rank}`}.webp`;

  // Dimensiones ampliadas y cómodas para buena visibilidad táctil
  const sizeClasses = {
    sm: 'w-16 h-24 sm:w-18 sm:h-28 text-xs',
    md: 'w-24 h-36 sm:w-28 sm:h-44 md:w-32 md:h-48 text-sm',
    lg: 'w-28 h-44 sm:w-34 sm:h-52 md:w-38 md:h-56 text-base',
  }[size];

  // Tamaños tipográficos dinámicos según tamaño de carta
  const fontSizes = {
    sm: {
      cornerNumber: 'text-sm font-black',
      cornerSymbol: 'text-[9px]',
      bottomPill: 'text-[8px] px-1 py-0.2',
      centerRank: 'text-2xl font-black',
    },
    md: {
      cornerNumber: 'text-lg sm:text-xl font-black',
      cornerSymbol: 'text-xs',
      bottomPill: 'text-[9px] sm:text-[10px] px-1.5 py-0.5',
      centerRank: 'text-3xl sm:text-4xl font-black',
    },
    lg: {
      cornerNumber: 'text-xl sm:text-2xl font-black',
      cornerSymbol: 'text-sm',
      bottomPill: 'text-xs px-2 py-0.5',
      centerRank: 'text-4xl sm:text-5xl font-black',
    },
  }[size];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative ${sizeClasses} rounded-2xl flex flex-col items-center justify-between p-1 transition-all select-none cursor-pointer group ${
        isSelected
          ? 'scale-110 -translate-y-3.5 ring-4 ring-amber-400 shadow-[0_25px_40px_rgba(245,158,11,0.7)] z-30'
          : isHinted
          ? 'scale-105 -translate-y-2 ring-3 ring-lime-400 shadow-[0_15px_30px_rgba(132,204,22,0.55)] z-20'
          : 'hover:-translate-y-1.5 hover:shadow-2xl'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
      style={{
        filter: isSelected
          ? 'drop-shadow(0 0 16px rgba(245, 158, 11, 0.9))'
          : isHinted
          ? 'drop-shadow(0 0 12px rgba(132, 204, 22, 0.8))'
          : 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.5))',
      }}
      title={`${rankName} de ${suitInfo.name} (Rango: ${rank} | Valor en Escoba: ${value} pts)`}
    >
      {/* 1. REVERSO TRADICIONAL BARAJA ESPAÑOLA (CUANDO ESTÁ BOCA ABAJO) */}
      {isFaceDown ? (
        <div className="w-full h-full rounded-xl bg-gradient-to-br from-[#7f1d1d] via-[#450a0a] to-[#1c1917] border-2 border-amber-400/80 p-2 flex flex-col items-center justify-between shadow-inner text-center relative overflow-hidden">
          {/* Patrón de fondo geométrico tradicional */}
          <div className="absolute inset-1 rounded-lg border border-amber-300/40 opacity-70 pointer-events-none" />
          <div className="absolute inset-2 border border-dashed border-amber-400/30 pointer-events-none" />

          <div className="w-full flex justify-between items-center text-[10px] text-amber-300/80 font-serif font-black px-1">
            <span>🎴</span>
            <span>✦</span>
            <span>🎴</span>
          </div>

          <div className="flex flex-col items-center justify-center my-auto z-10">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/60 border-2 border-amber-400 flex items-center justify-center shadow-lg mb-1">
              <span className="text-base sm:text-lg">👑</span>
            </div>
            <span className="text-[10px] sm:text-xs font-black tracking-widest text-amber-200 uppercase font-serif drop-shadow-md">
              BARAJA
            </span>
            <span className="text-[8px] sm:text-[9px] font-bold text-amber-400 tracking-wider font-mono">
              ESPAÑOLA
            </span>
          </div>

          <div className="w-full flex justify-between items-center text-[10px] text-amber-300/80 font-serif font-black px-1">
            <span>🎴</span>
            <span>✦</span>
            <span>🎴</span>
          </div>
        </div>
      ) : (
        /* 2. CARTA BOCA ARRIBA - DISEÑO OFICIAL BARAJA ESPAÑOLA CON DISTINCIÓN CLARA DE RANGO Y VALOR */
        <div
          className="w-full h-full rounded-xl bg-gradient-to-b from-[#fffdf5] via-[#faf7ea] to-[#f4eed4] border-2 sm:border-3 flex flex-col justify-between relative overflow-hidden shadow-inner"
          style={{ borderColor: suitInfo.borderColor }}
        >
          {/* Marco decorativo interior de naipes españoles */}
          <div
            className="absolute inset-1 rounded-lg border pointer-events-none opacity-40"
            style={{ borderColor: suitInfo.darkColor }}
          />

          {/* ========================================================= */}
          {/* ÍNDICE SUPERIOR IZQUIERDO: RANGO (1..12) + SÍMBOLO PALO    */}
          {/* ========================================================= */}
          <div className="absolute top-1 left-1.5 z-20 flex flex-col items-center leading-none pointer-events-none drop-shadow-sm">
            <span
              className={`${fontSizes.cornerNumber} font-serif tracking-tight drop-shadow-md`}
              style={{ color: suitInfo.darkColor }}
            >
              {rankDisplay}
            </span>
            <span className={`${fontSizes.cornerSymbol} mt-0.5`}>
              {suitInfo.symbol}
            </span>
          </div>

          {/* ========================================================= */}
          {/* ÍNDICE INFERIOR DERECHO INVERTIDO (ESTILO NAIPE REAL)     */}
          {/* ========================================================= */}
          <div className="absolute bottom-1 right-1.5 z-20 flex flex-col items-center leading-none pointer-events-none rotate-180 drop-shadow-sm">
            <span
              className={`${fontSizes.cornerNumber} font-serif tracking-tight drop-shadow-md`}
              style={{ color: suitInfo.darkColor }}
            >
              {rankDisplay}
            </span>
            <span className={`${fontSizes.cornerSymbol} mt-0.5`}>
              {suitInfo.symbol}
            </span>
          </div>

          {/* ========================================================= */}
          {/* CUERPO CENTRAL: IMAGEN WEBP AUTÉNTICA O ILUSTRACIÓN       */}
          {/* ========================================================= */}
          <div className="w-full h-full flex flex-col items-center justify-center p-2.5 sm:p-3 relative z-10">
            {!imgError ? (
              <img
                src={webpUrl}
                alt={`${rankName} de ${suitInfo.name}`}
                className="w-full h-full max-h-[75%] object-contain pointer-events-none select-none drop-shadow-md transition-transform group-hover:scale-105"
                loading="eager"
                decoding="async"
                onError={() => setImgError(true)}
              />
            ) : (
              /* Fallback artesanal si falla la carga */
              <div className="flex flex-col items-center justify-center text-center my-auto">
                <span className="text-3xl sm:text-4xl drop-shadow-md mb-1">
                  {suitInfo.symbol}
                </span>
                <span
                  className={`${fontSizes.centerRank} font-serif leading-none tracking-tight drop-shadow-sm`}
                  style={{ color: suitInfo.darkColor }}
                >
                  {rankDisplay}
                </span>
                <span
                  className="text-[10px] sm:text-xs font-bold uppercase tracking-wider mt-1 font-serif"
                  style={{ color: suitInfo.primaryColor }}
                >
                  {rankName}
                </span>
              </div>
            )}
          </div>

          {/* ==================================================================== */}
          {/* INSIGNIA DE VALOR EN ESCOBA: DEJA CLARO RANGO Y PUNTUACIÓN DE 15      */}
          {/* (Ej: "Sota • 8 pts", "Caballo • 9 pts", "Rey • 10 pts", "7 pts")     */}
          {/* ==================================================================== */}
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-20 pointer-events-none whitespace-nowrap">
            <div
              className={`rounded-full font-mono font-black border shadow-sm flex items-center gap-1 ${suitInfo.badgeBg} ${fontSizes.bottomPill}`}
            >
              {rank >= 10 ? (
                <>
                  <span className="font-serif font-black">{rankName}</span>
                  <span className="opacity-50">•</span>
                  <span>{value} pts</span>
                </>
              ) : rank === 1 ? (
                <>
                  <span className="font-serif font-black">As</span>
                  <span className="opacity-50">•</span>
                  <span>1 pt</span>
                </>
              ) : (
                <>
                  <span>{value} pts</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </button>
  );
};
