import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  Compass,
  Menu,
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SECTION_METADATA } from './SubmenuNav';
import { playTone } from './AudioSynthesizer';

const SECTIONS_ORDER = [
  'status',
  'reminders',
  'alarms',
  'minigames',
  'journal',
  'location',
  'emotional',
  'menstrual',
];

export const SimpleNavigator: React.FC = () => {
  const { settings, setActiveMenu } = useApp();
  const currentMenu = settings.activeMenu;

  const [isScrolledDown, setIsScrolledDown] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 250) {
        setIsScrolledDown(true);
      } else {
        setIsScrolledDown(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const currentIndex = SECTIONS_ORDER.indexOf(currentMenu);

  const goToPrev = () => {
    const prevIdx = (currentIndex - 1 + SECTIONS_ORDER.length) % SECTIONS_ORDER.length;
    const target = SECTIONS_ORDER[prevIdx];
    setActiveMenu(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    playTone('water');
  };

  const goToNext = () => {
    const nextIdx = (currentIndex + 1) % SECTIONS_ORDER.length;
    const target = SECTIONS_ORDER[nextIdx];
    setActiveMenu(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    playTone('water');
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    playTone('water');
  };

  const handleSelectSection = (secId: string) => {
    setActiveMenu(secId);
    setIsMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    playTone('water');
  };

  const currentMeta = SECTION_METADATA[currentMenu] || {
    shortLabel: 'Menú',
    emoji: '✨',
  };

  return (
    <>
      {/* BARRA FLOTANTE DE NAVEGACIÓN "SIMPLE" - PENSADA 100% PARA ANDROID */}
      <div className="fixed bottom-18 sm:bottom-20 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-sm pointer-events-auto select-none">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between gap-1 p-1.5 rounded-full bg-slate-950/85 backdrop-blur-xl border border-white/20 shadow-[0_12px_30px_rgba(0,0,0,0.65)] ring-1 ring-white/10"
        >
          {/* Botón Sección Anterior */}
          <button
            type="button"
            onClick={goToPrev}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 text-white flex items-center justify-center cursor-pointer transition-all shrink-0"
            title="Sección anterior"
            aria-label="Sección anterior"
          >
            <ChevronLeft className="w-5 h-5 text-white/90" />
          </button>

          {/* Menú Central: Abre selector rápido de 1 toque */}
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="flex-1 py-1.5 px-3 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all border border-white/10 truncate"
          >
            <span className="text-sm">{currentMeta.emoji}</span>
            <span className="truncate tracking-tight font-heading">
              {currentMeta.shortLabel}
            </span>
            <Compass className="w-3.5 h-3.5 text-cyan-300 shrink-0 ml-0.5" />
          </button>

          {/* Botón Sección Siguiente */}
          <button
            type="button"
            onClick={goToNext}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 text-white flex items-center justify-center cursor-pointer transition-all shrink-0"
            title="Siguiente sección"
            aria-label="Siguiente sección"
          >
            <ChevronRight className="w-5 h-5 text-white/90" />
          </button>

          {/* Botón Rápido Subir si está abajo */}
          {isScrolledDown && (
            <motion.button
              type="button"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              onClick={scrollToTop}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 active:scale-90 text-white flex items-center justify-center cursor-pointer shadow-md shrink-0 transition-all"
              title="Volver arriba"
              aria-label="Volver arriba"
            >
              <ArrowUp className="w-4 h-4 font-black" />
            </motion.button>
          )}
        </motion.div>
      </div>

      {/* SELECTOR RÁPIDO DE 1 TOQUE (POPOVER SIMPLE) */}
      <AnimatePresence>
        {isMenuOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-3"
            onClick={() => setIsMenuOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-[2.5rem] bg-gradient-to-b from-[#181a2e] to-[#0f111c] border-2 border-white/20 p-5 shadow-2xl text-white space-y-3 mb-20 sm:mb-0"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Compass className="w-5 h-5 text-cyan-400" />
                  <h4 className="text-sm font-black font-heading">
                    Navegación Simple Android
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {SECTIONS_ORDER.map((secId) => {
                  const meta = SECTION_METADATA[secId];
                  if (!meta) return null;
                  const isSelected = currentMenu === secId;

                  return (
                    <button
                      key={secId}
                      type="button"
                      onClick={() => handleSelectSection(secId)}
                      className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-white text-slate-950 font-black border-white shadow-lg scale-102 ring-2 ring-white/50'
                          : 'bg-white/5 border-white/10 hover:bg-white/10 text-white'
                      }`}
                    >
                      <span className="text-xl">{meta.emoji}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-black truncate">{meta.shortLabel}</div>
                        <div className={`text-[10px] truncate ${isSelected ? 'text-slate-600' : 'text-white/40'}`}>
                          {meta.label}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
