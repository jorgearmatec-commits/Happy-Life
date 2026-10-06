export type StatusOption =
  | 'Trabajando'
  | 'Cocinando'
  | 'Gym'
  | 'Leyendo'
  | 'Ocio'
  | 'Sacando al perro'
  | 'En el baño'
  | 'Necesito espacio'
  | 'Disponible para hablar'
  | 'Hornie 🔥';

export type EmotionOption =
  | 'Calmado'
  | 'Feliz'
  | 'Sobrecargado'
  | 'Agotado'
  | 'Inquieto'
  | 'Enojado'
  | 'Triste'
  | 'Ansioso'
  | 'Recargando'
  | 'Hornie';

export interface PlayingTrackInfo {
  title: string;
  artist?: string;
  source: 'YouTube' | 'YouTube Music' | 'MP3 Local';
  isPlaying: boolean;
  albumArt?: string;
  updatedAt?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  status: StatusOption;
  statusEmoji: string;
  socialBattery: number; // 0 - 100
  feeling: EmotionOption;
  feelingEmoji: string;
  feelingUpdatedAt: string;
  lastAction: string;
  lastActionTime: string;
  currentTrack?: PlayingTrackInfo;
  lastLocation?: {
    lat: number;
    lng: number;
    name: string;
    updatedAt: string;
    isRealTime?: boolean;
  };
  pauseNotice?: {
    text: string;
    timestamp: string;
  };
}

export type ReminderCategory =
  | 'Despertarse'
  | 'Pastillas'
  | 'Hacer aseo'
  | 'Cocinar'
  | 'Salir'
  | 'Sacar al perro'
  | 'Lavar dientes'
  | 'Crema'
  | 'Bañarse'
  | 'Personalizado';

export type NoteColor =
  | 'yellow'
  | 'pink'
  | 'mint'
  | 'sky'
  | 'lavender'
  | 'peach'
  | 'bordeaux'
  | 'red'
  | 'blue'
  | 'black';

export type SoundTone =
  | 'water'
  | 'samsung'
  | 'huawei'
  | 'nokia'
  | 'samsung_over_horizon'
  | 'samsung_morning_flower'
  | 'samsung_homecoming'
  | 'huawei_tune_living'
  | 'huawei_dream_possible'
  | 'huawei_classic'
  | 'google_chime'
  | 'google_eureka'
  | 'google_crystal'
  | 'google_fresh'
  | 'zen_bowl'
  | 'harpa'
  | 'morning_birds'
  | 'cathedral_bells'
  | 'cosmic_synth'
  | 'rainfall_chime'
  | 'acoustic_guitar'
  | 'retro_arcade'
  | 'pixel_dawn'
  | 'pixel_horizon'
  | 'over_horizon'
  | 'meditation_gong'
  | 'crescendo_alarm'
  | 'zen_flute'
  | 'celestial_harp'
  | 'digital_pulse'
  | 'ocean_waves'
  | 'forest_sunrise'
  | 'tibetan_singing_bowls'
  | 'romantic_piano'
  | 'energetic_marimba'
  | 'space_odyssey'
  | 'clock_bell_tower'
  | 'peaceful_chime'
  | 'custom';

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface ReminderNote {
  id: string;
  title: string;
  category: ReminderCategory;
  minutes: number;
  dueTime: string; // ISO
  specificDateTime?: string; // YYYY-MM-DDTHH:mm
  color: NoteColor;
  isPrivate: boolean; // true = solo mía, false = compartida
  completed: boolean;
  tone: SoundTone;
  customToneName?: string;
  customToneData?: string;
  createdBy: 'me' | 'partner';
  createdAt: string;
  scheduledNotification?: string;
  dismissStaggered?: boolean;
  isChecklist?: boolean;
  checklistItems?: ChecklistItem[];
}

export interface AlarmItem {
  id: string;
  label: string;
  time: string; // HH:mm
  date?: string; // YYYY-MM-DD
  enabled: boolean;
  tone: SoundTone;
  customToneName?: string;
  customToneData?: string;
  googleCalendarLinked?: boolean;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  author: 'me' | 'partner';
  text: string;
  photos: string[]; // Base64 or URLs
  isImportant: boolean;
  period?: 'morning' | 'afternoon' | 'night' | 'achievements';
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'me' | 'partner';
  text?: string;
  audioUrl?: string;
  imageUrl?: string;
  timestamp: string;
  reaction?: string;
}

export interface AudioRecording {
  id: string;
  fileName: string;
  duration: number;
  createdAt: string;
  dataUrl: string;
  isShared: boolean;
  category?: 'normal' | 'live_shared';
}

export interface MenstrualSettings {
  enabled: boolean;
  lastPeriodDate: string; // YYYY-MM-DD
  cycleDuration: number; // e.g. 28 days
  periodDuration: number; // e.g. 5 days
}

export interface LocalAudioTrack {
  id: string;
  title: string;
  artist: string;
  duration: number;
  dataUrl: string;
  size: number;
}

export interface AppSettings {
  backgroundTheme: string;
  customBgImage?: string;
  customBgFit?: 'contain' | 'cover' | 'fill';
  textColor: string;
  subtextColor: string;
  fontSize: 'small' | 'normal' | 'medium' | 'large' | 'extralarge';
  lowStimulusMode: boolean;
  highPerformanceMode?: boolean; // Android optimization to disable heavy blurs/backdrop filters
  lowEndDeviceMode?: boolean; // Extreme low-RAM optimization: Disables 3D, caps at 30fps, removes animations
  safeAudioMode?: boolean; // Safe audio mode to avoid freezes on Honor / low-end sound drivers
  reduceAnimations?: boolean; // Android optimization for snappy 60fps rendering
  brightness: number; // 50 to 150
  contrast: number; // 50 to 150
  blueLightFilter: number; // 0 to 100 warm tint
  nightModeDim: number; // 0 to 80 dark luminosity reduction
  screenFit: 'auto' | 'honor_narrow' | 'standard' | 'compact' | 'fullscreen' | 'qhd';
  deviceRole?: 'me' | 'partner'; // Permanent device owner selection
  appPermissions: {
    camera: boolean;
    microphone: boolean;
    notifications: boolean;
    geolocation: boolean;
    wakeLock: boolean;
  };
  menstrualCalendar: MenstrualSettings;
  securityPin?: string;
  isLocked: boolean;
  locationSharingConsent: boolean;
  realTimeLocationActive: boolean;
  activeSectionsOrder: string[];
  activeMenu: string; // Current single independent menu
  recentEmojis: string[];
}
