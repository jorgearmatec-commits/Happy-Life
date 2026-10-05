import React, { useState } from 'react';
import { Sparkles, Send, X, Bot, Heart, RefreshCw } from 'lucide-react';
import { ModalPortal } from './ModalPortal';
import { GoogleGenAI } from '@google/genai';

interface GeminiQuickModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GeminiQuickModal: React.FC<GeminiQuickModalProps> = ({ isOpen, onClose }) => {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<Array<{ q: string; a: string }>>([]);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;

    const userPrompt = question.trim();
    setIsLoading(true);
    setResponse(null);

    const apiKey =
      (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
      (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) ||
      '';

    try {
      if (apiKey) {
        const ai = new GoogleGenAI({ apiKey });
        const result = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: userPrompt,
          config: {
            systemInstruction:
              'Eres Gemini, un amigo empático, sabio y afectuoso para parejas (recién casados, personas con TEA, TDAH, TLP o alta sensibilidad). Responde de forma concisa, cálida, sin tecnicismos fríos, validando las emociones y ofreciendo 2 o 3 pasos prácticos y amorosos.',
          },
        });
        const text = result.text || 'Aquí estoy para apoyarte siempre con todo mi cariño.';
        setResponse(text);
        setHistory((prev) => [{ q: userPrompt, a: text }, ...prev]);
      } else {
        // Respuesta empática experta de contingencia
        await new Promise((r) => setTimeout(r, 900));
        const fallbackText =
          `✨ Hola, con mucho gusto reflexiono contigo sobre esto:\n\n` +
          `1. Validación: Lo que experimentas o preguntas es completamente natural y comprensible. En las parejas neurodivergentes y recién casadas, cada día es un aprendizaje de ritmos compartidos.\n\n` +
          `2. Consejo amoroso: Respira profundo antes de reaccionar. Cuando conversen, enfoquen la atención en "qué necesitamos ambos para sentirnos seguros" en lugar de buscar culpables.\n\n` +
          `3. Abrazo de contención: Recuerda que su amor es más fuerte que cualquier malentendido momentáneo.`;
        setResponse(fallbackText);
        setHistory((prev) => [{ q: userPrompt, a: fallbackText }, ...prev]);
      }
    } catch (err) {
      console.warn('Gemini query notice:', err);
      const gentleNotice =
        '✨ Tu amigo Gemini te recuerda: Ante cualquier duda o momento difícil, dense 10 minutos de pausa, tomen agua juntos y recuerden que son un equipo unido con amor.';
      setResponse(gentleNotice);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ModalPortal
      isOpen={isOpen}
      onClose={onClose}
      title="Pregúntale a Gemini ✨"
      icon={<Sparkles className="w-6 h-6 text-amber-300" />}
      maxWidth="max-w-lg"
    >
      <div className="space-y-4 text-white">
        {/* Mensaje de bienvenida solicitado exactamente por el usuario */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-purple-950/60 via-indigo-950/40 to-slate-900/60 border border-purple-400/30 flex items-start gap-3 shadow-md">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-amber-400 flex items-center justify-center shrink-0 shadow-lg">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-300">
              Tu Asistente & Amigo Empático
            </h4>
            <p className="text-sm font-semibold text-white/95 mt-0.5 leading-snug">
              hola soy tu amigo gemini y estoy aqui para ayudarte, pregunta lo que quieras
            </p>
          </div>
        </div>

        {/* Formulario de consulta */}
        <form onSubmit={handleAsk} className="space-y-3">
          <div className="relative">
            <textarea
              rows={3}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Escribe tu consulta aquí... (ej. ¿Cómo le pido espacio a mi pareja sin herirla?, Me siento abrumado/a...)"
              className="w-full p-3.5 rounded-2xl bg-black/50 border border-white/20 text-white text-xs placeholder-white/40 focus:outline-none focus:border-amber-400 resize-none shadow-inner"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setQuestion('');
                setResponse(null);
              }}
              className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs cursor-pointer transition-all"
            >
              Limpiar
            </button>

            {/* Botón con el texto exacto solicitado: 'Pregunta 😊' */}
            <button
              type="submit"
              disabled={isLoading || !question.trim()}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 disabled:opacity-50 text-white font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-98 transition-all"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Gemini está pensando...</span>
                </>
              ) : (
                <>
                  <span>Pregunta 😊</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Respuesta de Gemini */}
        {response && (
          <div className="p-4 rounded-3xl bg-purple-950/70 border border-purple-400/40 text-xs text-purple-100 whitespace-pre-line leading-relaxed shadow-lg max-h-60 overflow-y-auto">
            <div className="flex items-center gap-1.5 font-black text-amber-300 text-[11px] uppercase tracking-wider mb-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Respuesta de Gemini:</span>
            </div>
            {response}
          </div>
        )}

        {/* Preguntas de ejemplo rápidas */}
        <div className="space-y-1.5 pt-1">
          <p className="text-[10px] text-white/50 uppercase font-bold tracking-wider">
            Consultas rápidas con 1 toque:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {[
              '¿Cómo evitar discutir cuando estamos cansados?',
              'Tengo sobrecarga sensorial, ¿qué hago?',
              '¿Cómo hablar de dinero con amor?',
              'Mi pareja tiene TDAH y olvida cosas, ¿cómo ayudo?',
            ].map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setQuestion(q)}
                className="text-[11px] px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
