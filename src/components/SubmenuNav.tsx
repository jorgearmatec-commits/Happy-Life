import React from 'react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';

export const SECTION_METADATA: Record<
  string,
  { label: string; shortLabel: string; emoji: string; anim: string; color: string }
> = {
  status: {
    label: 'Estado actual',
    shortLabel: 'Estado 💘',
    emoji: '💘',
    anim: 'animate-bounce',
    color: 'text-rose-400',
  },
  reminders: {
    label: 'Recordatorios',
    shortLabel: 'Notas 📝',
    emoji: '📝',
    anim: 'hover:rotate-12 transition-transform',
    color: 'text-amber-400',
  },
  alarms: {
    label: 'Alarmas y reloj',
    shortLabel: 'Alarmas ⏰',
    emoji: '⏰',
    anim: 'animate-pulse',
    color: 'text-cyan-400',
  },
  minigames: {
    label: 'Minijuegos',
    shortLabel: 'Juegos 🎲',
    emoji: '🎲',
    anim: 'hover:rotate-45 transition-transform',
    color: 'text-amber-300',
  },
  journal: {
    label: 'Diario de vida',
    shortLabel: 'Diario 📖',
    emoji: '📖',
    anim: 'hover:scale-125 transition-transform',
    color: 'text-purple-400',
  },
  location: {
    label: 'Ubicación',
    shortLabel: 'Ubicación 📍',
    emoji: '📍',
    anim: 'animate-bounce',
    color: 'text-blue-400',
  },
  emotional: {
    label: 'Apoyo emocional',
    shortLabel: 'Apoyo ❤️',
    emoji: '❤️🔧',
    anim: 'hover:scale-125 transition-transform',
    color: 'text-rose-300',
  },
  menstrual: {
    label: 'Calendario menstrual',
    shortLabel: 'Menstrual 🌸',
    emoji: '🌸',
    anim: 'hover:rotate-45 transition-transform',
    color: 'text-pink-400',
  },
};

// 8 MENÚS EXACTOS DIVIDIDOS EN 4 Y 4 EN DOS FILAS
const ORDERED_8_MENUS = [
  // Fila 1 (4 menús)
  'status',
  'reminders',
  'alarms',
  'minigames',
  // Fila 2 (4 menús)
  'journal',
  'location',
  'emotional',
  'menstrual',
];

export const SubmenuNav: React.FC = () => {
  const { settings, setActiveMenu } = useApp();
  const currentMenu = settings.activeMenu;

  return (
    <nav className="w-full py-2 select-none" aria-label="Navegación de Secciones">
      {/* Cuadrícula de 8 menús: Divididos en 4 y 4 en dos filas uniformes */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5 w-full">
        {ORDERED_8_MENUS.map((secId) => {
          const meta = SECTION_METADATA[secId];
          if (!meta) return null;

          const isSelected = currentMenu === secId;

          return (
            <motion.button
              key={secId}
              type="button"
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveMenu(secId)}
              title={meta.label}
              className={`p-2 sm:p-2.5 rounded-2xl flex flex-col items-center justify-center text-center transition-all cursor-pointer relative shadow-sm min-h-[64px] sm:min-h-[72px] border ${
                isSelected
                  ? 'bg-white text-slate-950 font-black shadow-lg ring-2 ring-white/70 scale-102 border-white'
                  : 'bg-white/10 hover:bg-white/15 text-white border-white/15 backdrop-blur-md'
              }`}
            >
              {/* Emoji animado */}
              <div className="text-xl sm:text-2xl mb-1 flex items-center justify-center">
                {secId === 'emotional' ? (
                  <span className="inline-flex items-center gap-0.5">
                    <span className="animate-pulse">❤️</span>
                    <span className="inline-block animate-bounce">🔧</span>
                  </span>
                ) : (
                  <span className={`inline-block ${isSelected ? 'animate-bounce' : meta.anim}`}>
                    {meta.emoji}
                  </span>
                )}
              </div>

              {/* Título en texto responsive */}
              <span
                className={`text-[10.5px] sm:text-xs leading-tight tracking-tight font-heading truncate max-w-full ${
                  isSelected ? 'text-slate-950 font-black' : 'text-white/90 font-bold'
                }`}
                style={{
                  color: isSelected ? '#020617' : undefined,
                }}
              >
                {meta.shortLabel}
              </span>

              {/* Indicador de activo */}
              {isSelected && (
                <motion.span
                  layoutId="activeSubmenuIndicator"
                  className="absolute -bottom-1 w-6 h-1 rounded-full bg-rose-500 shadow-md"
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};
