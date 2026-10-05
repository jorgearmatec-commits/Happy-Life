import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  MapPin,
  Clock,
  Sparkles,
  Heart,
  Smile,
  Leaf,
  Edit2,
  Check,
  Skull,
  Headphones,
  Battery,
  BatteryCharging,
  BatteryFull,
  BatteryLow,
  BatteryMedium,
  BatteryWarning
} from 'lucide-react';
import {
  useApp,
  STATUS_OPTIONS,
  AVATAR_OPTIONS,
} from '../context/AppContext';
import { StatusOption } from '../types';
import { ModalPortal } from './ModalPortal';

// Componente visual de Pila / Batería Real con estados completos dentro y acordes
const VisualBattery: React.FC<{ percentage: number; isInteractive?: boolean; onChange?: (val: number) => void }> = ({
  percentage,
  isInteractive = false,
  onChange,
}) => {
  // Reglas solicitadas por el usuario:
  // - 0%: Agotado / Agotada 💀 (con icono acorde)
  // - 1% a 25%: Nivel Crítico 🛑
  // - 26% a 50%: Nivel Bajo ⚡
  // - 51% a 71%: Recargando ⚡
  // - 72% a 99%: Alta ✨ (verde empieza al 72%)
  // - 100%: Completa ⚡
  // - Texto explícito DENTRO de la batería para todos los estados
  // - Icono de batería acorde según el porcentaje
  const getLevelConfig = (pct: number) => {
    if (pct === 0) {
      return {
        fillBg: 'bg-[#ef4444]',
        textColor: 'text-[#ef4444]',
        iconColor: 'text-[#ef4444]',
        statusTitle: 'Agotado 0% 💀',
        insideIcon: '💀',
        IconComponent: BatteryWarning,
        glow: 'shadow-red-600/60',
        borderColor: 'border-[#ef4444]/60',
        partnerNotice:
          'Batería en 0% (Agotada 💀): La persona solo quiere estar sola y tranquila por un tiempo para recargar su sistema nervioso sin presiones.',
      };
    }
    if (pct <= 29) {
      return {
        fillBg: 'bg-[#ef4444]',
        textColor: 'text-[#ef4444]',
        iconColor: 'text-[#ef4444]',
        statusTitle: 'Nivel Crítico 🛑',
        insideIcon: '🛑',
        IconComponent: BatteryWarning,
        glow: 'shadow-red-500/50',
        borderColor: 'border-[#ef4444]/40',
        partnerNotice:
          'Batería en Nivel Crítico 🛑: Muy poca energía social. Requiere calma, comprensión y cero reproches para recargar.',
      };
    }
    if (pct <= 41) {
      return {
        fillBg: 'bg-[#facc15]',
        textColor: 'text-[#facc15]',
        iconColor: 'text-[#facc15]',
        statusTitle: 'Nivel Bajo 🪫',
        insideIcon: '🪫',
        IconComponent: BatteryLow,
        glow: 'shadow-yellow-400/50',
        borderColor: 'border-[#facc15]/40',
        partnerNotice:
          'Nivel Bajo 🪫: Energía social limitada. Prefiere planes tranquilos, abrazos en silencio o descansar juntos.',
      };
    }
    if (pct <= 71) {
      return {
        fillBg: 'bg-[#f97316]',
        textColor: 'text-[#f97316]',
        iconColor: 'text-[#f97316]',
        statusTitle: 'Recargando ⚡',
        insideIcon: '⚡',
        IconComponent: BatteryMedium,
        glow: 'shadow-orange-500/50',
        borderColor: 'border-[#f97316]/40',
        partnerNotice:
          'Recargando ⚡: Su nivel de energía está subiendo de forma positiva y saludable.',
      };
    }
    if (pct < 100) {
      return {
        fillBg: 'bg-[#22c55e]',
        textColor: 'text-[#22c55e]',
        iconColor: 'text-[#22c55e]',
        statusTitle: 'Alta ✨',
        insideIcon: '🔋',
        IconComponent: Battery,
        glow: 'shadow-green-500/50',
        borderColor: 'border-[#22c55e]/40',
        partnerNotice:
          'Alta ✨: ¡Gran disposición para conversar, reír y compartir actividades lindas en pareja!',
      };
    }
    return {
      fillBg: 'bg-[#15803d]',
      textColor: 'text-[#22c55e]',
      iconColor: 'text-[#22c55e]',
      statusTitle: 'Completa (100%) ⚡',
      insideIcon: '⚡',
      IconComponent: BatteryCharging,
      glow: 'shadow-emerald-600/60',
      borderColor: 'border-[#15803d]/50',
      partnerNotice:
        'Completa (100%) ⚡: Batería social al máximo nivel, óptimo estado emocional y afectivo.',
    };
  };

  const config = getLevelConfig(percentage);
  const totalSegments = 10;
  const BatteryIcon = config.IconComponent;

  return (
    <div className="space-y-2 select-none">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-bold text-white/90">
          <span>Batería Social</span>
        </div>
        <div className="flex items-center gap-1.5">
          <BatteryIcon className={`w-4 h-4 ${config.iconColor}`} />
          <span className={`font-black text-sm ${config.textColor}`}>
            {percentage}%
          </span>
        </div>
      </div>

      {/* Forma Física de Pila / Batería con Rayitas Internas Segmentadas */}
      <div className="flex items-center gap-1">
        <div
          className={`relative flex-1 h-8 rounded-2xl bg-black/80 p-1.5 border-2 ${config.borderColor} shadow-inner flex items-center gap-1 transition-colors duration-300 overflow-hidden`}
        >
          {/* Rayitas / Celdas internas que se llenan como un icono de batería real */}
          {Array.from({ length: totalSegments }).map((_, idx) => {
            const segThreshold = (idx + 1) * 10;
            const isLit = percentage >= segThreshold - 5;
            const isCriticalPulse = percentage <= 29 && percentage > 0 && isLit;

            return (
              <div
                key={idx}
                className={`h-full flex-1 rounded-md transition-all duration-300 ${
                  isLit
                    ? `${config.fillBg} ${config.glow} shadow-sm ${
                        isCriticalPulse ? 'animate-pulse' : ''
                      }`
                    : 'bg-white/5 border border-white/5'
                }`}
              />
            );
          })}
        </div>

        {/* Polo positivo terminal de la batería */}
        <div className="w-2 h-5 rounded-r-md bg-white/40 border border-l-0 border-white/30 shrink-0" />
      </div>

      {/* TEXTO DE NIVEL RESTAURADO DEBAJO DE LA BARRA (Agotado, Nivel Crítico, Nivel Bajo, Recargando, Alta, Completa) */}
      <div className="flex items-center justify-between px-1 text-xs">
        <span className="text-[11px] text-white/50 font-medium">Estado del nivel:</span>
        <span className={`font-black text-xs ${config.textColor} flex items-center gap-1`}>
          <span>{config.insideIcon}</span>
          <span>{config.statusTitle}</span>
        </span>
      </div>

      {/* Slider interactivo si es mi tarjeta */}
      {isInteractive && onChange && (
        <div className="pt-1">
          <input
            type="range"
            min="0"
            max="100"
            value={percentage}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full h-2 rounded-lg appearance-none bg-white/20 cursor-pointer accent-emerald-500"
          />
        </div>
      )}

      {/* Mensaje automático para pareja según el nivel de batería */}
      {!isInteractive && config.partnerNotice && (
        <div className="p-3 rounded-2xl bg-black/60 border border-white/10 text-white/90 text-xs leading-relaxed mt-2 shadow-md">
          <div className="flex items-center gap-1.5 font-bold mb-1 text-white/80">
            <span>Mensaje Automático para Pareja:</span>
          </div>
          <p className="text-white/80">{config.partnerNotice}</p>
        </div>
      )}
    </div>
  );
};

export const CurrentStatus: React.FC = () => {
  const {
    me,
    partner,
    activeRole,
    updateUserName,
    updateMyStatus,
    updateMySocialBattery,
    sendPauseNotice,
  } = useApp();

  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [editingAvatarTarget, setEditingAvatarTarget] = useState<'me' | 'partner'>('me');

  // Renaming state
  const [isRenamingTarget, setIsRenamingTarget] = useState<'me' | 'partner' | null>(null);
  const [tempName, setTempName] = useState('');

  const PAUSE_OPTIONS = [
    {
      title: 'Tiempo en silencio breve',
      text: 'Necesito un pequeño tiempo en silencio para recargarme, todo está bien contigo mi amor ❤',
      icon: '🤫',
    },
    {
      title: 'Sobrecarga sensorial',
      text: 'Tengo sobrecarga sensorial, voy a ponerme auriculares 30 minutos 🎧',
      icon: '🎧',
    },
    {
      title: 'Batería social muy baja',
      text: 'Estoy con batería social muy baja, te amo y luego te escribo o te llamo 🌿',
      icon: '🔋',
    },
    {
      title: 'Descanso prolongado',
      text: 'Necesito un largo descanso, te escribo en cuanto pueda 🥺',
      icon: '🛌',
    },
  ];

  const currentDisplayMe = activeRole === 'me' ? me : partner;
  const currentDisplayPartner = activeRole === 'me' ? partner : me;

  const handleOpenRename = (target: 'me' | 'partner') => {
    setIsRenamingTarget(target);
    setTempName(target === 'me' ? currentDisplayMe.name : currentDisplayPartner.name);
  };

  const handleSaveRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRenamingTarget) {
      updateUserName(isRenamingTarget === 'me' ? activeRole : (activeRole === 'me' ? 'partner' : 'me'), tempName);
      setIsRenamingTarget(null);
    }
  };

  return (
    <section className="w-full space-y-6">
      {/* 1. TARJETA DE LA PAREJA (ORDEN OBLIGATORIO: ARRIBA PRIMERO) */}
      <motion.div
        whileHover={{ rotateX: 2, rotateY: -2, scale: 1.01 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        style={{ perspective: 1000 }}
        className="glass-card p-6 relative overflow-hidden border-rose-500/30"
      >
        <div className="absolute top-0 right-0 w-36 h-36 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header: Partner Name con botón de cambiar nombre */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setEditingAvatarTarget('partner');
                  setIsAvatarModalOpen(true);
                }}
                className="w-16 h-16 rounded-3xl bg-rose-500/20 border-2 border-rose-400/40 flex items-center justify-center text-3xl shadow-lg hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                title="Cambiar avatar de tu pareja"
              >
                {currentDisplayPartner.avatar}
              </button>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#121826] flex items-center justify-center" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Pareja ❤️
                </span>
                <span className="text-xs text-white/50">Prioridad Máxima</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <h2 className="text-2xl font-black text-white font-heading">
                  {currentDisplayPartner.name}
                </h2>
                <button
                  type="button"
                  onClick={() => handleOpenRename('partner')}
                  className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white cursor-pointer transition-all"
                  title="Cambiar nombre de pareja"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-400/20 text-rose-300 text-xs font-semibold">
            <Heart className="w-3.5 h-3.5 fill-rose-400 text-rose-400 animate-pulse" />
            <span>En vivo</span>
          </div>
        </div>

        {/* Pause Banner if partner activated pause */}
        {currentDisplayPartner.pauseNotice && (
          <div className="mb-4 p-4 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-200 flex items-start gap-3 shadow-lg">
            <span className="text-2xl">🌿</span>
            <div>
              <p className="text-xs uppercase font-bold tracking-wider text-amber-300">
                Pausa activa de tu pareja ({currentDisplayPartner.pauseNotice.timestamp})
              </p>
              <p className="text-sm font-medium mt-0.5">
                "{currentDisplayPartner.pauseNotice.text}"
              </p>
            </div>
          </div>
        )}

        {/* Estado actual de mi pareja: ubicado abajo y arriba de la batería social (sin recortes y legible) */}
        <div className="mb-4 p-4 rounded-3xl bg-white/10 border border-white/15 flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-3xl shadow-inner shrink-0">
              {currentDisplayPartner.statusEmoji}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-white/60 uppercase font-bold tracking-wider">
                Estado actual de mi pareja
              </p>
              <p className="text-base sm:text-lg font-black text-white leading-tight truncate">
                {currentDisplayPartner.status}
              </p>
            </div>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30 shrink-0">
            Sincronizado ✨
          </span>
        </div>

        {/* Banner: Lo que está escuchando mi pareja actualmente */}
        {currentDisplayPartner.currentTrack && currentDisplayPartner.currentTrack.isPlaying && (
          <div className="mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-rose-950/50 via-purple-950/40 to-slate-900/60 border border-rose-400/30 flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-300 shrink-0">
                <Headphones className="w-5 h-5 animate-pulse" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-black uppercase text-rose-300 tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Escuchando en su teléfono
                </span>
                <p className="text-xs font-bold text-white truncate">
                  {currentDisplayPartner.currentTrack.title}
                </p>
                {currentDisplayPartner.currentTrack.artist && (
                  <p className="text-[10px] text-white/60 truncate">
                    {currentDisplayPartner.currentTrack.artist}
                  </p>
                )}
              </div>
            </div>
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-rose-500/25 border border-rose-400/30 text-rose-200 font-bold shrink-0">
              {currentDisplayPartner.currentTrack.source}
            </span>
          </div>
        )}

        {/* Batería Social con icono de pila real */}
        <div className="mb-4 bg-white/5 p-4 rounded-3xl border border-white/10">
          <VisualBattery percentage={currentDisplayPartner.socialBattery} />
        </div>

        {/* Grid: Last Action, Last Location, and Synchronized "Me siento" */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-white/50 text-[10px] uppercase font-bold">Última acción</p>
              <p className="font-semibold text-white/90 line-clamp-1 mt-0.5">
                {currentDisplayPartner.lastAction}
              </p>
              <p className="text-[10px] text-white/50 mt-0.5">{currentDisplayPartner.lastActionTime}</p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-white/50 text-[10px] uppercase font-bold">Última ubicación</p>
              <p className="font-semibold text-white/90 line-clamp-1 mt-0.5">
                {currentDisplayPartner.lastLocation?.name || 'En casa 🏡'}
              </p>
              <p className="text-[10px] text-white/50 mt-0.5">
                {currentDisplayPartner.lastLocation?.updatedAt || 'Reciente'}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-2.5">
            <Smile className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-white/50 text-[10px] uppercase font-bold">Se siente</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-base">{currentDisplayPartner.feelingEmoji}</span>
                <span className="font-bold text-white/90">{currentDisplayPartner.feeling}</span>
              </div>
              <p className="text-[10px] text-white/50 mt-0.5">
                {currentDisplayPartner.feelingUpdatedAt}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 2. TARJETA MÍA (ORDEN OBLIGATORIO: ABAJO) */}
      <motion.div
        whileHover={{ rotateX: 2, rotateY: -2, scale: 1.01 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        style={{ perspective: 1000 }}
        className="glass-card p-6 relative overflow-hidden border-emerald-500/30"
      >
        <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Fila Superior: Avatar y Nombre */}
        <div className="flex items-center justify-between gap-3.5 mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setEditingAvatarTarget('me');
                  setIsAvatarModalOpen(true);
                }}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-emerald-500/20 border-2 border-emerald-400/40 flex items-center justify-center text-3xl shadow-lg hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                title="Cambiar mi avatar"
              >
                {currentDisplayMe.avatar}
              </button>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#121826] flex items-center justify-center" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-xs uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Tú 🌿
                </span>
                <span className="text-[10px] text-white/50">Tu espacio</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <h2 className="text-xl sm:text-2xl font-black text-white font-heading">
                  {currentDisplayMe.name}
                </h2>
                <button
                  type="button"
                  onClick={() => handleOpenRename('me')}
                  className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white cursor-pointer transition-all"
                  title="Cambiar mi nombre"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sección Destacada: Mi Estado Actual Amplio y Sin Cortes */}
        <div className="mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-black/40 to-slate-900/40 border border-emerald-400/30 flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-3xl shrink-0 p-1.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 shadow-inner">
              {currentDisplayMe.statusEmoji}
            </span>
            <div className="min-w-0">
              <span className="text-[10px] text-emerald-300 font-black uppercase tracking-wider block">
                Mi Estado Actual:
              </span>
              <p className="text-sm sm:text-base font-black text-white leading-tight break-words whitespace-normal">
                {currentDisplayMe.status}
              </p>
            </div>
          </div>
          <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 font-bold shrink-0">
            Activo ✨
          </span>
        </div>

        {/* 1-Tap Status Change con iconos y letras más pequeñas para dar más espacio */}
        <div className="mb-5">
          <p className="text-[11px] font-bold text-white/60 uppercase tracking-wider mb-2">
            Cambiar estado en 1 tap (Compacto):
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
            {STATUS_OPTIONS.map((opt) => {
              const isSelected = currentDisplayMe.status === opt.label;
              return (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => updateMyStatus(opt.label, opt.emoji)}
                  className={`p-1.5 rounded-xl border text-left flex items-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-rose-500/30 border-rose-400 shadow-md ring-1 ring-rose-400/50 scale-[1.02]'
                      : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20'
                  }`}
                >
                  <span className="text-sm shrink-0">{opt.emoji}</span>
                  <p className="text-[10px] font-bold text-white leading-tight truncate">
                    {opt.label}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Batería Social Mía Interactiva con Niveles Visuales (Sin porcentajes molestos abajo) */}
        <div className="mb-5 bg-white/5 p-4 rounded-3xl border border-white/10">
          <VisualBattery
            percentage={currentDisplayMe.socialBattery}
            isInteractive
            onChange={updateMySocialBattery}
          />
        </div>

        {/* Banner: Lo que estoy escuchando en mi teléfono actualmente */}
        {currentDisplayMe.currentTrack && currentDisplayMe.currentTrack.isPlaying && (
          <div className="mb-5 p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/50 via-purple-950/40 to-slate-900/60 border border-indigo-400/30 flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
                <Headphones className="w-5 h-5 animate-pulse" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-black uppercase text-indigo-300 tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Escuchando en mi teléfono
                </span>
                <p className="text-xs font-bold text-white truncate">
                  {currentDisplayMe.currentTrack.title}
                </p>
                {currentDisplayMe.currentTrack.artist && (
                  <p className="text-[10px] text-white/60 truncate">
                    {currentDisplayMe.currentTrack.artist}
                  </p>
                )}
              </div>
            </div>
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-indigo-500/25 border border-indigo-400/30 text-indigo-200 font-bold shrink-0">
              {currentDisplayMe.currentTrack.source}
            </span>
          </div>
        )}

        {/* Sync with "Me Siento" check-in */}
        <div className="mb-6 p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-xl">
              {currentDisplayMe.feelingEmoji}
            </div>
            <div>
              <p className="text-[10px] text-white/50 uppercase font-bold">Me siento actualmente</p>
              <p className="text-sm font-bold text-white">{currentDisplayMe.feeling}</p>
            </div>
          </div>
          <span className="text-xs text-white/50 font-medium">
            {currentDisplayMe.feelingUpdatedAt}
          </span>
        </div>

        {/* BOTÓN GIGANTE: "Necesito una pausa 🌿" */}
        <button
          type="button"
          onClick={() => setIsPauseModalOpen(true)}
          className="w-full p-4 rounded-3xl btn-3d-olive flex flex-col items-center justify-center gap-1 cursor-pointer"
        >
          <div className="flex items-center gap-2 text-lg sm:text-xl font-black tracking-wide text-white font-heading">
            <Leaf className="w-6 h-6 text-lime-200 animate-pulse" />
            <span>Necesito una pausa 🌿</span>
          </div>
          <p className="text-xs text-lime-100/90 text-center font-normal px-2">
            Avisa a tu pareja que necesitas silencio o desconexión total sin generar alarma ni sensación de rechazo.
          </p>
        </button>
      </motion.div>

      {/* MODAL: CAMBIAR NOMBRE */}
      <ModalPortal
        isOpen={isRenamingTarget !== null}
        onClose={() => setIsRenamingTarget(null)}
        title={isRenamingTarget === 'me' ? 'Cambiar mi Nombre' : 'Cambiar Nombre de mi Pareja'}
        icon={<Edit2 className="w-6 h-6 text-rose-400" />}
      >
        <form onSubmit={handleSaveRename} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-white/80 uppercase tracking-wider mb-2">
              Ingresa el nuevo nombre o apodo cariñoso:
            </label>
            <input
              type="text"
              required
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              placeholder="Ej. Mi Vida, Amor, etc."
              className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-white font-bold text-sm focus:outline-none focus:border-rose-400"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsRenamingTarget(null)}
              className="flex-1 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-2xl btn-3d-rose text-white font-bold text-xs cursor-pointer"
            >
              Guardar Nombre
            </button>
          </div>
        </form>
      </ModalPortal>

      {/* MODAL: NECESITO UNA PAUSA 🌿 */}
      <ModalPortal
        isOpen={isPauseModalOpen}
        onClose={() => setIsPauseModalOpen(false)}
        title="Avisar que necesitas una pausa 🌿"
        icon={<Leaf className="w-6 h-6 text-lime-400" />}
      >
        <div className="space-y-4">
          <p className="text-sm text-white/80 leading-relaxed">
            Elige el mensaje que mejor exprese tu necesidad en este momento. Se enviará con amor y empatía:
          </p>

          <div className="space-y-3">
            {PAUSE_OPTIONS.map((opt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  sendPauseNotice(idx);
                  setIsPauseModalOpen(false);
                }}
                className="w-full p-4 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-[0.98] border border-white/10 hover:border-lime-400/50 text-left flex items-start gap-3 transition-all cursor-pointer group"
              >
                <span className="text-3xl shrink-0 group-hover:scale-110 transition-transform">
                  {opt.icon}
                </span>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-lime-300">
                    {opt.title}
                  </h4>
                  <p className="text-xs text-white/70 mt-1 leading-relaxed">
                    "{opt.text}"
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </ModalPortal>

      {/* MODAL: CAMBIAR AVATAR */}
      <ModalPortal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        title="Elige o Escribe tu Avatar / Emoji Alegre"
        icon={<Smile className="w-6 h-6 text-rose-400" />}
      >
        <div className="space-y-4 text-white">
          {/* Opción para escribir o pegar cualquier emoji tipo WhatsApp */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <label className="block text-xs font-bold text-white/90">
              Personalizado: Pega o escribe un emoji tipo WhatsApp:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={4}
                placeholder="Pega tu emoji aquí (ej. 🥰, 🥑, 💘)"
                className="flex-1 px-4 py-2.5 rounded-xl bg-black/40 border border-white/20 text-white text-base focus:outline-none focus:border-rose-400 text-center font-bold"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    const customEmoji = e.currentTarget.value.trim();
                    if (editingAvatarTarget === 'me') {
                      if (activeRole === 'me') me.avatar = customEmoji;
                      else partner.avatar = customEmoji;
                    } else {
                      if (activeRole === 'me') partner.avatar = customEmoji;
                      else me.avatar = customEmoji;
                    }
                    localStorage.setItem('happyduo_me_avatar', customEmoji);
                    setIsAvatarModalOpen(false);
                  }
                }}
                id="custom-emoji-input"
              />
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById('custom-emoji-input') as HTMLInputElement;
                  if (input && input.value.trim()) {
                    const customEmoji = input.value.trim();
                    if (editingAvatarTarget === 'me') {
                      if (activeRole === 'me') me.avatar = customEmoji;
                      else partner.avatar = customEmoji;
                    } else {
                      if (activeRole === 'me') partner.avatar = customEmoji;
                      else me.avatar = customEmoji;
                    }
                    localStorage.setItem('happyduo_me_avatar', customEmoji);
                    setIsAvatarModalOpen(false);
                  }
                }}
                className="px-4 py-2.5 rounded-xl btn-3d-rose text-white text-xs font-bold cursor-pointer shrink-0"
              >
                Aplicar
              </button>
            </div>
            <p className="text-[11px] text-white/50">
              Acepta cualquier emoji de tu teclado móvil o avatar kawaii.
            </p>
          </div>

          <p className="text-xs font-bold text-white/70 uppercase tracking-wider">
            O selecciona de la colección animada (120+ opciones):
          </p>

          <div className="grid grid-cols-6 sm:grid-cols-8 gap-2.5 max-h-[50vh] overflow-y-auto p-1 scrollbar-thin">
            {AVATAR_OPTIONS.map((av, idx) => (
              <button
                key={`${av}-${idx}`}
                type="button"
                onClick={() => {
                  if (editingAvatarTarget === 'me') {
                    if (activeRole === 'me') me.avatar = av;
                    else partner.avatar = av;
                  } else {
                    if (activeRole === 'me') partner.avatar = av;
                    else me.avatar = av;
                  }
                  localStorage.setItem('happyduo_me_avatar', av);
                  setIsAvatarModalOpen(false);
                }}
                className="w-11 h-11 rounded-2xl bg-white/5 hover:bg-white/20 active:scale-90 border border-white/10 flex items-center justify-center text-2xl transition-all cursor-pointer shadow-sm hover:border-rose-400"
              >
                <span className="hover:scale-125 transition-transform duration-200">
                  {av}
                </span>
              </button>
            ))}
          </div>
        </div>
      </ModalPortal>
    </section>
  );
};
