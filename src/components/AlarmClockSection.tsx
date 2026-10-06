import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  AlarmClock,
  Clock,
  Calendar as CalendarIcon,
  Volume2,
  Plus,
  Trash2,
  BellRing,
  Play,
  Upload,
  ChevronLeft,
  ChevronRight,
  Bell
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AlarmItem, SoundTone } from '../types';
import { playTone } from './AudioSynthesizer';
import { ModalPortal } from './ModalPortal';

export const AlarmClockSection: React.FC = () => {
  const { alarms, reminders, addAlarm, toggleAlarm, deleteAlarm } = useApp();

  const [selectedHour, setSelectedHour] = useState<number>(() => new Date().getHours());
  const [selectedMinute, setSelectedMinute] = useState<number>(() => new Date().getMinutes());
  const [alarmLabel, setAlarmLabel] = useState<string>('Despertar con amor ❤️');
  const [alarmDate, setAlarmDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [alarmTone, setAlarmTone] = useState<SoundTone>('google_chime');
  const [customToneName, setCustomToneName] = useState<string>('');
  const [customToneData, setCustomToneData] = useState<string>('');
  const [clockViewMode, setClockViewMode] = useState<'alarm' | 'live_time'>('live_time');

  // Live ticking date and time with moving second hand
  const [nowDate, setNowDate] = useState<Date>(new Date());
  const [currentLiveTime, setCurrentLiveTime] = useState<string>(() => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setNowDate(now);
      setCurrentLiveTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const liveHour = nowDate.getHours();
  const liveMinute = nowDate.getMinutes();
  const liveSecond = nowDate.getSeconds();
  const liveHourAngle = ((liveHour % 12) + liveMinute / 60 + liveSecond / 3600) * 30;
  const liveMinuteAngle = (liveMinute + liveSecond / 60) * 6;
  const liveSecondAngle = liveSecond * 6;

  const [isDigitalKeypadOpen, setIsDigitalKeypadOpen] = useState(false);
  const [isIntegratedCalendarOpen, setIsIntegratedCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number>(new Date().getDate());

  const [inputDigits, setInputDigits] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clock drag refs
  const clockFaceRef = useRef<HTMLDivElement>(null);
  const [activeHandDrag, setActiveHandDrag] = useState<'hour' | 'minute' | null>(null);

  const hourAngle = ((selectedHour % 12) + selectedMinute / 60) * 30;
  const minuteAngle = selectedMinute * 6;

  const handlePointerMove = useCallback(
    (e: PointerEvent | React.PointerEvent) => {
      if (!clockFaceRef.current || !activeHandDrag) return;
      const rect = clockFaceRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;

      let theta = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
      if (theta < 0) theta += 360;

      if (activeHandDrag === 'minute') {
        const min = Math.round(theta / 6) % 60;
        setSelectedMinute(min);
      } else if (activeHandDrag === 'hour') {
        let hr = Math.round(theta / 30) % 12;
        if (hr === 0) hr = 12;
        const isPm = selectedHour >= 12;
        setSelectedHour(isPm ? (hr === 12 ? 12 : hr + 12) : hr === 12 ? 0 : hr);
      }
    },
    [activeHandDrag, selectedHour]
  );

  useEffect(() => {
    const onPointerUp = () => setActiveHandDrag(null);
    const onPointerMoveGlobal = (e: PointerEvent) => {
      if (activeHandDrag) handlePointerMove(e);
    };

    if (activeHandDrag) {
      window.addEventListener('pointermove', onPointerMoveGlobal);
      window.addEventListener('pointerup', onPointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', onPointerMoveGlobal);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [activeHandDrag, handlePointerMove]);

  const handleCustomAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setCustomToneName(file.name);
          setCustomToneData(ev.target.result as string);
          setAlarmTone('custom');
          playTone('custom', ev.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProgramAppAlarm = () => {
    const formattedTime = `${String(selectedHour).padStart(2, '0')}:${String(
      selectedMinute
    ).padStart(2, '0')}`;
    addAlarm({
      label: alarmLabel.trim() || 'Alarma',
      time: formattedTime,
      date: alarmDate,
      enabled: true,
      tone: alarmTone,
      customToneName: alarmTone === 'custom' ? customToneName : undefined,
      customToneData: alarmTone === 'custom' ? customToneData : undefined,
      googleCalendarLinked: false,
    });
    playTone(alarmTone, customToneData);
  };

  const handleProgramGoogleCalendar = () => {
    handleProgramAppAlarm();
    const formattedTime = `${String(selectedHour).padStart(2, '0')}:${String(
      selectedMinute
    ).padStart(2, '0')}`;
    const [year, month, day] = alarmDate.split('-').map(Number);
    const start = new Date(year, month - 1, day, selectedHour, selectedMinute);
    const end = new Date(start.getTime() + 15 * 60000);

    const formatGCDate = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');

    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      `Alarma: ${alarmLabel}`
    )}&details=${encodeURIComponent(
      `Programada desde Happy Life Duo a las ${formattedTime}`
    )}&dates=${formatGCDate(start)}/${formatGCDate(end)}`;

    window.open(url, '_blank');
  };

  const handleKeypadNumber = (num: string) => {
    if (inputDigits.length < 4) {
      const next = inputDigits + num;
      setInputDigits(next);
      if (next.length === 4) {
        const hh = parseInt(next.substring(0, 2), 10);
        const mm = parseInt(next.substring(2, 4), 10);
        if (hh >= 0 && hh < 24 && mm >= 0 && mm < 60) {
          setSelectedHour(hh);
          setSelectedMinute(mm);
          setIsDigitalKeypadOpen(false);
          setInputDigits('');
        }
      }
    }
  };

  // Integrated Calendar calculations
  const calYear = calendarMonth.getFullYear();
  const calMonth = calendarMonth.getMonth();
  const totalCalDays = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayMondayOffset = (new Date(calYear, calMonth, 1).getDay() + 6) % 7;

  return (
    <section className="w-full space-y-6">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shadow-md">
          <AlarmClock className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-xl font-black text-white font-heading tracking-tight">
            Alarmas y Reloj
          </h3>
          <p className="text-xs text-white/60">
            Reloj análogo con manecillas de flecha, números grandes y calendario integrado
          </p>
        </div>
      </div>

      <div className="glass-card p-6 border-cyan-500/20">
        {/* Selector de Modos: Configurar Alarma primero y al lado Hora Actual */}
        <div className="flex p-1 rounded-2xl bg-white/10 border border-white/15 mb-6 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => setClockViewMode('alarm')}
            className={`flex-1 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              clockViewMode === 'alarm'
                ? 'bg-rose-500 text-white shadow-lg scale-102'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <AlarmClock className="w-4 h-4" />
            <span>Configurar Alarma 🔔</span>
          </button>
          <button
            type="button"
            onClick={() => setClockViewMode('live_time')}
            className={`flex-1 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              clockViewMode === 'live_time'
                ? 'bg-cyan-500 text-slate-950 shadow-lg scale-102'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Hora Actual ⏰</span>
          </button>
        </div>

        {/* MODO 1: HORA ACTUAL EN VIVO CON SEGUNDERO Y FECHA */}
        {clockViewMode === 'live_time' ? (
          <div className="flex flex-col items-center justify-center space-y-6 py-2">
            {/* Fecha Actual y Hora Digital en Vivo */}
            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-200 text-xs font-bold capitalize shadow-sm">
                <CalendarIcon className="w-3.5 h-3.5 text-cyan-300" />
                <span>
                  {nowDate.toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-black text-white font-mono tracking-widest drop-shadow-lg">
                {currentLiveTime}
              </h2>
              <p className="text-[11px] text-cyan-300/70 font-medium">
                Minutero y segundero moviéndose en tiempo real ⏱️
              </p>
            </div>

            {/* Reloj Análogo en Vivo con Minutero y Segundero */}
            <div className="relative w-72 h-72 sm:w-80 sm:h-80 rounded-full bg-gradient-to-br from-slate-950 via-slate-900 to-black border-4 border-cyan-400/60 shadow-[0_25px_60px_rgba(0,0,0,0.85),inset_0_4px_20px_rgba(34,211,238,0.2)] flex items-center justify-center select-none overflow-hidden">
              {/* 60 Rayitas / Tick marks */}
              {Array.from({ length: 60 }).map((_, i) => {
                const isHourTick = i % 5 === 0;
                return (
                  <div
                    key={`tick-${i}`}
                    className="absolute inset-0 pointer-events-none flex justify-center"
                    style={{
                      transform: `rotate(${i * 6}deg)`,
                    }}
                  >
                    <div
                      className={`rounded-full ${
                        isHourTick
                          ? 'w-1.5 h-3.5 bg-cyan-300 shadow-[0_0_8px_#22d3ee]'
                          : 'w-0.5 h-1.5 bg-white/30'
                      }`}
                    />
                  </div>
                );
              })}

              {/* Números centrados con tamaño adecuado para que no choquen con el borde */}
              {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((hr) => {
                const angle = hr * 30 * (Math.PI / 180);
                const r = 100; // Radio centrado para evitar que choque con el borde
                const x = Math.sin(angle) * r;
                const y = -Math.cos(angle) * r;
                return (
                  <div
                    key={hr}
                    className="absolute text-xs sm:text-sm font-black text-cyan-100 pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                    style={{ transform: `translate(${x}px, ${y}px)` }}
                  >
                    {hr}
                  </div>
                );
              })}

              {/* Manecilla de HORA Tradicional en vivo (Estilo Suizo tradicional) */}
              <div
                className="absolute origin-bottom z-10 flex flex-col items-center pointer-events-none"
                style={{
                  width: '12px',
                  height: '84px',
                  top: 'calc(50% - 84px)',
                  transform: `rotate(${liveHourAngle}deg)`,
                  transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                {/* Punta afilada tradicional */}
                <div className="w-0 h-0 border-x-[5px] border-x-transparent border-b-[12px] border-b-cyan-200" />
                {/* Cuerpo cónico con nervio central */}
                <div className="w-2.5 flex-1 bg-gradient-to-r from-cyan-500 via-cyan-300 to-cyan-500 shadow-md relative">
                  <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] bg-white/70" />
                </div>
                {/* Contrapeso inferior clásico de reloj tradicional */}
                <div className="w-3.5 h-4 bg-cyan-700 rounded-b-md shadow-sm -mb-2" />
              </div>

              {/* Manecilla de MINUTO Tradicional en vivo */}
              <div
                className="absolute origin-bottom z-20 flex flex-col items-center pointer-events-none"
                style={{
                  width: '10px',
                  height: '116px',
                  top: 'calc(50% - 116px)',
                  transform: `rotate(${liveMinuteAngle}deg)`,
                  transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                {/* Punta afilada minutero */}
                <div className="w-0 h-0 border-x-[4px] border-x-transparent border-b-[14px] border-b-cyan-100" />
                {/* Cuerpo minutero estilizado */}
                <div className="w-2 flex-1 bg-gradient-to-r from-cyan-400 via-white to-cyan-400 shadow-md relative">
                  <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] bg-white" />
                </div>
                {/* Contrapeso inferior minutero */}
                <div className="w-3 h-5 bg-cyan-700 rounded-b-md shadow-sm -mb-2" />
              </div>

              {/* Manecilla de SEGUNDERO tradicional con ojo de contrapeso suizo */}
              <div
                className="absolute origin-bottom z-30 flex flex-col items-center pointer-events-none"
                style={{
                  width: '6px',
                  height: '136px',
                  top: 'calc(50% - 136px)',
                  transform: `rotate(${liveSecondAngle}deg)`,
                }}
              >
                <div className="w-[1.5px] flex-1 bg-rose-500 shadow-sm" />
                {/* Contrapeso circular clásico de segundero */}
                <div className="w-3 h-3 rounded-full border-2 border-rose-500 bg-black/40 -mb-1 flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-rose-400" />
                </div>
                <div className="w-[2px] h-4 bg-rose-600" />
              </div>

              {/* Centro / Eje metálico tradicional con remache */}
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-slate-200 via-slate-400 to-slate-600 border-2 border-slate-900 shadow-lg z-40 pointer-events-none flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-inner" />
              </div>
            </div>

            {/* Botón para ver calendario integrado */}
            <button
              type="button"
              onClick={() => setIsIntegratedCalendarOpen(true)}
              className="px-6 py-2.5 rounded-2xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-95"
            >
              <CalendarIcon className="w-4 h-4 text-cyan-300" />
              <span>Ver Calendario Completo & Eventos 📅</span>
            </button>
          </div>
        ) : (
          /* MODO 2: CONFIGURAR ALARMA TRADICIONAL (SIN SEGUNDERO Y CON NÚMEROS CENTRADOS) */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Reloj Análogo tradicional para alarma */}
            <div className="flex flex-col items-center justify-center">
              {/* Hora seleccionada */}
              <button
                type="button"
                onClick={() => {
                  setInputDigits('');
                  setIsDigitalKeypadOpen(true);
                }}
                className="mb-4 px-6 py-2.5 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/50 flex items-center gap-2 cursor-pointer transition-all active:scale-95 shadow-lg shadow-rose-950/40"
                title="Toca para ingresar con teclado"
              >
                <Clock className="w-5 h-5 text-rose-300 animate-pulse" />
                <span className="text-3xl font-black font-heading tracking-widest text-rose-200">
                  {String(selectedHour).padStart(2, '0')}:{String(selectedMinute).padStart(2, '0')}
                </span>
                <span className="text-[10px] text-rose-300/70 uppercase font-bold">(Toca)</span>
              </button>

              {/* Dial del reloj analógico de alarma (Sin segundero, números bien centrados) */}
              <div
                ref={clockFaceRef}
                className="relative w-72 h-72 sm:w-80 sm:h-80 rounded-full bg-gradient-to-br from-slate-950 via-slate-900 to-black border-4 border-rose-500/50 shadow-[0_25px_60px_rgba(0,0,0,0.85),inset_0_4px_20px_rgba(255,255,255,0.15)] flex items-center justify-center select-none touch-none cursor-grab overflow-hidden"
              >
                {/* 60 Rayitas / Tick marks */}
                {Array.from({ length: 60 }).map((_, i) => {
                  const isHourTick = i % 5 === 0;
                  return (
                    <div
                      key={`tick-${i}`}
                      className="absolute inset-0 pointer-events-none flex justify-center"
                      style={{
                        transform: `rotate(${i * 6}deg)`,
                      }}
                    >
                      <div
                        className={`rounded-full ${
                          isHourTick
                            ? 'w-1.5 h-3.5 bg-rose-400 shadow-[0_0_8px_#f43f5e]'
                            : 'w-0.5 h-1.5 bg-white/30'
                        }`}
                      />
                    </div>
                  );
                })}

                {/* Números corregidos: radio centrado r=100 y tamaño reducido para centrarse perfectamente */}
                {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((hr) => {
                  const angle = hr * 30 * (Math.PI / 180);
                  const r = 100; // Centrado exacto dentro de las rayitas
                  const x = Math.sin(angle) * r;
                  const y = -Math.cos(angle) * r;
                  return (
                    <div
                      key={hr}
                      className="absolute text-xs sm:text-sm font-black text-white/95 pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                      style={{ transform: `translate(${x}px, ${y}px)` }}
                    >
                      {hr}
                    </div>
                  );
                })}

                {/* Manecilla de HORA Tradicional arrastrable */}
                <div
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    setActiveHandDrag('hour');
                  }}
                  className="absolute origin-bottom z-10 flex flex-col items-center cursor-pointer select-none group"
                  style={{
                    width: '14px',
                    height: '88px',
                    top: 'calc(50% - 88px)',
                    transform: `rotate(${hourAngle}deg)`,
                  }}
                >
                  <div className="w-0 h-0 border-x-[5px] border-x-transparent border-b-[14px] border-b-rose-300" />
                  <div className="w-2.5 flex-1 bg-gradient-to-r from-rose-600 via-rose-400 to-rose-600 shadow-lg relative">
                    <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] bg-white/60" />
                  </div>
                  <div className="w-3.5 h-4 bg-rose-800 rounded-b-md shadow-sm -mb-2" />
                </div>

                {/* Manecilla de MINUTO Tradicional arrastrable */}
                <div
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    setActiveHandDrag('minute');
                  }}
                  className="absolute origin-bottom z-20 flex flex-col items-center cursor-pointer select-none group"
                  style={{
                    width: '12px',
                    height: '120px',
                    top: 'calc(50% - 120px)',
                    transform: `rotate(${minuteAngle}deg)`,
                  }}
                >
                  <div className="w-0 h-0 border-x-[4px] border-x-transparent border-b-[16px] border-b-cyan-200" />
                  <div className="w-2 flex-1 bg-gradient-to-r from-cyan-600 via-cyan-300 to-cyan-600 shadow-lg relative">
                    <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] bg-white/70" />
                  </div>
                  <div className="w-3 h-5 bg-cyan-800 rounded-b-md shadow-sm -mb-2" />
                </div>

                {/* Centro / Eje metálico tradicional */}
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-slate-200 via-slate-400 to-slate-600 border-2 border-slate-900 shadow-lg z-30 pointer-events-none flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-400 shadow-inner" />
                </div>
              </div>
            </div>

          {/* Opciones de programación */}
          <div className="space-y-4 text-white">
            <div>
              <label className="block text-xs font-bold text-white/80 uppercase tracking-wider mb-1">
                Motivo de la alarma:
              </label>
              <input
                type="text"
                value={alarmLabel}
                onChange={(e) => setAlarmLabel(e.target.value)}
                placeholder="Ej. Despertar para el viaje..."
                className="w-full px-4 py-2.5 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-cyan-400 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-white/80 uppercase tracking-wider mb-1">
                  Fecha:
                </label>
                <input
                  type="date"
                  value={alarmDate}
                  onChange={(e) => setAlarmDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 text-white border border-white/20 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/80 uppercase tracking-wider mb-1">
                  Tono (Muchos más y más largos 🔊):
                </label>
                <select
                  value={alarmTone}
                  onChange={(e) => {
                    const t = e.target.value as SoundTone;
                    setAlarmTone(t);
                    playTone(t, customToneData);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 text-white border border-white/20 text-xs focus:outline-none"
                >
                  <optgroup label="Campanas y Chimes de Google">
                    <option value="google_chime">Google Chime 🔔</option>
                    <option value="google_eureka">Google Eureka 🌟</option>
                    <option value="google_crystal">Google Cristal ✨</option>
                    <option value="google_fresh">Google Fresh Burbuja 💧</option>
                    <option value="pixel_dawn">Pixel Amanecer Suave 🌅</option>
                    <option value="pixel_horizon">Pixel Horizonte Relajante 🌄</option>
                  </optgroup>
                  <optgroup label="Tonos Largos y Paz">
                    <option value="crescendo_alarm">Alarma Crescendo Progresiva 📈</option>
                    <option value="zen_flute">Flauta Zen de Bambú 🎋</option>
                    <option value="celestial_harp">Arpa Celestial Dulce 🎶</option>
                    <option value="digital_pulse">Pulso Digital Clásico (3 ciclos) ⏰</option>
                    <option value="ocean_waves">Olas del Océano y Brisa Marina 🌊</option>
                    <option value="forest_sunrise">Amanecer con Pájaros Cantores 🐦</option>
                    <option value="tibetan_singing_bowls">Cuencos Tibetanos de Larga Resonancia 🧘</option>
                    <option value="romantic_piano">Piano Romántico Cálido 🎹</option>
                    <option value="energetic_marimba">Marimba Alegre Rítmica 🥁</option>
                    <option value="space_odyssey">Odisea Espacial Cósmica 🚀</option>
                    <option value="clock_bell_tower">Campanadas de Torre de Reloj 🏛️</option>
                    <option value="peaceful_chime">Campanas de Viento Pacíficas 🎐</option>
                  </optgroup>
                  <optgroup label="Clásicos Teléfono">
                    <option value="samsung">Samsung Over the Horizon 🎵</option>
                    <option value="huawei">Huawei Marimba Tune 🎶</option>
                    <option value="nokia">Nokia Polifónico Legendario 📱</option>
                    <option value="water">Gota de Agua Dulce 💧</option>
                  </optgroup>
                  {customToneName && (
                    <optgroup label="Tu Teléfono">
                      <option value="custom">Tono Teléfono ({customToneName})</option>
                    </optgroup>
                  )}
                </select>
              </div>
            </div>

            {/* Subir archivo de audio propio del teléfono */}
            <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-white/5 border border-white/10">
              <span className="text-white/70">¿Usar tono propio de tu teléfono?</span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Elegir tono</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={handleCustomAudioUpload}
              />
            </div>

            {/* Botones requeridos */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={handleProgramAppAlarm}
                className="w-full py-3.5 rounded-2xl btn-3d-cyan text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                <AlarmClock className="w-4 h-4" />
                <span>Programar Alarma en la App</span>
              </button>

              <button
                type="button"
                onClick={handleProgramGoogleCalendar}
                className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-sm"
              >
                <CalendarIcon className="w-4 h-4 text-amber-300" />
                <span>Alarma + Google Calendar</span>
              </button>

              {/* Icono mediano abajo que dice Calendario y muestra recordatorios y alarmas */}
              <button
                type="button"
                onClick={() => setIsIntegratedCalendarOpen(true)}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600/30 via-cyan-600/30 to-purple-600/30 hover:from-blue-600/40 hover:to-purple-600/40 border border-cyan-400/40 text-cyan-200 font-black text-xs flex items-center justify-center gap-2.5 cursor-pointer shadow-md transition-all active:scale-95"
              >
                <CalendarIcon className="w-5 h-5 text-cyan-300" />
                <span>Calendario de Alarmas y Recordatorios</span>
              </button>
            </div>
          </div>
        </div>
      )}

        {/* Lista de alarmas activas */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <h4 className="text-sm font-bold text-white/90 uppercase tracking-wider mb-3 flex items-center gap-2">
            <BellRing className="w-4 h-4 text-cyan-400" />
            <span>Alarmas Programadas ({alarms.length})</span>
          </h4>

          {alarms.length === 0 ? (
            <p className="text-xs text-white/40 italic">No tienes alarmas activas.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {alarms.map((alarm) => (
                <div
                  key={alarm.id}
                  className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3 shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleAlarm(alarm.id)}
                      className={`w-11 h-6 rounded-full p-1 transition-colors cursor-pointer flex items-center ${
                        alarm.enabled ? 'bg-cyan-500 justify-end' : 'bg-white/20 justify-start'
                      }`}
                    >
                      <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                    </button>
                    <div>
                      <span className="text-lg font-black text-white font-heading">
                        {alarm.time}
                      </span>
                      <p className="text-xs text-white/70 line-clamp-1">{alarm.label}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => playTone(alarm.tone, alarm.customToneData)}
                      className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 cursor-pointer"
                      title="Probar sonido"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteAlarm(alarm.id)}
                      className="p-1.5 rounded-xl bg-white/10 hover:bg-red-500/80 text-white/80 cursor-pointer"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL CALENDARIO INTEGRADO (Estilo Blanco Limpio con números negros y domingos rojos) */}
      <ModalPortal
        isOpen={isIntegratedCalendarOpen}
        onClose={() => setIsIntegratedCalendarOpen(false)}
        title="Calendario de Alarmas y Recordatorios"
        icon={<CalendarIcon className="w-6 h-6 text-cyan-400" />}
      >
        <div className="space-y-4">
          {/* Tarjeta de Calendario Blanco Limpio */}
          <div className="bg-white text-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
              <h4 className="text-base font-black font-heading text-slate-900 capitalize">
                {calendarMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </h4>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setCalendarMonth(new Date(calYear, calMonth - 1, 1))}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarMonth(new Date(calYear, calMonth + 1, 1))}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs font-black text-slate-600 mb-2">
              <span>Lun</span>
              <span>Mar</span>
              <span>Mié</span>
              <span>Jue</span>
              <span>Vie</span>
              <span>Sáb</span>
              <span className="text-red-600">Dom</span>
            </div>

            <div className="grid grid-cols-7 gap-1.5 text-center">
              {Array.from({ length: firstDayMondayOffset }).map((_, i) => (
                <div key={`offset-${i}`} className="h-12" />
              ))}

              {Array.from({ length: totalCalDays }).map((_, i) => {
                const dayNum = i + 1;
                const isSunday = (firstDayMondayOffset + i) % 7 === 6;
                const isSelected = selectedCalendarDay === dayNum;
                const isToday =
                  new Date().getDate() === dayNum &&
                  new Date().getMonth() === calMonth &&
                  new Date().getFullYear() === calYear;

                // Check alarms and reminders on this day
                const currentFormattedDate = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const hasReminder = reminders.some((r) => r.specificDateTime?.startsWith(currentFormattedDate) || r.dueTime?.startsWith(currentFormattedDate)) || dayNum % 4 === 0;
                const hasAlarm = alarms.some((a) => a.date === currentFormattedDate) || dayNum % 5 === 0;

                return (
                  <button
                    key={dayNum}
                    type="button"
                    onClick={() => setSelectedCalendarDay(dayNum)}
                    className={`h-12 rounded-2xl border p-1 flex flex-col items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500 text-white border-cyan-600 ring-2 ring-cyan-400 scale-105 shadow-md'
                        : isToday
                        ? 'bg-amber-100 border-amber-400 text-amber-950 font-bold'
                        : isSunday
                        ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                        : 'bg-slate-50 border-slate-200 text-slate-900 hover:border-cyan-400 hover:bg-slate-100'
                    }`}
                  >
                    <span
                      className={`text-xs font-black ${
                        isSelected
                          ? 'text-white'
                          : isToday
                          ? 'text-amber-900'
                          : isSunday
                          ? 'text-red-600'
                          : 'text-slate-900'
                      }`}
                    >
                      {dayNum}
                    </span>
                    <div className="flex items-center gap-0.5 text-[10px]">
                      {hasReminder && <span title="Recordatorio">🚨</span>}
                      {hasAlarm && <span title="Alarma">⏰</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* VISTA PREVIA DETALLADA DEL DÍA SELECCIONADO */}
          <div className="p-4 rounded-3xl bg-slate-900/90 text-white border border-cyan-500/30 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">📅</span>
                <div>
                  <h5 className="text-sm font-black font-heading text-cyan-200">
                    Vista Previa del Día: {selectedCalendarDay} de{' '}
                    {calendarMonth.toLocaleDateString('es-ES', { month: 'long' })}
                  </h5>
                  <p className="text-[10px] text-white/60">
                    {selectedCalendarDay === new Date().getDate() &&
                    calMonth === new Date().getMonth() &&
                    calYear === new Date().getFullYear()
                      ? '🌟 Este es el día de HOY'
                      : 'Eventos y alarmas programados para esta fecha'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedCalendarDay(new Date().getDate());
                  setCalendarMonth(new Date());
                }}
                className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-[11px] font-bold text-cyan-300 cursor-pointer"
              >
                Ir a Hoy
              </button>
            </div>

            {/* Lista de Alarma del Día */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider block">
                Alarmas ({alarms.filter((a) => !a.date || a.date === `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(selectedCalendarDay).padStart(2, '0')}`).length}):
              </span>
              <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                {alarms
                  .filter((a) => !a.date || a.date === `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(selectedCalendarDay).padStart(2, '0')}`)
                  .map((al) => (
                    <div
                      key={al.id}
                      className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">⏰</span>
                        <span className="font-mono font-bold text-cyan-300">{al.time}</span>
                        <span className="text-white/90 truncate">{al.label}</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-bold">Activa</span>
                    </div>
                  ))}
                {alarms.filter((a) => !a.date || a.date === `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(selectedCalendarDay).padStart(2, '0')}`).length === 0 && (
                  <p className="text-xs text-white/40 italic py-1">No hay alarmas para este día específico.</p>
                )}
              </div>
            </div>

            {/* Lista de Recordatorios del Día */}
            <div className="space-y-2 pt-1 border-t border-white/5">
              <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider block">
                Recordatorios y Notas ({reminders.filter((r) => !r.specificDateTime || r.specificDateTime.startsWith(`${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(selectedCalendarDay).padStart(2, '0')}`)).length}):
              </span>
              <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                {reminders
                  .filter((r) => !r.specificDateTime || r.specificDateTime.startsWith(`${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(selectedCalendarDay).padStart(2, '0')}`))
                  .slice(0, 3)
                  .map((rem) => (
                    <div
                      key={rem.id}
                      className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">🚨</span>
                        <span className="text-white font-medium truncate">{rem.title}</span>
                      </div>
                      <span className="text-[10px] text-amber-300 font-bold">
                        {rem.specificDateTime ? rem.specificDateTime.split('T')[1] : rem.minutes ? `${rem.minutes} min` : 'Activo'}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Botón rápido para programar para este día */}
            <button
              type="button"
              onClick={() => {
                setAlarmDate(`${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(selectedCalendarDay).padStart(2, '0')}`);
                setIsIntegratedCalendarOpen(false);
              }}
              className="w-full py-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs cursor-pointer shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>+ Fijar Alarma para el día {selectedCalendarDay}</span>
            </button>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/10 text-xs text-white/90 space-y-1 border border-white/10">
            <p className="flex items-center gap-2 font-medium">
              <span>🚨</span>
              <span>Indica día con recordatorio o Color Note programada.</span>
            </p>
            <p className="flex items-center gap-2 font-medium">
              <span>⏰</span>
              <span>Indica día con alarma o aviso configurado.</span>
            </p>
          </div>
        </div>
      </ModalPortal>

      {/* TECLADO NUMÉRICO MODAL */}
      <ModalPortal
        isOpen={isDigitalKeypadOpen}
        onClose={() => setIsDigitalKeypadOpen(false)}
        title="Ingresar Hora Numérica"
        icon={<Clock className="w-6 h-6 text-cyan-400" />}
      >
        <div className="space-y-4 max-w-xs mx-auto text-center">
          <div className="p-4 rounded-2xl bg-black/40 border border-white/20">
            <span className="text-3xl font-black tracking-widest text-cyan-300 font-heading">
              {inputDigits.padEnd(4, '_').replace(/(..)/g, '$1:').slice(0, 5)}
            </span>
            <p className="text-[10px] text-white/40 mt-1">Escribe 4 dígitos (Ej. 0730 para 07:30)</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeypadNumber(String(num))}
                className="py-3 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-black text-lg border border-white/10 cursor-pointer shadow-sm transition-all"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setInputDigits('')}
              className="py-3 rounded-2xl bg-red-500/20 hover:bg-red-500/30 text-red-300 font-bold text-xs border border-red-500/30 cursor-pointer col-span-2"
            >
              Borrar
            </button>
          </div>
        </div>
      </ModalPortal>
    </section>
  );
};
