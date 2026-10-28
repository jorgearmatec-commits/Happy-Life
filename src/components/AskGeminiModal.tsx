import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  X,
  Send,
  RotateCw,
  HelpCircle,
  Compass,
  ArrowRight,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { askGemini, GeminiResponse } from '../utils/geminiApi';
import { useApp } from '../context/AppContext';
import { SECTION_METADATA } from './SubmenuNav';

interface AskGeminiModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Renderizador inteligente de markdown en línea (negrita, código, cursiva)
function formatInlineMarkdown(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`|\*.*?\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-bold text-purple-200">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={index} className="px-1.5 py-0.5 rounded-md bg-white/10 font-mono text-xs text-amber-300">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={index} className="italic text-white/90">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
}

// Renderizador estructurado para respuestas inteligentes: Tablas Markdown, SVG y Párrafos
function renderRichContent(rawText: string) {
  // 1. Extraer bloques SVG si existen
  const svgRegex = /<svg[\s\S]*?<\/svg>/i;
  const svgMatch = rawText.match(svgRegex);
  const svgContent = svgMatch ? svgMatch[0] : null;
  const textWithoutSvg = rawText.replace(svgRegex, '').trim();

  const lines = textWithoutSvg.split('\n');
  const renderedElements: React.ReactNode[] = [];
  let tableRows: string[] = [];
  let inTable = false;

  const flushTable = (buffer: string[], key: number) => {
    if (buffer.length < 2) return null;
    const headerCols = buffer[0].split('|').map((c) => c.trim()).filter(Boolean);
    const bodyRows = buffer.slice(2).map((r) => r.split('|').map((c) => c.trim()).filter(Boolean));

    return (
      <div key={`table_${key}`} className="my-2.5 overflow-x-auto rounded-2xl border border-purple-500/30 bg-black/50 shadow-inner">
        <table className="w-full text-xs text-left">
          <thead className="bg-purple-900/40 text-purple-200 uppercase font-bold text-[10px] tracking-wider">
            <tr>
              {headerCols.map((col, idx) => (
                <th key={idx} className="px-3 py-2 border-b border-purple-500/30">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {bodyRows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-white/5 transition-colors">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-3 py-2 text-white/90">
                    {formatInlineMarkdown(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  let idx = 0;
  while (idx < lines.length) {
    const line = lines[idx];
    const trimmed = line.trim();

    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      inTable = true;
      tableRows.push(trimmed);
      idx++;
    } else {
      if (inTable) {
        renderedElements.push(flushTable(tableRows, idx));
        tableRows = [];
        inTable = false;
      }
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
        renderedElements.push(
          <li key={idx} className="ml-4 list-disc text-white/90 leading-relaxed">
            {formatInlineMarkdown(trimmed.replace(/^[-*•]\s*/, ''))}
          </li>
        );
      } else if (trimmed) {
        renderedElements.push(
          <p key={idx} className="leading-relaxed">
            {formatInlineMarkdown(line)}
          </p>
        );
      } else {
        renderedElements.push(<div key={idx} className="h-1.5" />);
      }
      idx++;
    }
  }

  if (inTable && tableRows.length > 0) {
    renderedElements.push(flushTable(tableRows, idx));
  }

  return (
    <div className="space-y-1.5">
      {renderedElements}
      {svgContent && (
        <div className="my-3 p-3.5 rounded-2xl bg-black/70 border border-purple-400/40 flex flex-col items-center justify-center overflow-x-auto shadow-xl">
          <span className="text-[10px] text-purple-300 font-bold uppercase tracking-wider mb-2 self-start flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-cyan-300" />
            <span>Gráfico Interactivo generado por Gemini</span>
          </span>
          <div
            className="w-full flex justify-center py-1 [&>svg]:max-w-full [&>svg]:h-auto [&>svg]:drop-shadow-lg"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        </div>
      )}
    </div>
  );
}

export const AskGeminiModal: React.FC<AskGeminiModalProps> = ({ isOpen, onClose }) => {
  const { settings } = useApp();
  const currentScreen = settings.activeMenu || 'status';
  const screenMeta = SECTION_METADATA[currentScreen] || {
    shortLabel: 'Menú Principal',
    emoji: '✨',
  };

  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<GeminiResponse | null>(null);
  const [lastQuery, setLastQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const answerRef = useRef<HTMLDivElement>(null);

  // Sugerencias rápidas equilibradas: consultas generales y funciones de la app
  const quickQuestions = [
    '¿Qué temperatura hará mañana en Buenos Aires?',
    '¿Cómo agrego un gasto en Happy Life Duo?',
    '¿Cuánto es 25 por 4?',
    'Traduce hola, ¿cómo estás? al inglés',
    'Dame una receta rápida para la cena',
    '¿Cómo sincronizo con mi pareja?',
    `¿Cómo funciona la sección de ${screenMeta.shortLabel}?`,
  ];

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    } else {
      setQuery('');
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleSend = async (questionToSend?: string) => {
    const textToAsk = (questionToSend || query).trim();
    if (!textToAsk || isLoading) return;

    setLastQuery(textToAsk);
    setIsLoading(true);
    setResponse(null);

    try {
      const res = await askGemini(textToAsk, currentScreen);
      setResponse(res);
      setTimeout(() => {
        answerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    } catch (err: any) {
      setResponse({
        success: false,
        isError: true,
        text: 'Ocurrió un error al procesar tu consulta. Verifica tu conexión a internet o pulsa reintentar.',
        suggestions: [],
        error: err?.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = () => {
    setQuery('');
    setResponse(null);
    setLastQuery('');
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  if (!isOpen || typeof document === 'undefined') return null;

  const isFailed = response && (response.isError || !response.success);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-[2.5rem] bg-gradient-to-br from-[#121629]/95 via-[#161a33]/98 to-[#0d1021]/98 border-2 border-purple-500/40 shadow-2xl text-white overflow-hidden flex flex-col max-h-[90vh] my-auto"
      >
        {/* Cabecera del Modal con Identidad Visual de Gemini */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between gap-3 bg-white/5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-sky-400 p-0.5 shadow-lg shrink-0">
              <div className="w-full h-full bg-[#121629] rounded-[14px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-300 animate-pulse" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black font-heading text-white tracking-tight truncate">
                  Pregúntale a Gemini
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
                  Asistente IA
                </span>
              </div>
              <p className="text-[11px] text-white/60 truncate flex items-center gap-1.5">
                <span>Pantalla activa:</span>
                <span className="text-cyan-300 font-bold">
                  {screenMeta.emoji} {screenMeta.shortLabel}
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 text-white/70 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
            title="Cerrar ayuda"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cuerpo del Modal con Contenido Dinámico */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Tarjeta de Respuesta o Error de Gemini */}
          <AnimatePresence mode="wait">
            {response && (
              <motion.div
                key={lastQuery}
                ref={answerRef}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-4 sm:p-4.5 rounded-3xl border space-y-3 shadow-lg ${
                  isFailed
                    ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                    : 'bg-purple-950/40 border-purple-500/30 text-white'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold border-b border-white/10 pb-2">
                  <span className="flex items-center gap-1.5 truncate">
                    {isFailed ? (
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    )}
                    <span className="truncate">Consulta: "{lastQuery}"</span>
                  </span>
                  {response.modelUsed ? (
                    <span className="text-[10px] bg-purple-500/20 border border-purple-500/30 px-2 py-0.5 rounded-lg text-purple-200 shrink-0">
                      {response.modelUsed}
                    </span>
                  ) : response.isOfflineFallback ? (
                    <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-lg text-white/60 shrink-0">
                      Respuesta Inteligente Local
                    </span>
                  ) : null}
                </div>

                <div className="text-sm sm:text-base leading-relaxed font-medium">
                  {renderRichContent(response.text)}
                </div>

                {/* Fuentes de información y enlaces verificados */}
                {response.sources && response.sources.length > 0 && (
                  <div className="pt-2 border-t border-white/10 flex flex-wrap items-center gap-1.5 text-[11px] text-white/70">
                    <span className="font-bold text-cyan-300">Fuente:</span>
                    {response.sources.map((src, i) => (
                      <a
                        key={i}
                        href={src.url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-cyan-200 text-[10px] font-bold border border-white/10 transition-colors"
                      >
                        {src.title}
                      </a>
                    ))}
                  </div>
                )}

                {/* Si hubo un error, botón destacado de reintentar */}
                {isFailed && (
                  <div className="pt-2 flex items-center gap-2 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => handleSend(lastQuery)}
                      disabled={isLoading}
                      className="px-4 py-2 rounded-xl bg-amber-500/30 hover:bg-amber-500/50 text-amber-200 text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all border border-amber-400/30"
                    >
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Reintentar consulta</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="text-xs text-white/60 hover:text-white cursor-pointer px-2 py-1"
                    >
                      Hacer otra pregunta
                    </button>
                  </div>
                )}

                {/* Sugerencias de seguimiento interactivas */}
                {!isFailed && response.suggestions && response.suggestions.length > 0 && (
                  <div className="pt-2 border-t border-white/10 space-y-1.5">
                    <span className="text-[11px] font-bold text-purple-300 block">
                      Preguntas relacionadas:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {response.suggestions.map((sugg, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setQuery(sugg);
                            handleSend(sugg);
                          }}
                          className="px-2.5 py-1 rounded-xl bg-purple-500/20 hover:bg-purple-500/35 border border-purple-400/30 text-xs text-purple-200 text-left transition-all cursor-pointer flex items-center gap-1"
                        >
                          <span>{sugg}</span>
                          <ArrowRight className="w-3 h-3 shrink-0 opacity-70" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Botón para realizar otra consulta */}
                {!isFailed && (
                  <div className="pt-1 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="text-xs text-purple-300 hover:text-white flex items-center gap-1 cursor-pointer font-bold"
                    >
                      <RotateCw className="w-3 h-3" />
                      <span>Hacer otra consulta</span>
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Indicador discreto de procesamiento (no bloqueante) */}
          {isLoading && (
            <div className="p-4 rounded-3xl bg-white/5 border border-purple-500/30 flex items-center gap-3 text-sm text-purple-200">
              <Sparkles className="w-5 h-5 text-purple-400 animate-spin shrink-0" />
              <div className="min-w-0">
                <span className="font-bold block text-white">Consultando a Gemini...</span>
                <span className="text-xs text-white/60">
                  Procesando tu consulta con precisión
                </span>
              </div>
            </div>
          )}

          {/* Consultas Rápidas Sugeridas (visibles si no hay respuesta activa o para guiar al usuario) */}
          {!response && !isLoading && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-white/70 font-bold">
                <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
                <span>Consultas frecuentes sobre la app:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {quickQuestions.map((qText, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      setQuery(qText);
                      handleSend(qText);
                    }}
                    className="p-2.5 rounded-2xl bg-white/5 hover:bg-purple-600/20 active:scale-98 border border-white/10 hover:border-purple-400/40 text-left text-xs font-semibold text-white/90 transition-all cursor-pointer flex items-center justify-between gap-2 group"
                  >
                    <span className="truncate">{qText}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-purple-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Barra de Entrada de Pregunta (Optimizado para teclado Android) */}
        <div className="p-3 sm:p-4 border-t border-white/10 bg-black/40">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                placeholder="Escribe tu duda (ej. ¿cómo agrego un gasto?)..."
                className="w-full py-3 pl-4 pr-10 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-xs sm:text-sm focus:outline-none focus:border-purple-400 focus:bg-white/15 transition-all"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="py-3 px-4 sm:px-5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-600 hover:from-purple-500 hover:to-sky-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg active:scale-95 transition-all shrink-0"
              title="Preguntar a Gemini"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Consultar</span>
            </button>
          </form>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};
