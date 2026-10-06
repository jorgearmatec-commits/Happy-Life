import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Bell,
  HelpCircle,
  ExternalLink,
  Bot
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ModalPortal } from './ModalPortal';
import { getDayInfo, MONTH_NAMES_ES, DayInfo } from '../data/calendarOnomastics';
import { GeminiQuickModal } from './GeminiQuickModal';

interface CalendarSectionProps {
  embedded?: boolean;
}

export const CalendarSection: React.FC<CalendarSectionProps> = ({ embedded = false }) => {
  const { reminders, alarms } = useApp();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isGeminiModalOpen, setIsGeminiModalOpen] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Days in month
  const totalDays = new Date(year, month + 1, 0).getDate();

  // First day offset (Monday = 0)
  const firstDayRaw = new Date(year, month, 1).getDay();
  const firstDayMondayOffset = (firstDayRaw + 6) % 7;

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDay(today.getDate());
  };

  // Real events for day (STRICT: only user created alarms and reminders)
  const getDayEvents = (dayNum: number) => {
    const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    const dayRems = (reminders || []).filter(
      (r) => r.specificDateTime?.startsWith(dayStr) || r.dueTime?.startsWith(dayStr)
    );
    const dayAlms = (alarms || []).filter((a) => a.date === dayStr);
    return { reminders: dayRems, alarms: dayAlms, count: dayRems.length + dayAlms.length };
  };

  const dayHasEvent = (dayNum: number) => {
    return getDayEvents(dayNum).count > 0;
  };

  // Información del día actual o seleccionado
  const displayDayNum = selectedDay || (month === new Date().getMonth() && year === new Date().getFullYear() ? new Date().getDate() : 1);
  const currentDayInfo: DayInfo = getDayInfo(month, displayDayNum);

  return (
    <section className="w-full space-y-4">
      {/* Título de sección (si no está embebido) */}
      {!embedded && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shadow-md">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white font-heading tracking-tight">
                Calendario de Alarmas y Recordatorios
              </h3>
              <p className="text-xs text-white/60">
                Sincronización de eventos, onomásticos y curiosidades de Google
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={goToToday}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-cyan-200 text-xs font-bold border border-white/15 transition-all cursor-pointer"
          >
            Hoy
          </button>
        </div>
      )}

      {/* Tarjeta Calendario Principal */}
      <div className="rounded-[2.5rem] bg-[#f8fafc] text-slate-900 p-5 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-slate-300 select-none">
        {/* Month Navigation */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <h4 className="text-2xl font-black font-heading text-slate-900 tracking-tight">
              {MONTH_NAMES_ES[month]} {year}
            </h4>
            <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
              Lunes primero
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={prevMonth}
              className="p-2 rounded-xl bg-slate-200 hover:bg-slate-300 active:scale-95 text-slate-800 transition-colors cursor-pointer"
              title="Mes anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={nextMonth}
              className="p-2 rounded-xl bg-slate-200 hover:bg-slate-300 active:scale-95 text-slate-800 transition-colors cursor-pointer"
              title="Mes siguiente"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Days of week header (Lunes primer día, Domingos en rojo) */}
        <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-black uppercase tracking-wider mb-2">
          <span className="text-slate-600">Lun</span>
          <span className="text-slate-600">Mar</span>
          <span className="text-slate-600">Mié</span>
          <span className="text-slate-600">Jue</span>
          <span className="text-slate-600">Vie</span>
          <span className="text-slate-600">Sáb</span>
          <span className="text-rose-600 font-extrabold">Dom</span>
        </div>

        {/* Grid de días: SOLO ICONOS CUANDO EXISTA EVENTO REAL */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center">
          {/* Espacios vacíos antes del primer día del mes */}
          {Array.from({ length: firstDayMondayOffset }).map((_, idx) => (
            <div key={`empty-${idx}`} className="h-14 sm:h-16" />
          ))}

          {/* Días del mes */}
          {Array.from({ length: totalDays }).map((_, idx) => {
            const dayNum = idx + 1;
            const dayOfWeek = (firstDayMondayOffset + idx) % 7;
            const isSunday = dayOfWeek === 6;
            const eventData = getDayEvents(dayNum);
            const isSelected = selectedDay === dayNum;
            const isToday =
              dayNum === new Date().getDate() &&
              month === new Date().getMonth() &&
              year === new Date().getFullYear();

            return (
              <button
                key={dayNum}
                type="button"
                onClick={() => setSelectedDay(dayNum)}
                className={`h-14 sm:h-16 rounded-2xl p-1.5 flex flex-col items-center justify-between border transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                  isSelected
                    ? 'ring-3 ring-cyan-500 bg-cyan-50 border-cyan-400 shadow-md'
                    : eventData.count > 0
                    ? 'bg-rose-50/80 border-rose-300 shadow-xs'
                    : isToday
                    ? 'bg-amber-50 border-amber-300 shadow-xs'
                    : 'bg-white hover:bg-slate-100 border-slate-200/90'
                }`}
              >
                {/* Número del día */}
                <div className="w-full flex items-center justify-between px-1">
                  <span
                    className={`text-sm sm:text-base font-extrabold ${
                      isSunday
                        ? 'text-rose-600 font-black'
                        : isToday
                        ? 'text-amber-600 font-black'
                        : 'text-slate-900'
                    }`}
                  >
                    {dayNum}
                  </span>
                  {isToday && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Hoy" />
                  )}
                </div>

                {/* Pie del día: SOLO mostrar icono SI HAY EVENTO REAL GUARDADO */}
                <div className="h-5 flex items-center justify-center">
                  {eventData.count > 0 ? (
                    <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black shadow-xs animate-pulse">
                      {eventData.alarms.length > 0 && <span>⏰</span>}
                      {eventData.reminders.length > 0 && <span>📝</span>}
                      <span>{eventData.count}</span>
                    </div>
                  ) : null /* COMPLETAMENTE LIMPIO SI NO HAY EVENTO */}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* =================================================================== */}
      {/* PARTE MÁS BAJA DEL CALENDARIO: ONOMÁSTICO Y CURIOSIDADES SEGÚN GOOGLE */}
      {/* =================================================================== */}
      <div className="p-5 sm:p-6 rounded-[2rem] bg-gradient-to-br from-indigo-950/50 via-slate-900/60 to-purple-950/50 border border-indigo-400/30 text-white space-y-4 shadow-xl select-none">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-300 animate-spin" />
            <div>
              <h4 className="text-sm font-black uppercase tracking-wider text-amber-300 font-heading">
                Onomástico y Curiosidades Diarias según Google
              </h4>
              <p className="text-[11px] text-white/60">
                Información del día {displayDayNum} de {MONTH_NAMES_ES[month]}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsGeminiModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-purple-500/20 hover:from-amber-500/30 hover:to-purple-500/30 border border-amber-300/30 text-amber-200 text-xs font-bold cursor-pointer transition-all active:scale-95"
            title="Consultar más detalles con Gemini"
          >
            <Bot className="w-3.5 h-3.5 text-amber-300" />
            <span>Consultar con Gemini ✨</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
          {/* 1. Onomástico / Santoral del Día */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
            <span className="text-[10px] uppercase font-black tracking-wider text-amber-300 flex items-center gap-1">
              <span>🌟 Santoral / Onomástico:</span>
            </span>
            <p className="text-sm font-black text-white">
              {currentDayInfo.onomastic}
            </p>
            <p className="text-[11px] text-white/70 leading-relaxed">
              Día tradicional de salutación y bendición para quienes llevan este nombre.
            </p>
          </div>

          {/* 2. Qué día se celebra según Google */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
            <span className="text-[10px] uppercase font-black tracking-wider text-sky-300 flex items-center gap-1">
              <span>🌍 ¿Qué día se celebra hoy según Google?:</span>
            </span>
            <p className="text-sm font-black text-sky-200">
              {currentDayInfo.celebration}
            </p>
            <p className="text-[11px] text-white/70 leading-relaxed">
              Conmemoración internacional y efeméride destacada en Google Calendar.
            </p>
          </div>
        </div>

        {/* 3. Curiosidades del Día y Tips de Pareja */}
        <div className="p-3.5 rounded-2xl bg-purple-950/30 border border-purple-400/20 space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-base shrink-0">🔍</span>
            <div className="space-y-1 text-xs">
              <strong className="text-purple-200 block font-bold">
                Curiosidad histórica y científica del día:
              </strong>
              <p className="text-white/80 leading-relaxed">
                {currentDayInfo.curiosity}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 pt-1 border-t border-white/5">
            <span className="text-base shrink-0">❤️</span>
            <div className="space-y-0.5 text-xs">
              <strong className="text-rose-200 block font-bold">
                Detalle y tip afectivo para hoy:
              </strong>
              <p className="text-white/80 leading-relaxed">
                {currentDayInfo.coupleTip}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DETALLES DEL DÍA AL HACER CLICK */}
      <ModalPortal
        isOpen={selectedDay !== null}
        onClose={() => setSelectedDay(null)}
        title={selectedDay ? `Día ${selectedDay} de ${MONTH_NAMES_ES[month]}` : ''}
        icon={<CalendarIcon className="w-6 h-6 text-rose-500" />}
      >
        {selectedDay && (
          <div className="space-y-4 text-white">
            {/* Onomástico */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <span className="text-[10px] text-amber-300 uppercase font-black tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Onomástico del día
              </span>
              <p className="text-base font-bold text-white">
                {getDayInfo(month, selectedDay).onomastic}
              </p>
            </div>

            {/* Celebración Google */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <span className="text-[10px] text-sky-300 uppercase font-black tracking-wider">
                🌍 Celebración Internacional / Google
              </span>
              <p className="text-sm font-semibold text-white/90">
                {getDayInfo(month, selectedDay).celebration}
              </p>
            </div>

            {/* Curiosidad */}
            <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-400/30 space-y-1">
              <span className="text-[10px] text-purple-300 uppercase font-black tracking-wider">
                🔍 Curiosidad del día
              </span>
              <p className="text-xs text-white/85 leading-relaxed">
                {getDayInfo(month, selectedDay).curiosity}
              </p>
            </div>

            {/* Eventos reales de la fecha */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <span className="text-[10px] text-rose-300 uppercase font-black tracking-wider flex items-center gap-1">
                <Bell className="w-3.5 h-3.5" /> Alarmas y Recordatorios Programados
              </span>
              {(() => {
                const dayData = getDayEvents(selectedDay);
                if (dayData.count === 0) {
                  return (
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center space-y-1">
                      <p className="text-xs text-white/50 italic">
                        No hay alarmas ni recordatorios guardados para este día.
                      </p>
                      <p className="text-[10px] text-white/40">
                        Solo aparecerán aquí cuando agregues una alarma o nota para esta fecha.
                      </p>
                    </div>
                  );
                }
                return (
                  <div className="space-y-2">
                    {dayData.reminders.map((r) => (
                      <div
                        key={r.id}
                        className="p-3 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-200 font-bold text-xs shadow-sm flex items-center justify-between"
                      >
                        <span>📝 {r.title}</span>
                        <span className="text-[10px] opacity-70">
                          {r.dueTime ? new Date(r.dueTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                    ))}
                    {dayData.alarms.map((a) => (
                      <div
                        key={a.id}
                        className="p-3 rounded-xl bg-rose-500/20 border border-rose-400/30 text-rose-200 font-bold text-xs shadow-sm flex items-center justify-between"
                      >
                        <span>⏰ {a.label}</span>
                        <span className="text-[10px] font-mono">{a.time}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </ModalPortal>

      {/* Modal Gemini Quick */}
      <GeminiQuickModal
        isOpen={isGeminiModalOpen}
        onClose={() => setIsGeminiModalOpen(false)}
      />
    </section>
  );
};
