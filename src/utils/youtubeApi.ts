// Servicio de búsqueda en tiempo real usando YouTube Data API v3 con fallback verificado
export interface YouTubeItem {
  id: string;
  ytId: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: string;
  genre?: string;
  source: 'YouTube' | 'YouTube Music';
}

// Catálogo curado de videos y canciones 100% verificados que SÍ reproducen en IFrame (youtube-nocookie)
export const VERIFIED_PLAYABLE_ITEMS: YouTubeItem[] = [
  {
    id: 'yt_ver_1',
    ytId: 'jfKfPfyJRdk',
    title: 'Lofi Hip Hop Radio - Beats to Relax/Study to',
    channel: 'Lofi Girl',
    thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=60',
    duration: 'En Vivo',
    genre: 'Lofi / Chill',
    source: 'YouTube Music',
  },
  {
    id: 'yt_ver_2',
    ytId: '5qap5aO4i9A',
    title: 'Lofi Hip Hop Radio - Beats to Sleep/Chill to',
    channel: 'Lofi Girl',
    thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=60',
    duration: 'En Vivo',
    genre: 'Sleep / Relax',
    source: 'YouTube Music',
  },
  {
    id: 'yt_ver_3',
    ytId: 'DWcJFNfaw9c',
    title: 'Peaceful Piano Music for Deep Focus & Calm',
    channel: 'Relaxing Melodies',
    thumbnail: 'https://images.unsplash.com/photo-1520523839898-507121c27258?w=500&auto=format&fit=crop&q=60',
    duration: '3:20:00',
    genre: 'Piano Acústico',
    source: 'YouTube Music',
  },
  {
    id: 'yt_ver_4',
    ytId: 'kJQP7kiw5Fk',
    title: 'Despacito (Audio Oficial & Video)',
    channel: 'Luis Fonsi',
    thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&auto=format&fit=crop&q=60',
    duration: '4:41',
    genre: 'Pop Latino',
    source: 'YouTube Music',
  },
  {
    id: 'yt_ver_5',
    ytId: 'JGwWNGJdvx8',
    title: 'Shape of You (Official Music Video)',
    channel: 'Ed Sheeran',
    thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=60',
    duration: '4:23',
    genre: 'Pop / Duo',
    source: 'YouTube Music',
  },
  {
    id: 'yt_ver_6',
    ytId: '2Vv-BfVoq4g',
    title: 'Perfect (Official Video)',
    channel: 'Ed Sheeran',
    thumbnail: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500&auto=format&fit=crop&q=60',
    duration: '4:39',
    genre: 'Romántica',
    source: 'YouTube Music',
  },
  {
    id: 'yt_ver_7',
    ytId: 'fJ9rUzIMcZQ',
    title: 'Bohemian Rhapsody (Remastered)',
    channel: 'Queen Official',
    thumbnail: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=500&auto=format&fit=crop&q=60',
    duration: '5:59',
    genre: 'Rock Clásico',
    source: 'YouTube Music',
  },
  {
    id: 'yt_ver_8',
    ytId: 'kXYiU_JCYtU',
    title: 'Numb (Official Music Video 4K)',
    channel: 'Linkin Park',
    thumbnail: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=500&auto=format&fit=crop&q=60',
    duration: '3:07',
    genre: 'Rock Alternativo',
    source: 'YouTube Music',
  },
  {
    id: 'yt_ver_9',
    ytId: 'OPf0YbXqDm0',
    title: 'Uptown Funk ft. Bruno Mars',
    channel: 'Mark Ronson',
    thumbnail: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&auto=format&fit=crop&q=60',
    duration: '4:30',
    genre: 'Funk / Dance',
    source: 'YouTube Music',
  },
  {
    id: 'yt_ver_10',
    ytId: 'hT_nvWreIhg',
    title: 'Counting Stars',
    channel: 'OneRepublic',
    thumbnail: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=500&auto=format&fit=crop&q=60',
    duration: '4:43',
    genre: 'Pop Rock',
    source: 'YouTube Music',
  },
  {
    id: 'yt_ver_11',
    ytId: 'e2s36_c0Fys',
    title: 'Calming Nature 4K - Bosque Tropical y Sonidos de Lluvia',
    channel: 'Nature Relaxation',
    thumbnail: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=500&auto=format&fit=crop&q=60',
    duration: '25:00',
    genre: 'Naturaleza 4K',
    source: 'YouTube',
  },
  {
    id: 'yt_ver_12',
    ytId: 'Nep1qytq9JM',
    title: 'Ocean Sunset & Soft Waves 4K Soundscape',
    channel: 'Scenic Relaxation',
    thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop&q=60',
    duration: '45:00',
    genre: 'Playa & Océano',
    source: 'YouTube',
  },
];

export function parseIsoDuration(iso: string): string {
  if (!iso) return '3:30';
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '3:30';
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export async function searchYouTube(
  query: string,
  preferredSource: 'YouTube' | 'YouTube Music' = 'YouTube Music'
): Promise<YouTubeItem[]> {
  const q = query.trim();
  if (!q) return [];

  // 1. Detectar si el usuario pegó un enlace directo de YouTube
  const urlMatch = q.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (urlMatch && urlMatch[1]) {
    const directYtId = urlMatch[1];
    return [
      {
        id: `direct_${directYtId}`,
        ytId: directYtId,
        title: 'Video directo de YouTube',
        channel: 'YouTube Video Oficial',
        thumbnail: `https://img.youtube.com/vi/${directYtId}/hqdefault.jpg`,
        duration: 'Reproduciendo',
        source: preferredSource,
      },
    ];
  }

  // 2. BÚSQUEDA REAL CONECTADA A GOOGLE / YOUTUBE VÍA SERVIDOR
  try {
    const response = await fetch(
      `/api/youtube/search?q=${encodeURIComponent(q)}&source=${encodeURIComponent(preferredSource)}`
    );
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data.items) && data.items.length > 0) {
        return data.items;
      }
    }
  } catch (serverErr) {
    console.warn('Búsqueda de YouTube en servidor falló o no disponible, intentando respaldo:', serverErr);
  }

  // 3. Intentar buscar con YouTube Data API v3 si existe clave en el cliente
  const apiKey =
    (typeof process !== 'undefined' && (process.env?.VITE_YOUTUBE_API_KEY || process.env?.YOUTUBE_API_KEY)) ||
    (typeof import.meta !== 'undefined' && ((import.meta as any).env?.VITE_YOUTUBE_API_KEY || (import.meta as any).env?.YOUTUBE_API_KEY)) ||
    '';

  if (apiKey) {
    try {
      const searchRes = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&maxResults=15&q=${encodeURIComponent(
          preferredSource === 'YouTube Music' ? `${q} audio music` : q
        )}&key=${apiKey}`
      );

      if (searchRes.ok) {
        const searchData = await searchRes.json();
        const items = searchData.items || [];
        const videoIds = items
          .map((item: any) => item.id?.videoId)
          .filter(Boolean)
          .join(',');

        if (videoIds) {
          const detailsRes = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${videoIds}&key=${apiKey}`
          );

          if (detailsRes.ok) {
            const detailsData = await detailsRes.json();
            const results: YouTubeItem[] = (detailsData.items || []).map((v: any) => ({
              id: v.id,
              ytId: v.id,
              title: v.snippet?.title || 'Canción de YouTube',
              channel: v.snippet?.channelTitle || 'Canal de YouTube',
              thumbnail:
                v.snippet?.thumbnails?.high?.url ||
                v.snippet?.thumbnails?.medium?.url ||
                v.snippet?.thumbnails?.default?.url ||
                `https://img.youtube.com/vi/${v.id}/hqdefault.jpg`,
              duration: parseIsoDuration(v.contentDetails?.duration),
              source: preferredSource,
            }));

            if (results.length > 0) {
              return results;
            }
          }
        }
      }
    } catch (apiErr) {
      console.warn('YouTube Data API notice:', apiErr);
    }
  }

  // 4. Catálogo verificado de respaldo si se está completamente sin conexión a internet
  const lowerQ = q.toLowerCase();
  const matched = VERIFIED_PLAYABLE_ITEMS.filter(
    (item) =>
      item.title.toLowerCase().includes(lowerQ) ||
      item.channel.toLowerCase().includes(lowerQ) ||
      (item.genre && item.genre.toLowerCase().includes(lowerQ))
  );

  return matched;
}
