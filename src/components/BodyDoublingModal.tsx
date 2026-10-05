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
  RotateCw,
  Repeat,
  Radio,
  Sparkles,
  Smartphone,
  Shuffle,
  RefreshCw,
  X
} from 'lucide-react';
import { ModalPortal } from './ModalPortal';
import { useApp } from '../context/AppContext';
import { searchYouTube, YouTubeItem } from '../utils/youtubeApi';
import {
  saveMultipleVlcTracks,
  getStoredVlcTracks,
  deleteStoredVlcTrack,
  clearAllStoredVlcTracks,
  StoredVlcTrack,
} from '../utils/vlcStorage';

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
  blob?: Blob;
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
  const [isSearchingYtm, setIsSearchingYtm] = useState(false);

  // Playback timeline & controls
  const [currentTimeSecs, setCurrentTimeSecs] = useState(45);
  const [totalDurationSecs, setTotalDurationSecs] = useState(210);
  const [volume, setVolume] = useState(85);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);

  // YouTube Video Normal State
  const [activeVideo, setActiveVideo] = useState<VideoItem>(POPULAR_VIDEOS_CATALOG[0]);
  const [isPlayingYtn, setIsPlayingYtn] = useState(false);
  const [ytnSearchInput, setYtnSearchInput] = useState('');
  const [ytnSearchResults, setYtnSearchResults] = useState<VideoItem[]>([]);
  const [hasSearchedYtn, setHasSearchedYtn] = useState(false);
  const [isSearchingYtn, setIsSearchingYtn] = useState(false);

  // VLC MP3 Local State con persistencia IndexedDB
  const [vlcTracks, setVlcTracks] = useState<CachedVlcTrack[]>([]);
  const [activeVlcTrack, setActiveVlcTrack] = useState<CachedVlcTrack | null>(null);
  const [isPlayingVlc, setIsPlayingVlc] = useState(false);
  const [vlcProgress, setVlcProgress] = useState(0);
  const [vlcDuration, setVlcDuration] = useState(0);
  const [isVlcShuffle, setIsVlcShuffle] = useState(false);
  const [vlcRepeatMode, setVlcRepeatMode] = useState<'off' | 'all' | 'one'>('all');
  const [vlcVolume, setVlcVolume] = useState(1);
  const [isVlcMuted, setIsVlcMuted] = useState(false);
  const [ignoredFilesNotice, setIgnoredFilesNotice] = useState<string | null>(null);

  const localAudioRef = useRef<HTMLAudioElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar canciones almacenadas en IndexedDB al iniciar la aplicación
  useEffect(() => {
    let isMounted = true;
    getStoredVlcTracks().then((stored) => {
      if (!isMounted || !stored || stored.length === 0) return;
      const loaded: CachedVlcTrack[] = stored.map((s) => ({
        id: s.id,
        name: s.name,
        sizeStr: s.sizeStr,
        dataUrl: URL.createObjectURL(s.blob),
        blob: s.blob,
      }));
      setVlcTracks(loaded);
      if (loaded.length > 0) {
        setActiveVlcTrack((prev) => prev || loaded[0]);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Sincronización con el Teléfono a través del estándar MediaSession de Android / iOS
  const syncWithPhoneMediaSession = (
    track: { title: string; artist: string; albumArt?: string },
    playing: boolean
  ) => {
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
        // Sandbox fallback
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

  // Búsqueda real en YouTube Music con YouTube Data API v3 y fallback verificado
  const executeYtmSearch = async (queryStr: string) => {
    const q = queryStr.trim();
    if (!q) {
      setYtmSearchResults([]);
      setHasSearchedYtm(false);
      return;
    }

    setHasSearchedYtm(true);
    setIsSearchingYtm(true);

    try {
      const results = await searchYouTube(q, 'YouTube Music');
      const mapped: MusicTrack[] = results.map((r) => ({
        id: r.id,
        title: r.title,
        artist: r.channel,
        ytId: r.ytId,
        albumArt: r.thumbnail,
        duration: r.duration,
        genre: r.genre || 'YouTube Music',
      }));
      setYtmSearchResults(mapped);
    } catch (err) {
      console.warn('Error en búsqueda de YouTube Music:', err);
    } finally {
      setIsSearchingYtm(false);
    }
  };

  const handleYtmSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeYtmSearch(ytmSearchQuery);
  };

  // Seleccionar canción de la lista de resultados de YouTube Music
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

  // Controles de siguiente y anterior para YouTube Music
  const handleNextTrack = () => {
    const sourceList = ytmSearchResults.length > 0 ? ytmSearchResults : POPULAR_MUSIC_CATALOG;
    const currentIdx = sourceList.findIndex((t) => t.id === activeTrack.id);
    const nextIdx = (currentIdx + 1) % sourceList.length;
    handleSelectYtmTrack(sourceList[nextIdx]);
  };

  const handlePrevTrack = () => {
    const sourceList = ytmSearchResults.length > 0 ? ytmSearchResults : POPULAR_MUSIC_CATALOG;
    const currentIdx = sourceList.findIndex((t) => t.id === activeTrack.id);
    const prevIdx = (currentIdx - 1 + sourceList.length) % sourceList.length;
    handleSelectYtmTrack(sourceList[prevIdx]);
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

  // Búsqueda real en YouTube Normal Video con YouTube Data API v3
  const executeYtnSearch = async (queryStr: string) => {
    const q = queryStr.trim();
    if (!q) {
      setYtnSearchResults([]);
      setHasSearchedYtn(false);
      return;
    }

    setHasSearchedYtn(true);
    setIsSearchingYtn(true);

    try {
      const results = await searchYouTube(q, 'YouTube');
      const mapped: VideoItem[] = results.map((r) => ({
        id: r.id,
        title: r.title,
        channel: r.channel,
        ytId: r.ytId,
        thumbnail: r.thumbnail,
        duration: r.duration,
      }));
      setYtnSearchResults(mapped);
    } catch (err) {
      console.warn('Error en búsqueda de YouTube Video:', err);
    } finally {
      setIsSearchingYtn(false);
    }
  };

  const handleYtnSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeYtnSearch(ytnSearchInput);
  };

  const handleSelectYtnVideo = (video: VideoItem) => {
    setActiveVideo(video);
    setIsPlayingYtn(true);
    updateMyCurrentTrack({
      title: video.title,
      artist: video.channel,
      source: 'YouTube',
      isPlaying: true,
      albumArt: video.thumbnail,
    });
    syncWithPhoneMediaSession(
      {
        title: video.title,
        artist: video.channel,
        albumArt: video.thumbnail,
      },
      true
    );
  };

  // Sincronización MediaSession API para VLC MP3 Local en Android
  const syncVlcMediaSession = (track: CachedVlcTrack | null, playing: boolean) => {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator && track) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: track.name,
          artist: 'Reproductor VLC Duo',
          album: 'Música MP3 Local',
          artwork: [
            {
              src: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=60',
              sizes: '512x512',
              type: 'image/jpeg',
            },
          ],
        });

        navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';

        navigator.mediaSession.setActionHandler('play', () => {
          if (localAudioRef.current) {
            localAudioRef.current.play();
            setIsPlayingVlc(true);
            updateMyCurrentTrack({
              title: track.name,
              artist: 'VLC Duo MP3 Local',
              source: 'MP3 Local',
              isPlaying: true,
            });
          }
        });

        navigator.mediaSession.setActionHandler('pause', () => {
          if (localAudioRef.current) {
            localAudioRef.current.pause();
            setIsPlayingVlc(false);
            updateMyCurrentTrack({
              title: track.name,
              artist: 'VLC Duo MP3 Local',
              source: 'MP3 Local',
              isPlaying: false,
            });
          }
        });

        navigator.mediaSession.setActionHandler('previoustrack', () => {
          handlePrevVlcTrack();
        });

        navigator.mediaSession.setActionHandler('nexttrack', () => {
          handleNextVlcTrack();
        });

        navigator.mediaSession.setActionHandler('seekforward', (details) => {
          if (localAudioRef.current) {
            const skip = details.seekOffset || 10;
            localAudioRef.current.currentTime = Math.min(
              localAudioRef.current.duration || 1000,
              localAudioRef.current.currentTime + skip
            );
          }
        });

        navigator.mediaSession.setActionHandler('seekbackward', (details) => {
          if (localAudioRef.current) {
            const skip = details.seekOffset || 10;
            localAudioRef.current.currentTime = Math.max(
              0,
              localAudioRef.current.currentTime - skip
            );
          }
        });

        navigator.mediaSession.setActionHandler('seekto', (details) => {
          if (localAudioRef.current && details.seekTime !== undefined) {
            localAudioRef.current.currentTime = details.seekTime;
          }
        });
      } catch {
        // sandbox notice
      }
    }
  };

  // Manejo de VLC MP3 Local estricto con almacenamiento en IndexedDB
  const handleScanPhoneMp3Only = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newTracks: CachedVlcTrack[] = [];
    const toStore: Array<{ id: string; name: string; sizeStr: string; blob: Blob }> = [];
    let ignoredCount = 0;

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const isMp3 =
        f.name.toLowerCase().endsWith('.mp3') ||
        f.type === 'audio/mpeg' ||
        f.type === 'audio/mp3';

      if (!isMp3) {
        ignoredCount++;
        continue;
      }

      const url = URL.createObjectURL(f);
      const sizeStr = `${(f.size / (1024 * 1024)).toFixed(1)} MB`;
      const id = `mp3_${Date.now()}_${i}`;
      const cleanName = f.name.replace(/\.[^/.]+$/, '');

      newTracks.push({
        id,
        name: cleanName,
        sizeStr,
        dataUrl: url,
        blob: f,
      });

      toStore.push({
        id,
        name: cleanName,
        sizeStr,
        blob: f,
      });
    }

    if (ignoredCount > 0) {
      setIgnoredFilesNotice(
        `Se filtraron ${ignoredCount} archivos no-MP3 para mantener tu biblioteca musical pura.`
      );
      setTimeout(() => setIgnoredFilesNotice(null), 5000);
    }

    if (newTracks.length > 0) {
      // Guardar en IndexedDB para persistencia permanente al recargar
      await saveMultipleVlcTracks(toStore);
      setVlcTracks((prev) => [...newTracks, ...prev]);
      setActiveVlcTrack(newTracks[0]);
      setIsPlayingVlc(true);
      updateMyCurrentTrack({
        title: newTracks[0].name,
        artist: 'VLC Duo MP3 Local',
        source: 'MP3 Local',
        isPlaying: true,
      });
      syncVlcMediaSession(newTracks[0], true);
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
            artist: 'VLC Duo MP3 Local',
            source: 'MP3 Local',
            isPlaying: false,
          });
          syncVlcMediaSession(track, false);
        } else {
          localAudioRef.current.play();
          setIsPlayingVlc(true);
          updateMyCurrentTrack({
            title: track.name,
            artist: 'VLC Duo MP3 Local',
            source: 'MP3 Local',
            isPlaying: true,
          });
          syncVlcMediaSession(track, true);
        }
      }
    } else {
      setActiveVlcTrack(track);
      setIsPlayingVlc(true);
      updateMyCurrentTrack({
        title: track.name,
        artist: 'VLC Duo MP3 Local',
        source: 'MP3 Local',
        isPlaying: true,
      });
      syncVlcMediaSession(track, true);
    }
  };

  // Controles VLC: Siguiente, Anterior, Adelantar 10s, Retroceder 10s, Seek y Volumen
  const handleNextVlcTrack = () => {
    if (vlcTracks.length === 0) return;
    const currentIdx = vlcTracks.findIndex((t) => t.id === activeVlcTrack?.id);
    let nextIdx = (currentIdx + 1) % vlcTracks.length;

    if (isVlcShuffle && vlcTracks.length > 1) {
      do {
        nextIdx = Math.floor(Math.random() * vlcTracks.length);
      } while (nextIdx === currentIdx);
    }

    const nextTrack = vlcTracks[nextIdx];
    setActiveVlcTrack(nextTrack);
    setIsPlayingVlc(true);
    updateMyCurrentTrack({
      title: nextTrack.name,
      artist: 'VLC Duo MP3 Local',
      source: 'MP3 Local',
      isPlaying: true,
    });
    syncVlcMediaSession(nextTrack, true);
  };

  const handlePrevVlcTrack = () => {
    if (vlcTracks.length === 0) return;
    if (localAudioRef.current && localAudioRef.current.currentTime > 3) {
      localAudioRef.current.currentTime = 0;
      return;
    }
    const currentIdx = vlcTracks.findIndex((t) => t.id === activeVlcTrack?.id);
    const prevIdx = (currentIdx - 1 + vlcTracks.length) % vlcTracks.length;
    const prevTrack = vlcTracks[prevIdx];
    setActiveVlcTrack(prevTrack);
    setIsPlayingVlc(true);
    updateMyCurrentTrack({
      title: prevTrack.name,
      artist: 'VLC Duo MP3 Local',
      source: 'MP3 Local',
      isPlaying: true,
    });
    syncVlcMediaSession(prevTrack, true);
  };

  const handleVlcSeek = (time: number) => {
    setVlcProgress(time);
    if (localAudioRef.current) {
      localAudioRef.current.currentTime = time;
    }
  };

  const handleVlcForward10 = () => {
    if (localAudioRef.current) {
      const targetTime = Math.min(vlcDuration, localAudioRef.current.currentTime + 10);
      localAudioRef.current.currentTime = targetTime;
      setVlcProgress(targetTime);
    }
  };

  const handleVlcRewind10 = () => {
    if (localAudioRef.current) {
      const targetTime = Math.max(0, localAudioRef.current.currentTime - 10);
      localAudioRef.current.currentTime = targetTime;
      setVlcProgress(targetTime);
    }
  };

  const handleVlcVolumeChange = (vol: number) => {
    setVlcVolume(vol);
    if (localAudioRef.current) {
      localAudioRef.current.volume = vol;
      localAudioRef.current.muted = vol === 0;
    }
    setIsVlcMuted(vol === 0);
  };

  const toggleVlcMute = () => {
    if (localAudioRef.current) {
      const nextMuted = !isVlcMuted;
      setIsVlcMuted(nextMuted);
      localAudioRef.current.muted = nextMuted;
    }
  };

  const onVlcEnded = () => {
    if (vlcRepeatMode === 'one' && localAudioRef.current) {
      localAudioRef.current.currentTime = 0;
      localAudioRef.current.play();
    } else {
      handleNextVlcTrack();
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
                    disabled={isSearchingYtm}
                    className="px-4 py-2.5 rounded-2xl btn-3d-rose text-white text-xs font-bold cursor-pointer shrink-0 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isSearchingYtm ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Buscando...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-3.5 h-3.5" />
                        <span>Buscar</span>
                      </>
                    )}
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
                        <span>Resultados de YouTube Music ({ytmSearchResults.length}):</span>
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                      {ytmSearchResults.map((track) => {
                        const isCurrent = activeTrack.id === track.id;
                        return (
                          <div
                            key={track.id}
                            className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 text-left transition-all group ${
                              isCurrent
                                ? 'bg-rose-500/30 border-rose-400 shadow-md ring-1 ring-rose-400/50'
                                : 'bg-white/5 hover:bg-rose-500/15 border-white/10 hover:border-rose-400/30'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={track.albumArt}
                                alt={track.title}
                                className="w-11 h-11 rounded-lg object-cover shrink-0 shadow-sm"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-white truncate group-hover:text-rose-200">
                                  {track.title}
                                </p>
                                <p className="text-[10px] text-white/60 truncate">
                                  {track.artist}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-white/10 text-white/70 font-mono">
                                    ⏱️ {track.duration || '3:30'}
                                  </span>
                                  {track.genre && (
                                    <span className="text-[9px] text-rose-300/80 font-medium truncate">
                                      {track.genre}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleSelectYtmTrack(track)}
                              className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 active:scale-95 text-white text-[10px] font-black shrink-0 flex items-center gap-1 transition-all cursor-pointer shadow-md"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>{isCurrent && isPlayingYtm ? 'Sonando' : 'Elegir'}</span>
                            </button>
                          </div>
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
                  src={`https://www.youtube-nocookie.com/embed/${activeTrack.ytId}?autoplay=${
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
                    disabled={isSearchingYtn}
                    className="px-4 py-2.5 rounded-2xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-xs cursor-pointer shadow-md shrink-0 flex items-center gap-1.5"
                  >
                    {isSearchingYtn ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Buscando...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-3.5 h-3.5" />
                        <span>Buscar Video</span>
                      </>
                    )}
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                      {ytnSearchResults.map((video) => {
                        const isCurrent = activeVideo.id === video.id;
                        return (
                          <div
                            key={video.id}
                            className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 text-left transition-all group ${
                              isCurrent
                                ? 'bg-red-600/30 border-red-400 shadow-md ring-1 ring-red-400/50'
                                : 'bg-white/5 hover:bg-red-600/15 border-white/10 hover:border-red-400/30'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={video.thumbnail}
                                alt={video.title}
                                className="w-14 h-10 rounded-lg object-cover shrink-0 shadow-sm"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-white truncate group-hover:text-red-200">
                                  {video.title}
                                </p>
                                <p className="text-[10px] text-white/60 truncate">
                                  {video.channel}
                                </p>
                                <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-white/10 text-white/70 font-mono mt-0.5 inline-block">
                                  ⏱️ {video.duration || 'Reproduciendo'}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleSelectYtnVideo(video)}
                              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[10px] font-black shrink-0 flex items-center gap-1 transition-colors cursor-pointer shadow-md active:scale-95"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>{isCurrent && isPlayingYtn ? 'Viendo' : 'Elegir'}</span>
                            </button>
                          </div>
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

              {/* TRACK ACTIVO VLC CON INTERFAZ MEJORADA */}
              {activeVlcTrack && activeVlcTrack.dataUrl ? (
                <div className="p-4 sm:p-5 rounded-3xl bg-black/70 border border-amber-400/40 space-y-4 shadow-2xl">
                  {/* Título de la pista y formato verificado */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        Reproduciendo en VLC Duo
                      </span>
                      <h5 className="font-black text-sm sm:text-base text-white truncate mt-0.5">
                        🎵 {activeVlcTrack.name}
                      </h5>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-[10px] text-amber-200 font-mono shrink-0">
                      MP3 Local
                    </span>
                  </div>

                  {/* BARRA DE PROGRESO ARRASTRABLE */}
                  <div className="space-y-1.5">
                    <input
                      type="range"
                      min="0"
                      max={vlcDuration || 1}
                      step="0.5"
                      value={vlcProgress}
                      onChange={(e) => handleVlcSeek(Number(e.target.value))}
                      className="w-full h-2 rounded-lg appearance-none bg-white/20 cursor-pointer accent-amber-400 hover:bg-white/30 transition-all"
                    />
                    <div className="flex items-center justify-between text-[11px] text-amber-200/70 font-mono px-0.5">
                      <span>{formatSecs(vlcProgress)}</span>
                      <span>{formatSecs(vlcDuration)}</span>
                    </div>
                  </div>

                  {/* BOTONES DE CONTROL COMPLETOS: SHUFFLE, ANTERIOR, RETROCEDER, PLAY/PAUSA, ADELANTAR, SIGUIENTE, REPEAT */}
                  <div className="flex items-center justify-center gap-2 sm:gap-3 pt-1">
                    {/* Botón Shuffle / Aleatorio */}
                    <button
                      type="button"
                      onClick={() => setIsVlcShuffle(!isVlcShuffle)}
                      className={`p-2 sm:p-2.5 rounded-2xl border transition-all cursor-pointer ${
                        isVlcShuffle
                          ? 'bg-amber-500 text-slate-950 font-black border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.6)]'
                          : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                      }`}
                      title={isVlcShuffle ? 'Modo Aleatorio: Activo' : 'Activar Modo Aleatorio'}
                    >
                      <Shuffle className="w-4 h-4" />
                    </button>

                    {/* Botón Canción Anterior */}
                    <button
                      type="button"
                      onClick={handlePrevVlcTrack}
                      className="p-2 sm:p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white cursor-pointer active:scale-90 transition-all"
                      title="Canción Anterior"
                    >
                      <SkipBack className="w-4 h-4 fill-current" />
                    </button>

                    {/* Botón Retroceder 10 segundos */}
                    <button
                      type="button"
                      onClick={handleVlcRewind10}
                      className="px-2.5 py-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white/90 text-[11px] font-bold flex items-center gap-1 cursor-pointer active:scale-90 transition-all"
                      title="Retroceder 10 segundos"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>-10s</span>
                    </button>

                    {/* BOTÓN PRINCIPAL PLAY / PAUSA */}
                    <button
                      type="button"
                      onClick={() => toggleVlcPlay(activeVlcTrack)}
                      className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 flex items-center justify-center cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.5)] active:scale-95 transition-all"
                      title={isPlayingVlc ? 'Pausar' : 'Reproducir'}
                    >
                      {isPlayingVlc ? (
                        <Pause className="w-6 h-6 fill-current" />
                      ) : (
                        <Play className="w-6 h-6 fill-current ml-0.5" />
                      )}
                    </button>

                    {/* Botón Adelantar 10 segundos */}
                    <button
                      type="button"
                      onClick={handleVlcForward10}
                      className="px-2.5 py-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white/90 text-[11px] font-bold flex items-center gap-1 cursor-pointer active:scale-90 transition-all"
                      title="Adelantar 10 segundos"
                    >
                      <span>+10s</span>
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>

                    {/* Botón Canción Siguiente */}
                    <button
                      type="button"
                      onClick={handleNextVlcTrack}
                      className="p-2 sm:p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white cursor-pointer active:scale-90 transition-all"
                      title="Canción Siguiente"
                    >
                      <SkipForward className="w-4 h-4 fill-current" />
                    </button>

                    {/* Botón Repeat / Bucle */}
                    <button
                      type="button"
                      onClick={() => {
                        if (vlcRepeatMode === 'all') setVlcRepeatMode('one');
                        else if (vlcRepeatMode === 'one') setVlcRepeatMode('off');
                        else setVlcRepeatMode('all');
                      }}
                      className={`p-2 sm:p-2.5 rounded-2xl border transition-all cursor-pointer relative ${
                        vlcRepeatMode !== 'off'
                          ? 'bg-amber-500 text-slate-950 font-black border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.6)]'
                          : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                      }`}
                      title={`Repetición: ${
                        vlcRepeatMode === 'all'
                          ? 'Todas las canciones'
                          : vlcRepeatMode === 'one'
                          ? 'Canción actual en bucle'
                          : 'Desactivado'
                      }`}
                    >
                      <Repeat className="w-4 h-4" />
                      {vlcRepeatMode === 'one' && (
                        <span className="absolute -top-1 -right-1 text-[9px] bg-red-600 text-white font-black rounded-full px-1">
                          1
                        </span>
                      )}
                    </button>
                  </div>

                  {/* CONTROL DE VOLUMEN CON SLIDER Y MUTE */}
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={toggleVlcMute}
                        className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-amber-200 cursor-pointer transition-colors"
                        title={isVlcMuted ? 'Activar Sonido' : 'Silenciar'}
                      >
                        {isVlcMuted || vlcVolume === 0 ? (
                          <VolumeX className="w-4 h-4 text-rose-400" />
                        ) : (
                          <Volume2 className="w-4 h-4 text-amber-300" />
                        )}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={isVlcMuted ? 0 : vlcVolume}
                        onChange={(e) => handleVlcVolumeChange(Number(e.target.value))}
                        className="w-24 sm:w-32 h-1.5 rounded-lg appearance-none bg-white/20 cursor-pointer accent-amber-400"
                        title={`Volumen: ${Math.round((isVlcMuted ? 0 : vlcVolume) * 100)}%`}
                      />
                      <span className="text-[10px] text-white/60 font-mono w-8">
                        {Math.round((isVlcMuted ? 0 : vlcVolume) * 100)}%
                      </span>
                    </div>

                    <span className="text-[10px] text-amber-300/80 font-mono hidden sm:inline-block">
                      Notificaciones Android Activas 📱
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-black/40 border border-white/10 text-center text-xs text-white/50 italic">
                  No hay canción MP3 reproduciéndose. Pulsa "📁 Escoger Carpeta" para cargar tu música local desde el teléfono.
                </div>
              )}

              {/* BIBLIOTECA VLC MP3 CON CACHÉ INDEXEDDB */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-white/60 flex items-center gap-1.5">
                    <ListMusic className="w-3.5 h-3.5 text-amber-400" />
                    Biblioteca MP3 guardada en teléfono ({vlcTracks.length} canciones):
                  </span>
                  {vlcTracks.length > 0 && (
                    <button
                      type="button"
                      onClick={async () => {
                        await clearAllStoredVlcTracks();
                        setVlcTracks([]);
                        setActiveVlcTrack(null);
                        setIsPlayingVlc(false);
                      }}
                      className="text-[10px] text-white/40 hover:text-rose-300 cursor-pointer"
                    >
                      Limpiar caché
                    </button>
                  )}
                </div>

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
                              ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold shadow-md'
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

      {/* ELEMENTO DE AUDIO VLC PERSISTENTE EN EL DOM (SIGUE SONANDO AL CERRAR EL MODAL) */}
      <audio
        ref={localAudioRef}
        src={activeVlcTrack?.dataUrl}
        autoPlay={isPlayingVlc}
        onTimeUpdate={onTimeUpdateVlc}
        onEnded={onVlcEnded}
        className="hidden"
      />

      {/* REPRODUCTOR EN SEGUNDO PLANO DE YOUTUBE CUANDO EL MODAL ESTÁ CERRADO (AL CERRAR SIGUE SONANDO) */}
      {!isOpen && isPlayingYtm && activeTrack?.ytId && (
        <div
          className="fixed -bottom-96 -right-96 w-1 h-1 opacity-0 pointer-events-none overflow-hidden"
          aria-hidden="true"
        >
          <iframe
            title="Background YouTube Audio"
            src={`https://www.youtube-nocookie.com/embed/${activeTrack.ytId}?autoplay=1&enablejsapi=1`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      )}
    </>
  );
};
