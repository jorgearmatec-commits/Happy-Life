import React from 'react';
import { UnoCard, UnoColor } from './MinigamesSection';

interface UnoCardViewProps {
  card: UnoCard;
  isSelected?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export const UnoCardView: React.FC<UnoCardViewProps> = ({
  card,
  isSelected = false,
  onClick,
  size = 'md',
  disabled = false,
}) => {
  const { color, type, value } = card;

  const sizeClasses = {
    sm: 'w-14 h-21 text-xs',
    md: 'w-22 h-34 sm:w-26 sm:h-40 text-sm sm:text-base',
    lg: 'w-24 h-36 sm:w-28 sm:h-44 text-base sm:text-lg',
  }[size];

  // Paleta oficial UNO
  const colorStyles: Record<UnoColor, { bg: string; border: string; glow: string; name: string }> = {
    red: { bg: 'bg-[#ef4444]', border: 'border-red-400', glow: 'rgba(239, 68, 68, 0.7)', name: 'Rojo' },
    yellow: { bg: 'bg-[#f59e0b]', border: 'border-amber-300', glow: 'rgba(245, 158, 11, 0.7)', name: 'Amarillo' },
    green: { bg: 'bg-[#10b981]', border: 'border-emerald-400', glow: 'rgba(16, 185, 129, 0.7)', name: 'Verde' },
    blue: { bg: 'bg-[#0ea5e9]', border: 'border-sky-300', glow: 'rgba(14, 165, 233, 0.7)', name: 'Azul' },
    wild: { bg: 'bg-[#18181b]', border: 'border-purple-400', glow: 'rgba(168, 85, 247, 0.7)', name: 'Comodín' },
  };

  const style = colorStyles[color];

  // Renderizar símbolo o número central
  const renderCardContent = () => {
    if (type === 'number') {
      return (
        <span className="text-4xl sm:text-5xl font-black italic tracking-tighter text-slate-900 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
          {value}
        </span>
      );
    }
    if (type === 'skip') {
      return (
        <div className="flex flex-col items-center">
          <span className="text-3xl sm:text-4xl">⊘</span>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-900">Salto</span>
        </div>
      );
    }
    if (type === 'reverse') {
      return (
        <div className="flex flex-col items-center">
          <span className="text-3xl sm:text-4xl font-black">⇄</span>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-900">Reversa</span>
        </div>
      );
    }
    if (type === 'draw2') {
      return (
        <div className="flex flex-col items-center">
          <span className="text-3xl sm:text-4xl font-black italic text-slate-900">+2</span>
          <span className="text-[9px] font-black uppercase tracking-wider text-slate-900">Roba 2</span>
        </div>
      );
    }
    if (type === 'wild') {
      return (
        <div className="flex flex-col items-center justify-center">
          {/* Óvalo de 4 colores de UNO */}
          <div className="w-12 h-12 rounded-full overflow-hidden grid grid-cols-2 grid-rows-2 border-2 border-white shadow-md">
            <div className="bg-[#ef4444]" />
            <div className="bg-[#0ea5e9]" />
            <div className="bg-[#f59e0b]" />
            <div className="bg-[#10b981]" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-widest text-white mt-1 drop-shadow">
            WILD
          </span>
        </div>
      );
    }
    if (type === 'wild4') {
      return (
        <div className="flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full overflow-hidden grid grid-cols-2 grid-rows-2 border-2 border-white shadow-md">
            <div className="bg-[#ef4444]" />
            <div className="bg-[#0ea5e9]" />
            <div className="bg-[#f59e0b]" />
            <div className="bg-[#10b981]" />
          </div>
          <span className="text-xl font-black italic text-white mt-0.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            +4
          </span>
        </div>
      );
    }
    return null;
  };

  const cornerLabel =
    type === 'number'
      ? String(value)
      : type === 'skip'
      ? '⊘'
      : type === 'reverse'
      ? '⇄'
      : type === 'draw2'
      ? '+2'
      : type === 'wild'
      ? '★'
      : '+4';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative ${sizeClasses} rounded-2xl p-1.5 flex flex-col justify-between shadow-2xl transition-all select-none cursor-pointer group ${style.bg} ${
        isSelected
          ? 'scale-110 -translate-y-3 ring-4 ring-white shadow-[0_20px_35px_rgba(255,255,255,0.7)] z-20'
          : 'hover:scale-105 hover:-translate-y-1.5'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
      style={{
        boxShadow: isSelected
          ? `0 0 30px ${style.glow}, inset 0 0 15px rgba(255,255,255,0.6)`
          : `0 10px 20px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.3)`,
      }}
    >
      {/* Borde exterior blanco de carta UNO tradicional */}
      <div className="absolute inset-1 rounded-xl border-2 border-white/80 pointer-events-none" />

      {/* Esquina superior izquierda */}
      <div className="flex justify-between items-center w-full px-1 z-10">
        <span className="font-black text-xs sm:text-sm font-sans text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
          {cornerLabel}
        </span>
        <span className="text-[8px] font-black uppercase text-white/80 tracking-wider">
          UNO
        </span>
      </div>

      {/* Óvalo Central Inclinado clásico de UNO */}
      <div className="z-10 flex-1 flex items-center justify-center w-full my-auto">
        {color === 'wild' ? (
          <div className="w-16 h-22 sm:w-20 sm:h-28 rounded-[50%] bg-black/70 border-2 border-white/60 flex items-center justify-center transform -rotate-12 shadow-inner">
            {renderCardContent()}
          </div>
        ) : (
          <div className="w-16 h-22 sm:w-20 sm:h-28 rounded-[50%] bg-[#fafafa] border-2 border-white flex items-center justify-center transform -rotate-12 shadow-[0_4px_12px_rgba(0,0,0,0.35)]">
            <div className="transform rotate-12">
              {renderCardContent()}
            </div>
          </div>
        )}
      </div>

      {/* Esquina inferior derecha (invertida) */}
      <div className="flex justify-between items-center w-full px-1 z-10 transform rotate-180">
        <span className="font-black text-xs sm:text-sm font-sans text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
          {cornerLabel}
        </span>
      </div>
    </button>
  );
};
