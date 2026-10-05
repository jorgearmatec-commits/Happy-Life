import React, { useState } from 'react';
import { Flower2, Droplets, Sparkles, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MenstrualCalendarModal } from './MenstrualCalendarModal';

export const MenstrualCard: React.FC = () => {
  const { settings } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  const menstrual = settings.menstrualCalendar;
  const lastPeriod = new Date(menstrual.lastPeriodDate || '2026-09-20');
  const nextPeriod = new Date(lastPeriod.getTime() + (menstrual.cycleDuration || 28) * 86400000);

  return (
    <>
      <section className="w-full">
        <div className="glass-card p-6 border-pink-500/30 bg-gradient-to-br from-pink-950/20 via-black/40 to-slate-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-pink-500/20 border border-pink-400/30 flex items-center justify-center text-pink-300 text-2xl shadow-lg">
              🌸
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                  Ciclo Sagrado
                </span>
                <span className="text-xs text-white/50">Fase Folicular Activa</span>
              </div>
              <h3 className="text-lg font-black text-white font-heading mt-0.5">
                Calendario Menstrual & Fertilidad
              </h3>
              <p className="text-xs text-white/60">
                Próxima regla estimada: {nextPeriod.toLocaleDateString([], { day: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 shrink-0"
          >
            <span>Ver Fases y Días Fértiles</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      <MenstrualCalendarModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};
