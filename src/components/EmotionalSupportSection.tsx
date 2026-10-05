import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Dices,
  Smile,
  ShieldCheck,
  Brain,
  MessageCircle,
  HelpCircle,
  Volume2,
  Sun,
  Sunset,
  Moon,
  Info,
  Trophy,
  Bell,
  RotateCw,
  Heart,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useApp, EMOTION_OPTIONS } from '../context/AppContext';
import { ModalPortal } from './ModalPortal';
import { ThreeDice3D } from './ThreeDice3D';
import { COMPREHENSIVE_ADVICE, ADVICE_CATEGORIES } from '../data/comprehensiveAdvice';

export { COMPREHENSIVE_ADVICE, ADVICE_CATEGORIES };

export const EmotionalSupportSection: React.FC = () => {
  const { me, partner, activeRole, updateMyFeeling, updateMyStatus, settings, sendMessage, trigger3DConfetti } = useApp();

  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string>('Todos');
  const [adviceIndex, setAdviceIndex] = useState<number>(0);

  // -------------------------------------------------------------
  // DADO DE LA VERDAD - 3+3 MECÁNICA 50/50 & ANIMACIÓN 10 SEGUNDOS
  // -------------------------------------------------------------
  const [myNumbers, setMyNumbers] = useState<number[]>([1, 3, 5]);
  const [partnerNumbers, setPartnerNumbers] = useState<number[]>([2, 4, 6]);
  const [diceRollResult, setDiceRollResult] = useState<number | null>(null);
  const [isRollingDice, setIsRollingDice] = useState<boolean>(false);
  const [diceWinnerNotice, setDiceWinnerNotice] = useState<string | null>(null);
  const [diceValidationNotice, setDiceValidationNotice] = useState<string | null>(null);

  const currentDisplayMe = activeRole === 'me' ? me : partner;
  const currentDisplayPartner = activeRole === 'me' ? partner : me;

  const filteredAdvice =
    selectedFilterCategory === 'Todos'
      ? COMPREHENSIVE_ADVICE
      : COMPREHENSIVE_ADVICE.filter((a) =>
          selectedFilterCategory === 'Autismo (TEA)'
            ? a.category.includes('Autismo')
            : selectedFilterCategory === 'TDAH'
            ? a.category.includes('TDAH')
            : selectedFilterCategory === 'TLP y Regulación'
            ? a.category.includes('TLP')
            : a.category.includes(selectedFilterCategory)
        );

  const currentAdvice = filteredAdvice[adviceIndex % filteredAdvice.length] || COMPREHENSIVE_ADVICE[0];

  const handleRandomAdvice = () => {
    const pool = filteredAdvice.filter((a) => a.text !== currentAdvice.text);
    const finalPool = pool.length > 0 ? pool : filteredAdvice;
    const randomPick = finalPool[Math.floor(Math.random() * finalPool.length)];
    const targetIdx = filteredAdvice.findIndex((a) => a.text === randomPick.text);
    setAdviceIndex(targetIdx >= 0 ? targetIdx : Math.floor(Math.random() * filteredAdvice.length));
  };

  // Toggle selection for my 3 numbers
  const toggleMyNumber = (num: number) => {
    if (isRollingDice) return;
    setDiceValidationNotice(null);
    setMyNumbers((prev) => {
      if (prev.includes(num)) {
        return prev.filter((n) => n !== num);
      }
      if (prev.length >= 3) {
        // Reemplaza el más antiguo o avisa
        return [...prev.slice(1), num];
      }
      return [...prev, num].sort((a, b) => a - b);
    });
  };

  // Toggle selection for partner's 3 numbers
  const togglePartnerNumber = (num: number) => {
    if (isRollingDice) return;
    setDiceValidationNotice(null);
    setPartnerNumbers((prev) => {
      if (prev.includes(num)) {
        return prev.filter((n) => n !== num);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), num];
      }
      return [...prev, num].sort((a, b) => a - b);
    });
  };

  // INICIO DE LA TIRADA DE DADO (Animación 10 segundos)
  const handleStartRoll = () => {
    if (isRollingDice) return;

    if (myNumbers.length !== 3 || partnerNumbers.length !== 3) {
      setDiceValidationNotice('Ambos deben elegir exactamente 3 números cada uno para tener 50% de probabilidad.');
      return;
    }

    setDiceValidationNotice(null);
    setDiceWinnerNotice(null);

    // Audio / vibración ligera si está disponible
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([60, 40, 60]);
      } catch {}
    }

    // Resultado aleatorio no sesgado del 1 al 6
    const finalNumber = Math.floor(Math.random() * 6) + 1;
    setDiceRollResult(finalNumber);
    setIsRollingDice(true);
  };

  // CALLBACK DE FINALIZACIÓN TRAS LOS 10 SEGUNDOS OBLIGATORIOS
  const handleDiceAnimationComplete = (finalNumber: number) => {
    setIsRollingDice(false);

    const meName = currentDisplayMe.name || 'Yo';
    const partnerName = currentDisplayPartner.name || 'Mi Pareja';

    const myMatches = myNumbers.includes(finalNumber);
    const partnerMatches = partnerNumbers.includes(finalNumber);

    let winnerText = '';

    if (myMatches && partnerMatches) {
      winnerText = `¡Empate amoroso con el número ${finalNumber}! Ambos lo habían elegido [${myNumbers.join(', ')}] 🤝💖`;
    } else if (myMatches) {
      winnerText = `¡Gana ${meName} con el número ${finalNumber}! Tú [${myNumbers.join(', ')}] vs Pareja [${partnerNumbers.join(', ')}] 🏆`;
    } else if (partnerMatches) {
      winnerText = `¡Gana ${partnerName} con el número ${finalNumber}! Pareja [${partnerNumbers.join(', ')}] vs Tú [${myNumbers.join(', ')}] 🏆`;
    } else {
      winnerText = `¡Salió el número ${finalNumber}! Tirada neutral 🎲`;
    }

    setDiceWinnerNotice(winnerText);

    // Confetti 3D
    try {
      trigger3DConfetti();
    } catch {}

    // Notificación en chat compartido
    try {
      sendMessage(`🎲 [Dado de la Verdad 50/50]: ${winnerText}`);
    } catch {}

    // Guardar en timeline/estado de la app
    try {
      updateMyStatus({ lastAction: `🎲 Dado de la verdad: Salió ${finalNumber}` });
    } catch {}

    // Notificación Web Push para ambos
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification('🎲 Dado de la Verdad 50/50', {
          body: winnerText,
          icon: '/icon.svg',
        });
      } catch {}
    }
  };

  return (
    <section className="w-full space-y-6 select-none">
      {/* Título de la sección con emoji animado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-xl shadow-md">
            ❤️🔧
          </div>
          <div>
            <h3 className="text-xl font-black text-white font-heading tracking-tight">
              Apoyo Emocional & Salud
            </h3>
            <p className="text-xs text-white/60">
              Refugio para regularte, tomar decisiones en paz y nutrir el amor diario.
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. MINI JUEGO: DADO DE LA VERDAD 3D REALISTA (MECÁNICA 3+3 50/50 Y 10s)  */}
      {/* ========================================================================= */}
      <div className="glass-card p-5 sm:p-6 border-amber-500/30 bg-gradient-to-br from-amber-950/25 via-black/50 to-slate-900/50 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-amber-500/20">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-xl shadow-md">
              🎲
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-black text-amber-200 uppercase tracking-wide font-heading">
                Dado de la Verdad 3D 🎲 (50% / 50%)
              </h4>
              <p className="text-xs text-white/60">
                Evita discusiones: cada uno elige 3 números y el dado físico decide en 10 segundos
              </p>
            </div>
          </div>
          <span className="text-[10px] uppercase font-black px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 self-start sm:self-center">
            Expectación 10s
          </span>
        </div>

        {/* CONTENEDOR 3D REALISTA CON THREE.JS */}
        <div className="flex flex-col items-center justify-center pt-2">
          <ThreeDice3D
            isRolling={isRollingDice}
            resultNumber={diceRollResult}
            onRollComplete={handleDiceAnimationComplete}
            width={280}
            height={240}
          />
        </div>

        {/* SELECTOR 3+3: CADA UNO ELIGE EXACTAMENTE 3 NÚMEROS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Opción uno: Mis 3 números (Verde Oliva seleccionado) */}
          <div className="p-4 rounded-3xl bg-black/40 border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-lime-300 flex items-center gap-1.5">
                <span>🎯</span>
                <span>Mis 3 números ({currentDisplayMe.name}):</span>
              </span>
              <span className="text-[11px] font-bold text-white/50">
                {myNumbers.length}/3 elegidos
              </span>
            </div>
            <div className="grid grid-cols-6 gap-1.5">
              {[1, 2, 3, 4, 5, 6].map((num) => {
                const isSelected = myNumbers.includes(num);
                return (
                  <button
                    key={num}
                    type="button"
                    disabled={isRollingDice}
                    onClick={() => toggleMyNumber(num)}
                    className={`h-12 rounded-2xl font-black text-sm transition-all cursor-pointer flex items-center justify-center border ${
                      isSelected
                        ? 'bg-[#556b2f] border-lime-400 text-white shadow-[0_0_15px_rgba(85,107,47,0.8)] scale-105 ring-2 ring-lime-400/50'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-white/50">
              Elige tus 3 números para tener el 50% de probabilidad.
            </p>
          </div>

          {/* Opción dos: Números de mi Pareja */}
          <div className="p-4 rounded-3xl bg-black/40 border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                <span>💘</span>
                <span>Números de mi Pareja ({currentDisplayPartner.name}):</span>
              </span>
              <span className="text-[11px] font-bold text-white/50">
                {partnerNumbers.length}/3 elegidos
              </span>
            </div>
            <div className="grid grid-cols-6 gap-1.5">
              {[1, 2, 3, 4, 5, 6].map((num) => {
                const isSelected = partnerNumbers.includes(num);
                return (
                  <button
                    key={num}
                    type="button"
                    disabled={isRollingDice}
                    onClick={() => togglePartnerNumber(num)}
                    className={`h-12 rounded-2xl font-black text-sm transition-all cursor-pointer flex items-center justify-center border ${
                      isSelected
                        ? 'bg-rose-600 border-rose-400 text-white shadow-[0_0_15px_rgba(244,63,94,0.8)] scale-105 ring-2 ring-rose-400/50'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-white/50">
              Tu pareja elige sus 3 números (o puedes configurarlos).
            </p>
          </div>
        </div>

        {/* ALERTA DE VALIDACIÓN SI FALTAN NÚMEROS */}
        {diceValidationNotice && (
          <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-300" />
            <span>{diceValidationNotice}</span>
          </div>
        )}

        {/* BOTÓN PRINCIPAL PARA TIRAR EL DADO */}
        <div className="pt-1">
          <button
            type="button"
            disabled={isRollingDice}
            onClick={handleStartRoll}
            className="w-full py-4 rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 active:scale-98 disabled:opacity-50 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-3 cursor-pointer shadow-[0_10px_25px_rgba(245,158,11,0.45)] border border-amber-300/40 transition-all"
          >
            <Dices className={`w-5 h-5 ${isRollingDice ? 'animate-spin' : ''}`} />
            <span>{isRollingDice ? 'Tirando Dado de la Verdad (10s)...' : '¡TIRAR DADO! 🎲'}</span>
          </button>
        </div>

        {/* AVISO DEL RESULTADO FINAL */}
        {diceWinnerNotice && !isRollingDice && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-3xl bg-gradient-to-r from-amber-500/25 via-rose-500/25 to-purple-500/25 border-2 border-amber-400/50 text-xs sm:text-sm font-bold text-white flex items-center gap-3 shadow-lg"
          >
            <Trophy className="w-6 h-6 text-amber-300 shrink-0 animate-bounce" />
            <div className="flex-1">
              <span className="block font-black text-amber-200 text-[11px] uppercase tracking-wider">
                Resultado de la Verdad:
              </span>
              <span className="font-semibold text-white/95">{diceWinnerNotice}</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. BIBLIOTECA COMPLETA DE 240+ CONSEJOS (40 POR CADA APARTADO)           */}
      {/* ========================================================================= */}
      <div className="glass-card p-5 sm:p-6 border-purple-500/20 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div>
            <h4 className="text-base font-black text-white font-heading uppercase tracking-wide flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" />
              <span>Biblioteca de Apoyo ({COMPREHENSIVE_ADVICE.length} Consejos)</span>
            </h4>
            <p className="text-xs text-white/60">
              40 consejos especializados por cada categoría para enriquecer su vínculo diario
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-purple-200 font-bold px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30">
              {filteredAdvice.length} consejos en esta sección
            </span>
          </div>
        </div>

        {/* Selector de Categorías (Pestañas) */}
        <div className="flex flex-wrap gap-1.5 pb-1">
          {ADVICE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setSelectedFilterCategory(cat);
                setAdviceIndex(0);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedFilterCategory === cat
                  ? 'bg-purple-600 text-white shadow-md scale-102 font-black'
                  : 'bg-white/5 hover:bg-white/10 text-white/70'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Tarjeta de Consejo Actual con cambio dinámico */}
        <motion.div
          key={currentAdvice.text}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="p-5 rounded-3xl bg-purple-950/40 border border-purple-500/30 space-y-3 shadow-lg"
        >
          <div className="flex items-center justify-between text-xs text-purple-300 font-bold">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{currentAdvice.category}</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="bg-purple-500/20 border border-purple-400/30 px-2.5 py-0.5 rounded-full text-[11px] text-purple-200">
                {currentAdvice.tag}
              </span>
              <span className="text-[10px] text-white/40 font-mono">
                {((adviceIndex % filteredAdvice.length) + 1)}/{filteredAdvice.length}
              </span>
            </div>
          </div>

          <p className="text-sm sm:text-base text-white/95 leading-relaxed font-semibold">
            "{currentAdvice.text}"
          </p>

          {currentAdvice.actionTip && (
            <div className="p-3.5 rounded-2xl bg-purple-500/15 border border-purple-400/25 flex items-start gap-2.5 text-xs text-purple-100">
              <span className="text-base shrink-0">💡</span>
              <div>
                <span className="font-black text-amber-200 block text-[11px] uppercase tracking-wider">
                  Paso Práctico para los Dos:
                </span>
                <span>{currentAdvice.actionTip}</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-white/50">
            <span className="flex items-center gap-1 text-purple-300 font-bold">
              <span>👆 Explora consejos variados y prácticos sin repetir</span>
            </span>
            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-lg text-white/70">
              Al Azar 🎲
            </span>
          </div>
        </motion.div>

        {/* Botón único para cambiar tarjeta al azar */}
        <div className="pt-1">
          <button
            type="button"
            onClick={handleRandomAdvice}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 active:scale-98 text-white font-black text-xs flex items-center justify-center gap-2 border border-white/20 cursor-pointer transition-all shadow-xl"
          >
            <Dices className="w-4 h-4 text-purple-200 animate-spin" />
            <span>Cambiar Tarjeta al Azar 🎲</span>
          </button>
        </div>
      </div>
    </section>
  );
};
