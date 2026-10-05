import React, { useState } from 'react';
import {
  Flower2,
  Droplets,
  Moon,
  Sparkles,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Heart
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ModalPortal } from './ModalPortal';

export const MenstrualCalendarModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { settings, updateSettings } = useApp();

  const menstrual = settings.menstrualCalendar;
  const [cycleDays, setCycleDays] = useState(menstrual.cycleDuration || 28);
  const [periodDays, setPeriodDays] = useState(menstrual.periodDuration || 5);
  const [lastDate, setLastDate] = useState(menstrual.lastPeriodDate || '2026-09-20');

  // Month navigation for feminine calendar
  const [calMonth, setCalMonth] = useState(new Date(2026, 9, 1)); // Octubre 2026

  const calYear = calMonth.getFullYear();
  const cMonth = calMonth.getMonth();
  const totalDays = new Date(calYear, cMonth + 1, 0).getDate();
  const firstDayMondayOffset = (new Date(calYear, cMonth, 1).getDay() + 6) % 7;

  // Compute key dates
  const lastPeriod = new Date(lastDate);
  const nextPeriod = new Date(lastPeriod.getTime() + cycleDays * 86400000);
  const ovulationDay = new Date(nextPeriod.getTime() - 14 * 86400000);
  const fertileStart = new Date(ovulationDay.getTime() - 4 * 86400000);
  const fertileEnd = new Date(ovulationDay.getTime() + 1 * 86400000);

  const formatDate = (d: Date) =>
    d.toLocaleDateString([], { day: 'numeric', month: 'short' });

  // Helper to categorize each day in this month
  const getDayStatus = (dayNum: number) => {
    const thisDate = new Date(calYear, cMonth, dayNum);

    // Period days (around lastPeriod and nextPeriod)
    const diffLast = Math.round((thisDate.getTime() - lastPeriod.getTime()) / 86400000);
    if (diffLast >= 0 && diffLast < periodDays) {
      return 'period';
    }

    const diffNext = Math.round((thisDate.getTime() - nextPeriod.getTime()) / 86400000);
    if (diffNext >= 0 && diffNext < periodDays) {
      return 'predicted_period';
    }

    // Ovulation
    if (thisDate.toDateString() === ovulationDay.toDateString()) {
      return 'ovulation';
    }

    // Fertile window
    if (thisDate >= fertileStart && thisDate <= fertileEnd) {
      return 'fertile';
    }

    return 'normal';
  };

  const handleSave = () => {
    updateSettings({
      menstrualCalendar: {
        ...menstrual,
        cycleDuration: cycleDays,
        periodDuration: periodDays,
        lastPeriodDate: lastDate,
      },
    });
    onClose();
  };

  return (
    <ModalPortal
      isOpen={isOpen}
      onClose={onClose}
      title="Calendario Menstrual & Ciclo Sagrado 🌸"
      icon={<Flower2 className="w-6 h-6 text-pink-400" />}
      maxWidth="max-w-xl"
    >
      <div className="space-y-5 text-white">
        {/* Banner Femenino Rosa y Amarillo Pastel */}
        <div className="p-4 rounded-3xl bg-gradient-to-r from-[#fed7aa]/20 via-[#fbcfe8]/30 to-[#fde047]/20 border border-pink-300/40 text-center space-y-1.5 shadow-md">
          <div className="inline-flex p-2.5 rounded-2xl bg-pink-400/20 text-pink-200 text-3xl">
            🌸
          </div>
          <h4 className="text-base font-black text-pink-200 font-heading">
            Calendario de Fertilidad & Ciclo de la Pareja
          </h4>
          <p className="text-xs text-pink-100/90 leading-relaxed max-w-sm mx-auto">
            Visualiza con claridad los días de sangrado, ventana fértil, ovulación y predicción del próximo periodo.
          </p>
        </div>

        {/* CALENDARIO VISUAL FEMENINO ROSA PASTEL & AMARILLO PASTEL */}
        <div className="p-4 rounded-3xl bg-[#1e1b2e]/90 border border-pink-400/30 space-y-3 shadow-inner">
          <div className="flex items-center justify-between pb-2 border-b border-pink-500/20">
            <h5 className="text-sm font-black font-heading text-pink-200">
              {calMonth.toLocaleDateString([], { month: 'long', year: 'numeric' })}
            </h5>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setCalMonth(new Date(calYear, cMonth - 1, 1))}
                className="p-1.5 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 text-pink-200 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setCalMonth(new Date(calYear, cMonth + 1, 1))}
                className="p-1.5 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 text-pink-200 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-pink-200/60 mb-1">
            <span>Lun</span>
            <span>Mar</span>
            <span>Mié</span>
            <span>Jue</span>
            <span>Vie</span>
            <span>Sáb</span>
            <span>Dom</span>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {Array.from({ length: firstDayMondayOffset }).map((_, i) => (
              <div key={`offset-${i}`} className="h-10" />
            ))}

            {Array.from({ length: totalDays }).map((_, i) => {
              const dayNum = i + 1;
              const status = getDayStatus(dayNum);

              let style = 'bg-white/5 text-white/80 border-white/5';
              let badge = '';

              if (status === 'period') {
                style = 'bg-rose-500 text-white font-black border-rose-400 shadow-md shadow-rose-900/40';
                badge = '🩸';
              } else if (status === 'predicted_period') {
                style = 'bg-rose-500/40 text-rose-100 font-bold border-rose-400/50';
                badge = '🩸';
              } else if (status === 'ovulation') {
                style = 'bg-amber-400 text-amber-950 font-black border-amber-300 ring-2 ring-amber-400 shadow-lg';
                badge = '🌟';
              } else if (status === 'fertile') {
                style = 'bg-amber-300/30 text-amber-200 font-bold border-amber-400/40';
                badge = '✨';
              }

              return (
                <div
                  key={dayNum}
                  className={`h-11 rounded-xl p-1 flex flex-col items-center justify-between border text-xs transition-all ${style}`}
                >
                  <span className="leading-none">{dayNum}</span>
                  <span className="text-[10px]">{badge}</span>
                </div>
              );
            })}
          </div>

          {/* Leyenda de colores */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-pink-500/20 text-[10px]">
            <div className="flex items-center gap-1.5 text-rose-300">
              <span className="w-3 h-3 rounded-full bg-rose-500" />
              <span>Sangrado / Regla</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-300">
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              <span>Pico Ovulación 🌟</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-200">
              <span className="w-3 h-3 rounded-full bg-amber-300/40" />
              <span>Ventana Fértil ✨</span>
            </div>
            <div className="flex items-center gap-1.5 text-rose-200">
              <span className="w-3 h-3 rounded-full bg-rose-500/40" />
              <span>Próxima Regla</span>
            </div>
          </div>
        </div>

        {/* Resumen de predicciones */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/40 space-y-1">
            <span className="text-xs font-bold text-rose-300 flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5 fill-rose-500" /> Próxima Regla
            </span>
            <p className="text-base font-black text-rose-100 font-heading">
              {formatDate(nextPeriod)}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-400/40 space-y-1">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Días Fértiles
            </span>
            <p className="text-sm font-black text-amber-300 font-heading">
              {formatDate(fertileStart)} - {formatDate(fertileEnd)}
            </p>
          </div>
        </div>

        {/* Registro y Duración */}
        <div className="p-4 rounded-3xl bg-black/40 border border-white/10 space-y-3">
          <h5 className="text-xs font-bold text-white/80 uppercase">Ajustar Registro del Ciclo:</h5>
          <div>
            <label className="block text-[11px] text-white/60 mb-1">Primer día de la última regla:</label>
            <input
              type="date"
              value={lastDate}
              onChange={(e) => setLastDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-xs focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-white/60 mb-1">Duración ciclo ({cycleDays} días):</label>
              <input
                type="number"
                min="21"
                max="45"
                value={cycleDays}
                onChange={(e) => setCycleDays(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-white/60 mb-1">Días sangrado ({periodDays} días):</label>
              <input
                type="number"
                min="2"
                max="10"
                value={periodDays}
                onChange={(e) => setPeriodDays(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-xs focus:outline-none"
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="w-full py-3.5 rounded-2xl btn-3d-rose text-white font-bold text-sm cursor-pointer shadow-lg"
        >
          Guardar y Actualizar Calendario
        </button>
      </div>
    </ModalPortal>
  );
};
