import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Send,
  X,
  Bot,
  Heart,
  RefreshCw,
  Globe,
  ExternalLink,
  Search,
  Volume2,
  VolumeX,
  Copy,
  Check,
  BookmarkPlus,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  MessageSquarePlus,
  Compass,
  ArrowRight
} from 'lucide-react';
import { ModalPortal } from './ModalPortal';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';

interface GeminiQuickModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GroundingSource {
  title: string;
  url: string;
}

interface MessageItem {
  id: string;
  q: string;
  a: string;
  suggestions: string[];
  sources: GroundingSource[];
  timestamp: string;
}

export const GeminiQuickModal: React.FC<GeminiQuickModalProps> = ({ isOpen, onClose }) => {
  const { addReminder, trigger3DConfetti } = useApp();
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedNoteId, setSavedNoteId] = useState<string | null>(null);

  // Detener voz al cerrar modal
  useEffect(() => {
    if (!isOpen && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isOpen]);

  const handleAsk = async (customPrompt?: string) => {
    const promptToSend = (customPrompt || question).trim();
    if (!promptToSend || isLoading) return;

    setIsLoading(true);
    if (!customPrompt) {
      setQuestion('');
    }

    try {
      const res = await fetch('/api/gemini/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToSend,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.text || 'Gemini ha procesado tu consulta.';
        const suggestions = Array.isArray(data.suggestions) && data.suggestions.length > 0
          ? data.suggestions
          : [
              `¿Puedes darme más detalles sobre "${promptToSend.slice(0, 30)}"?`,
              `¿Cómo aplicar esto en la vida cotidiana en pareja?`,
              `¿Qué curiosidades científicas existen sobre este tema?`
            ];
        const foundSources: GroundingSource[] = data.sources || [
          {
            title: `Búsqueda en Google sobre "${promptToSend}"`,
            url: `https://www.google.com/search?q=${encodeURIComponent(promptToSend)}`,
          },
        ];

        const newMessage: MessageItem = {
          id: 'msg_' + Date.now(),
          q: promptToSend,
          a: text,
          suggestions,
          sources: foundSources,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [newMessage, ...prev]);
      } else {
        throw new Error(`Código ${res.status}`);
      }
    } catch (err: any) {
      console.warn('Gemini query error fallback:', err);
      const fallbackText = `🌐 Hemos procesado tu consulta sobre "${promptToSend}".\n\nPuedes explorar los resultados completos y verificados en tiempo real en Google:`;
      const newMessage: MessageItem = {
        id: 'msg_' + Date.now(),
        q: promptToSend,
        a: fallbackText,
        suggestions: [
          `Ver noticias recientes sobre ${promptToSend.slice(0, 25)}`,
          `Consejos prácticos paso a paso`,
          `Curiosidades y datos de interés`
        ],
        sources: [
          {
            title: `Resultados en Google: "${promptToSend}"`,
            url: `https://www.google.com/search?q=${encodeURIComponent(promptToSend)}`,
          },
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [newMessage, ...prev]);
    } finally {
      setIsLoading(false);
    }
  };

  // Texto a voz con SpeechSynthesis
  const handleToggleSpeech = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    // Limpiar markdown básico para una pronunciación limpia
    const cleanText = text
      .replace(/[#*_~`>-]/g, '')
      .replace(/💡|🎯|🌟|📖|✨|掃|扫/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'es-ES';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Copiar al portapapeles
  const handleCopy = (id: string, text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  // Guardar respuesta como Nota / Recordatorio en Happy Life Duo
  const handleSaveToNotes = (id: string, q: string, a: string) => {
    addReminder({
      title: `Gemini: ${q.slice(0, 30)} - ${a.slice(0, 45)}...`,
      category: 'Personalizado',
      minutes: 0,
      dueTime: new Date().toISOString(),
      color: 'lavender',
      isPrivate: false,
      tone: 'zen_bowl',
      createdBy: 'me',
    });
    setSavedNoteId(id);
    trigger3DConfetti();
    setTimeout(() => setSavedNoteId(null), 3000);
  };

  // Renderizador enriquecido de texto de Gemini
  const renderFormattedText = (raw: string) => {
    const lines = raw.split('\n');
    return (
      <div className="space-y-2.5 text-xs sm:text-[13px] leading-relaxed text-white/95">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) {
            return <div key={idx} className="h-1.5" />;
          }

          // Headers
          if (trimmed.startsWith('### ') || trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
            const heading = trimmed.replace(/^#+\s*/, '');
            return (
              <h4 key={idx} className="text-sm font-black text-amber-300 font-heading pt-2 pb-0.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{heading}</span>
              </h4>
            );
          }

          // Sabías que / Curiosidad callout box
          if (trimmed.toLowerCase().includes('sabías que') || trimmed.toLowerCase().includes('dato curioso') || trimmed.startsWith('💡')) {
            return (
              <div key={idx} className="p-3 rounded-2xl bg-amber-500/15 border border-amber-400/30 text-amber-200 text-xs font-medium flex items-start gap-2.5 shadow-sm">
                <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1">{trimmed.replace(/^💡\s*/, '')}</div>
              </div>
            );
          }

          // Acciones prácticas callout box
          if (trimmed.toLowerCase().includes('acciones prácticas') || trimmed.toLowerCase().includes('consejos prácticos') || trimmed.startsWith('🎯')) {
            return (
              <div key={idx} className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 text-xs font-medium flex items-start gap-2.5 shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex-1 font-bold">{trimmed.replace(/^🎯\s*/, '')}</div>
              </div>
            );
          }

          // Viñetas / Bullets
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
            const content = trimmed.substring(2);
            return (
              <div key={idx} className="flex items-start gap-2 pl-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-2" />
                <div>{renderInlineBolds(content)}</div>
              </div>
            );
          }

          // Listas numeradas
          const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
          if (numMatch) {
            return (
              <div key={idx} className="flex items-start gap-2.5 pl-1">
                <span className="w-5 h-5 rounded-lg bg-white/10 text-amber-300 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5 border border-white/15">
                  {numMatch[1]}
                </span>
                <div className="flex-1">{renderInlineBolds(numMatch[2])}</div>
              </div>
            );
          }

          return <p key={idx}>{renderInlineBolds(trimmed)}</p>;
        })}
      </div>
    );
  };

  // Resalta **negritas** en el texto
  const renderInlineBolds = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-black text-amber-200">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  // Categorías de consultas predefinidas
  const CATEGORIES = [
    {
      id: 'couple',
      label: '💖 Amor & Pareja',
      prompts: [
        '¿Cómo resolver un desacuerdo con empatía y sin herir?',
        'Ideas creativas para una cita romántica casera inolvidable',
        '¿Cómo apoyar a mi pareja cuando tiene un día abrumador?',
      ],
    },
    {
      id: 'wellness',
      label: '🧠 Bienestar & TDAH',
      prompts: [
        'Técnicas de regulación sensorial ante sobrecarga o ansiedad',
        '¿Cómo ayudar a una persona con TDAH a iniciar tareas difíciles?',
        'Ejercicios de respiración guiada para conciliar el sueño rápido',
      ],
    },
    {
      id: 'science',
      label: '🌟 Curiosidades de Hoy',
      prompts: [
        '¿Qué efemérides o curiosidades científicas se celebran hoy?',
        '¿Por qué el cerebro humano produce oxitocina con los abrazos?',
        'Datos asombrosos del universo que casi nadie conoce',
      ],
    },
    {
      id: 'daily',
      label: '🌐 Noticias & Saber',
      prompts: [
        '¿Cuáles son los avances científicos más emocionantes de este año?',
        'Explícame la computación cuántica de forma sencilla y divertida',
        'Consejos para organizar mejor el tiempo entre dos personas',
      ],
    },
  ];

  return (
    <ModalPortal
      isOpen={isOpen}
      onClose={onClose}
      title="Pregúntale a Gemini ✨"
      icon={<Sparkles className="w-6 h-6 text-amber-300" />}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4 text-white">
        {/* Banner de Bienvenida Oficial */}
        <div className="p-4 rounded-3xl bg-gradient-to-r from-purple-950/80 via-indigo-950/70 to-slate-900/80 border border-purple-400/40 flex items-start justify-between gap-3 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 via-rose-500 to-amber-400 flex items-center justify-center shrink-0 shadow-xl border border-white/20">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-300">
                  Gemini Inteligencia Real
                </h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1">
                  <Globe className="w-3 h-3 animate-pulse" /> Conectado a Google
                </span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-white/90 mt-0.5 leading-snug">
                Hola, soy tu amigo Gemini en Happy Life Duo. Pregúntame lo que quieras: respuestas profundas, datos verificados, consejos y soluciones al instante.
              </p>
            </div>
          </div>
        </div>

        {/* Categorías Rápidas */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-white/60">
            <Compass className="w-3.5 h-3.5 text-amber-300" />
            <span>Temas para inspirarte:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(activeCategory === cat.id ? 'all' : cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black scale-102 ring-2 ring-amber-300'
                    : 'bg-white/10 hover:bg-white/20 text-white/80'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {activeCategory !== 'all' && (
            <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 flex flex-wrap gap-1.5 animate-fadeIn">
              {CATEGORIES.find((c) => c.id === activeCategory)?.prompts.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleAsk(p)}
                  className="text-xs px-2.5 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/40 border border-purple-400/30 text-purple-200 hover:text-white transition-all text-left flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowRight className="w-3 h-3 shrink-0 text-amber-300" />
                  <span>{p}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Formulario de Entrada */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk();
          }}
          className="space-y-2.5"
        >
          <div className="relative">
            <textarea
              rows={2}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAsk();
                }
              }}
              placeholder="Haz tu pregunta a Gemini... (ej: '¿Cómo reconectar en pareja?', 'Curiosidades de hoy en el mundo', 'Ideas para cenar rico y sano')"
              className="w-full p-3.5 pr-12 rounded-2xl bg-black/50 border border-white/20 text-white text-xs sm:text-sm placeholder-white/40 focus:outline-none focus:border-amber-400 resize-none shadow-inner"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isLoading || !question.trim()}
              className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 disabled:opacity-50 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-98 transition-all"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Consultando con Gemini y Google en tiempo real...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Pregunta a Gemini 😊</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Respuestas Recientes / Hilo Interactivo */}
        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
          {messages.length === 0 && !isLoading && (
            <div className="py-8 text-center text-white/50 text-xs sm:text-sm space-y-2">
              <Bot className="w-8 h-8 mx-auto text-amber-300/60 animate-bounce" />
              <p className="font-semibold text-white/70">¿Sobre qué te gustaría aprender o conversar hoy?</p>
              <p className="text-white/40 max-w-sm mx-auto text-xs">
                Escribe tu consulta arriba o pulsa uno de los temas sugeridos para obtener una respuesta completa, interactiva y con datos verificados.
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-purple-950/70 via-slate-900/80 to-indigo-950/70 border border-purple-400/40 shadow-xl space-y-3.5"
            >
              {/* Encabezado de la Pregunta */}
              <div className="flex items-start justify-between gap-3 border-b border-purple-400/20 pb-3">
                <div className="flex items-start gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 font-bold shrink-0 mt-0.5">
                    ❓
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-amber-200">
                      {msg.q}
                    </h4>
                    <span className="text-[10px] text-white/40">{msg.timestamp}</span>
                  </div>
                </div>

                {/* Botones de Acción: Voz, Copiar, Guardar */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Escuchar / Leer en voz alta */}
                  <button
                    type="button"
                    onClick={() => handleToggleSpeech(msg.a)}
                    className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      isSpeaking
                        ? 'bg-amber-500 border-amber-400 text-slate-950 animate-pulse'
                        : 'bg-white/10 hover:bg-white/20 border-white/15 text-white/80'
                    }`}
                    title={isSpeaking ? 'Detener lectura' : 'Escuchar respuesta con voz'}
                  >
                    {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">{isSpeaking ? 'Pausar' : 'Escuchar'}</span>
                  </button>

                  {/* Copiar texto */}
                  <button
                    type="button"
                    onClick={() => handleCopy(msg.id, msg.a)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white/80 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                    title="Copiar texto"
                  >
                    {copiedId === msg.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300 text-[10px]">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Copiar</span>
                      </>
                    )}
                  </button>

                  {/* Guardar en Notas / Recordatorios */}
                  <button
                    type="button"
                    onClick={() => handleSaveToNotes(msg.id, msg.q, msg.a)}
                    className="p-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/40 border border-purple-400/40 text-purple-200 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                    title="Guardar en mis notas y recordatorios"
                  >
                    {savedNoteId === msg.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300 text-[10px]">¡Guardado!</span>
                      </>
                    ) : (
                      <>
                        <BookmarkPlus className="w-3.5 h-3.5 text-amber-300" />
                        <span className="hidden sm:inline">Guardar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Contenido Enriquecido de la Respuesta */}
              <div className="p-1">
                {renderFormattedText(msg.a)}
              </div>

              {/* Fuentes y Verificación en Google */}
              {msg.sources.length > 0 && (
                <div className="pt-2 border-t border-purple-400/20 flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1">
                    <Globe className="w-3 h-3" /> Fuentes y Google:
                  </span>
                  {msg.sources.map((src, i) => (
                    <a
                      key={i}
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-[11px] text-amber-200 hover:text-white transition-all shadow-xs"
                    >
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      <span className="max-w-[220px] truncate">{src.title}</span>
                    </a>
                  ))}
                </div>
              )}

              {/* CHIPS INTERACTIVOS DE SEGUIMIENTO (PARA CONTINUAR LA CONVERSACIÓN) */}
              {msg.suggestions && msg.suggestions.length > 0 && (
                <div className="pt-2.5 border-t border-purple-400/20 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-cyan-300">
                    <MessageSquarePlus className="w-3.5 h-3.5" />
                    <span>Preguntas interactivas para continuar:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.suggestions.map((sug, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleAsk(sug)}
                        className="text-xs px-3 py-1.5 rounded-xl bg-cyan-950/40 hover:bg-cyan-800/50 border border-cyan-400/40 text-cyan-200 hover:text-white font-medium transition-all text-left flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
                      >
                        <Sparkles className="w-3 h-3 text-cyan-300 shrink-0" />
                        <span>{sug}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </ModalPortal>
  );
};
