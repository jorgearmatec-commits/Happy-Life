import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, AlertCircle, Sparkles, Bell } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ModalPortal } from './ModalPortal';

// Commemorative days and onomastics database for rich experience
const DAY_COMMEMORATIONS: Record<number, { onomastic: string; commemoration: string }> = {
  1: { onomastic: 'Teresa del Niño Jesús', commemoration: 'Día Internacional del Café y del Amor Verdadero' },
  2: { onomastic: 'Ángeles Custodios', commemoration: 'Día Internacional de la No Violencia' },
  3: { onomastic: 'Francisco de Borja', commemoration: 'Día de la Convivencia y del Abrazo Sincero' },
  4: { onomastic: 'Francisco de Asís', commemoration: 'Día Mundial de los Animales y Compañeros de Vida' },
  5: { onomastic: 'Faustina Kowalska', commemoration: 'Día Mundial de las y los Docentes' },
  6: { onomastic: 'Bruno de Colonia', commemoration: 'Día del Hábitat y del Hogar Seguro' },
  7: { onomastic: 'Rosario', commemoration: 'Día de la Calma Interior y Salud Mental' },
  8: { onomastic: 'Pelagia de Antioquía', commemoration: 'Día de la Comunicación Afectiva' },
  9: { onomastic: 'Dionisio', commemoration: 'Día Mundial del Correo y Cartas de Amor' },
  10: { onomastic: 'Tomás de Villanueva', commemoration: 'Día Mundial de la Salud Mental' },
  11: { onomastic: 'Juan XXIII', commemoration: 'Día Internacional de la Niña' },
  12: { onomastic: 'Pilar', commemoration: 'Día de la Diversidad y Encuentro de Culturas' },
  13: { onomastic: 'Eduardo', commemoration: 'Día del Diálogo en Pareja' },
  14: { onomastic: 'Calixto', commemoration: 'Día de la Paciencia y Escucha Activa' },
  15: { onomastic: 'Teresa de Jesús', commemoration: 'Día de las Manos Entrelazadas' },
  16: { onomastic: 'Margarita María Alacoque', commemoration: 'Día Mundial de la Alimentación' },
  17: { onomastic: 'Ignacio de Antioquía', commemoration: 'Día de la Resolución Pacífica de Conflictos' },
  18: { onomastic: 'Lucas Evangelista', commemoration: 'Día del Acompañamiento Mutuo' },
  19: { onomastic: 'Pedro de Alcántara', commemoration: 'Día de la Esperanza y Valentía' },
  20: { onomastic: 'Irene', commemoration: 'Día de la Paz y la Calma Sensorial' },
  21: { onomastic: 'Úrsula', commemoration: 'Día de la Mirada Amorosa' },
  22: { onomastic: 'Juan Pablo', commemoration: 'Día del Respeto y la Empatía' },
  23: { onomastic: 'Juan de Capistrano', commemoration: 'Día de la Validación Emocional' },
  24: { onomastic: 'Rafael Arcángel', commemoration: 'Día de las Naciones Unidas' },
  25: { onomastic: 'Crispín', commemoration: 'Día de la Creatividad Compartida' },
  26: { onomastic: 'Evaristo', commemoration: 'Día del Descanso Reparador' },
  27: { onomastic: 'Vicente', commemoration: 'Día de los Recuerdos Felices' },
  28: { onomastic: 'Judas Tadeo', commemoration: 'Día de la Confianza Inquebrantable' },
  29: { onomastic: 'Narciso', commemoration: 'Día del Cuidado del Sistema Nervioso' },
  30: { onomastic: 'Germán', commemoration: 'Día de la Alegría Simple' },
  31: { onomastic: 'Quintín', commemoration: 'Noche de Celebración y Dulzura' },
};

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const CalendarSection: React.FC = () => {
  const { reminders, alarms } = useApp();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Days in month
  const totalDays = new Date(year, month + 1, 0).getDate();

  // Day of week for 1st day of month (0 = Sun, 1 = Mon, ..., 6 = Sat)
  const firstDayRaw = new Date(year, month, 1).getDay();
  // We need Monday as first day: Mon=0, Tue=1, Wed=2, Thu=3, Fri=4, Sat=5, Sun=6
  const firstDayMondayOffset = (firstDayRaw + 6) % 7;

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const selectedCommemoration = selectedDay ? DAY_COMMEMORATIONS[selectedDay] : null;

  // Real events for day
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

  return (
    <section className="w-full space-y-4">
      {/* Título solo "Calendario" icono mini calendario */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-md">
          <CalendarIcon className="w-4 h-4" />
        </div>
        <h3 className="text-xl font-black text-white font-heading tracking-tight">
          Calendario
        </h3>
      </div>

      {/* Diseño tradicional fondo blanco/marfil números negros, domingos/feriados rojo, Lunes primer día */}
      <div className="rounded-[2.5rem] bg-[#f8fafc] text-slate-900 p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-slate-300 select-none">
        {/* Month Navigation */}
        <div className="flex items-center justify-between pb-6 mb-4 border-b border-slate-200">
          <h4 className="text-2xl font-black font-heading text-slate-900 tracking-tight">
            {MONTH_NAMES[month]} {year}
          </h4>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prevMonth}
              className="p-2 rounded-xl bg-slate-200/80 hover:bg-slate-300 active:scale-95 text-slate-800 transition-colors cursor-pointer"
              title="Mes anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={nextMonth}
              className="p-2 rounded-xl bg-slate-200/80 hover:bg-slate-300 active:scale-95 text-slate-800 transition-colors cursor-pointer"
              title="Mes siguiente"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Days of week header (Lunes primer día, Domingos en rojo) */}
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-black uppercase tracking-wider mb-2">
          <span className="text-slate-600">Lun</span>
          <span className="text-slate-600">Mar</span>
          <span className="text-slate-600">Mié</span>
          <span className="text-slate-600">Jue</span>
          <span className="text-slate-600">Vie</span>
          <span className="text-slate-600">Sáb</span>
          <span className="text-rose-600 font-extrabold">Dom</span>
        </div>

        {/* Grid 30/31 días. Sin "san, santa" en celda. Icono 🚨 si hay evento. */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center">
          {/* Empty offset padding for days before the 1st */}
          {Array.from({ length: firstDayMondayOffset }).map((_, idx) => (
            <div key={`empty-${idx}`} className="h-14 sm:h-16" />
          ))}

          {/* Month Days */}
          {Array.from({ length: totalDays }).map((_, idx) => {
            const dayNum = idx + 1;
            // Day of week index for this day
            const dayOfWeek = (firstDayMondayOffset + idx) % 7;
            const isSunday = dayOfWeek === 6;
            const hasEvent = dayHasEvent(dayNum);

            return (
              <button
                key={dayNum}
                type="button"
                onClick={() => setSelectedDay(dayNum)}
                className={`h-14 sm:h-16 rounded-2xl p-1.5 flex flex-col items-center justify-between border transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                  hasEvent
                    ? 'bg-rose-50/70 border-rose-300/80 shadow-xs'
                    : 'bg-white hover:bg-slate-100 border-slate-200/90 shadow-2xs'
                }`}
              >
                {/* Day number: black, sunday in red */}
                <span
                  className={`text-sm sm:text-base font-extrabold ${
                    isSunday ? 'text-rose-600 font-black' : 'text-slate-900'
                  }`}
                >
                  {dayNum}
                </span>

                {/* Icono 🚨 si hay evento */}
                {hasEvent ? (
                  <span className="text-sm filter drop-shadow animate-bounce">🚨</span>
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                )}
              </button>
            );
          })}
        </div>

        <p className="text-[11px] text-slate-500 text-center mt-6 italic">
          Toca cualquier día para ver su onomástico popular, preview de Color Notes y conmemoración internacional.
        </p>
      </div>

      {/* MODAL DETALLES DEL DÍA (Centered ModalPortal) */}
      <ModalPortal
        isOpen={selectedDay !== null}
        onClose={() => setSelectedDay(null)}
        title={selectedDay ? `Día ${selectedDay} de ${MONTH_NAMES[month]}` : ''}
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
                {selectedCommemoration?.onomastic || 'Santos y protectores de la armonía'}
              </p>
            </div>

            {/* Conmemoración Google / Día Internacional */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <span className="text-[10px] text-sky-300 uppercase font-black tracking-wider">
                Conmemoración / Día Internacional
              </span>
              <p className="text-sm font-semibold text-white/90">
                {selectedCommemoration?.commemoration || 'Día de la complicidad y el amor mutuo'}
              </p>
            </div>

            {/* Recordatorios y Notas Adhesivas de la Fecha */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <span className="text-[10px] text-rose-300 uppercase font-black tracking-wider flex items-center gap-1">
                <Bell className="w-3.5 h-3.5" /> Recordatorios y Notas de la Fecha
              </span>
              {(() => {
                const dayData = getDayEvents(selectedDay);
                if (dayData.count === 0) {
                  return (
                    <div className="p-4 rounded-xl bg-white/5 text-center text-white/50 text-xs">
                      No hay alarmas ni notas guardadas para este día. Se agregarán aquí automáticamente cuando tú o tu pareja las programen.
                    </div>
                  );
                }
                return (
                  <div className="space-y-2">
                    {dayData.reminders.map((r) => (
                      <div
                        key={r.id}
                        className="p-3 rounded-xl bg-amber-100/90 text-amber-950 font-bold text-xs shadow-sm flex items-center justify-between"
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
                        className="p-3 rounded-xl bg-rose-100/90 text-rose-950 font-bold text-xs shadow-sm flex items-center justify-between"
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
    </section>
  );
};
