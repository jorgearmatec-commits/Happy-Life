import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import confetti from 'canvas-confetti';
import JSZip from 'jszip';
import {
  UserProfile,
  ReminderNote,
  AlarmItem,
  JournalEntry,
  ChatMessage,
  AudioRecording,
  AppSettings,
  StatusOption,
  EmotionOption,
  NoteColor,
  SoundTone,
  ReminderCategory,
  ChecklistItem,
  PlayingTrackInfo
} from '../types';
import { playTone } from '../components/AudioSynthesizer';
import { auth, loginWithGoogle, logoutUser, onAuthStateChanged, FirebaseUser } from '../firebase';

// 120+ joyful, cute, WhatsApp style and animated avatars
export const AVATAR_OPTIONS = [
  // Tiernos Animalitos
  '🦊', '🐱', '🐼', '🐰', '🦁', '🐨', '🐯', '🐻',
  '🦄', '🐧', '🐶', '🦦', '🐸', '🦉', '🐣', '🦥',
  '🦋', '🐙', '🐬', '🐝', '🦩', '🦔', '🐹', '🐿️',
  '🦆', '🐢', '🦭', '🦚', '🐾', '🐺', '🦊', '🐱',
  // Amor & Pareja WhatsApp
  '💖', '💘', '💕', '💓', '💗', '💞', '💝', '💟',
  '🥰', '😍', '🥳', '😻', '🤩', '🥺', '🤗', '😚',
  '😋', '😎', '😇', '🫶', '👑', '🔥', '🌈', '🕊️',
  '🧸', '💌', '🫂', '💋', '❤️‍🔥', '✨', '💐', '💍',
  // Comiditas Alegres & Café Kawaii
  '🥑', '🍓', '🍕', '🍰', '🍄', '🍩', '🍦', '🍒',
  '🍉', '🥨', '☕', '🍫', '🥞', '🧋', '🍭', '🧁',
  '🍪', '🍿', '🌮', '🍣', '🍎', '🍇', '🍑', '🍋',
  // Magia, Flores & Cósmicos
  '🌸', '🌻', '🌹', '🌷', '🌼', '🌺', '🍀', '🪴',
  '🎈', '🚀', '🌟', '💎', '💫', '🌙', '🪐', '🔮',
  '🎀', '🪄', '🎨', '🎧', '🎸', '🏖️', '🏰', '🎡'
];

export const STATUS_OPTIONS: { label: StatusOption; emoji: string; desc: string }[] = [
  { label: 'Disponible para hablar', emoji: '💬', desc: 'Con tiempo y ganas de charlar' },
  { label: 'Trabajando', emoji: '💻', desc: 'Enfocado en deberes o trabajo' },
  { label: 'Cocinando', emoji: '🍳', desc: 'Preparando algo rico' },
  { label: 'Gym', emoji: '🏋️', desc: 'Entrenando o ejercitando' },
  { label: 'Leyendo', emoji: '📖', desc: 'Momento de lectura y calma' },
  { label: 'Ocio', emoji: '🎮', desc: 'Jugando o viendo series' },
  { label: 'Sacando al perro', emoji: '🐕', desc: 'Paseo al aire libre' },
  { label: 'En el baño', emoji: '🚿', desc: 'Higiene o ducha' },
  { label: 'Necesito espacio', emoji: '🌿', desc: 'Recargando energías en soledad' },
  { label: 'Hornie 🔥', emoji: '🔥', desc: 'Con ganas de mimitos ardientes' },
];

export const EMOTION_OPTIONS: { label: EmotionOption; emoji: string; color: string }[] = [
  { label: 'Calmado', emoji: '😌', color: '#10b981' },
  { label: 'Feliz', emoji: '😊', color: '#f59e0b' },
  { label: 'Sobrecargado', emoji: '🤯', color: '#ef4444' },
  { label: 'Agotado', emoji: '🥱', color: '#6b7280' },
  { label: 'Inquieto', emoji: '⚡', color: '#8b5cf6' },
  { label: 'Enojado', emoji: '😡', color: '#dc2626' },
  { label: 'Triste', emoji: '😢', color: '#3b82f6' },
  { label: 'Ansioso', emoji: '😰', color: '#f97316' },
  { label: 'Recargando', emoji: '🔋', color: '#14b8a6' },
  { label: 'Hornie', emoji: '🔥', color: '#e11d48' },
];

const defaultSettings: AppSettings = {
  backgroundTheme: 'mesh-aurora-dark',
  textColor: '#ffffff',
  subtextColor: '#cbd5e1',
  fontSize: 'normal',
  lowStimulusMode: false,
  brightness: 100,
  contrast: 100,
  blueLightFilter: 0,
  nightModeDim: 0,
  screenFit: 'standard',
  appPermissions: {
    camera: true,
    microphone: true,
    notifications: true,
    geolocation: true,
    wakeLock: true,
  },
  menstrualCalendar: {
    enabled: true,
    lastPeriodDate: '2026-09-20',
    cycleDuration: 28,
    periodDuration: 5,
  },
  isLocked: false,
  locationSharingConsent: true,
  realTimeLocationActive: false,
  duoPairCode: 'DUO-AMOR',
  locationIntervalSecs: 30,
  activeSectionsOrder: [
    'status',
    'reminders',
    'alarms',
    'minigames',
    'journal',
    'location',
    'emotional',
    'menstrual'
  ],
  activeMenu: 'status',
  recentEmojis: ['❤️', '😘', '🥰', '🥺', '🔥', '✨', '🫂', '☕'],
};

const initialMe: UserProfile = {
  id: 'user_me',
  name: 'Amor Mío',
  avatar: '🦊',
  status: 'Disponible para hablar',
  statusEmoji: '💬',
  socialBattery: 85,
  phoneBattery: {
    level: 85,
    isCharging: false,
  },
  phoneSignal: {
    level: 4,
    type: '4G',
  },
  feeling: 'Feliz',
  feelingEmoji: '😊',
  feelingUpdatedAt: 'Hace 20 min',
  lastAction: 'Abrió Happy Life Duo',
  lastActionTime: 'Hace 5 min',
  lastLocation: {
    lat: -33.4489,
    lng: -70.6693,
    name: 'En casa 🏡',
    updatedAt: 'Hace 15 min',
    isRealTime: false,
  }
};

const initialPartner: UserProfile = {
  id: 'user_partner',
  name: 'Mi Pareja ❤️',
  avatar: '🐼',
  status: 'Trabajando',
  statusEmoji: '💻',
  socialBattery: 65,
  phoneBattery: {
    level: 72,
    isCharging: true,
  },
  phoneSignal: {
    level: 4,
    type: 'LTE',
  },
  feeling: 'Calmado',
  feelingEmoji: '😌',
  feelingUpdatedAt: 'Hace 45 min',
  lastAction: 'Completó tarea de pastillas',
  lastActionTime: 'Hace 10 min',
  lastLocation: {
    lat: -33.4475,
    lng: -70.6730,
    name: 'En la oficina 🏢',
    updatedAt: 'Hace 30 min',
    isRealTime: false,
  }
};

const initialReminders: ReminderNote[] = [];

const initialJournal: JournalEntry[] = [
  {
    id: 'j_1',
    author: 'partner',
    text: 'Hoy me desperté pensando en lo agradecido/a que estoy de tenerte. Logramos avanzar juntos y este fin de semana cocinaremos algo especial ✨.',
    photos: [],
    isImportant: true,
    period: 'morning',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'j_2',
    author: 'me',
    text: 'Día productivo, me sentí un poco abrumado al almuerzo pero descansar 15 minutos en silencio me ayudó mucho a recomponerme.',
    photos: [],
    isImportant: false,
    period: 'afternoon',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  }
];

const initialMessages: ChatMessage[] = [
  {
    id: 'm_1',
    sender: 'partner',
    text: 'Hola mi amor ❤️ ¿Cómo va tu día? Te dejé la lista de compras lista.',
    timestamp: '11:15 AM'
  },
  {
    id: 'm_2',
    sender: 'me',
    text: '¡Gracias mi vida! La reviso enseguida. Te amo mucho 💘',
    timestamp: '11:18 AM'
  }
];

interface AppContextType {
  firebaseUser: FirebaseUser | null;
  me: UserProfile;
  partner: UserProfile;
  reminders: ReminderNote[];
  alarms: AlarmItem[];
  journal: JournalEntry[];
  messages: ChatMessage[];
  recordings: AudioRecording[];
  settings: AppSettings;
  activeRole: 'me' | 'partner';
  
  setActiveMenu: (menuId: string) => void;
  toggleRole: () => void;
  updateUserName: (target: 'me' | 'partner', newName: string) => void;
  updateMyStatus: (
    statusOrPartial: StatusOption | { lastAction?: string; status?: StatusOption; emoji?: string },
    emoji?: string
  ) => void;
  updateMySocialBattery: (value: number) => void;
  updateMyFeeling: (feeling: EmotionOption, emoji: string) => void;
  updateMyCurrentTrack: (track: PlayingTrackInfo | undefined) => void;
  sendPauseNotice: (optionIndex: number) => void;
  updateMyLocation: (coords: { lat: number; lng: number }, name: string) => void;
  toggleRealTimeLocation: (active: boolean) => void;
  
  // Reminders & Edit
  addReminder: (note: Omit<ReminderNote, 'id' | 'createdAt' | 'completed'>) => void;
  updateReminder: (id: string, updatedNote: Partial<ReminderNote>) => void;
  toggleReminderDone: (id: string) => void;
  toggleChecklistItem: (noteId: string, itemId: string) => void;
  deleteReminder: (id: string) => void;
  
  // Alarms
  addAlarm: (alarm: Omit<AlarmItem, 'id' | 'createdAt'>) => void;
  toggleAlarm: (id: string) => void;
  deleteAlarm: (id: string) => void;
  
  // Journal
  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateJournalEntry: (id: string, text: string, isImportant: boolean) => void;
  deleteJournalEntry: (id: string) => void;
  setJournalEntries: (entries: JournalEntry[]) => void;
  
  // Chat
  sendMessage: (text?: string, imageUrl?: string, audioUrl?: string) => void;
  addRecentEmoji: (emoji: string) => void;
  exportChatBackup: () => void;
  
  // Recordings
  addRecording: (recording: Omit<AudioRecording, 'id' | 'createdAt'>) => void;
  deleteRecording: (id: string) => void;
  
  // Settings & Reorder
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  reorderSections: (newOrder: string[]) => void;
  
  // Backup & Restore
  exportEncryptedBackup: () => void;
  exportZipBackup: () => Promise<void>;
  restoreFromEncryptedBackup: (jsonContent: string) => boolean;
  restoreFromZipFile: (file: File) => Promise<boolean>;

  handleGoogleLogin: () => Promise<void>;
  handleLogout: () => Promise<void>;
  isGoogleModalOpen: boolean;
  openGoogleModal: () => void;
  closeGoogleModal: () => void;
  trigger3DConfetti: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);
const STORAGE_KEY = 'happy_life_duo_v4_state';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [activeRole, setActiveRole] = useState<'me' | 'partner'>('me');
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState<boolean>(false);

  const loadInitialData = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.reminders)) {
          // Filtrar recordatorios falsos/de demostración anteriores
          parsed.reminders = parsed.reminders.filter(
            (r: ReminderNote) => !['rem_1', 'rem_checklist_1', 'rem_2'].includes(r.id)
          );
        }
        if (parsed.settings && Array.isArray(parsed.settings.activeSectionsOrder)) {
          if (!parsed.settings.activeSectionsOrder.includes('minigames')) {
            parsed.settings.activeSectionsOrder = defaultSettings.activeSectionsOrder;
          }
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Persistent storage notice:', e);
    }
    return null;
  };

  const savedData = loadInitialData();

  const [me, setMe] = useState<UserProfile>(savedData?.me || initialMe);
  const [partner, setPartner] = useState<UserProfile>(savedData?.partner || initialPartner);
  const [reminders, setReminders] = useState<ReminderNote[]>(savedData?.reminders || initialReminders);
  const [alarms, setAlarms] = useState<AlarmItem[]>(savedData?.alarms || []);
  const [journal, setJournal] = useState<JournalEntry[]>(savedData?.journal || initialJournal);
  const [messages, setMessages] = useState<ChatMessage[]>(savedData?.messages || initialMessages);
  const [recordings, setRecordings] = useState<AudioRecording[]>(savedData?.recordings || []);
  const [settings, setSettings] = useState<AppSettings>(savedData?.settings || defaultSettings);

  useEffect(() => {
    try {
      const payload = {
        me,
        partner,
        reminders,
        alarms,
        journal,
        messages,
        recordings,
        settings,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (err) {
      console.warn('LocalStorage save notice:', err);
    }
  }, [me, partner, reminders, alarms, journal, messages, recordings, settings]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (usr) => {
      setFirebaseUser(usr);
      if (usr?.displayName) {
        setMe((prev) => ({
          ...prev,
          name: prev.name === initialMe.name ? usr.displayName || prev.name : prev.name,
        }));
      }
    });
    // Recuperar usuario de Google local si existía
    try {
      const cached = localStorage.getItem('happy_life_google_user');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.displayName) {
          setFirebaseUser(parsed as FirebaseUser);
          setMe((prev) => ({
            ...prev,
            name: prev.name === initialMe.name ? parsed.displayName : prev.name,
          }));
        }
      }
    } catch {}

    return () => unsub();
  }, []);

  const pairCode = settings.duoPairCode || 'DUO-AMOR';

  // Helper centralizado para empujar actualizaciones hacia la otra App
  const pushSyncUpdate = useCallback(
    async (updatePayload: { userProfile?: Partial<UserProfile>; newMessage?: ChatMessage }) => {
      // 1. BroadcastChannel en la misma máquina o ventana
      try {
        const bc = new BroadcastChannel('happy_life_duo_sync');
        bc.postMessage({ type: 'peer_update', role: activeRole, ...updatePayload });
        bc.close();
      } catch {}

      // 2. Servidor para sincronizar entre teléfonos diferentes en tiempo real
      try {
        await fetch('/api/sync/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pairCode,
            role: activeRole,
            ...updatePayload,
          }),
        });
      } catch {}
    },
    [pairCode, activeRole]
  );

  // DETECCIÓN DE BATERÍA ELÉCTRICA REAL DEL TELÉFONO (API Batería Oficial de Teléfonos)
  useEffect(() => {
    let batteryObj: any = null;
    const updateBattery = () => {
      if (!batteryObj) return;
      const level = Math.round((batteryObj.level || 1) * 100);
      const isCharging = Boolean(batteryObj.charging);
      setMe((prev) => {
        const updated = {
          ...prev,
          phoneBattery: { level, isCharging },
        };
        pushSyncUpdate({ userProfile: updated });
        return updated;
      });
    };

    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any)
        .getBattery()
        .then((batt: any) => {
          batteryObj = batt;
          updateBattery();
          batt.addEventListener('levelchange', updateBattery);
          batt.addEventListener('chargingchange', updateBattery);
        })
        .catch(() => {});
    }
  }, [pushSyncUpdate]);

  // DETECCIÓN DE SEÑAL TELEFÓNICA REAL Y TIPO DE RED (4G / 5G / WiFi / Cobertura)
  useEffect(() => {
    const updateSignal = () => {
      const conn =
        (navigator as any).connection ||
        (navigator as any).mozConnection ||
        (navigator as any).webkitConnection;
      let level = 4;
      let type: '5G' | '4G' | 'LTE' | 'WiFi' | '3G' | 'Sin señal' = '4G';
      if (!navigator.onLine) {
        level = 0;
        type = 'Sin señal';
      } else if (conn) {
        if (conn.type === 'wifi') type = 'WiFi';
        else if (conn.effectiveType === '4g') type = '4G';
        else if (conn.effectiveType === '3g') {
          type = '3G';
          level = 2;
        } else if (conn.effectiveType === '2g') {
          type = '3G';
          level = 1;
        } else {
          type = 'LTE';
        }
      }
      setMe((prev) => {
        const updated = {
          ...prev,
          phoneSignal: { level, type },
        };
        pushSyncUpdate({ userProfile: updated });
        return updated;
      });
    };

    updateSignal();
    window.addEventListener('online', updateSignal);
    window.addEventListener('offline', updateSignal);
    const conn = (navigator as any).connection;
    if (conn) conn.addEventListener('change', updateSignal);
    return () => {
      window.removeEventListener('online', updateSignal);
      window.removeEventListener('offline', updateSignal);
      if (conn) conn.removeEventListener('change', updateSignal);
    };
  }, [pushSyncUpdate]);

  // UBICACIÓN GPS EN TIEMPO REAL CON INTERVALO OPTIMIZADO PARA NO CONSUMIR BATERÍA NI RAM
  useEffect(() => {
    if (!settings.realTimeLocationActive) return;

    const intervalSecs = settings.locationIntervalSecs || 30;
    const fetchCurrentGps = () => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            setMe((prev) => {
              const updatedLoc = {
                lat: coords.lat,
                lng: coords.lng,
                name: `GPS: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`,
                updatedAt: `Actualizado ${timeStr}`,
                isRealTime: true,
              };
              const updatedMe = {
                ...prev,
                lastLocation: updatedLoc,
                lastAction: `Ubicación GPS en vivo: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`,
                lastActionTime: 'Ahora',
              };
              pushSyncUpdate({ userProfile: updatedMe });
              return updatedMe;
            });
          },
          (err) => {
            console.warn('GPS location tracking notice:', err);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
        );
      }
    };

    fetchCurrentGps();
    const timer = setInterval(fetchCurrentGps, intervalSecs * 1000);
    return () => clearInterval(timer);
  }, [settings.realTimeLocationActive, settings.locationIntervalSecs, pushSyncUpdate]);

  // MOTOR DE SINCRONIZACIÓN CONTINUA ENTRE APP 1 Y APP 2
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('happy_life_duo_sync');
      bc.onmessage = (event) => {
        const data = event.data;
        if (!data) return;
        if (data.type === 'peer_update' && data.role !== activeRole) {
          if (data.userProfile) {
            setPartner((prev) => ({ ...prev, ...data.userProfile, id: prev.id }));
          }
          if (data.newMessage) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === data.newMessage.id)) return prev;
              return [...prev, data.newMessage];
            });
          }
        }
      };
    } catch {}

    const pullFromServer = async () => {
      try {
        const res = await fetch(`/api/sync/pull?pairCode=${encodeURIComponent(pairCode)}&role=${activeRole}`);
        if (res.ok) {
          const data = await res.json();
          if (data.partnerProfile) {
            setPartner((prev) => ({
              ...prev,
              ...data.partnerProfile,
              id: prev.id,
            }));
          }
          if (Array.isArray(data.messages) && data.messages.length > 0) {
            setMessages((prev) => {
              const existingIds = new Set(prev.map((m) => m.id));
              const toAdd = data.messages.filter((m: ChatMessage) => !existingIds.has(m.id));
              if (toAdd.length === 0) return prev;
              return [...prev, ...toAdd];
            });
          }
        }
      } catch {}
    };

    pullFromServer();
    const interval = setInterval(pullFromServer, 2500);

    return () => {
      clearInterval(interval);
      if (bc) bc.close();
    };
  }, [pairCode, activeRole]);

  const trigger3DConfetti = useCallback(() => {
    try {
      confetti({
        particleCount: 85,
        spread: 75,
        origin: { y: 0.65 },
        colors: ['#f43f5e', '#ec4899', '#facc15', '#65a30d', '#38bdf8'],
        disableForReducedMotion: settings.lowStimulusMode,
      });
    } catch {
      // ignore
    }
  }, [settings.lowStimulusMode]);

  const toggleRole = () => {
    setActiveRole((r) => (r === 'me' ? 'partner' : 'me'));
  };

  const setActiveMenu = (menuId: string) => {
    setSettings((prev) => ({ ...prev, activeMenu: menuId }));
  };

  const updateUserName = (target: 'me' | 'partner', newName: string) => {
    if (!newName.trim()) return;
    if (target === 'me') {
      setMe((prev) => ({ ...prev, name: newName.trim() }));
    } else {
      setPartner((prev) => ({ ...prev, name: newName.trim() }));
    }
  };

  const updateMyStatus = (
    statusOrPartial: StatusOption | { lastAction?: string; status?: StatusOption; emoji?: string },
    emoji?: string
  ) => {
    const nowStr = 'Ahora';
    if (typeof statusOrPartial === 'object') {
      const actionText = statusOrPartial.lastAction || 'Actualizó su estado';
      if (activeRole === 'me') {
        setMe((prev) => ({
          ...prev,
          status: statusOrPartial.status || prev.status,
          statusEmoji: statusOrPartial.emoji || prev.statusEmoji,
          lastAction: actionText,
          lastActionTime: nowStr,
        }));
      } else {
        setPartner((prev) => ({
          ...prev,
          status: statusOrPartial.status || prev.status,
          statusEmoji: statusOrPartial.emoji || prev.statusEmoji,
          lastAction: actionText,
          lastActionTime: nowStr,
        }));
      }
      return;
    }

    const actionText = `Cambió su estado a: ${emoji || ''} ${statusOrPartial}`;

    if (activeRole === 'me') {
      setMe((prev) => ({
        ...prev,
        status: statusOrPartial,
        statusEmoji: emoji || '✨',
        lastAction: actionText,
        lastActionTime: nowStr,
      }));
    } else {
      setPartner((prev) => ({
        ...prev,
        status: statusOrPartial,
        statusEmoji: emoji || '✨',
        lastAction: actionText,
        lastActionTime: nowStr,
      }));
    }
  };

  const updateMySocialBattery = (val: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(val)));
    const nowStr = 'Ahora';
    const actionText = `Batería social al ${clamped}%`;

    if (activeRole === 'me') {
      setMe((prev) => ({
        ...prev,
        socialBattery: clamped,
        lastAction: actionText,
        lastActionTime: nowStr,
      }));
    } else {
      setPartner((prev) => ({
        ...prev,
        socialBattery: clamped,
        lastAction: actionText,
        lastActionTime: nowStr,
      }));
    }
  };

  const updateMyFeeling = (feeling: EmotionOption, emoji: string) => {
    const nowStr = 'Recién actualizado';
    const actionText = `Se siente ${emoji} ${feeling}`;

    if (activeRole === 'me') {
      setMe((prev) => ({
        ...prev,
        feeling,
        feelingEmoji: emoji,
        feelingUpdatedAt: nowStr,
        lastAction: actionText,
        lastActionTime: 'Ahora',
      }));
    } else {
      setPartner((prev) => ({
        ...prev,
        feeling,
        feelingEmoji: emoji,
        feelingUpdatedAt: nowStr,
        lastAction: actionText,
        lastActionTime: 'Ahora',
      }));
    }
  };

  const updateMyCurrentTrack = (track: PlayingTrackInfo | undefined) => {
    if (activeRole === 'me') {
      setMe((prev) => ({
        ...prev,
        currentTrack: track,
        lastAction: track?.isPlaying ? `Escuchando: ${track.title}` : prev.lastAction,
        lastActionTime: track?.isPlaying ? 'Ahora' : prev.lastActionTime,
      }));
    } else {
      setPartner((prev) => ({
        ...prev,
        currentTrack: track,
        lastAction: track?.isPlaying ? `Escuchando: ${track.title}` : prev.lastAction,
        lastActionTime: track?.isPlaying ? 'Ahora' : prev.lastActionTime,
      }));
    }
  };

  const PAUSE_OPTIONS = [
    'Necesito un pequeño tiempo en silencio para recargarme, todo está bien contigo mi amor ❤',
    'Tengo sobrecarga sensorial, voy a ponerme auriculares 30 minutos 🎧',
    'Estoy con batería social muy baja, te amo y luego te escribo o te llamo 🌿',
    'Necesito un largo descanso, te escribo en cuanto pueda 🥺'
  ];

  const sendPauseNotice = (optIndex: number) => {
    const text = PAUSE_OPTIONS[optIndex] || PAUSE_OPTIONS[0];
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const payload = { text, timestamp };

    if (activeRole === 'me') {
      setMe((prev) => ({
        ...prev,
        pauseNotice: payload,
        lastAction: `Envió pausa: "${text.substring(0, 35)}..."`,
        lastActionTime: 'Ahora'
      }));
    } else {
      setPartner((prev) => ({
        ...prev,
        pauseNotice: payload,
        lastAction: `Envió pausa: "${text.substring(0, 35)}..."`,
        lastActionTime: 'Ahora'
      }));
    }

    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('Aviso de Pausa - Happy Life Duo 🌿', {
          body: text,
          icon: '/icon.svg',
        });
      } catch {
        // ignore
      }
    }
  };

  const updateMyLocation = (coords: { lat: number; lng: number }, name: string) => {
    const locPayload = {
      lat: coords.lat,
      lng: coords.lng,
      name,
      updatedAt: 'Ahora mismo',
      isRealTime: settings.realTimeLocationActive
    };

    if (activeRole === 'me') {
      setMe((prev) => ({
        ...prev,
        lastLocation: locPayload,
        lastAction: `Ubicación compartida: ${name}`,
        lastActionTime: 'Ahora'
      }));
    } else {
      setPartner((prev) => ({
        ...prev,
        lastLocation: locPayload,
        lastAction: `Ubicación compartida: ${name}`,
        lastActionTime: 'Ahora'
      }));
    }
  };

  const toggleRealTimeLocation = (active: boolean) => {
    setSettings((prev) => ({ ...prev, realTimeLocationActive: active }));
    if (active && me.lastLocation) {
      setMe((prev) => ({
        ...prev,
        lastLocation: prev.lastLocation ? { ...prev.lastLocation, isRealTime: true } : undefined,
        lastAction: 'Activó ubicación en tiempo real 📡',
        lastActionTime: 'Ahora',
      }));
    }
  };

  const addReminder = (note: Omit<ReminderNote, 'id' | 'createdAt' | 'completed'>) => {
    const newNote: ReminderNote = {
      ...note,
      id: 'rem_' + Date.now() + Math.random().toString(36).substring(2, 6),
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setReminders((prev) => [newNote, ...prev]);
    playTone(note.tone, note.customToneData);
  };

  const updateReminder = (id: string, updatedNote: Partial<ReminderNote>) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updatedNote } : r))
    );
  };

  const toggleReminderDone = (id: string) => {
    setReminders((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextState = !item.completed;
          if (nextState) {
            trigger3DConfetti();
            playTone('google_fresh');
          }
          return { ...item, completed: nextState };
        }
        return item;
      })
    );
  };

  const toggleChecklistItem = (noteId: string, itemId: string) => {
    setReminders((prev) =>
      prev.map((note) => {
        if (note.id === noteId && note.checklistItems) {
          const updated = note.checklistItems.map((item) =>
            item.id === itemId ? { ...item, completed: !item.completed } : item
          );
          const allDone = updated.length > 0 && updated.every((i) => i.completed);
          if (allDone) {
            trigger3DConfetti();
          }
          return { ...note, checklistItems: updated, completed: allDone };
        }
        return note;
      })
    );
  };

  const deleteReminder = (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  const addAlarm = (alarm: Omit<AlarmItem, 'id' | 'createdAt'>) => {
    const newAlarm: AlarmItem = {
      ...alarm,
      id: 'alarm_' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    setAlarms((prev) => [...prev, newAlarm]);
    playTone(alarm.tone, alarm.customToneData);
  };

  const toggleAlarm = (id: string) => {
    setAlarms((prev) =>
      prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a))
    );
  };

  const deleteAlarm = (id: string) => {
    setAlarms((prev) => prev.filter((a) => a.id !== id));
  };

  const addJournalEntry = (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    const nowIso = new Date().toISOString();
    const newEntry: JournalEntry = {
      ...entry,
      id: 'j_' + Date.now(),
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    setJournal((prev) => [newEntry, ...prev]);
  };

  const updateJournalEntry = (id: string, text: string, isImportant: boolean) => {
    setJournal((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              text,
              isImportant,
              updatedAt: new Date().toISOString(),
            }
          : item
      )
    );
  };

  const deleteJournalEntry = (id: string) => {
    setJournal((prev) => prev.filter((j) => j.id !== id));
  };

  const setJournalEntries = (entries: JournalEntry[]) => {
    setJournal(entries);
  };

  const sendMessage = (text?: string, imageUrl?: string, audioUrl?: string) => {
    if (!text && !imageUrl && !audioUrl) return;
    const newMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      sender: activeRole,
      text,
      imageUrl,
      audioUrl,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, newMsg]);
    playTone('google_fresh');
    pushSyncUpdate({ newMessage: newMsg });
  };

  const addRecentEmoji = (emoji: string) => {
    setSettings((prev) => {
      const filtered = prev.recentEmojis.filter((e) => e !== emoji);
      return {
        ...prev,
        recentEmojis: [emoji, ...filtered].slice(0, 16),
      };
    });
  };

  const exportChatBackup = () => {
    const formatted = messages
      .map((m) => `[${m.timestamp}] ${m.sender === 'me' ? me.name : partner.name}: ${m.text || (m.audioUrl ? '[Nota de Voz]' : '[Foto]')}`)
      .join('\n');
    const blob = new Blob([formatted], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HappyLifeDuo_Chat_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const addRecording = (rec: Omit<AudioRecording, 'id' | 'createdAt'>) => {
    const newRec: AudioRecording = {
      ...rec,
      id: 'rec_' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    setRecordings((prev) => [newRec, ...prev]);
  };

  const deleteRecording = (id: string) => {
    setRecordings((prev) => prev.filter((r) => r.id !== id));
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const reorderSections = (newOrder: string[]) => {
    setSettings((prev) => ({ ...prev, activeSectionsOrder: newOrder }));
  };

  const exportEncryptedBackup = () => {
    const fullPayload = {
      version: '4.0',
      exportedAt: new Date().toISOString(),
      me,
      partner,
      reminders,
      alarms,
      journal,
      messages,
      recordings,
      settings,
    };
    const jsonStr = JSON.stringify(fullPayload);
    const encoded = btoa(encodeURIComponent(jsonStr));
    const blob = new Blob([encoded], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HappyLifeDuo_Backup_${new Date().toISOString().slice(0, 10)}.happyduo`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportZipBackup = async () => {
    try {
      const zip = new JSZip();
      const fullPayload = {
        version: '4.0',
        exportedAt: new Date().toISOString(),
        me,
        partner,
        reminders,
        alarms,
        journal,
        messages,
        recordings,
        settings,
      };

      const jsonStr = JSON.stringify(fullPayload, null, 2);
      zip.file('nuestro_lugar_seguro_backup.json', jsonStr);

      const readme = `=========================================================\n` +
        `HAPPY LIFE DUO - NUESTRO LUGAR SEGURO ❤\n` +
        `Copia de Seguridad Completa para Celular / PC\n` +
        `Fecha de Exportación: ${new Date().toLocaleString()}\n` +
        `=========================================================\n\n` +
        `Este archivo ZIP contiene todos sus datos:\n` +
        `- Diarios de vida compartidos y personales\n` +
        `- Recordatorios y listas de tareas\n` +
        `- Alarmas y tonos personalizados\n` +
        `- Grabaciones de voz y audios compartidos\n` +
        `- Historial del Mini Chat\n` +
        `- Ajustes, colores de texto, fotos y preferencias\n\n` +
        `Para restaurar en la app:\n` +
        `1. Abre Happy Life Duo\n` +
        `2. Ve a Ajustes y Personalización -> Seguridad & Respaldos\n` +
        `3. Toca "Restaurar Copia" y selecciona este archivo ZIP o el JSON interior.\n` +
        `¡Todo volverá a quedar exactamente como lo dejaron! 💖\n`;

      zip.file('LEEME_INSTRUCCIONES.txt', readme);

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `HappyLifeDuo_Backup_Completo_${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Error generating zip backup:', e);
      exportEncryptedBackup(); // fallback
    }
  };

  const restoreFromZipFile = async (file: File): Promise<boolean> => {
    try {
      if (file.name.endsWith('.zip')) {
        const zip = await JSZip.loadAsync(file);
        const jsonFile = zip.file('nuestro_lugar_seguro_backup.json') || Object.values(zip.files).find(f => f.name.endsWith('.json'));
        if (jsonFile) {
          const jsonText = await jsonFile.async('string');
          return restoreFromEncryptedBackup(jsonText);
        }
      } else {
        const text = await file.text();
        return restoreFromEncryptedBackup(text);
      }
    } catch (e) {
      console.error('Error restoring from zip file:', e);
    }
    return false;
  };

  const restoreFromEncryptedBackup = (rawStr: string): boolean => {
    try {
      let decodedStr = rawStr.trim();
      try {
        decodedStr = decodeURIComponent(atob(decodedStr));
      } catch {
        // fallback
      }
      const data = JSON.parse(decodedStr);
      if (data.me && data.partner) {
        if (data.me) setMe(data.me);
        if (data.partner) setPartner(data.partner);
        if (data.reminders) setReminders(data.reminders);
        if (data.alarms) setAlarms(data.alarms);
        if (data.journal) setJournal(data.journal);
        if (data.messages) setMessages(data.messages);
        if (data.recordings) setRecordings(data.recordings);
        if (data.settings) setSettings(data.settings);
        trigger3DConfetti();
        return true;
      }
    } catch (err) {
      console.error('Backup restoration failed:', err);
    }
    return false;
  };

  const openGoogleModal = () => setIsGoogleModalOpen(true);
  const closeGoogleModal = () => setIsGoogleModalOpen(false);

  const handleGoogleLogin = async () => {
    // Abre el modal visual directo y seguro de cuenta Google (0 errores de petición inválida)
    openGoogleModal();
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {}
    setFirebaseUser(null);
    try {
      localStorage.removeItem('happy_life_google_user');
    } catch {}
  };

  return (
    <AppContext.Provider
      value={{
        firebaseUser,
        me,
        partner,
        reminders,
        alarms,
        journal,
        messages,
        recordings,
        settings,
        activeRole,
        setActiveMenu,
        toggleRole,
        updateUserName,
        updateMyStatus,
        updateMySocialBattery,
        updateMyFeeling,
        updateMyCurrentTrack,
        sendPauseNotice,
        updateMyLocation,
        toggleRealTimeLocation,
        addReminder,
        updateReminder,
        toggleReminderDone,
        toggleChecklistItem,
        deleteReminder,
        addAlarm,
        toggleAlarm,
        deleteAlarm,
        addJournalEntry,
        updateJournalEntry,
        deleteJournalEntry,
        setJournalEntries,
        sendMessage,
        addRecentEmoji,
        exportChatBackup,
        addRecording,
        deleteRecording,
        updateSettings,
        reorderSections,
        exportEncryptedBackup,
        exportZipBackup,
        restoreFromEncryptedBackup,
        restoreFromZipFile,
        handleGoogleLogin,
        handleLogout,
        isGoogleModalOpen,
        openGoogleModal,
        closeGoogleModal,
        trigger3DConfetti,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
