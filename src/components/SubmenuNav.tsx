import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  GripVertical,
  ArrowUp,
  ArrowDown,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ModalPortal } from './ModalPortal';

export const SECTION_METADATA: Record<
  string,
  { label: string; emoji: string; anim: string; color: string }
> = {
  status: {
    label: 'Estado actual',
    emoji: '💘',
    anim: 'animate-bounce',
    color: 'text-rose-400',
  },
  reminders: {
    label: 'Recordatorios',
    emoji: '📝',
    anim: 'hover:rotate-12 transition-transform',
    color: 'text-amber-400',
  },
  alarms: {
    label: 'Alarmas y reloj',
    emoji: '⏰',
    anim: 'animate-pulse',
    color: 'text-cyan-400',
  },
  journal: {
    label: 'Diario de vida',
    emoji: '📖',
    anim: 'hover:scale-125 transition-transform',
    color: 'text-purple-400',
  },
  location: {
    label: 'Ubicación',
    emoji: '📍',
    anim: 'animate-bounce',
    color: 'text-emerald-400',
  },
  recorder: {
    label: 'Grabadora',
    emoji: '🎙️',
    anim: 'animate-pulse',
    color: 'text-lime-400',
  },
  emotional: {
    label: 'Apoyo emocional',
    emoji: '❤️🔧',
    anim: 'hover:scale-125 transition-transform',
    color: 'text-rose-300',
  },
  menstrual: {
    label: 'Calendario menstrual',
    emoji: '🌸',
    anim: 'hover:rotate-45 transition-transform',
    color: 'text-pink-400',
  },
};

export const SubmenuNav: React.FC = () => {
  const { settings, setActiveMenu } = useApp();

  // Filtrar secciones activas
  const sections = settings.activeSectionsOrder.filter(
    (secId) => secId !== 'menstrual' || settings.menstrualCalendar.enabled
  );
  const currentMenu = settings.activeMenu;

  return (
    <div className="w-full py-1 select-none">
      {/* Carrusel Deslizable de Menús Edge-to-Edge */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none touch-pan-x px-1">
        {sections.map((secId) => {
          const meta = SECTION_METADATA[secId];
          if (!meta) return null;

          const isSelected = currentMenu === secId;

          return (
            <motion.button
              key={secId}
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveMenu(secId)}
              className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer shadow-sm ${
                isSelected
                  ? 'bg-white text-slate-950 font-black scale-105 shadow-lg ring-2 ring-white/60'
                  : 'bg-white/10 hover:bg-white/20 text-white/90 border border-white/10'
              }`}
            >
              {/* Emoji 3D Animado Móvil */}
              {secId === 'emotional' ? (
                <span className="inline-flex items-center gap-0.5 text-base">
                  <span className="animate-pulse">❤️</span>
                  <span className="inline-block animate-bounce">🔧</span>
                </span>
              ) : (
                <span className={`text-base inline-block ${isSelected ? 'animate-bounce' : meta.anim}`}>
                  {meta.emoji}
                </span>
              )}
              <span className="tracking-tight">{meta.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
