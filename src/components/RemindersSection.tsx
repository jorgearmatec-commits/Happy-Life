import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  Plus,
  CheckCircle2,
  Clock,
  Lock,
  Users,
  Volume2,
  Calendar,
  Trash2,
  CheckSquare,
  FileText,
  Upload,
  CalendarCheck,
  Check,
  X,
  Edit3
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ReminderNote, ReminderCategory, NoteColor, SoundTone, ChecklistItem } from '../types';
import { playTone } from './AudioSynthesizer';
import { ModalPortal } from './ModalPortal';

const EXACT_CATEGORIES: { name: ReminderCategory; icon: string }[] = [
  { name: 'Despertarse', icon: '⏰' },
  { name: 'Pastillas', icon: '💊' },
  { name: 'Hacer aseo', icon: '🧹' },
  { name: 'Cocinar', icon: '🍳' },
  { name: 'Salir', icon: '🚪' },
  { name: 'Sacar al perro', icon: '🐕' },
  { name: 'Lavar dientes', icon: '🪥' },
  { name: 'Crema', icon: '🧴' },
  { name: 'Bañarse', icon: '🛁' },
  { name: 'Personalizado', icon: '📝' },
];

// Color Notes styles with new requested colors: burdeo, rojo, azul, negro + classics
const COLOR_SCHEMES: Record<NoteColor, { bg: string; text: string; border: string; glow: string }> = {
  yellow: { bg: 'bg-[#fef08a]', text: 'text-amber-950', border: 'border-amber-300', glow: 'shadow-amber-500/20' },
  pink: { bg: 'bg-[#fbcfe8]', text: 'text-pink-950', border: 'border-pink-300', glow: 'shadow-pink-500/20' },
  mint: { bg: 'bg-[#a7f3d0]', text: 'text-emerald-950', border: 'border-emerald-300', glow: 'shadow-emerald-500/20' },
  sky: { bg: 'bg-[#bae6fd]', text: 'text-sky-950', border: 'border-sky-300', glow: 'shadow-sky-500/20' },
  lavender: { bg: 'bg-[#e9d5ff]', text: 'text-purple-950', border: 'border-purple-300', glow: 'shadow-purple-500/20' },
  peach: { bg: 'bg-[#fed7aa]', text: 'text-orange-950', border: 'border-orange-300', glow: 'shadow-orange-500/20' },
  bordeaux: { bg: 'bg-[#5e0d1b]', text: 'text-rose-100', border: 'border-rose-700', glow: 'shadow-rose-950/40' },
  red: { bg: 'bg-[#dc2626]', text: 'text-white', border: 'border-red-400', glow: 'shadow-red-600/30' },
  blue: { bg: 'bg-[#1d4ed8]', text: 'text-white', border: 'border-blue-400', glow: 'shadow-blue-600/30' },
  black: { bg: 'bg-[#171717]', text: 'text-white', border: 'border-neutral-600', glow: 'shadow-black/50' },
};

const TIME_PRESETS = [
  { label: '10m', val: 10 },
  { label: '20m', val: 20 },
  { label: '30m', val: 30 },
  { label: '45m', val: 45 },
  { label: '1h', val: 60 },
  { label: '2h', val: 120 },
  { label: '4h', val: 240 },
  { label: '8h', val: 480 },
  { label: '12h', val: 720 },
];

export const RemindersSection: React.FC = () => {
  const {
    reminders,
    addReminder,
    updateReminder,
    toggleReminderDone,
    toggleChecklistItem,
    deleteReminder,
    activeRole,
    me,
    partner,
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [noteType, setNoteType] = useState<'normal' | 'checklist'>('normal');

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ReminderCategory>('Pastillas');
  const [minutes, setMinutes] = useState<number>(30);
  const [useSpecificDateTime, setUseSpecificDateTime] = useState<boolean>(false);
  const [specificDateTime, setSpecificDateTime] = useState<string>('');
  const [color, setColor] = useState<NoteColor>('yellow');
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [tone, setTone] = useState<SoundTone>('google_chime');
  const [customToneName, setCustomToneName] = useState<string>('');
  const [customToneData, setCustomToneData] = useState<string>('');

  // Editing state for existing notes
  const [editingNote, setEditingNote] = useState<ReminderNote | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<ReminderCategory>('Pastillas');
  const [editMinutes, setEditMinutes] = useState(30);
  const [editUseSpecific, setEditUseSpecific] = useState(false);
  const [editSpecificDateTime, setEditSpecificDateTime] = useState('');
  const [editColor, setEditColor] = useState<NoteColor>('yellow');
  const [editIsPrivate, setEditIsPrivate] = useState(false);
  const [editTone, setEditTone] = useState<SoundTone>('google_chime');
  const [editChecklistItems, setEditChecklistItems] = useState<ChecklistItem[]>([]);

  // Checklist items
  const [checklistItems, setChecklistItems] = useState<{ id: string; text: string; completed: boolean }[]>([
    { id: '1', text: '', completed: false },
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenEdit = (note: ReminderNote) => {
    setEditingNote(note);
    setEditTitle(note.title);
    setEditCategory(note.category);
    setEditMinutes(note.minutes || 30);
    setEditUseSpecific(!!note.specificDateTime);
    setEditSpecificDateTime(note.specificDateTime || '');
    setEditColor(note.color);
    setEditIsPrivate(note.isPrivate);
    setEditTone(note.tone);
    setEditChecklistItems(note.checklistItems ? [...note.checklistItems] : []);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNote || !editTitle.trim()) return;

    let computedDueTime = editingNote.dueTime;
    if (editUseSpecific && editSpecificDateTime) {
      computedDueTime = new Date(editSpecificDateTime).toISOString();
    } else if (editMinutes) {
      computedDueTime = new Date(Date.now() + editMinutes * 60000).toISOString();
    }

    updateReminder(editingNote.id, {
      title: editTitle.trim(),
      category: editCategory,
      minutes: editMinutes,
      specificDateTime: editUseSpecific ? editSpecificDateTime : undefined,
      dueTime: computedDueTime,
      color: editColor,
      isPrivate: editIsPrivate,
      tone: editTone,
      checklistItems: editingNote.isChecklist ? editChecklistItems.filter((i) => i.text.trim()) : undefined,
    });

    setEditingNote(null);
  };

  const handleAddChecklistRow = () => {
    setChecklistItems((prev) => [...prev, { id: String(Date.now()), text: '', completed: false }]);
  };

  const handleRemoveChecklistRow = (id: string) => {
    setChecklistItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleChecklistTextChange = (id: string, text: string) => {
    setChecklistItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, text } : i))
    );
  };

  // Upload custom phone sound
  const handleCustomAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setCustomToneName(file.name);
          setCustomToneData(ev.target.result as string);
          setTone('custom');
          playTone('custom', ev.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const openGoogleCalendar = (note: ReminderNote) => {
    const startTime = new Date(note.dueTime);
    const endTime = new Date(startTime.getTime() + 30 * 60000);
    const formatGCDate = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');

    const details = note.isChecklist && note.checklistItems
      ? `Lista de tareas:\n${note.checklistItems.map((i) => `[${i.completed ? 'X' : ' '}] ${i.text}`).join('\n')}`
      : `Recordatorio de Happy Life Duo [${note.category}]`;

    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      note.title
    )}&details=${encodeURIComponent(details)}&dates=${formatGCDate(startTime)}/${formatGCDate(endTime)}`;
    window.open(url, '_blank');
  };

  const handleCreateReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let dueTimeIso: string;
    if (useSpecificDateTime && specificDateTime) {
      dueTimeIso = new Date(specificDateTime).toISOString();
    } else {
      dueTimeIso = new Date(Date.now() + minutes * 60000).toISOString();
    }

    const filteredChecklist = checklistItems
      .filter((i) => i.text.trim().length > 0)
      .map((i) => ({ ...i, text: i.text.trim() }));

    addReminder({
      title: title.trim(),
      category,
      minutes,
      dueTime: dueTimeIso,
      specificDateTime: useSpecificDateTime ? specificDateTime : undefined,
      color,
      isPrivate,
      tone,
      customToneName: tone === 'custom' ? customToneName : undefined,
      customToneData: tone === 'custom' ? customToneData : undefined,
      createdBy: activeRole,
      isChecklist: noteType === 'checklist',
      checklistItems: noteType === 'checklist' ? filteredChecklist : undefined,
    });

    // Reset
    setTitle('');
    setChecklistItems([{ id: '1', text: '', completed: false }]);
    setCustomToneName('');
    setCustomToneData('');
    setIsModalOpen(false);
  };

  return (
    <section className="w-full space-y-5">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-amber-400/20 border border-amber-300/30 flex items-center justify-center text-amber-300 shadow-md">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white font-heading tracking-tight">
              Recordatorios y Notas
            </h3>
            <p className="text-xs text-white/60">
              Color Notes y Listas de Tareas tipo Pergamino
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl btn-3d-rose text-white text-xs font-bold cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Nota</span>
        </button>
      </div>

      {/* Grid of Notes */}
      {reminders.length === 0 ? (
        <div className="glass-card-subtle p-8 text-center text-white/50 text-sm">
          No hay recordatorios pendientes. ¡Crea el primero o una lista tipo pergamino! 📝
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <AnimatePresence>
            {reminders.map((note) => {
              const isParchment = note.isChecklist;
              const scheme = COLOR_SCHEMES[note.color] || COLOR_SCHEMES.yellow;
              const creatorName = note.createdBy === 'me' ? me.name : partner.name;

              if (note.isPrivate && note.createdBy !== activeRole) {
                return null;
              }

              return (
                <motion.div
                  key={note.id}
                  layout
                  initial={{ opacity: 0, y: -20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  className={`p-4 flex flex-col justify-between transition-all select-none ${
                    isParchment
                      ? 'parchment-card text-[#2d1e12]'
                      : `${scheme.bg} ${scheme.text} rounded-3xl border-2 ${scheme.border} shadow-lg ${scheme.glow}`
                  }`}
                >
                  <div>
                    {/* Top Bar: Category badge, Privacy */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span
                        className={`text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          isParchment ? 'bg-[#b8985c]/20 text-[#4a3521]' : 'bg-black/10'
                        }`}
                      >
                        {isParchment ? '📜 Pergamino Check-List' : note.category}
                      </span>
                      <div className="flex items-center gap-1">
                        {note.isPrivate ? (
                          <span className="text-[10px] font-bold flex items-center gap-0.5 bg-black/10 px-1.5 py-0.5 rounded-md">
                            <Lock className="w-3 h-3" /> Solo mía
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold flex items-center gap-0.5 bg-black/10 px-1.5 py-0.5 rounded-md">
                            <Users className="w-3 h-3" /> Compartida
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Note Title */}
                    <h4
                      className={`text-sm font-black leading-snug ${
                        note.completed ? 'line-through opacity-60' : ''
                      }`}
                    >
                      {note.title}
                    </h4>

                    {/* CHECK-LIST ITEMS (si es tipo pergamino) */}
                    {isParchment && note.checklistItems && (
                      <div className="my-3 space-y-1.5 border-t border-b border-[#b8985c]/30 py-2">
                        {note.checklistItems.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => toggleChecklistItem(note.id, item.id)}
                            className="flex items-center gap-2 text-xs font-semibold cursor-pointer hover:opacity-80 transition-opacity"
                          >
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                item.completed
                                  ? 'bg-[#8d6736] border-[#5e421e] text-white'
                                  : 'border-[#8d6736]/60 bg-white/40'
                              }`}
                            >
                              {item.completed && <Check className="w-3 h-3" />}
                            </div>
                            <span
                              className={`line-clamp-1 ${
                                item.completed ? 'line-through opacity-50' : 'text-[#3b2a1a]'
                              }`}
                            >
                              {item.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Time details */}
                    <div className="flex items-center gap-1.5 text-[10px] font-bold opacity-75 mt-1">
                      <Clock className="w-3 h-3" />
                      <span>
                        Aviso:{' '}
                        {new Date(note.dueTime).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Actions */}
                  <div
                    className={`flex items-center justify-between gap-1.5 mt-3 pt-2 border-t ${
                      isParchment ? 'border-[#b8985c]/30' : 'border-black/10'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleReminderDone(note.id)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-black text-xs transition-all active:scale-90 cursor-pointer shadow-sm ${
                        note.completed
                          ? 'bg-emerald-600 text-white'
                          : isParchment
                          ? 'bg-[#8d6736] text-white hover:bg-[#725127]'
                          : 'bg-black/15 hover:bg-black/25 text-inherit'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{note.completed ? '¡COMPLETO!' : 'HECHO'}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(note);
                        }}
                        className="p-1.5 rounded-lg bg-black/10 hover:bg-black/20 text-inherit cursor-pointer"
                        title="Editar nota"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          playTone(note.tone, note.customToneData);
                        }}
                        className="p-1.5 rounded-lg bg-black/10 hover:bg-black/20 text-inherit cursor-pointer"
                        title={`Probar tono (${note.customToneName || note.tone})`}
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openGoogleCalendar(note);
                        }}
                        className="p-1.5 rounded-lg bg-black/10 hover:bg-black/20 text-inherit cursor-pointer"
                        title="Agregar a Google Calendar"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteReminder(note.id);
                        }}
                        className="p-1.5 rounded-lg bg-black/10 hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* MODAL: NUEVA NOTA O CHECK-LIST */}
      <ModalPortal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Crear Nota o Check-List"
        icon={<Bell className="w-6 h-6 text-amber-400" />}
      >
        <form onSubmit={handleCreateReminder} className="space-y-4 text-white">
          {/* Selector de Tipo de Nota: Normal vs Check-List tipo Pergamino */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-white/5 border border-white/10">
            <button
              type="button"
              onClick={() => setNoteType('normal')}
              className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                noteType === 'normal' ? 'bg-amber-400 text-amber-950 font-black shadow-md' : 'text-white/60'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Color Note Normal</span>
            </button>

            <button
              type="button"
              onClick={() => setNoteType('checklist')}
              className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                noteType === 'checklist' ? 'bg-[#e2cd94] text-[#3b2a1a] font-black shadow-md' : 'text-white/60'
              }`}
            >
              <CheckSquare className="w-4 h-4 text-[#8d6736]" />
              <span>Check-List Pergamino 📜</span>
            </button>
          </div>

          {/* Título de la Nota */}
          <div>
            <label className="block text-xs font-bold text-white/80 uppercase tracking-wider mb-1.5">
              {noteType === 'checklist' ? 'Título de la Lista (ej. Compras de Supermercado):' : 'Título del recordatorio:'}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={noteType === 'checklist' ? 'Lista de supermercado, tareas de casa...' : 'Ej. Tomar 1 comprimido con agua...'}
              className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-amber-400 text-sm font-semibold"
            />
          </div>

          {/* Items de Check-List si es tipo Pergamino */}
          {noteType === 'checklist' && (
            <div className="p-3.5 rounded-2xl bg-black/40 border border-[#b8985c]/40 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-amber-200">
                <span>Elementos de la lista para tachar:</span>
                <button
                  type="button"
                  onClick={handleAddChecklistRow}
                  className="px-2.5 py-1 rounded-lg bg-[#b8985c] text-[#2d1e12] font-black hover:bg-[#d4b16c] cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir ítem</span>
                </button>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {checklistItems.map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <span className="text-xs text-white/50">{idx + 1}.</span>
                    <input
                      type="text"
                      value={item.text}
                      onChange={(e) => handleChecklistTextChange(item.id, e.target.value)}
                      placeholder="Ítem o tarea a completar..."
                      className="flex-1 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder-white/30 focus:outline-none"
                    />
                    {checklistItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveChecklistRow(item.id)}
                        className="text-red-400 hover:text-red-300 p-1 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Categoría */}
          <div>
            <label className="block text-xs font-bold text-white/80 uppercase tracking-wider mb-1.5">
              Categoría:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {EXACT_CATEGORIES.map((cat) => (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setCategory(cat.name)}
                  className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    category === cat.name
                      ? 'bg-amber-400/20 border-amber-300 text-amber-300'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span className="truncate">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tiempo de aviso: Presets, Slider continuo O Fecha/Hora Concreta */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white/90">Programar tiempo de aviso:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setUseSpecificDateTime(false)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    !useSpecificDateTime ? 'bg-amber-400 text-amber-950' : 'text-white/50'
                  }`}
                >
                  En X minutos
                </button>
                <button
                  type="button"
                  onClick={() => setUseSpecificDateTime(true)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    useSpecificDateTime ? 'bg-amber-400 text-amber-950' : 'text-white/50'
                  }`}
                >
                  Fecha y Hora exacta 📅
                </button>
              </div>
            </div>

            {useSpecificDateTime ? (
              <div>
                <label className="block text-[11px] text-white/70 mb-1">
                  Elige la fecha y hora concreta de la alarma:
                </label>
                <input
                  type="datetime-local"
                  required={useSpecificDateTime}
                  value={specificDateTime}
                  onChange={(e) => setSpecificDateTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/20 text-white text-xs focus:outline-none"
                />
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-white/70">Aviso en:</span>
                  <span className="font-bold text-amber-300">
                    {minutes >= 60 ? `${(minutes / 60).toFixed(1)} horas (${minutes} min)` : `${minutes} minutos`}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {TIME_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setMinutes(p.val)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        minutes === p.val
                          ? 'bg-amber-400 text-amber-950 border-amber-400'
                          : 'bg-white/5 text-white/80 border-white/10'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <input
                  type="range"
                  min="10"
                  max="720"
                  step="5"
                  value={minutes}
                  onChange={(e) => setMinutes(Number(e.target.value))}
                  className="w-full h-2.5 bg-white/15 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
              </div>
            )}
          </div>

          {/* Colores (incluyendo burdeo, rojo, azul y negro) */}
          {noteType === 'normal' && (
            <div>
              <label className="block text-xs font-bold text-white/80 uppercase tracking-wider mb-1.5">
                Color de la Nota Adhesiva (10 Opciones):
              </label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(COLOR_SCHEMES) as NoteColor[]).map((cKey) => {
                  const scheme = COLOR_SCHEMES[cKey];
                  return (
                    <button
                      key={cKey}
                      type="button"
                      onClick={() => setColor(cKey)}
                      className={`w-8 h-8 rounded-xl ${scheme.bg} border-2 transition-transform cursor-pointer shadow-md ${
                        color === cKey ? 'scale-110 border-white ring-2 ring-amber-400' : 'border-transparent'
                      }`}
                      title={cKey}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Sonidos y Tonos (Google Chimes, Polifónicos y Tonos propios del teléfono) */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-white/90 flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-cyan-400" /> Tono de Alarma
              </label>
              <button
                type="button"
                onClick={() => playTone(tone, customToneData)}
                className="text-xs text-cyan-300 hover:underline cursor-pointer font-bold"
              >
                Probar sonido 🔊
              </button>
            </div>

            <select
              value={tone}
              onChange={(e) => {
                const newTone = e.target.value as SoundTone;
                setTone(newTone);
                setTimeout(() => {
                  try {
                    playTone(newTone, customToneData);
                  } catch (err) {
                    console.warn(err);
                  }
                }, 100);
              }}
              className="w-full p-2.5 rounded-xl bg-black/50 text-white border border-white/20 text-xs focus:outline-none"
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
                <option value="digital_pulse">Pulso Digital Clásico ⏰</option>
                <option value="ocean_waves">Olas del Océano Relajantes 🌊</option>
                <option value="forest_sunrise">Amanecer con Pájaros Cantores 🐦</option>
                <option value="tibetan_singing_bowls">Cuencos Tibetanos de Larga Resonancia 🧘</option>
                <option value="romantic_piano">Piano Romántico Cálido 🎹</option>
                <option value="energetic_marimba">Marimba Alegre Rítmica 🥁</option>
                <option value="space_odyssey">Odisea Espacial Cósmica 🚀</option>
                <option value="clock_bell_tower">Campanadas de Torre de Reloj 🏛️</option>
                <option value="peaceful_chime">Campanas de Viento Pacíficas 🎐</option>
                <option value="zen_bowl">Cuenco Tibetano Zen 🧘</option>
                <option value="harpa">Arpa Dulce 🎶</option>
              </optgroup>
              <optgroup label="Clásicos Teléfono">
                <option value="samsung">Samsung Over the Horizon</option>
                <option value="huawei">Huawei Marimba</option>
                <option value="nokia">Nokia Polifónico</option>
                <option value="water">Gota de Agua Dulce 💧</option>
              </optgroup>
              {customToneName && <option value="custom">Tono del Teléfono ({customToneName})</option>}
            </select>

            {/* Cargar tonos propios del teléfono */}
            <div className="pt-1 flex items-center justify-between">
              <span className="text-[11px] text-white/60">¿Usar tono propio de tu celular?</span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-cyan-300" />
                <span>Elegir archivo audio</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={handleCustomAudioUpload}
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl btn-3d-rose text-white font-bold text-sm cursor-pointer shadow-lg"
            >
              Guardar Nota
            </button>
          </div>
        </form>
      </ModalPortal>

      {/* MODAL: EDITAR NOTA EXISTENTE (AL PRESIONARLA) */}
      <ModalPortal
        isOpen={!!editingNote}
        onClose={() => setEditingNote(null)}
        title="Editar Nota / Recordatorio ✏️"
        icon={<Edit3 className="w-6 h-6 text-amber-400" />}
      >
        {editingNote && (
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-white/80 uppercase tracking-wider mb-1.5">
                Título del recordatorio:
              </label>
              <input
                type="text"
                required
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-amber-400 text-sm font-semibold"
              />
            </div>

            {/* Checklist items si es tipo checklist */}
            {editingNote.isChecklist && (
              <div className="p-3.5 rounded-2xl bg-black/40 border border-[#b8985c]/40 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-amber-200">
                  <span>Ítems de la lista para tachar:</span>
                  <button
                    type="button"
                    onClick={() =>
                      setEditChecklistItems((prev) => [
                        ...prev,
                        { id: String(Date.now()), text: '', completed: false },
                      ])
                    }
                    className="px-2.5 py-1 rounded-lg bg-[#b8985c] text-[#2d1e12] font-black hover:bg-[#d4b16c] cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Añadir ítem</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {editChecklistItems.map((item, idx) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <span className="text-xs text-white/50">{idx + 1}.</span>
                      <input
                        type="text"
                        value={item.text}
                        onChange={(e) =>
                          setEditChecklistItems((prev) =>
                            prev.map((i) => (i.id === item.id ? { ...i, text: e.target.value } : i))
                          )
                        }
                        placeholder="Ítem o tarea..."
                        className="flex-1 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setEditChecklistItems((prev) => prev.filter((i) => i.id !== item.id))
                        }
                        className="text-red-400 hover:text-red-300 p-1 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Categoría */}
            <div>
              <label className="block text-xs font-bold text-white/80 uppercase tracking-wider mb-1.5">
                Categoría:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {EXACT_CATEGORIES.map((cat) => (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => setEditCategory(cat.name)}
                    className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      editCategory === cat.name
                        ? 'bg-amber-400/20 border-amber-300 text-amber-300'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span className="truncate">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Fecha / Hora */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white/90">Programar tiempo de aviso:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditUseSpecific(false)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      !editUseSpecific ? 'bg-amber-400 text-amber-950' : 'text-white/50'
                    }`}
                  >
                    En X minutos
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditUseSpecific(true)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      editUseSpecific ? 'bg-amber-400 text-amber-950' : 'text-white/50'
                    }`}
                  >
                    Fecha y Hora exacta 📅
                  </button>
                </div>
              </div>

              {editUseSpecific ? (
                <div>
                  <label className="block text-[11px] text-white/70 mb-1">
                    Elige la fecha y hora concreta de la alarma:
                  </label>
                  <input
                    type="datetime-local"
                    value={editSpecificDateTime}
                    onChange={(e) => setEditSpecificDateTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/20 text-white text-xs focus:outline-none"
                  />
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-white/70">Aviso en:</span>
                    <span className="font-bold text-amber-300">
                      {editMinutes >= 60 ? `${(editMinutes / 60).toFixed(1)} horas (${editMinutes} min)` : `${editMinutes} minutos`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="720"
                    step="5"
                    value={editMinutes}
                    onChange={(e) => setEditMinutes(Number(e.target.value))}
                    className="w-full h-2.5 bg-white/15 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  />
                </div>
              )}
            </div>

            {/* Colores */}
            {!editingNote.isChecklist && (
              <div>
                <label className="block text-xs font-bold text-white/80 uppercase tracking-wider mb-1.5">
                  Color de la Nota:
                </label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(COLOR_SCHEMES) as NoteColor[]).map((cKey) => {
                    const scheme = COLOR_SCHEMES[cKey];
                    return (
                      <button
                        key={cKey}
                        type="button"
                        onClick={() => setEditColor(cKey)}
                        className={`w-8 h-8 rounded-xl ${scheme.bg} border-2 transition-transform cursor-pointer shadow-md ${
                          editColor === cKey ? 'scale-110 border-white ring-2 ring-amber-400' : 'border-transparent'
                        }`}
                        title={cKey}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Privacidad */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-xs text-white/80 font-bold">Privacidad de la nota:</span>
              <button
                type="button"
                onClick={() => setEditIsPrivate(!editIsPrivate)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                  editIsPrivate ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'bg-white/10 text-white'
                }`}
              >
                {editIsPrivate ? '🔒 Solo Mía' : '👥 Compartida'}
              </button>
            </div>

            {/* Tono */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-white/90 flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-cyan-400" /> Tono de la Nota
                </label>
                <button
                  type="button"
                  onClick={() => playTone(editTone, editingNote.customToneData)}
                  className="text-xs text-cyan-300 hover:underline cursor-pointer font-bold"
                >
                  Probar sonido 🔊
                </button>
              </div>

              <select
                value={editTone}
                onChange={(e) => {
                  const newTone = e.target.value as SoundTone;
                  setEditTone(newTone);
                  setTimeout(() => {
                    try {
                      playTone(newTone, editingNote.customToneData);
                    } catch (err) {
                      console.warn(err);
                    }
                  }, 100);
                }}
                className="w-full p-2.5 rounded-xl bg-black/50 text-white border border-white/20 text-xs focus:outline-none"
              >
                <option value="google_chime">Google Chime 🔔</option>
                <option value="google_eureka">Google Eureka 🌟</option>
                <option value="google_crystal">Google Cristal ✨</option>
                <option value="google_fresh">Google Fresh Burbuja 💧</option>
                <option value="crescendo_alarm">Alarma Crescendo Progresiva 📈</option>
                <option value="zen_flute">Flauta Zen de Bambú 🎋</option>
                <option value="celestial_harp">Arpa Celestial Dulce 🎶</option>
                <option value="digital_pulse">Pulso Digital Clásico ⏰</option>
                <option value="ocean_waves">Olas del Océano 🌊</option>
                <option value="forest_sunrise">Pájaros de Amanecer 🐦</option>
                <option value="tibetan_singing_bowls">Cuencos Tibetanos 🧘</option>
                <option value="romantic_piano">Piano Romántico 🎹</option>
                <option value="energetic_marimba">Marimba Alegre 🥁</option>
                <option value="samsung">Samsung Over the Horizon</option>
                <option value="huawei">Huawei Marimba</option>
                <option value="nokia">Nokia Polifónico</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingNote(null)}
                className="flex-1 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-3 rounded-2xl btn-3d-rose text-white font-bold text-xs cursor-pointer shadow-lg"
              >
                Actualizar Nota 💾
              </button>
            </div>
          </form>
        )}
      </ModalPortal>
    </section>
  );
};
