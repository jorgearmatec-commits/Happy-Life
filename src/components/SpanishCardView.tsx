import React from 'react';
import { SpanishCard, SpanishSuit } from './MinigamesSection';

interface SpanishCardViewProps {
  card: SpanishCard;
  isSelected?: boolean;
  isHinted?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export const SpanishCardView: React.FC<SpanishCardViewProps> = ({
  card,
  isSelected = false,
  isHinted = false,
  onClick,
  size = 'md',
  disabled = false,
}) => {
  const { suit, rank, value } = card;

  // Dimensiones ampliadas y cómodas según solicitud del usuario
  const sizeClasses = {
    sm: 'w-14 h-22 sm:w-16 sm:h-24 text-[9px]',
    md: 'w-22 h-34 sm:w-26 sm:h-40 md:w-28 md:h-44 text-xs',
    lg: 'w-28 h-44 sm:w-32 sm:h-50 md:w-36 md:h-54 text-xs sm:text-sm',
  }[size];

  // Paleta de colores tradicionales de la baraja española
  const suitColors: Record<SpanishSuit, { primary: string; secondary: string; border: string; name: string }> = {
    oros: { primary: '#eab308', secondary: '#ca8a04', border: '#ca8a04', name: 'Oros' },
    copas: { primary: '#ef4444', secondary: '#b91c1c', border: '#b91c1c', name: 'Copas' },
    espadas: { primary: '#0284c7', secondary: '#0369a1', border: '#0369a1', name: 'Espadas' },
    bastos: { primary: '#15803d', secondary: '#166534', border: '#166534', name: 'Bastos' },
  };

  const colors = suitColors[suit];

  // Renderizador de la histórica "Orla y Pintas" de la baraja española:
  // Oros: 0 cortes (continua)
  // Copas: 1 corte arriba y abajo
  // Espadas: 2 cortes arriba y abajo
  // Bastos: 3 cortes arriba y abajo
  const renderPintasBorder = () => {
    switch (suit) {
      case 'oros':
        return <rect x="5" y="5" width="90" height="90" rx="3" fill="none" stroke="#ca8a04" strokeWidth="1.5" />;
      case 'copas':
        return (
          <path
            d="M 12 5 L 45 5 M 55 5 L 88 5 L 88 95 L 55 95 M 45 95 L 12 95 L 12 5"
            fill="none"
            stroke="#b91c1c"
            strokeWidth="1.5"
          />
        );
      case 'espadas':
        return (
          <path
            d="M 12 5 L 32 5 M 42 5 L 58 5 M 68 5 L 88 5 L 88 95 L 68 95 M 58 95 L 42 95 M 32 95 L 12 95 L 12 5"
            fill="none"
            stroke="#0369a1"
            strokeWidth="1.5"
          />
        );
      case 'bastos':
        return (
          <path
            d="M 12 5 L 25 5 M 35 5 L 45 5 M 55 5 L 65 5 M 75 5 L 88 5 L 88 95 L 75 95 M 65 95 L 55 95 M 45 95 L 35 95 M 25 95 L 12 95 L 12 5"
            fill="none"
            stroke="#166534"
            strokeWidth="1.5"
          />
        );
    }
  };

  // Emblemas heráldicos realistas en SVG para cada palo
  const renderSuitIcon = (w = 26, h = 26) => {
    switch (suit) {
      case 'oros':
        return (
          <svg width={w} height={h} viewBox="0 0 100 100" className="drop-shadow-xs shrink-0">
            <defs>
              <radialGradient id={`goldGrad-${card.id}-${w}`} cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="45%" stopColor="#eab308" />
                <stop offset="85%" stopColor="#ca8a04" />
                <stop offset="100%" stopColor="#713f12" />
              </radialGradient>
            </defs>
            {/* Moneda festoneada exterior */}
            <circle cx="50" cy="50" r="46" fill="url(#goldGrad-${card.id}-${w})" stroke="#713f12" strokeWidth="3" />
            <circle cx="50" cy="50" r="39" fill="none" stroke="#713f12" strokeWidth="1.8" strokeDasharray="3 2" />
            <circle cx="50" cy="50" r="30" fill="#fde047" stroke="#854d0e" strokeWidth="2" />
            {/* Sol radiante heráldico con rayos */}
            <path
              d="M50 24 L53 35 L64 30 L59 40 L69 44 L60 50 L69 56 L59 60 L64 70 L53 65 L50 76 L47 65 L36 70 L41 60 L31 56 L40 50 L31 44 L41 40 L36 30 L47 35 Z"
              fill="#b45309"
            />
            <circle cx="50" cy="50" r="10" fill="#fef08a" stroke="#713f12" strokeWidth="1.5" />
            <circle cx="50" cy="50" r="4" fill="#ca8a04" />
          </svg>
        );

      case 'copas':
        return (
          <svg width={w} height={h} viewBox="0 0 100 100" className="drop-shadow-xs shrink-0">
            <defs>
              <linearGradient id={`cupGrad-${card.id}-${w}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="35%" stopColor="#f59e0b" />
                <stop offset="75%" stopColor="#dc2626" />
                <stop offset="100%" stopColor="#7f1d1d" />
              </linearGradient>
            </defs>
            {/* Remate con cruz heráldica */}
            <path d="M50 9 L53 16 L47 16 Z M44 16 L56 16 L50 22 Z" fill="#991b1b" />
            <ellipse cx="50" cy="24" rx="26" ry="6" fill="#fde047" stroke="#78350f" strokeWidth="2" />
            {/* Cuerpo del cáliz cincelado */}
            <path
              d="M26 24 C26 48 38 62 50 62 C62 62 74 48 74 24 Z"
              fill="url(#cupGrad-${card.id}-${w})"
              stroke="#78350f"
              strokeWidth="2.5"
            />
            {/* Joya roja engastada */}
            <ellipse cx="50" cy="42" rx="10" ry="12" fill="#ef4444" stroke="#7f1d1d" strokeWidth="1.5" />
            <ellipse cx="48" cy="39" rx="4" ry="5" fill="#fca5a5" />
            {/* Tallo ornamentado y peana */}
            <path d="M46 62 L46 76 L32 86 L68 86 L54 76 L54 62 Z" fill="url(#cupGrad-${card.id}-${w})" stroke="#78350f" strokeWidth="2" />
            <ellipse cx="50" cy="86" rx="22" ry="5" fill="#ca8a04" stroke="#78350f" strokeWidth="2" />
          </svg>
        );

      case 'espadas':
        return (
          <svg width={w} height={h} viewBox="0 0 100 100" className="drop-shadow-xs shrink-0">
            <defs>
              <linearGradient id={`bladeGrad-${card.id}-${w}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#94a3b8" />
                <stop offset="45%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#475569" />
              </linearGradient>
            </defs>
            {/* Hoja curvada de acero toledano */}
            <path
              d="M50 6 C53 28 58 52 58 66 L42 66 C42 52 47 28 50 6 Z"
              fill="url(#bladeGrad-${card.id}-${w})"
              stroke="#0f172a"
              strokeWidth="2"
            />
            {/* Canal de la espada */}
            <line x1="50" y1="10" x2="50" y2="66" stroke="#334155" strokeWidth="1.5" />
            {/* Gavilán curvo de oro */}
            <path
              d="M22 66 C34 61 66 61 78 66 C80 70 70 72 50 70 C30 72 20 70 22 66 Z"
              fill="#eab308"
              stroke="#713f12"
              strokeWidth="2"
            />
            {/* Empuñadura trenzada y pomo */}
            <rect x="47" y="70" width="6" height="15" rx="2" fill="#78350f" stroke="#451a03" strokeWidth="1.5" />
            <circle cx="50" cy="89" r="6" fill="#facc15" stroke="#713f12" strokeWidth="2" />
          </svg>
        );

      case 'bastos':
        return (
          <svg width={w} height={h} viewBox="0 0 100 100" className="drop-shadow-xs shrink-0">
            <defs>
              <linearGradient id={`clubGrad-${card.id}-${w}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4ade80" />
                <stop offset="35%" stopColor="#16a34a" />
                <stop offset="80%" stopColor="#15803d" />
                <stop offset="100%" stopColor="#052e16" />
              </linearGradient>
            </defs>
            {/* Porra nudosa de roble verde */}
            <path
              d="M44 88 L46 64 C40 59 38 48 42 38 C40 28 42 16 50 10 C58 16 60 28 58 38 C62 48 60 59 54 64 L56 88 Z"
              fill="url(#clubGrad-${card.id}-${w})"
              stroke="#052e16"
              strokeWidth="2.5"
            />
            {/* Nudos con hojas vivas brotando */}
            <circle cx="43" cy="28" r="4.5" fill="#86efac" stroke="#14532d" strokeWidth="1.5" />
            <circle cx="57" cy="44" r="5" fill="#86efac" stroke="#14532d" strokeWidth="1.5" />
            <circle cx="45" cy="55" r="4" fill="#86efac" stroke="#14532d" strokeWidth="1.5" />
            {/* Anillos dorados de empuñadura */}
            <rect x="44" y="72" width="12" height="3" rx="1" fill="#fef08a" stroke="#713f12" strokeWidth="1" />
            <rect x="44" y="78" width="12" height="3" rx="1" fill="#fef08a" stroke="#713f12" strokeWidth="1" />
          </svg>
        );
    }
  };

  // Renderizado del cuerpo central de la carta (Figuras históricas o As o Números)
  const renderCardCenter = () => {
    // -------------------------------------------------------------------------
    // 10: SOTA DE LA BARAJA ESPAÑOLA (Paje con jubón, pluma y el palo en mano)
    // -------------------------------------------------------------------------
    if (rank === 10) {
      return (
        <div className="flex flex-col items-center justify-center my-auto w-full px-1">
          <div className="relative flex flex-col items-center">
            {/* Boina renacentista con gran pluma */}
            <div className="relative">
              <div className="w-12 h-4 rounded-t-full bg-gradient-to-r from-rose-700 via-rose-600 to-amber-600 border border-slate-900 shadow-xs" />
              <div className="absolute -top-3.5 -right-1 text-sm filter drop-shadow">🪶</div>
            </div>
            {/* Rostro del paje / escudero */}
            <div className="w-9 h-9 rounded-full bg-[#fde68a] border-2 border-slate-800 flex items-center justify-center -mt-1 shadow-xs">
              <span className="text-sm">👱</span>
            </div>
            {/* Jubón heráldico con brocados */}
            <div className="w-14 h-16 rounded-b-2xl bg-gradient-to-b from-amber-400 via-rose-600 to-indigo-900 border-2 border-slate-900 flex flex-col items-center justify-between p-1 shadow-md -mt-1">
              <div className="scale-85 mt-0.5">{renderSuitIcon(24, 24)}</div>
              <span className="text-[9px] font-black tracking-widest text-white bg-slate-950/80 px-2 py-0.5 rounded-full border border-white/20">
                SOTA
              </span>
            </div>
          </div>
          <span className="text-[10px] font-black tracking-wider text-slate-800 mt-1 uppercase">
            10 • Sota (8)
          </span>
        </div>
      );
    }

    // -------------------------------------------------------------------------
    // 11: CABALLO DE LA BARAJA ESPAÑOLA (Caballero andante con coraza a caballo)
    // -------------------------------------------------------------------------
    if (rank === 11) {
      return (
        <div className="flex flex-col items-center justify-center my-auto w-full px-1">
          <div className="relative flex flex-col items-center">
            {/* Casco con penacho de plumas */}
            <div className="w-10 h-6 rounded-t-xl bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400 border-2 border-slate-900 flex items-center justify-center shadow-xs">
              <span className="text-xs">🛡️</span>
            </div>
            {/* Corcel blanco / alazán piafando con gualdrapa heráldica */}
            <div className="w-16 h-18 rounded-2xl bg-gradient-to-b from-amber-800 via-amber-900 to-amber-950 border-2 border-slate-900 flex flex-col items-center justify-between p-1.5 shadow-md -mt-1">
              <div className="flex items-center justify-between w-full px-1">
                <span className="text-xl">🐎</span>
                <div className="scale-80">{renderSuitIcon(20, 20)}</div>
              </div>
              <span className="text-[8px] font-black tracking-widest text-amber-200 bg-slate-950/85 px-2 py-0.5 rounded-full border border-amber-400/40">
                CABALLO
              </span>
            </div>
          </div>
          <span className="text-[10px] font-black tracking-wider text-slate-800 mt-1 uppercase">
            11 • Caballo (9)
          </span>
        </div>
      );
    }

    // -------------------------------------------------------------------------
    // 12: REY DE LA BARAJA ESPAÑOLA (Monarca entronizado con corona y cetro)
    // -------------------------------------------------------------------------
    if (rank === 12) {
      return (
        <div className="flex flex-col items-center justify-center my-auto w-full px-1">
          <div className="relative flex flex-col items-center">
            {/* Corona de oro real */}
            <div className="text-base leading-none drop-shadow -mb-1">👑</div>
            {/* Cabeza barbada del Rey */}
            <div className="w-10 h-9 rounded-full bg-[#fde68a] border-2 border-slate-900 flex items-center justify-center shadow-xs">
              <span className="text-sm">🧔</span>
            </div>
            {/* Manto real de armiño con brocado imperial */}
            <div className="w-16 h-18 rounded-b-2xl bg-gradient-to-b from-purple-900 via-rose-700 to-amber-700 border-2 border-slate-900 flex flex-col items-center justify-between p-1.5 shadow-md -mt-1">
              <div className="flex items-center justify-between w-full px-1">
                <span className="text-xs">⚜️</span>
                <div className="scale-85">{renderSuitIcon(24, 24)}</div>
              </div>
              <span className="text-[9px] font-black tracking-widest text-amber-200 bg-slate-950/85 px-2.5 py-0.5 rounded-full border border-amber-400/40">
                REY
              </span>
            </div>
          </div>
          <span className="text-[10px] font-black tracking-wider text-slate-800 mt-1 uppercase">
            12 • Rey (10)
          </span>
        </div>
      );
    }

    // -------------------------------------------------------------------------
    // 1: AS (GRAN EMBLEMA CENTRAL HERÁLDICO)
    // -------------------------------------------------------------------------
    if (rank === 1) {
      return (
        <div className="flex flex-col items-center justify-center my-auto gap-1 w-full">
          <div className="scale-125 sm:scale-150 my-2">
            {renderSuitIcon(48, 48)}
          </div>
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-900 bg-amber-200/90 px-3 py-1 rounded-full border border-amber-400 shadow-xs">
            AS DE {colors.name}
          </div>
        </div>
      );
    }

    // -------------------------------------------------------------------------
    // 7 DE OROS: EL VELO (LA CARTA MÁS CODICIADA DE LA ESCOBA)
    // -------------------------------------------------------------------------
    if (rank === 7 && suit === 'oros') {
      return (
        <div className="flex flex-col items-center justify-center my-auto w-full px-1 gap-1">
          <div className="text-[9px] font-black uppercase tracking-wider text-amber-900 bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 px-2 py-0.5 rounded-full border border-amber-500 shadow-sm animate-pulse">
            ⭐ EL VELO (1 PTO)
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 items-center justify-items-center">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i}>{renderSuitIcon(20, 20)}</div>
            ))}
            <div className="col-span-2 scale-110">{renderSuitIcon(22, 22)}</div>
          </div>
        </div>
      );
    }

    // -------------------------------------------------------------------------
    // NÚMEROS 2 AL 7: DISPOSICIÓN SIMÉTRICA DE PIPS
    // -------------------------------------------------------------------------
    const pipCount = rank;
    const pipSize = pipCount >= 6 ? 20 : 24;

    return (
      <div className="flex flex-col items-center justify-center my-auto w-full px-1">
        <div className="grid grid-cols-2 gap-x-2.5 gap-y-1.5 items-center justify-items-center py-1">
          {Array.from({ length: pipCount }).map((_, i) => (
            <div
              key={i}
              className={`${
                pipCount % 2 !== 0 && i === pipCount - 1 ? 'col-span-2' : ''
              }`}
            >
              {renderSuitIcon(pipSize, pipSize)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative ${sizeClasses} rounded-2xl border-2 flex flex-col justify-between p-2 shadow-xl transition-all select-none cursor-pointer group ${
        isSelected
          ? 'bg-[#fffdf2] border-amber-500 scale-108 -translate-y-3 shadow-[0_20px_35px_rgba(245,158,11,0.65)] ring-4 ring-amber-400 z-20'
          : isHinted
          ? 'bg-[#fffef5] border-lime-500 scale-104 -translate-y-1.5 shadow-[0_15px_30px_rgba(132,204,22,0.5)] ring-3 ring-lime-400 z-10'
          : 'bg-[#fffef7] border-[#d4af37] hover:border-amber-500 hover:-translate-y-1.5 hover:shadow-2xl'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      style={{
        boxShadow: isSelected
          ? '0 0 30px rgba(245, 158, 11, 0.75), inset 0 0 12px rgba(254, 240, 138, 0.5)'
          : isHinted
          ? '0 0 25px rgba(132, 204, 22, 0.7), inset 0 0 10px rgba(217, 249, 157, 0.5)'
          : '0 10px 22px rgba(0, 0, 0, 0.35), inset 0 0 8px rgba(212, 175, 55, 0.15)',
      }}
    >
      {/* SVG de Orla tradicional de la baraja española */}
      <svg className="absolute inset-1 w-[calc(100%-8px)] h-[calc(100%-8px)] pointer-events-none" viewBox="0 0 100 100">
        {renderPintasBorder()}
      </svg>

      {/* Esquina Superior Izquierda: Número grande tradicional y mini emblema */}
      <div className="flex justify-between items-center w-full z-10 px-0.5">
        <div className="flex items-center gap-1">
          <span className="font-black text-sm sm:text-base md:text-lg font-serif text-slate-950 leading-none">
            {rank}
          </span>
          <div className="scale-75 origin-left">{renderSuitIcon(16, 16)}</div>
        </div>
        <span
          className="text-[9px] font-black uppercase tracking-wider px-1 rounded-sm"
          style={{ color: colors.secondary }}
        >
          {colors.name}
        </span>
      </div>

      {/* Centro de la Carta: Ilustración heráldica rica o Pips tradicionales */}
      <div className="z-10 flex-1 flex items-center justify-center w-full">
        {renderCardCenter()}
      </div>

      {/* Esquina Inferior: Valor para la Escoba del 15 */}
      <div className="flex justify-between items-center w-full z-10 pt-1 border-t border-slate-200 px-0.5">
        <span className="text-[9px] font-black text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded-sm border border-slate-300">
          Suma: <strong className="text-slate-950 font-black">{value}</strong>
        </span>
        <div className="flex items-center gap-0.5">
          <div className="scale-75 origin-right">{renderSuitIcon(16, 16)}</div>
          <span className="font-black text-sm sm:text-base md:text-lg font-serif text-slate-950 leading-none">
            {rank}
          </span>
        </div>
      </div>
    </button>
  );
};
