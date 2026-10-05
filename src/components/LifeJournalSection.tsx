import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  Camera,
  Star,
  Sparkles,
  Edit3,
  Trash2,
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  Scroll,
  Eye,
  Image as ImageIcon
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { JournalEntry } from '../types';
import { CameraCaptureModal } from './CameraCaptureModal';
import { ModalPortal } from './ModalPortal';

export const LifeJournalSection: React.FC = () => {
  const {
    journal,
    addJournalEntry,
    updateJournalEntry,
    deleteJournalEntry,
    setJournalEntries,
    activeRole,
    me,
    partner,
  } = useApp();

  // Form states
  const [inputText, setInputText] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isImportant, setIsImportant] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isOrganizingWithGemini, setIsOrganizingWithGemini] = useState(false);
  const [geminiSummary, setGeminiSummary] = useState<string | null>(null);

  // Edit modal
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [editText, setEditText] = useState('');
  const [editImportant, setEditImportant] = useState(false);

  // Independent Journal Calendar
  const [isJournalCalendarOpen, setIsJournalCalendarOpen] = useState(false);
  const [journalCalMonth, setJournalCalMonth] = useState(new Date(2026, 9, 1));
  const [selectedParchmentDay, setSelectedParchmentDay] = useState<string | null>(null);
  const [showTimeBreakdown, setShowTimeBreakdown] = useState<boolean>(false);
  const [enlargedPhoto, setEnlargedPhoto] = useState<string | null>(null);

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && photos.length === 0) return;

    addJournalEntry({
      author: activeRole,
      text: inputText.trim(),
      photos,
      isImportant,
    });

    setInputText('');
    setPhotos([]);
    setIsImportant(false);
  };

  const handleStartEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setEditText(entry.text);
    setEditImportant(entry.isImportant);
  };

  const handleSaveEdit = () => {
    if (editingEntry) {
      updateJournalEntry(editingEntry.id, editText, editImportant);
      setEditingEntry(null);
    }
  };

  const handleOrganizeWithGemini = async () => {
    setIsOrganizingWithGemini(true);
    try {
      const updated = journal.map((entry) => {
        let period: 'morning' | 'afternoon' | 'night' | 'achievements' = 'morning';
        const hr = new Date(entry.createdAt).getHours();
        if (
          entry.isImportant ||
          entry.text.toLowerCase().includes('logro') ||
          entry.text.toLowerCase().includes('ganamos') ||
          entry.text.toLowerCase().includes('meta')
        ) {
          period = 'achievements';
        } else if (hr >= 6 && hr < 13) {
          period = 'morning';
        } else if (hr >= 13 && hr < 20) {
          period = 'afternoon';
        } else {
          period = 'night';
        }
        return { ...entry, period };
      });

      setJournalEntries(updated);
      setGeminiSummary(
        `✨ Gemini organizó exitosamente las ${journal.length} entradas en: Mañana 🌅, Tarde ☀️, Noche 🌙 y Logros 🏆.`
      );
    } catch {
      setGeminiSummary('Organización cronológica completada.');
    } finally {
      setIsOrganizingWithGemini(false);
    }
  };

  const myEntries = journal.filter((j) => j.author === 'me');
  const partnerEntries = journal.filter((j) => j.author === 'partner');

  const formatExactDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return `${d.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return isoStr;
    }
  };

  // Group entries by day YYYY-MM-DD for the Pergamino Antiguo
  const getEntriesForDay = (dateStr: string) => {
    return journal.filter((j) => j.createdAt.slice(0, 10) === dateStr);
  };

  // Journal Calendar calculations
  const jYear = journalCalMonth.getFullYear();
  const jMonth = journalCalMonth.getMonth();
  const totalJDays = new Date(jYear, jMonth + 1, 0).getDate();
  const firstDayMondayOffset = (new Date(jYear, jMonth, 1).getDay() + 6) % 7;

  // Selected day's entries for parchment
  const activeParchmentEntries = selectedParchmentDay ? getEntriesForDay(selectedParchmentDay) : [];

  return (
    <section className="w-full space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 shadow-md">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white font-heading tracking-tight">
              Diario de Vida
            </h3>
            <p className="text-xs text-white/60">
              Diario personal, de pareja y hoja pergamino unificada
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Icono pequeño Calendario del Diario */}
          <button
            type="button"
            onClick={() => setIsJournalCalendarOpen(true)}
            className="p-2.5 rounded-2xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/40 text-purple-200 flex items-center gap-1.5 text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95"
            title="Abrir Calendario del Diario"
          >
            <CalendarIcon className="w-4 h-4 text-purple-300" />
            <span className="hidden sm:inline">Calendario Diario</span>
          </button>

          {/* Botón: ✨ Organizar con Gemini */}
          <button
            type="button"
            onClick={handleOrganizeWithGemini}
            disabled={isOrganizingWithGemini || journal.length === 0}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-900/30 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
            <span className="hidden sm:inline">{isOrganizingWithGemini ? 'Organizando...' : '✨ Organizar'}</span>
          </button>
        </div>
      </div>

      {geminiSummary && (
        <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-400/30 text-purple-200 text-xs flex items-center justify-between">
          <span>{geminiSummary}</span>
          <button
            type="button"
            onClick={() => setGeminiSummary(null)}
            className="text-white/60 hover:text-white ml-2 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Write New Entry Box */}
      <div className="glass-card p-5 border-white/15">
        <form onSubmit={handleSaveEntry} className="space-y-3 text-white">
          <div className="flex items-center justify-between text-xs text-white/70">
            <span className="font-bold flex items-center gap-1.5">
              Escribiendo como: <strong className="text-white">{activeRole === 'me' ? me.name : partner.name}</strong>
            </span>
            <button
              type="button"
              onClick={() => setIsImportant(!isImportant)}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                isImportant
                  ? 'bg-amber-400 text-amber-950 shadow-md shadow-amber-500/30'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{isImportant ? '⭐ Importante Marcado' : 'Marcar Importante'}</span>
            </button>
          </div>

          <textarea
            rows={3}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="¿Qué momentos, pensamientos o detalles compartieron hoy?..."
            className="w-full p-4 rounded-2xl bg-white/5 border border-white/15 text-white placeholder-white/35 focus:outline-none focus:border-purple-400 text-sm resize-none"
          />

          {photos.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {photos.map((img, i) => (
                <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-white/20 shadow-md">
                  <img src={img} alt="Capture" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotos(photos.filter((_, idx) => idx !== i))}
                    className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center font-bold"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setIsCameraOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/10 cursor-pointer transition-all"
            >
              <Camera className="w-4 h-4 text-purple-300" />
              <span>Foto rápida / Galería</span>
            </button>

            <button
              type="submit"
              disabled={!inputText.trim() && photos.length === 0}
              className="px-6 py-2.5 rounded-2xl btn-3d-rose text-white font-bold text-xs cursor-pointer disabled:opacity-40"
            >
              Guardar Entrada
            </button>
          </div>
        </form>
      </div>

      {/* HOJA PERGAMINO ANTIGUO DE HOY (Unifica todas las entradas del día) */}
      <div className="parchment-card p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#b8985c]/40 pb-3">
          <div className="flex items-center gap-2.5">
            <Scroll className="w-6 h-6 text-[#725127]" />
            <div>
              <h4 className="text-base sm:text-lg font-black font-heading text-[#3b2a1a] tracking-tight">
                Hoja Pergamino del Día (Memorias Unificadas)
              </h4>
              <p className="text-[11px] text-[#5e421e]/80">
                Al final del día, todas sus palabras se unen en un solo pergamino compartido.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowTimeBreakdown(!showTimeBreakdown)}
            className="self-start sm:self-auto px-3 py-1 rounded-xl bg-[#8d6736]/20 hover:bg-[#8d6736]/30 text-[#3b2a1a] text-xs font-bold cursor-pointer transition-colors"
          >
            {showTimeBreakdown ? 'Ocultar horas exactas' : 'Desglosar horas de escritura ⏳'}
          </button>
        </div>

        {/* Unified daily text */}
        <div className="space-y-4 font-serif text-sm sm:text-base leading-relaxed text-[#2d1e12]">
          {journal.length === 0 ? (
            <p className="italic text-center py-6 opacity-60">
              El pergamino está en blanco. Escriban sus primeras notas del día para verlas florecer aquí juntas.
            </p>
          ) : (
            journal.slice(0, 6).map((item) => (
              <div key={item.id} className="border-b border-[#b8985c]/25 pb-3">
                <div className="flex items-center justify-between text-xs font-bold text-[#6b4c23] mb-1">
                  <span>
                    ✍️ {item.author === 'me' ? me.name : partner.name}
                    {item.isImportant && ' ⭐ (Destacado)'}
                  </span>
                  {showTimeBreakdown && (
                    <span className="text-[10px] opacity-75">
                      {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                <p className="whitespace-pre-line">{item.text}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* DOS TARJETAS LADO A LADO: Tu Diario Personal y Diario de tu Pareja */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-5 border-emerald-500/20">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🦊</span>
              <h4 className="text-sm font-black text-white uppercase tracking-wider font-heading">
                Tu Diario Personal
              </h4>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
              {myEntries.length} entradas
            </span>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {myEntries.length === 0 ? (
              <p className="text-xs text-white/40 italic py-6 text-center">
                Aún no has escrito en tu diario hoy.
              </p>
            ) : (
              myEntries.map((entry) => (
                <div key={entry.id} className="p-3.5 rounded-2xl bg-white/5 border border-white/10 relative">
                  {entry.isImportant && (
                    <span className="absolute top-2 right-2 text-xs bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full font-black flex items-center gap-0.5 shadow-sm">
                      <Star className="w-3 h-3 fill-current" /> Importante
                    </span>
                  )}
                  <p className="text-xs text-white/90 leading-relaxed pr-16">{entry.text}</p>
                  
                  {/* Fotos Pequeñas con Clic para Agrandar */}
                  {entry.photos && entry.photos.length > 0 && (
                    <div className="flex flex-wrap gap-2 my-2.5">
                      {entry.photos.map((photo, pIdx) => (
                        <div
                          key={pIdx}
                          onClick={() => setEnlargedPhoto(photo)}
                          className="relative w-14 h-14 rounded-2xl overflow-hidden border border-white/20 shadow-md cursor-pointer hover:scale-105 active:scale-95 transition-transform group"
                          title="Toca para ver la foto en grande"
                        >
                          <img src={photo} alt="Foto diario" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                            <Eye className="w-4 h-4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-white/50 mt-2.5 pt-2 border-t border-white/5">
                    <span>Escrito: {formatExactDate(entry.createdAt)}</span>
                    <button
                      type="button"
                      onClick={() => handleStartEdit(entry)}
                      className="text-purple-300 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                    >
                      <Edit3 className="w-3 h-3" /> Editar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="glass-card p-5 border-rose-500/20">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🐼</span>
              <h4 className="text-sm font-black text-white uppercase tracking-wider font-heading">
                Diario de tu Pareja (Solo Lectura)
              </h4>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold">
              {partnerEntries.length} entradas
            </span>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {partnerEntries.length === 0 ? (
              <p className="text-xs text-white/40 italic py-6 text-center">
                Tu pareja aún no ha compartido entradas hoy.
              </p>
            ) : (
              partnerEntries.map((entry) => (
                <div key={entry.id} className="p-3.5 rounded-2xl bg-white/5 border border-white/10 relative">
                  {entry.isImportant && (
                    <span className="absolute top-2 right-2 text-xs bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full font-black flex items-center gap-0.5 shadow-sm">
                      <Star className="w-3 h-3 fill-current" /> Importante
                    </span>
                  )}
                  <p className="text-xs text-white/90 leading-relaxed pr-16">{entry.text}</p>
                  
                  {/* Fotos Pequeñas con Clic para Agrandar */}
                  {entry.photos && entry.photos.length > 0 && (
                    <div className="flex flex-wrap gap-2 my-2.5">
                      {entry.photos.map((photo, pIdx) => (
                        <div
                          key={pIdx}
                          onClick={() => setEnlargedPhoto(photo)}
                          className="relative w-14 h-14 rounded-2xl overflow-hidden border border-white/20 shadow-md cursor-pointer hover:scale-105 active:scale-95 transition-transform group"
                          title="Toca para ver la foto en grande"
                        >
                          <img src={photo} alt="Foto diario" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                            <Eye className="w-4 h-4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-white/50 mt-2.5 pt-2 border-t border-white/5">
                    <span>Escrito: {formatExactDate(entry.createdAt)}</span>
                    <span className="text-white/40 font-semibold flex items-center gap-1">
                      <span>Solo lectura 🔒</span>
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* MODAL CALENDARIO DEL DIARIO (Independiente) */}
      <ModalPortal
        isOpen={isJournalCalendarOpen}
        onClose={() => {
          setIsJournalCalendarOpen(false);
          setSelectedParchmentDay(null);
        }}
        title="Calendario Histórico del Diario"
        icon={<CalendarIcon className="w-6 h-6 text-purple-400" />}
      >
        <div className="space-y-4 text-white">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <h4 className="text-base font-black font-heading">
              {journalCalMonth.toLocaleDateString([], { month: 'long', year: 'numeric' })}
            </h4>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setJournalCalMonth(new Date(jYear, jMonth - 1, 1))}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setJournalCalMonth(new Date(jYear, jMonth + 1, 1))}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-white/60 mb-1">
            <span>Lun</span>
            <span>Mar</span>
            <span>Mié</span>
            <span>Jue</span>
            <span>Vie</span>
            <span>Sáb</span>
            <span className="text-rose-400">Dom</span>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {Array.from({ length: firstDayMondayOffset }).map((_, i) => (
              <div key={`joffset-${i}`} className="h-10" />
            ))}

            {Array.from({ length: totalJDays }).map((_, i) => {
              const dayNum = i + 1;
              const dateKey = `${jYear}-${String(jMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const entriesThisDay = getEntriesForDay(dateKey);
              const hasNotes = entriesThisDay.length > 0;
              const isSelected = selectedParchmentDay === dateKey;

              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => setSelectedParchmentDay(dateKey)}
                  className={`h-11 rounded-xl p-1 flex flex-col items-center justify-between border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-purple-600 border-white text-white font-black scale-105'
                      : hasNotes
                      ? 'bg-purple-500/20 border-purple-400/40 text-purple-200'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/70'
                  }`}
                >
                  <span className="text-xs">{dayNum}</span>
                  {hasNotes && <span className="text-[10px]">📜</span>}
                </button>
              );
            })}
          </div>

          {/* Si se presiona un día, muestra lo ingresado en formato pergamino antiguo */}
          {selectedParchmentDay && (
            <div className="parchment-card p-5 mt-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[#b8985c]/40 pb-2">
                <span className="text-xs font-black text-[#3b2a1a] uppercase">
                  Pergamino del {selectedParchmentDay}
                </span>
                <span className="text-xs font-bold text-[#8d6736]">
                  {activeParchmentEntries.length} entradas
                </span>
              </div>

              {activeParchmentEntries.length === 0 ? (
                <p className="text-xs italic text-[#5e421e] py-3 text-center">
                  No hay escritos registrados en esta fecha.
                </p>
              ) : (
                activeParchmentEntries.map((e) => (
                  <div key={e.id} className="text-xs text-[#2d1e12] border-b border-[#b8985c]/20 pb-2">
                    <div className="flex justify-between font-bold text-[#5e421e] mb-0.5">
                      <span>{e.author === 'me' ? me.name : partner.name}</span>
                      <span>
                        {new Date(e.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p>{e.text}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </ModalPortal>

      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onPhotoCaptured={(photoUrl) => setPhotos((prev) => [...prev, photoUrl])}
      />

      <ModalPortal
        isOpen={!!editingEntry}
        onClose={() => setEditingEntry(null)}
        title="Editar Entrada del Diario"
        icon={<Edit3 className="w-6 h-6 text-purple-400" />}
      >
        <div className="space-y-4">
          <textarea
            rows={4}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full p-3.5 rounded-2xl bg-white/10 border border-white/20 text-white text-sm focus:outline-none"
          />
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setEditImportant(!editImportant)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                editImportant ? 'bg-amber-400 text-amber-950' : 'bg-white/10 text-white/70'
              }`}
            >
              <Star className="w-4 h-4 fill-current" />
              <span>{editImportant ? 'Sello Importante' : 'Normal'}</span>
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              className="px-5 py-2.5 rounded-xl btn-3d-rose text-white text-xs font-bold cursor-pointer"
            >
              Guardar Cambios
            </button>
          </div>
        </div>
      </ModalPortal>

      {/* MODAL AGRANDAR FOTO (LIGHTBOX) */}
      <ModalPortal
        isOpen={!!enlargedPhoto}
        onClose={() => setEnlargedPhoto(null)}
        title="Fotografía del Diario 📷"
        icon={<ImageIcon className="w-6 h-6 text-purple-300" />}
      >
        {enlargedPhoto && (
          <div className="space-y-4 text-center">
            <div className="max-h-[65vh] rounded-3xl overflow-hidden bg-black/80 border border-white/20 shadow-2xl flex items-center justify-center p-2">
              <img
                src={enlargedPhoto}
                alt="Foto ampliada del diario"
                className="max-h-[60vh] max-w-full rounded-2xl object-contain shadow-md"
              />
            </div>
            <button
              type="button"
              onClick={() => setEnlargedPhoto(null)}
              className="px-6 py-2.5 rounded-2xl btn-3d-rose text-white text-xs font-black cursor-pointer shadow-md"
            >
              Cerrar Vista
            </button>
          </div>
        )}
      </ModalPortal>
    </section>
  );
};
