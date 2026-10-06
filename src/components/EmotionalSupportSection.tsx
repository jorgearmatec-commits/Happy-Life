import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
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
  RotateCw,
  Heart,
  CheckCircle2,
  AlertCircle,
  Dices
} from 'lucide-react';
import { useApp, EMOTION_OPTIONS } from '../context/AppContext';
import { COMPREHENSIVE_ADVICE, ADVICE_CATEGORIES } from '../data/comprehensiveAdvice';

export { COMPREHENSIVE_ADVICE, ADVICE_CATEGORIES };

export const EmotionalSupportSection: React.FC = () => {
  const { me, partner, activeRole, updateMyFeeling, updateMyStatus, settings, sendMessage } = useApp();

  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string>('Todos');
  const [adviceIndex, setAdviceIndex] = useState<number>(0);

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
      {/* 1. BIBLIOTECA COMPLETA DE 240+ CONSEJOS (40 POR CADA APARTADO)           */}
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
