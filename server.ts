import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '15mb' }));

// Servir la carpeta pública de forma estática siempre (imágenes webp de baraja, iconos, manifest)
app.use(express.static(path.resolve(__dirname, 'public')));
app.use('/cards', express.static(path.resolve(__dirname, 'public/cards')));

// ---------------------------------------------------------------------------
// SINCRONIZACIÓN EN TIEMPO REAL ENTRE APP 1 Y APP 2 (PAREJA INDEPENDIENTE)
// ---------------------------------------------------------------------------
interface SyncMessage {
  id: string;
  sender: 'me' | 'partner';
  senderName: string;
  text?: string;
  imageUrl?: string;
  audioUrl?: string;
  timestamp: string;
}

interface PeerSyncData {
  lastUpdated: number;
  userProfile?: any; // estado, batería eléctrica, señal, ubicación en tiempo real
  messages: SyncMessage[];
  remindersShared?: any[];
}

const syncRooms: Map<string, { app1: PeerSyncData; app2: PeerSyncData }> = new Map();

// Endpoint para vincular o crear código de pareja
app.post('/api/sync/pair', (req, res) => {
  const { pairCode } = req.body;
  const cleanCode = (pairCode || 'DUO-AMOR').trim().toUpperCase();

  if (!syncRooms.has(cleanCode)) {
    syncRooms.set(cleanCode, {
      app1: { lastUpdated: Date.now(), messages: [] },
      app2: { lastUpdated: Date.now(), messages: [] },
    });
  }

  return res.json({
    success: true,
    pairCode: cleanCode,
    connectedUsers: 2,
  });
});

// Endpoint para empujar actualización (desde App 1 o App 2)
app.post('/api/sync/push', (req, res) => {
  const { pairCode, role, userProfile, newMessage, remindersShared } = req.body;
  const cleanCode = (pairCode || 'DUO-AMOR').trim().toUpperCase();

  let room = syncRooms.get(cleanCode);
  if (!room) {
    room = {
      app1: { lastUpdated: Date.now(), messages: [] },
      app2: { lastUpdated: Date.now(), messages: [] },
    };
    syncRooms.set(cleanCode, room);
  }

  const slot = role === 'partner' ? 'app2' : 'app1';
  const targetPeer = role === 'partner' ? 'app1' : 'app2';

  if (userProfile) {
    room[slot].userProfile = userProfile;
    room[slot].lastUpdated = Date.now();
  }

  if (newMessage) {
    // Almacenar en ambas ranuras
    room[slot].messages.push(newMessage);
    room[targetPeer].messages.push(newMessage);
    // Limitar historial
    if (room[slot].messages.length > 100) room[slot].messages.shift();
    if (room[targetPeer].messages.length > 100) room[targetPeer].messages.shift();
    room[slot].lastUpdated = Date.now();
    room[targetPeer].lastUpdated = Date.now();
  }

  if (remindersShared) {
    room[slot].remindersShared = remindersShared;
    room[targetPeer].remindersShared = remindersShared;
    room[slot].lastUpdated = Date.now();
    room[targetPeer].lastUpdated = Date.now();
  }

  return res.json({ success: true, timestamp: Date.now() });
});

// Endpoint para traer actualizaciones del compañero
app.get('/api/sync/pull', (req, res) => {
  const cleanCode = ((req.query.pairCode as string) || 'DUO-AMOR').trim().toUpperCase();
  const role = (req.query.role as string) || 'me';

  const room = syncRooms.get(cleanCode);
  if (!room) {
    return res.json({ success: true, partnerProfile: null, newMessages: [], remindersShared: null });
  }

  const partnerSlot = role === 'partner' ? 'app1' : 'app2';
  const mySlot = role === 'partner' ? 'app2' : 'app1';

  return res.json({
    success: true,
    partnerProfile: room[partnerSlot].userProfile || null,
    messages: room[mySlot].messages || [],
    remindersShared: room[partnerSlot].remindersShared || null,
    lastUpdated: room[partnerSlot].lastUpdated,
  });
});

// ---------------------------------------------------------------------------
// 1. ENDPOINT GEMINI AI (SERVER-SIDE SEGÚN SKILL GEMINI-API)
// ---------------------------------------------------------------------------
app.post('/api/gemini/ask', async (req, res) => {
  try {
    const { prompt, systemInstruction } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Se requiere una pregunta o consulta válida.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'No se encontró GEMINI_API_KEY en el servidor.',
        text: 'La clave GEMINI_API_KEY no está configurada en las variables de entorno del servidor.',
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: { 'User-Agent': 'aistudio-build' },
      },
    });

    let resultText = '';
    const sources: Array<{ title: string; url: string }> = [
      {
        title: `Búsqueda en Google sobre "${prompt}"`,
        url: `https://www.google.com/search?q=${encodeURIComponent(prompt)}`,
      },
    ];
    const searchQueries: string[] = [prompt];

    const instruction =
      systemInstruction ||
      `Eres Gemini, el asistente oficial de Inteligencia Artificial de Google integrado en Happy Life Duo (la app de bienestar, parejas, ciencia y vida cotidiana).
Tus respuestas NUNCA deben ser sosas, cortas o vacías. Deben ser COMPLETAS, FASCINANTES, MUY BIEN ESTRUCTURADAS E INTERACTIVAS:
1. 📖 Explicación Rica y Profunda: Brinda información detallada, veraz y comprensible usando subtítulos claros, negritas para conceptos importantes y listas con viñetas.
2. 💡 Sabías Que / Dato Curioso: Agrega un dato fascinante o poco conocido relacionado con la pregunta.
3. 🎯 Acciones Prácticas / Consejos: Ofrece recomendaciones prácticas, ejemplos concretos o tips aplicables al día a día o a la pareja.
4. 🌟 Al final de tu respuesta, incluye siempre 3 sugerencias interactivas de preguntas que el usuario pueda hacer a continuación, en este formato exacto:
---SUGERENCIAS---
- [Pregunta de seguimiento 1]
- [Pregunta de seguimiento 2]
- [Pregunta de seguimiento 3]

Responde siempre en español con calidez, entusiasmo, sabiduría y rigor.`;

    // Intentar primero con gemini-3.1-flash-lite para máxima disponibilidad y rapidez sin 429
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          systemInstruction: instruction,
        },
      });
      resultText = response.text || '';
    } catch (errLite: any) {
      console.warn('Intento con gemini-3.1-flash-lite falló, reintentando con gemini-3.8-flash:', errLite?.message);
      const responseFlash = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: instruction,
        },
      });
      resultText = responseFlash.text || '';
    }

    // Extraer sugerencias interactivas si vienen en la respuesta
    let cleanedText = resultText;
    const extractedSuggestions: string[] = [];
    if (resultText.includes('---SUGERENCIAS---')) {
      const parts = resultText.split('---SUGERENCIAS---');
      cleanedText = parts[0].trim();
      const rawSuggs = parts[1] || '';
      const lines = rawSuggs.split('\n');
      for (const line of lines) {
        const clean = line.replace(/^[-*•\d.]+\s*/, '').trim();
        if (clean && clean.length > 3) {
          extractedSuggestions.push(clean);
        }
      }
    }

    if (extractedSuggestions.length === 0) {
      extractedSuggestions.push(
        `¿Puedes darme más detalles prácticos sobre ${prompt.slice(0, 30)}?`,
        `¿Qué consejos científicos o psicológicos recomiendas sobre esto?`,
        `Explícamelo con un ejemplo sencillo para el día a día`
      );
    }

    return res.json({
      success: true,
      text: cleanedText,
      suggestions: extractedSuggestions,
      sources,
      searchQueries,
    });
  } catch (error: any) {
    console.error('Error en /api/gemini/ask:', error);
    return res.status(500).json({
      error: error?.message || 'Error al consultar Gemini',
      text: `Ocurrió un error al procesar tu consulta con Gemini: ${error?.message || 'Error de conexión'}.`,
      sources: [
        {
          title: `Búsqueda directa en Google`,
          url: `https://www.google.com/search?q=${encodeURIComponent(req.body?.prompt || '')}`,
        },
      ],
      searchQueries: [req.body?.prompt || ''],
    });
  }
});

// ---------------------------------------------------------------------------
// 2. ENDPOINT YOUTUBE / YOUTUBE MUSIC (BÚSQUEDA REAL EN GOOGLE / YOUTUBE)
// ---------------------------------------------------------------------------
interface ScrapedVideo {
  id: string;
  ytId: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: string;
  source: string;
}

app.get('/api/youtube/search', async (req, res) => {
  const query = (req.query.q as string)?.trim() || '';
  const source = ((req.query.source as string) || 'YouTube Music') as 'YouTube' | 'YouTube Music';

  if (!query) {
    return res.json({ items: [] });
  }

  // A. Si el usuario ingresó un enlace o ID directo de YouTube
  const urlMatch = query.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (urlMatch && urlMatch[1]) {
    const directYtId = urlMatch[1];
    return res.json({
      items: [
        {
          id: `direct_${directYtId}`,
          ytId: directYtId,
          title: `Video directo de YouTube (${directYtId})`,
          channel: 'Canal Oficial de YouTube',
          thumbnail: `https://img.youtube.com/vi/${directYtId}/hqdefault.jpg`,
          duration: 'Reproduciendo',
          source,
        },
      ],
    });
  }

  const items: ScrapedVideo[] = [];

  // B. Búsqueda real conectada a YouTube vía scraping seguro de resultados públicos
  try {
    const searchQuery = source === 'YouTube Music' ? `${query} audio` : query;
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;
    
    const ytRes = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      },
    });

    if (ytRes.ok) {
      const html = await ytRes.text();
      const match =
        html.match(/ytInitialData\s*=\s*({.+?});<\/script>/s) ||
        html.match(/var\s+ytInitialData\s*=\s*({.+?});/s);

      if (match) {
        try {
          const data = JSON.parse(match[1]);
          const contents =
            data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]
              ?.itemSectionRenderer?.contents || [];

          for (const item of contents) {
            const v = item.videoRenderer;
            if (v && v.videoId && v.title?.runs?.[0]?.text) {
              const videoId = v.videoId;
              const title = v.title.runs[0].text;
              const channel = v.ownerText?.runs?.[0]?.text || 'YouTube';
              const duration = v.lengthText?.simpleText || '3:30';
              const thumbnail =
                v.thumbnail?.thumbnails?.slice(-1)[0]?.url ||
                `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

              items.push({
                id: videoId,
                ytId: videoId,
                title,
                channel,
                thumbnail,
                duration,
                source,
              });

              if (items.length >= 15) break;
            }
          }
        } catch (parseErr) {
          console.warn('Error parseando ytInitialData:', parseErr);
        }
      }

      // Si ytInitialData no dio resultados suficientes, usar regex directo
      if (items.length === 0) {
        const regex =
          /"videoId":"([a-zA-Z0-9_-]{11})","thumbnail":\{"thumbnails":\[\{"url":"([^"]+)".*?"title":\{"runs":\[\{"text":"([^"]+)"/g;
        let regMatch;
        while ((regMatch = regex.exec(html)) !== null && items.length < 12) {
          const vId = regMatch[1];
          if (!items.some((it) => it.ytId === vId)) {
            items.push({
              id: vId,
              ytId: vId,
              title: regMatch[3],
              channel: 'YouTube Video Oficial',
              thumbnail: `https://img.youtube.com/vi/${vId}/hqdefault.jpg`,
              duration: '3:30',
              source,
            });
          }
        }
      }
    }
  } catch (ytErr) {
    console.error('Error buscando en YouTube en servidor:', ytErr);
  }

  // C. Si la búsqueda no encontró nada (por ejemplo sin red), proveer resultados complementarios
  return res.json({ items });
});

// ---------------------------------------------------------------------------
// 3. INTEGRACIÓN VITE DEV / PRODUCTION STATIC SERVING
// ---------------------------------------------------------------------------
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Happy Life Duo server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
