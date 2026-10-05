import React, { useState } from 'react';
import { Sparkles, Send, X, Bot, Heart, RefreshCw, Globe, ExternalLink, Search } from 'lucide-react';
import { ModalPortal } from './ModalPortal';
import { GoogleGenAI } from '@google/genai';

interface GeminiQuickModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GroundingSource {
  title: string;
  url: string;
}

export const GeminiQuickModal: React.FC<GeminiQuickModalProps> = ({ isOpen, onClose }) => {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [searchQueries, setSearchQueries] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<Array<{ q: string; a: string; sources: GroundingSource[] }>>([]);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;

    const userPrompt = question.trim();
    setIsLoading(true);
    setResponse(null);
    setSources([]);
    setSearchQueries([]);

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
              'Eres Gemini con búsqueda en internet en tiempo real. Responde de forma precisa, veraz, actualizada y empática a cualquier pregunta que haga el usuario (noticias, datos, clima, ciencia, relaciones de pareja, neurodivergencia, recomendaciones o cualquier tema). Utiliza la herramienta de búsqueda de Google (Grounding) para obtener información fresca y verificada.',
            tools: [{ googleSearch: {} }],
          },
        });

        const text = result.text || 'He buscado en internet pero no encontré respuesta precisa.';
        setResponse(text);

        // Extraer fuentes de Grounding de Google Search
        const candidate = result.candidates?.[0];
        const groundingMeta = (candidate as any)?.groundingMetadata;
        const foundSources: GroundingSource[] = [];

        if (groundingMeta?.groundingChunks && Array.isArray(groundingMeta.groundingChunks)) {
          for (const chunk of groundingMeta.groundingChunks) {
            if (chunk?.web?.uri) {
              foundSources.push({
                title: chunk.web.title || chunk.web.uri.replace(/^https?:\/\//, '').split('/')[0],
                url: chunk.web.uri,
              });
            }
          }
        }

        if (groundingMeta?.webSearchQueries && Array.isArray(groundingMeta.webSearchQueries)) {
          setSearchQueries(groundingMeta.webSearchQueries);
        }

        setSources(foundSources);
        setHistory((prev) => [{ q: userPrompt, a: text, sources: foundSources }, ...prev]);
      } else {
        // Fallback inteligente con búsqueda real conectada vía DuckDuckGo / Google Web Link
        const encoded = encodeURIComponent(userPrompt);
        let liveSummary = '';
        const fallbackSources: GroundingSource[] = [
          {
            title: `Búsqueda en Google: "${userPrompt}"`,
            url: `https://www.google.com/search?q=${encoded}`,
          },
          {
            title: 'Wikipedia en Español',
            url: `https://es.wikipedia.org/wiki/Special:Search?search=${encoded}`,
          },
        ];

        try {
          const res = await fetch(`https://api.duckduckgo.com/?q=${encoded}&format=json&no_html=1&skip_disambig=1`);
          const data = await res.json();
          if (data.AbstractText) {
            liveSummary = `${data.AbstractText}\n\n(Fuente: ${data.AbstractSource || 'Wikipedia'})`;
            if (data.AbstractURL) {
              fallbackSources.unshift({
                title: data.AbstractSource || 'Fuente Web Oficial',
                url: data.AbstractURL,
              });
            }
          }
        } catch {
          // ignore
        }

        if (!liveSummary) {
          liveSummary =
            `🌐 He consultado sobre: "${userPrompt}".\n\n` +
            `Aquí tienes los enlaces directos a los resultados verificados en internet. Configura VITE_GEMINI_API_KEY para habilitar la síntesis automática con Google Search Grounding directamente en pantalla.`;
        }

        setResponse(liveSummary);
        setSources(fallbackSources);
        setSearchQueries([userPrompt]);
        setHistory((prev) => [{ q: userPrompt, a: liveSummary, sources: fallbackSources }, ...prev]);
      }
    } catch (err: any) {
      console.warn('Gemini query notice:', err);
      const gentleNotice =
        `🌐 Consulta realizada para: "${userPrompt}".\n\nNo fue posible completar la conexión con la API de Gemini (${err?.message || 'Error de red'}). Puedes ver la búsqueda directa en el enlace abajo.`;
      setResponse(gentleNotice);
      setSources([
        {
          title: `Buscar "${userPrompt}" en Google`,
          url: `https://www.google.com/search?q=${encodeURIComponent(userPrompt)}`,
        },
      ]);
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
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-300">
                Tu Asistente & Amigo Gemini
              </h4>
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Globe className="w-3 h-3 animate-pulse" /> Búsqueda Web Real
              </span>
            </div>
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
              placeholder="Escribe lo que quieras saber... (noticias, datos, clima, consejos, ciencia, cultura...)"
              className="w-full p-3.5 rounded-2xl bg-black/50 border border-white/20 text-white text-xs placeholder-white/40 focus:outline-none focus:border-amber-400 resize-none shadow-inner"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setQuestion('');
                setResponse(null);
                setSources([]);
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
                  <span>Buscando en internet con Gemini...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Pregunta 😊</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Respuesta de Gemini con Fuentes y Enlaces */}
        {response && (
          <div className="p-4 rounded-3xl bg-purple-950/70 border border-purple-400/40 text-xs text-purple-100 space-y-3 shadow-lg max-h-72 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-purple-400/20 pb-2">
              <div className="flex items-center gap-1.5 font-black text-amber-300 text-[11px] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Respuesta con Búsqueda Real:</span>
              </div>
              {searchQueries.length > 0 && (
                <span className="text-[10px] text-white/50 flex items-center gap-1">
                  <Search className="w-3 h-3 text-cyan-300" /> {searchQueries[0]}
                </span>
              )}
            </div>

            <div className="whitespace-pre-line leading-relaxed text-white/95">
              {response}
            </div>

            {/* Fuentes y Enlaces Web Encontrados */}
            {sources.length > 0 && (
              <div className="pt-2 border-t border-purple-400/20 space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Fuentes y Enlaces Web:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {sources.map((src, i) => (
                    <a
                      key={i}
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-500/20 hover:bg-purple-500/40 border border-purple-400/40 text-[11px] text-amber-200 hover:text-white transition-all shadow-sm"
                    >
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      <span className="max-w-[200px] truncate">{src.title}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Preguntas de ejemplo rápidas */}
        <div className="space-y-1.5 pt-1">
          <p className="text-[10px] text-white/50 uppercase font-bold tracking-wider">
            Consultas de ejemplo con búsqueda web:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {[
              '¿Qué clima habrá hoy en Santiago de Chile?',
              '¿Cuáles son las últimas noticias del mundo?',
              '¿Cómo calmar un ataque de pánico según psicólogos?',
              'Técnicas científicas para comunicarse con una pareja autista',
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
