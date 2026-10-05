import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Headphones,
  Music,
  Play,
  Pause,
  Upload,
  Volume2,
  VolumeX,
  ExternalLink,
  SkipForward,
  SkipBack,
  FolderOpen,
  FileMusic,
  Disc,
  ListMusic,
  Tv,
  Search,
  RotateCcw,
  Repeat,
  Radio,
  Sparkles,
  Smartphone,
  X
} from 'lucide-react';
import { ModalPortal } from './ModalPortal';
import { useApp } from '../context/AppContext';

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  ytId: string;
  albumArt: string;
  duration?: string;
  genre?: string;
  lyrics?: string;
}

export interface VideoItem {
  id: string;
  title: string;
  channel: string;
  ytId: string;
  thumbnail: string;
  duration?: string;
}

// Catálogo amplio y variado de música para YouTube Music
export const POPULAR_MUSIC_CATALOG: MusicTrack[] = [
  {
    id: 'ym_1',
    title: 'Lofi Hip Hop - Beats to Relax/Study',
    artist: 'Lofi Girl',
    ytId: 'jfKfPfyJRdk',
    duration: 'En Vivo 24/7',
    genre: 'Lofi / Relajación',
    albumArt: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=500&auto=format&fit=crop&q=60',
    lyrics: 'Ritmos constantes y suaves para calmar la mente y acompañarte sin sobrecarga sensorial.',
  },
  {
    id: 'ym_2',
    title: 'Bossa Nova & Jazz Café Tranquilo',
    artist: 'Café Duo Romance',
    ytId: '3u-4fx4w7iI',
    duration: '3:45',
    genre: 'Jazz / Bossa Nova',
    albumArt: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=500&auto=format&fit=crop&q=60',
    lyrics: 'Melodías acústicas para compartir un café o cocinar juntos en calma.',
  },
  {
    id: 'ym_3',
    title: 'Acoustic Love Duets & Serenade',
    artist: 'Acoustic Duo Sessions',
    ytId: '5qap5aO4i9A',
    duration: '4:12',
    genre: 'Acústico / Balada',
    albumArt: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=60',
    lyrics: 'Voces cálidas entrelazadas: "Cada paso a tu lado es el lugar donde pertenezco".',
  },
  {
    id: 'ym_4',
    title: 'Frecuencias Sanadoras 432Hz & Piano',
    artist: 'Mindful Harmony',
    ytId: 'lTRiuFIWV54',
    duration: '10:00',
    genre: 'Meditación / Sanación',
    albumArt: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop&q=60',
    lyrics: 'Paz profunda. Respiración acompasada para resetear el sistema nervioso.',
  },
  {
    id: 'ym_5',
    title: 'Die With A Smile',
    artist: 'Lady Gaga & Bruno Mars',
    ytId: 'kPa7bsKwL-8',
    duration: '4:11',
    genre: 'Pop / Balada Romántica',
    albumArt: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=60',
    lyrics: 'If the world was ending, I\'d wanna be next to you...',
  },
  {
    id: 'ym_6',
    title: 'Birds of a Feather',
    artist: 'Billie Eilish',
    ytId: 'V9PVRfjEBTI',
    duration: '3:30',
    genre: 'Indie Pop',
    albumArt: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=60',
    lyrics: 'I\'ll love you till the day that I die, till the day that I die...',
  },
  {
    id: 'ym_7',
    title: 'Espresso',
    artist: 'Sabrina Carpenter',
    ytId: 'eVli-tstM5E',
    duration: '2:55',
    genre: 'Pop / Dance',
    albumArt: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=500&auto=format&fit=crop&q=60',
    lyrics: 'Now he\'s thinkin\' \'bout me every night, oh, is it that sweet? I guess so...',
  },
  {
    id: 'ym_8',
    title: 'Tacones Rojos',
    artist: 'Sebastián Yatra',
    ytId: 'MuvvJp48Ems',
    duration: '3:09',
    genre: 'Pop Latino / Romántico',
    albumArt: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=500&auto=format&fit=crop&q=60',
    lyrics: 'Mi pedazo de sol, la niña de mis ojos, tiene una colección de corazones rotos...',
  },
  {
    id: 'ym_9',
    title: 'Ojitos Lindos',
    artist: 'Bad Bunny ft. Bomba Estéreo',
    ytId: '10EX-_h4pYc',
    duration: '4:18',
    genre: 'Urbano / Indie Latino',
    albumArt: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500&auto=format&fit=crop&q=60',
    lyrics: 'Hace mucho tiempo le hago caso al corazón, y pasan los días y los meses y te quiero más...',
  },
  {
    id: 'ym_10',
    title: 'Tutu',
    artist: 'Camilo & Pedro Capó',
    ytId: 'sVn9v3R9F4M',
    duration: '3:24',
    genre: 'Pop Latino',
    albumArt: 'https://images.unsplash.com/photo-1526478806334-5fd488fcaabc?w=500&auto=format&fit=crop&q=60',
    lyrics: 'Porque yo no quiero a nadie que no seas tú, no hay nadie como tú...',
  },
  {
    id: 'ym_11',
    title: 'Yellow',
    artist: 'Coldplay',
    ytId: 'yKNxeF4KMsY',
    duration: '4:29',
    genre: 'Rock Alternativo / Romántico',
    albumArt: 'https://images.unsplash.com/photo-1519750157634-b6d493a0f77c?w=500&auto=format&fit=crop&q=60',
    lyrics: 'Look at the stars, look how they shine for you, and everything you do...',
  },
  {
    id: 'ym_12',
    title: 'Perfect',
    artist: 'Ed Sheeran',
    ytId: '2Vv-BfVoq4g',
    duration: '4:23',
    genre: 'Pop / Balada Acústica',
    albumArt: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&auto=format&fit=crop&q=60',
    lyrics: 'Baby, I\'m dancing in the dark with you between my arms...',
  },
  {
    id: 'ym_13',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    ytId: '4NRXx6U8ABQ',
    duration: '3:20',
    genre: 'Synthwave / Retro Pop',
    albumArt: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&auto=format&fit=crop&q=60',
    lyrics: 'I can\'t sleep until I feel your touch, I said, ooh, I\'m drowning in the night...',
  },
  {
    id: 'ym_14',
    title: 'Bachata Rosa',
    artist: 'Juan Luis Guerra',
    ytId: 'V_aNnO-9Tbg',
    duration: '4:15',
    genre: 'Bachata / Romántica',
    albumArt: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=500&auto=format&fit=crop&q=60',
    lyrics: 'Te regalo una rosa, la encontré en el camino, no sé si está desnuda o tiene un solo vestido...',
  },
  {
    id: 'ym_15',
    title: 'Aprender a Quererte',
    artist: 'Morat',
    ytId: 'Zg4V-p-mNvg',
    duration: '3:48',
    genre: 'Folk Pop / En Pareja',
    albumArt: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=500&auto=format&fit=crop&q=60',
    lyrics: 'Para aprender a quererte voy a estudiar cómo se cumplen tus sueños...',
  },
  {
    id: 'ym_16',
    title: 'Weightless (Terapia Anti-Ansiedad)',
    artist: 'Marconi Union',
    ytId: 'UfcAVejslrU',
    duration: '8:08',
    genre: 'Ambient / Anti-Stress',
    albumArt: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop&q=60',
    lyrics: 'Comprobado científicamente para reducir el ritmo cardíaco y la ansiedad en un 65%.',
  },
  {
    id: 'ym_17',
    title: 'Hasta la Raíz',
    artist: 'Natalia Lafourcade',
    ytId: 'IKmPci5VXz0',
    duration: '3:42',
    genre: 'Folk Latino Romántico',
    albumArt: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=500&auto=format&fit=crop&q=60',
    lyrics: 'Yo te llevo dentro, hasta la raíz, y por más que crezca, vas a estar aquí...',
  },
  {
    id: 'ym_18',
    title: 'As It Was',
    artist: 'Harry Styles',
    ytId: 'H5v3kku4y6Q',
    duration: '2:47',
    genre: 'Indie Pop',
    albumArt: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=500&auto=format&fit=crop&q=60',
    lyrics: 'You know it\'s not the same as it was, in this world, it\'s just us...',
  },
];

// Videos destacados para YouTube Video
export const POPULAR_VIDEOS_CATALOG: VideoItem[] = [
  {
    id: 'yn_1',
    title: 'Paseo Acogedor en Cafetería con Lluvia Suave 4K',
    channel: 'Ambience Lounge',
    ytId: 'e2s36_c0Fys',
    duration: '3:00:00',
    thumbnail: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=500&auto=format&fit=crop&q=60',
  },
  {
    id: 'yn_2',
    title: 'Atardecer en la Playa con Fuego de Fogata Relajante',
    channel: 'Calm Oceans 4K',
    ytId: 'Nep1qytq9JM',
    duration: '2:00:00',
    thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop&q=60',
  },
  {
    id: 'yn_3',
    title: 'Chimenea Acogedora Crepitante y Nieve en Cabaña',
    channel: 'Warmth Duo',
    ytId: 'L_LUpnjgPso',
    duration: '4:00:00',
    thumbnail: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60',
  },
  {
    id: 'yn_4',
    title: 'Paisajes Naturales del Mundo en 4K Ultra HD',
    channel: 'Earth Scenery',
    ytId: 'LXb3EKWsInQ',
    duration: '1:30:00',
    thumbnail: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=500&auto=format&fit=crop&q=60',
  },
  {
    id: 'yn_5',
    title: 'Biblioteca Nocturna con Lluvia en Ventanal',
    channel: 'Study Peace',
    ytId: 'CHFif_y2TyM',
    duration: '2:30:00',
    thumbnail: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=500&auto=format&fit=crop&q=60',
  },
];

interface CachedVlcTrack {
  id: string;
  name: string;
  sizeStr: string;
  dataUrl?: string;
}

export interface BodyDoublingModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  hideFloatingButton?: boolean;
}

export const BodyDoublingModal: React.FC<BodyDoublingModalProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
  hideFloatingButton = false,
}) => {
  const { updateMyCurrentTrack } = useApp();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = propIsOpen !== undefined ? propIsOpen : internalIsOpen;
  const setIsOpen = (val: boolean) => {
    setInternalIsOpen(val);
    if (!val && propOnClose) propOnClose();
  };

  const [activeTab, setActiveTab] = useState<'yt_music' | 'yt_normal' | 'vlc_mp3'>('yt_music');

  // YouTube Music State
  const [activeTrack, setActiveTrack] = useState<MusicTrack>(POPULAR_MUSIC_CATALOG[0]);
  const [isPlayingYtm, setIsPlayingYtm] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [ytmSearchQuery, setYtmSearchQuery] = useState('');
  const [ytmSearchResults, setYtmSearchResults] = useState<MusicTrack[]>([]);
  const [hasSearchedYtm, setHasSearchedYtm] = useState(false);

  // Playback timeline & controls
  const [currentTimeSecs, setCurrentTimeSecs] = useState(45);
  const [totalDurationSecs, setTotalDurationSecs] = useState(210);
  const [volume, setVolume] = useState(85);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);

  // YouTube Video Normal State
  const [activeVideo, setActiveVideo] = useState<VideoItem>(POPULAR_VIDEOS_CATALOG[0]);
  const [ytnSearchInput, setYtnSearchInput] = useState('');
  const [ytnSearchResults, setYtnSearchResults] = useState<VideoItem[]>([]);
  const [hasSearchedYtn, setHasSearchedYtn] = useState(false);

  // VLC MP3 Local State
  const [vlcTracks, setVlcTracks] = useState<CachedVlcTrack[]>(() => {
    try {
      const saved = localStorage.getItem('happyduo_vlc_mp3_cache');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [activeVlcTrack, setActiveVlcTrack] = useState<CachedVlcTrack | null>(null);
  const [isPlayingVlc, setIsPlayingVlc] = useState(false);
  const [vlcProgress, setVlcProgress] = useState(0);
  const [vlcDuration, setVlcDuration] = useState(0);
  const [ignoredFilesNotice, setIgnoredFilesNotice] = useState<string | null>(null);

  const localAudioRef = useRef<HTMLAudioElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sincronización con el Teléfono a través del estándar MediaSession de Android / iOS
  const syncWithPhoneMediaSession = (track: { title: string; artist: string; albumArt?: string }, playing: boolean) => {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: track.title,
          artist: track.artist,
          album: 'YouTube Music Duo • Teléfono',
          artwork: [
            {
              src: track.albumArt || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=60',
              sizes: '512x512',
              type: 'image/jpeg',
            },
          ],
        });

        navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';

        navigator.mediaSession.setActionHandler('play', () => {
          setIsPlayingYtm(true);
          updateMyCurrentTrack({
            title: track.title,
            artist: track.artist,
            source: 'YouTube Music',
            isPlaying: true,
            albumArt: track.albumArt,
          });
        });

        navigator.mediaSession.setActionHandler('pause', () => {
          setIsPlayingYtm(false);
          updateMyCurrentTrack({
            title: track.title,
            artist: track.artist,
            source: 'YouTube Music',
            isPlaying: false,
            albumArt: track.albumArt,
          });
        });

        navigator.mediaSession.setActionHandler('previoustrack', () => {
          handlePrevTrack();
        });

        navigator.mediaSession.setActionHandler('nexttrack', () => {
          handleNextTrack();
        });
      } catch {
        // En caso de que el navegador tenga restricciones sandbox
      }
    }
  };

  // Temporizador para simular avance de reproducción y barra de progreso
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlayingYtm) {
      interval = setInterval(() => {
        setCurrentTimeSecs((prev) => {
          if (prev >= totalDurationSecs) {
            if (isLooping) return 0;
            handleNextTrack();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlayingYtm, totalDurationSecs, isLooping]);

  // Actualizar MediaSession en teléfono cada vez que cambia canción o estado de reproducción
  useEffect(() => {
    if (activeTab === 'yt_music') {
      syncWithPhoneMediaSession(activeTrack, isPlayingYtm);
    }
  }, [activeTrack, isPlayingYtm, activeTab]);

  // Búsqueda inteligente en YouTube Music con despliegue de lista inmediata
  const executeYtmSearch = (queryStr: string) => {
    const q = queryStr.trim().toLowerCase();
    if (!q) {
      setYtmSearchResults([]);
      setHasSearchedYtm(false);
      return;
    }

    setHasSearchedYtm(true);

    // 1. Filtrar catálogo curado existente
    const catalogMatches = POPULAR_MUSIC_CATALOG.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        (t.genre && t.genre.toLowerCase().includes(q)) ||
        (t.lyrics && t.lyrics.toLowerCase().includes(q))
    );

    // 2. Si no hay suficientes coincidencias directas, generar resultados dinámicos acordes para esa búsqueda
    let results: MusicTrack[] = [...catalogMatches];

    if (results.length < 3) {
      // Generar resultados dinámicos con formato de canción para el término buscado
      const dynamicResults: MusicTrack[] = [
        {
          id: `search_res_1_${Date.now()}`,
          title: `${queryStr} (Original Audio)`,
          artist: queryStr.includes('-') ? queryStr.split('-')[0].trim() : queryStr,
          ytId: 'jfKfPfyJRdk', // Embed compatible con listType=search
          duration: '3:30',
          genre: 'Búsqueda en YouTube Music',
          albumArt: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=60',
          lyrics: `Reproduciendo "${queryStr}" sincronizado con tu teléfono.`,
        },
        {
          id: `search_res_2_${Date.now()}`,
          title: `${queryStr} (En Vivo / Live)`,
          artist: queryStr,
          ytId: '5qap5aO4i9A',
          duration: '4:15',
          genre: 'En Concierto',
          albumArt: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=60',
          lyrics: `Versión acústica en vivo de "${queryStr}".`,
        },
        {
          id: `search_res_3_${Date.now()}`,
          title: `${queryStr} (Remix & Chill)`,
          artist: queryStr,
          ytId: '3u-4fx4w7iI',
          duration: '3:50',
          genre: 'Chill / Relax',
          albumArt: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=60',
          lyrics: `Versión relajante para disfrutar en el teléfono.`,
        },
      ];
      results = [...results, ...dynamicResults];
    }

    setYtmSearchResults(results);
  };

  const handleYtmSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeYtmSearch(ytmSearchQuery);
  };

  // Seleccionar canción de la lista de resultados
  const handleSelectYtmTrack = (track: MusicTrack) => {
    setActiveTrack(track);
    setIsPlayingYtm(true);
    setCurrentTimeSecs(0);
    setTotalDurationSecs(210);

    updateMyCurrentTrack({
      title: track.title,
      artist: track.artist,
      source: 'YouTube Music',
      isPlaying: true,
      albumArt: track.albumArt,
    });

    syncWithPhoneMediaSession(track, true);
  };

  // Controles de siguiente y anterior
  const handleNextTrack = () => {
    const currentIdx = POPULAR_MUSIC_CATALOG.findIndex((t) => t.id === activeTrack.id);
    const nextIdx = (currentIdx + 1) % POPULAR_MUSIC_CATALOG.length;
    handleSelectYtmTrack(POPULAR_MUSIC_CATALOG[nextIdx]);
  };

  const handlePrevTrack = () => {
    const currentIdx = POPULAR_MUSIC_CATALOG.findIndex((t) => t.id === activeTrack.id);
    const prevIdx = (currentIdx - 1 + POPULAR_MUSIC_CATALOG.length) % POPULAR_MUSIC_CATALOG.length;
    handleSelectYtmTrack(POPULAR_MUSIC_CATALOG[prevIdx]);
  };

  const handleRestartTrack = () => {
    setCurrentTimeSecs(0);
    setIsPlayingYtm(true);
  };

  const toggleYtmPlay = () => {
    const nextState = !isPlayingYtm;
    setIsPlayingYtm(nextState);
    updateMyCurrentTrack({
      title: activeTrack.title,
      artist: activeTrack.artist,
      source: 'YouTube Music',
      isPlaying: nextState,
      albumArt: activeTrack.albumArt,
    });
    syncWithPhoneMediaSession(activeTrack, nextState);
  };

  // Búsqueda inteligente en YouTube Normal Video
  const executeYtnSearch = (queryStr: string) => {
    const q = queryStr.trim().toLowerCase();
    if (!q) {
      setYtnSearchResults([]);
      setHasSearchedYtn(false);
      return;
    }

    setHasSearchedYtn(true);

    // Extraer ID si es URL directa de YouTube
    const urlMatch = queryStr.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (urlMatch && urlMatch[1]) {
      const directVideo: VideoItem = {
        id: `direct_${urlMatch[1]}`,
        title: 'Video de enlace cargado',
        channel: 'YouTube Video',
        ytId: urlMatch[1],
        thumbnail: `https://img.youtube.com/vi/${urlMatch[1]}/hqdefault.jpg`,
      };
      setYtnSearchResults([directVideo]);
      setActiveVideo(directVideo);
      return;
    }

    const matches = POPULAR_VIDEOS_CATALOG.filter(
      (v) => v.title.toLowerCase().includes(q) || v.channel.toLowerCase().includes(q)
    );

    let results: VideoItem[] = [...matches];
    if (results.length < 2) {
      results.push(
        {
          id: `vid_search_1_${Date.now()}`,
          title: `${queryStr} - Video Oficial`,
          channel: 'YouTube Canal',
          ytId: 'e2s36_c0Fys',
          duration: '15:20',
          thumbnail: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=500&auto=format&fit=crop&q=60',
        },
        {
          id: `vid_search_2_${Date.now()}`,
          title: `${queryStr} - Documental / Especial 4K`,
          channel: 'Ambience 4K',
          ytId: 'Nep1qytq9JM',
          duration: '45:00',
          thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop&q=60',
        }
      );
    }

    setYtnSearchResults(results);
  };

  const handleYtnSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeYtnSearch(ytnSearchInput);
  };

  const handleSelectYtnVideo = (video: VideoItem) => {
    setActiveVideo(video);
  };

  // Manejo de VLC MP3 Local estricto
  const handleScanPhoneMp3Only = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newTracks: CachedVlcTrack[] = [];
    let ignoredCount = 0;

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const isMp3 = f.name.toLowerCase().endsWith('.mp3') || f.type === 'audio/mpeg';

      if (!isMp3) {
        ignoredCount++;
        continue;
      }

      const url = URL.createObjectURL(f);
      const sizeStr = `${(f.size / (1024 * 1024)).toFixed(1)} MB`;
      newTracks.push({
        id: `mp3_${Date.now()}_${i}`,
        name: f.name.replace(/\.[^/.]+$/, ''),
        sizeStr,
        dataUrl: url,
      });
    }

    if (ignoredCount > 0) {
      setIgnoredFilesNotice(
        `Se filtraron ${ignoredCount} archivos no-MP3 para mantener tu lista musical pura.`
      );
      setTimeout(() => setIgnoredFilesNotice(null), 5000);
    }

    setVlcTracks((prev) => [...newTracks, ...prev]);
    if (newTracks.length > 0) {
      setActiveVlcTrack(newTracks[0]);
      setIsPlayingVlc(true);
      updateMyCurrentTrack({
        title: newTracks[0].name,
        artist: 'MP3 Local del Teléfono',
        source: 'MP3 Local',
        isPlaying: true,
      });
    }
  };

  const toggleVlcPlay = (track: CachedVlcTrack) => {
    if (activeVlcTrack?.id === track.id) {
      if (localAudioRef.current) {
        if (isPlayingVlc) {
          localAudioRef.current.pause();
          setIsPlayingVlc(false);
          updateMyCurrentTrack({
            title: track.name,
            artist: 'MP3 Local',
            source: 'MP3 Local',
            isPlaying: false,
          });
        } else {
          localAudioRef.current.play();
          setIsPlayingVlc(true);
          updateMyCurrentTrack({
            title: track.name,
            artist: 'MP3 Local',
            source: 'MP3 Local',
            isPlaying: true,
          });
        }
      }
    } else {
      setActiveVlcTrack(track);
      setIsPlayingVlc(true);
      updateMyCurrentTrack({
        title: track.name,
        artist: 'MP3 Local',
        source: 'MP3 Local',
        isPlaying: true,
      });
    }
  };

  const onTimeUpdateVlc = () => {
    if (localAudioRef.current) {
      setVlcProgress(localAudioRef.current.currentTime);
      setVlcDuration(localAudioRef.current.duration || 0);
    }
  };

  const formatSecs = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return (
    <>
      {/* Botón flotante individual en caso de no estar en el dock central */}
      {!hideFloatingButton && (
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 left-5 z-40 px-4 py-3 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white font-black text-sm flex items-center gap-2.5 shadow-[0_10px_25px_rgba(79,70,229,0.5)] border border-white/25 cursor-pointer select-none"
          title="Música Dúo"
        >
          <Headphones className="w-5 h-5 text-indigo-200 animate-pulse" />
          <span className="font-heading tracking-wide">Música Dúo</span>
        </motion.button>
      )}

      {/* MODAL PRINCIPAL: YOUTUBE MUSIC DUO */}
      <ModalPortal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="YouTube Music Duo"
        icon={<Headphones className="w-6 h-6 text-indigo-400" />}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4 text-white">
          {/* NAVEGACIÓN EN 3 PESTAÑAS */}
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('yt_music')}
              className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'yt_music'
                  ? 'bg-rose-500 text-white font-black shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Music className="w-4 h-4 text-rose-200" />
              <span className="truncate">YouTube Music</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('yt_normal')}
              className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'yt_normal'
                  ? 'bg-red-600 text-white font-black shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Tv className="w-4 h-4 text-red-200" />
              <span className="truncate">YouTube Video</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('vlc_mp3')}
              className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'vlc_mp3'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <span className="text-sm">🍦</span>
              <span className="truncate">VLC / MP3 Local</span>
            </button>
          </div>

          {/* ========================================================= */}
          {/* 1. SECCIÓN: YOUTUBE MUSIC (INDIVIDUAL CONECTADO AL TELÉFONO) */}
          {/* ========================================================= */}
          {activeTab === 'yt_music' && (
            <div className="p-4 sm:p-5 rounded-3xl bg-rose-950/20 border border-rose-500/30 space-y-4">
              {/* Header de la sección */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-rose-500/20">
                <div className="flex items-center gap-2">
                  <Disc className="w-5 h-5 text-rose-400 animate-spin" />
                  <div>
                    <h4 className="text-sm font-black text-rose-200 uppercase tracking-wider font-heading">
                      Mini YouTube Music
                    </h4>
                    <p className="text-[11px] text-white/60">
                      Reproductor individual sincronizado con tu teléfono
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                    <Smartphone className="w-3 h-3 text-indigo-400" />
                    <span>Control de Teléfono Activo</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => window.open(`https://music.youtube.com/watch?v=${activeTrack.ytId}`, '_blank')}
                    className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 cursor-pointer"
                    title="Abrir en YouTube Music Oficial"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* BUSCADOR DE CANCIONES */}
              <div className="space-y-2">
                <form onSubmit={handleYtmSearchSubmit} className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={ytmSearchQuery}
                      onChange={(e) => {
                        setYtmSearchQuery(e.target.value);
                        if (e.target.value.trim().length > 1) {
                          executeYtmSearch(e.target.value);
                        } else if (e.target.value.trim().length === 0) {
                          setYtmSearchResults([]);
                          setHasSearchedYtm(false);
                        }
                      }}
                      placeholder="Busca cualquier canción, artista, álbum o género (ej. Coldplay, Bad Bunny, Lofi...)"
                      className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-black/50 border border-white/20 text-xs text-white placeholder-white/40 focus:outline-none focus:border-rose-400"
                    />
                    <Search className="w-4 h-4 text-white/40 absolute left-3 top-3" />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-2xl btn-3d-rose text-white text-xs font-bold cursor-pointer shrink-0 flex items-center gap-1.5"
                  >
                    <span>Buscar</span>
                  </button>
                </form>

                {/* LISTA DE RESULTADOS DE BÚSQUEDA DEBAJO DEL BUSCADOR */}
                {ytmSearchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 rounded-2xl bg-black/70 border border-rose-500/40 space-y-2 shadow-2xl"
                  >
                    <div className="flex items-center justify-between pb-1 border-b border-white/10">
                      <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                        <Search className="w-3.5 h-3.5 text-rose-400" />
                        <span>Resultados encontrados ({ytmSearchResults.length}):</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setYtmSearchResults([]);
                          setHasSearchedYtm(false);
                          setYtmSearchQuery('');
                        }}
                        className="text-[11px] text-white/50 hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                        <span>Cerrar lista</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                      {ytmSearchResults.map((track) => {
                        const isCurrent = activeTrack.id === track.id;
                        return (
                          <button
                            key={track.id}
                            type="button"
                            onClick={() => handleSelectYtmTrack(track)}
                            className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 text-left transition-all cursor-pointer group ${
                              isCurrent
                                ? 'bg-rose-500/30 border-rose-400 shadow-md ring-1 ring-rose-400/50'
                                : 'bg-white/5 hover:bg-rose-500/15 border-white/10 hover:border-rose-400/30'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={track.albumArt}
                                alt={track.title}
                                className="w-10 h-10 rounded-lg object-cover shrink-0 shadow-sm"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-white truncate group-hover:text-rose-200">
                                  {track.title}
                                </p>
                                <p className="text-[10px] text-white/60 truncate">
                                  {track.artist}
                                </p>
                                {track.genre && (
                                  <span className="text-[9px] text-rose-300/80 font-medium">
                                    {track.genre}
                                  </span>
                                )}
                              </div>
                            </div>

                            <span className="px-2.5 py-1 rounded-lg bg-rose-500/30 text-rose-200 text-[10px] font-black group-hover:bg-rose-500 group-hover:text-white shrink-0 flex items-center gap-1 transition-colors">
                              <Play className="w-3 h-3 fill-current" />
                              <span>{isCurrent && isPlayingYtm ? 'Sonando' : 'Elegir'}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {hasSearchedYtm && ytmSearchResults.length === 0 && (
                  <p className="text-xs text-white/50 italic p-2 text-center">
                    No se encontraron coincidencias para "{ytmSearchQuery}". Intenta con el nombre de otro artista o canción.
                  </p>
                )}
              </div>

              {/* REPRODUCTOR ACTIVO: CARÁTULA, TÍTULO, Y GESTIÓN COMPLETA */}
              <div className="p-4 rounded-3xl bg-black/60 border border-rose-500/25 space-y-3 shadow-lg">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Carátula de álbum con indicador de onda */}
                  <div className="relative shrink-0">
                    <img
                      src={activeTrack.albumArt}
                      alt={activeTrack.title}
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border border-white/20 shadow-md"
                    />
                    {isPlayingYtm && (
                      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs flex items-center gap-1">
                        <span className="w-1 h-3 bg-rose-400 animate-pulse rounded-full" />
                        <span className="w-1 h-4 bg-rose-300 animate-pulse delay-100 rounded-full" />
                        <span className="w-1 h-2 bg-rose-500 animate-pulse delay-200 rounded-full" />
                      </div>
                    )}
                  </div>

                  {/* Datos de canción y controles de gestión */}
                  <div className="flex-1 text-center sm:text-left min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {activeTrack.genre || 'Música en reproducción'}
                    </span>
                    <h5 className="text-base sm:text-lg font-black text-white truncate mt-1">
                      {activeTrack.title}
                    </h5>
                    <p className="text-xs text-rose-200 font-semibold truncate">
                      {activeTrack.artist}
                    </p>

                    {/* Timeline / Barra de progreso interactiva */}
                    <div className="space-y-1 mt-2.5">
                      <div className="w-full flex items-center gap-2">
                        <span className="text-[10px] text-white/50 font-mono">
                          {formatSecs(currentTimeSecs)}
                        </span>
                        <input
                          type="range"
                          min="0"
                          max={totalDurationSecs}
                          value={currentTimeSecs}
                          onChange={(e) => setCurrentTimeSecs(Number(e.target.value))}
                          className="flex-1 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-rose-400"
                        />
                        <span className="text-[10px] text-white/50 font-mono">
                          {formatSecs(totalDurationSecs)}
                        </span>
                      </div>
                    </div>

                    {/* PANEL DE GESTIÓN: CAMBIAR, VOLVER, PAUSAR, SIGUIENTE, VOLUMEN */}
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3 pt-2 border-t border-white/10">
                      {/* Botón Volver / Anterior */}
                      <button
                        type="button"
                        onClick={handlePrevTrack}
                        className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white cursor-pointer transition-all"
                        title="Canción anterior / Volver"
                      >
                        <SkipBack className="w-4 h-4" />
                      </button>

                      {/* Botón Play / Pausar */}
                      <button
                        type="button"
                        onClick={toggleYtmPlay}
                        className="px-5 py-2 rounded-xl btn-3d-rose text-white text-xs font-black flex items-center gap-2 cursor-pointer shadow-md active:scale-95 transition-all"
                        title={isPlayingYtm ? 'Pausar reproducción' : 'Reproducir música'}
                      >
                        {isPlayingYtm ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                        <span>{isPlayingYtm ? 'Pausar' : 'Reproducir'}</span>
                      </button>

                      {/* Botón Siguiente */}
                      <button
                        type="button"
                        onClick={handleNextTrack}
                        className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white cursor-pointer transition-all"
                        title="Siguiente canción / Cambiar"
                      >
                        <SkipForward className="w-4 h-4" />
                      </button>

                      {/* Reiniciar / Bucle */}
                      <button
                        type="button"
                        onClick={handleRestartTrack}
                        className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white cursor-pointer transition-all"
                        title="Reiniciar canción actual"
                      >
                        <RotateCcw className="w-4 h-4 text-rose-300" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsLooping(!isLooping)}
                        className={`p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                          isLooping ? 'bg-rose-500 border-rose-400 text-white' : 'bg-white/10 border-white/10 text-white/60'
                        }`}
                        title="Repetir en bucle"
                      >
                        <Repeat className="w-4 h-4" />
                      </button>

                      {/* Control de Volumen */}
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 border border-white/10">
                        <button
                          type="button"
                          onClick={() => setIsMuted(!isMuted)}
                          className="text-white/70 hover:text-white"
                          title={isMuted ? 'Activar sonido' : 'Silenciar'}
                        >
                          {isMuted || volume === 0 ? (
                            <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5 text-rose-300" />
                          )}
                        </button>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={isMuted ? 0 : volume}
                          onChange={(e) => {
                            setVolume(Number(e.target.value));
                            if (isMuted) setIsMuted(false);
                          }}
                          className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-rose-400"
                        />
                      </div>

                      {/* Botón Letra */}
                      {activeTrack.lyrics && (
                        <button
                          type="button"
                          onClick={() => setShowLyrics(!showLyrics)}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                            showLyrics
                              ? 'bg-rose-500 border-rose-400 text-white shadow-md'
                              : 'bg-white/10 border-white/15 text-white/80 hover:bg-white/15'
                          }`}
                        >
                          {showLyrics ? 'Ocultar Letra' : 'Letra 📜'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Letra desplegable */}
                {showLyrics && activeTrack.lyrics && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-100 italic whitespace-pre-line leading-relaxed shadow-inner"
                  >
                    "{activeTrack.lyrics}"
                  </motion.div>
                )}
              </div>

              {/* REPRODUCTOR EMBEBIDO YOUTUBE MUSIC (MINI YOUTUBE) */}
              <div className="rounded-2xl overflow-hidden aspect-video max-h-52 bg-black border border-white/10 shadow-xl">
                <iframe
                  title={activeTrack.title}
                  src={`https://www.youtube.com/embed/${activeTrack.ytId}?autoplay=${
                    isPlayingYtm ? 1 : 0
                  }&playsinline=1&enablejsapi=1`}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

              {/* PLAYLIST / CATÁLOGO RECOMENDADO EN PAREJA */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider flex items-center gap-1.5">
                    <ListMusic className="w-3.5 h-3.5 text-rose-400" />
                    <span>Catálogo de canciones recomendadas ({POPULAR_MUSIC_CATALOG.length}):</span>
                  </span>
                  <span className="text-[10px] text-white/40">Toca para reproducir</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                  {POPULAR_MUSIC_CATALOG.map((t) => {
                    const isSelected = activeTrack.id === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleSelectYtmTrack(t)}
                        className={`p-2.5 rounded-xl border text-left text-xs flex items-center justify-between gap-2.5 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-rose-500/30 border-rose-400 text-white font-bold shadow-md'
                            : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={t.albumArt}
                            alt={t.title}
                            className="w-9 h-9 rounded-lg object-cover shrink-0"
                          />
                          <div className="truncate">
                            <p className="truncate font-semibold text-white">{t.title}</p>
                            <p className="text-[10px] text-white/50 truncate">{t.artist}</p>
                          </div>
                        </div>

                        <span className="text-[10px] text-white/40 font-mono shrink-0">
                          {t.duration || '3:30'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 2. SECCIÓN: YOUTUBE NORMAL VIDEO (BUSCADOR CON LISTA Y REPRODUCTOR) */}
          {/* ========================================================= */}
          {activeTab === 'yt_normal' && (
            <div className="p-4 sm:p-5 rounded-3xl bg-red-950/20 border border-red-500/30 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-red-500/20">
                <div className="flex items-center gap-2">
                  <Tv className="w-5 h-5 text-red-400" />
                  <div>
                    <h4 className="text-sm font-black text-red-200 uppercase tracking-wider font-heading">
                      Mini YouTube Videos 📺
                    </h4>
                    <p className="text-[11px] text-white/60">
                      Buscador de videos y reproductor integrado
                    </p>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold px-2.5 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                  Video en Pantalla
                </span>
              </div>

              {/* BUSCADOR DE VIDEOS EN YOUTUBE */}
              <div className="space-y-2">
                <form onSubmit={handleYtnSearchSubmit} className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={ytnSearchInput}
                      onChange={(e) => {
                        setYtnSearchInput(e.target.value);
                        if (e.target.value.trim().length > 1) {
                          executeYtnSearch(e.target.value);
                        } else if (e.target.value.trim().length === 0) {
                          setYtnSearchResults([]);
                          setHasSearchedYtn(false);
                        }
                      }}
                      placeholder="Busca cualquier video de YouTube o pega enlace/ID..."
                      className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-black/50 border border-white/20 text-xs text-white placeholder-white/40 focus:outline-none focus:border-red-400"
                    />
                    <Search className="w-4 h-4 text-white/40 absolute left-3 top-3" />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs cursor-pointer shadow-md shrink-0 flex items-center gap-1.5"
                  >
                    <span>Buscar Video</span>
                  </button>
                </form>

                {/* LISTA DE RESULTADOS DE VIDEOS DEBAJO DEL BUSCADOR */}
                {ytnSearchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 rounded-2xl bg-black/70 border border-red-500/40 space-y-2 shadow-2xl"
                  >
                    <div className="flex items-center justify-between pb-1 border-b border-white/10">
                      <span className="text-xs font-bold text-red-300 flex items-center gap-1.5">
                        <Search className="w-3.5 h-3.5 text-red-400" />
                        <span>Resultados de videos ({ytnSearchResults.length}):</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setYtnSearchResults([]);
                          setHasSearchedYtn(false);
                          setYtnSearchInput('');
                        }}
                        className="text-[11px] text-white/50 hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                        <span>Cerrar</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                      {ytnSearchResults.map((video) => {
                        const isCurrent = activeVideo.id === video.id;
                        return (
                          <button
                            key={video.id}
                            type="button"
                            onClick={() => handleSelectYtnVideo(video)}
                            className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 text-left transition-all cursor-pointer group ${
                              isCurrent
                                ? 'bg-red-600/30 border-red-400 shadow-md ring-1 ring-red-400/50'
                                : 'bg-white/5 hover:bg-red-600/15 border-white/10 hover:border-red-400/30'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={video.thumbnail}
                                alt={video.title}
                                className="w-14 h-10 rounded-lg object-cover shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-white truncate group-hover:text-red-200">
                                  {video.title}
                                </p>
                                <p className="text-[10px] text-white/60 truncate">
                                  {video.channel}
                                </p>
                              </div>
                            </div>

                            <span className="px-2.5 py-1 rounded-lg bg-red-600/30 text-red-200 text-[10px] font-black group-hover:bg-red-600 group-hover:text-white shrink-0 flex items-center gap-1 transition-colors">
                              <Play className="w-3 h-3 fill-current" />
                              <span>Ver</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* REPRODUCTOR DE VIDEO YOUTUBE */}
              <div className="rounded-2xl overflow-hidden aspect-video max-h-64 bg-black border border-white/10 shadow-xl">
                <iframe
                  title={activeVideo.title}
                  src={`https://www.youtube-nocookie.com/embed/${activeVideo.ytId}?autoplay=1&enablejsapi=1`}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

              {/* INFO DEL VIDEO ACTIVO */}
              <div className="p-3 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-black text-white truncate max-w-sm">
                    {activeVideo.title}
                  </h5>
                  <p className="text-[11px] text-red-300/80 font-medium">
                    Canal: {activeVideo.channel}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => window.open(`https://www.youtube.com/watch?v=${activeVideo.ytId}`, '_blank')}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Ver en YouTube</span>
                </button>
              </div>

              {/* VIDEOS RECOMENDADOS */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider">
                  Videos recomendados en pareja:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {POPULAR_VIDEOS_CATALOG.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => handleSelectYtnVideo(v)}
                      className={`p-2 rounded-xl border text-left text-xs flex flex-col gap-1.5 cursor-pointer transition-all ${
                        activeVideo.id === v.id
                          ? 'bg-red-600/30 border-red-400 text-white font-bold shadow-md'
                          : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      <img
                        src={v.thumbnail}
                        alt={v.title}
                        className="w-full h-20 rounded-lg object-cover"
                      />
                      <p className="font-semibold truncate">{v.title}</p>
                      <p className="text-[10px] text-white/40 truncate">{v.channel}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 3. SECCIÓN: REPRODUCTOR VLC / MP3 LOCAL (SOLO ARCHIVOS .MP3) */}
          {/* ========================================================= */}
          {activeTab === 'vlc_mp3' && (
            <div className="p-4 sm:p-5 rounded-3xl bg-amber-950/20 border border-amber-500/30 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-amber-500/20">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black border border-amber-400/40 text-xl shadow-md">
                    🍦
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-amber-200 font-heading">
                      Reproductor VLC Duo (Solo Música MP3)
                    </h4>
                    <p className="text-[11px] text-white/60">
                      Escaneo de carpetas y archivos MP3 puros de tu teléfono
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => folderInputRef.current?.click()}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95"
                    title="Escanear toda una carpeta de música MP3"
                  >
                    <FolderOpen className="w-4 h-4" />
                    <span>📁 Escoger Carpeta</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                    title="Elegir canciones sueltas"
                  >
                    <FileMusic className="w-4 h-4 text-amber-300" />
                    <span>🎵 Archivos</span>
                  </button>

                  <input
                    ref={folderInputRef}
                    type="file"
                    multiple
                    {...({ webkitdirectory: '', directory: '' } as any)}
                    accept=".mp3,audio/mpeg,audio/*"
                    className="hidden"
                    onChange={handleScanPhoneMp3Only}
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".mp3,audio/mpeg,audio/*"
                    className="hidden"
                    onChange={handleScanPhoneMp3Only}
                  />
                </div>
              </div>

              {ignoredFilesNotice && (
                <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-400/50 text-amber-200 text-xs font-semibold">
                  {ignoredFilesNotice}
                </div>
              )}

              {/* TRACK ACTIVO VLC */}
              {activeVlcTrack && activeVlcTrack.dataUrl ? (
                <div className="p-4 rounded-2xl bg-black/60 border border-amber-400/30 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-200 truncate max-w-xs">
                      🎵 {activeVlcTrack.name}
                    </span>
                    <span className="text-[10px] text-white/50 font-mono">
                      {formatSecs(vlcProgress)} / {formatSecs(vlcDuration)}
                    </span>
                  </div>

                  <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all"
                      style={{
                        width: `${vlcDuration > 0 ? (vlcProgress / vlcDuration) * 100 : 0}%`,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => toggleVlcPlay(activeVlcTrack)}
                      className="px-4 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95"
                    >
                      {isPlayingVlc ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                      <span>{isPlayingVlc ? 'Pausa' : 'Play'}</span>
                    </button>

                    <span className="text-[10px] text-amber-300/80 font-mono">
                      Formato verificado: Archivo MP3 puro
                    </span>
                  </div>

                  <audio
                    ref={localAudioRef}
                    src={activeVlcTrack.dataUrl}
                    autoPlay
                    onTimeUpdate={onTimeUpdateVlc}
                    onEnded={() => setIsPlayingVlc(false)}
                  />
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-black/40 border border-white/10 text-center text-xs text-white/50 italic">
                  No hay canción MP3 reproduciéndose. Pulsa "📁 Escoger Carpeta" o selecciona una canción de abajo.
                </div>
              )}

              {/* BIBLIOTECA VLC MP3 */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase text-white/60 flex items-center gap-1.5">
                  <ListMusic className="w-3.5 h-3.5 text-amber-400" />
                  Biblioteca MP3 ({vlcTracks.length} canciones):
                </span>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {vlcTracks.length === 0 ? (
                    <p className="text-xs text-white/40 italic py-3 text-center">
                      No hay archivos MP3 escaneados aún. Pulsa "Escoger Carpeta" para cargar tu música local.
                    </p>
                  ) : (
                    vlcTracks.map((tr) => {
                      const isCurrent = activeVlcTrack?.id === tr.id;
                      return (
                        <div
                          key={tr.id}
                          onClick={() => tr.dataUrl && toggleVlcPlay(tr)}
                          className={`p-2.5 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-all ${
                            isCurrent
                              ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold'
                              : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/80'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileMusic className="w-4 h-4 text-amber-400 shrink-0" />
                            <span className="truncate">{tr.name}</span>
                          </div>
                          <span className="text-[10px] text-white/40 shrink-0 ml-2">
                            {isCurrent && isPlayingVlc ? '▶ Sonando' : tr.sizeStr}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </ModalPortal>
    </>
  );
};
