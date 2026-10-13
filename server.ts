import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

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
// SINCRONIZACIÓN EN TIEMPO REAL CON AUTENTICACIÓN BEARER Y EMPAREJAMIENTO SEGURO
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
  userProfile?: any;
  messages: SyncMessage[];
  remindersShared?: any[];
  expensesShared?: any[];
}

interface SyncRoom {
  id: string;
  createdAt: number;
  app1Token: string;
  app2Token?: string;
  app1: PeerSyncData;
  app2: PeerSyncData;
  backup?: any;
}

interface DeviceSession {
  token: string;
  roomId: string;
  role: 'app1' | 'app2';
  createdAt: number;
  revoked: boolean;
}

interface PendingPairCode {
  code: string;
  roomId: string;
  creatorToken: string;
  createdAt: number;
  expiresAt: number;
  attempts: number;
  maxAttempts: number;
}

const syncRooms: Map<string, SyncRoom> = new Map();
const activeTokens: Map<string, DeviceSession> = new Map();
const pendingPairCodes: Map<string, PendingPairCode> = new Map();

// Limpiador automático de códigos temporales expirados
const cleanExpiredCodes = () => {
  const now = Date.now();
  for (const [code, pending] of pendingPairCodes.entries()) {
    if (now > pending.expiresAt || pending.attempts >= pending.maxAttempts) {
      pendingPairCodes.delete(code);
    }
  }
};

// Middleware/validador de autenticación Bearer estricto
const authenticateBearer = (
  req: express.Request
): { session: DeviceSession; room: SyncRoom; token: string } | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.slice(7).trim();
  if (!token) return null;

  const session = activeTokens.get(token);
  if (!session || session.revoked) return null;

  const room = syncRooms.get(session.roomId);
  if (!room) return null;

  return { session, room, token };
};

// 1. INICIAR EMPAREJAMIENTO: Genera código temporal seguro de un solo uso y emite token para Dispositivo 1
app.post(['/api/sync/pair/code', '/api/sync/pair/init'], (req, res) => {
  cleanExpiredCodes();

  // Generación criptográfica segura de código temporal de 6 caracteres (ej. HLD-7492)
  const codeNum = crypto.randomInt(1000, 9999);
  const pairCode = `HLD-${codeNum}`;

  const creatorToken = crypto.randomBytes(32).toString('hex');
  const roomId = crypto.randomUUID();

  const newRoom: SyncRoom = {
    id: roomId,
    createdAt: Date.now(),
    app1Token: creatorToken,
    app1: { lastUpdated: Date.now(), messages: [] },
    app2: { lastUpdated: Date.now(), messages: [] },
  };

  syncRooms.set(roomId, newRoom);

  activeTokens.set(creatorToken, {
    token: creatorToken,
    roomId,
    role: 'app1',
    createdAt: Date.now(),
    revoked: false,
  });

  pendingPairCodes.set(pairCode, {
    code: pairCode,
    roomId,
    creatorToken,
    createdAt: Date.now(),
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutos de validez
    attempts: 0,
    maxAttempts: 3,
  });

  return res.json({
    success: true,
    pairCode,
    deviceToken: creatorToken,
    expiresIn: 600,
  });
});

// 2. UNIRSE AL EMPAREJAMIENTO: Valida código temporal, destruye código y emite token secreto para Dispositivo 2
app.post(['/api/sync/pair', '/api/sync/pair/join'], (req, res) => {
  cleanExpiredCodes();
  const { pairCode } = req.body || {};

  if (!pairCode || typeof pairCode !== 'string' || !pairCode.trim()) {
    return res.status(400).json({ success: false, error: 'Código de emparejamiento requerido' });
  }

  const cleanCode = pairCode.trim().toUpperCase();
  const pending = pendingPairCodes.get(cleanCode);

  if (!pending) {
    return res.status(401).json({
      success: false,
      error: 'Código de emparejamiento inválido o inexistente. No se permite crear habitaciones arbitrarias.',
    });
  }

  if (Date.now() > pending.expiresAt) {
    pendingPairCodes.delete(cleanCode);
    return res.status(401).json({
      success: false,
      error: 'El código de emparejamiento ha expirado. Genera uno nuevo.',
    });
  }

  pending.attempts += 1;
  if (pending.attempts > pending.maxAttempts) {
    pendingPairCodes.delete(cleanCode);
    return res.status(401).json({
      success: false,
      error: 'Se superó el límite máximo de intentos permitidos para este código.',
    });
  }

  const room = syncRooms.get(pending.roomId);
  if (!room) {
    pendingPairCodes.delete(cleanCode);
    return res.status(404).json({ success: false, error: 'Habitación de sincronización no encontrada' });
  }

  // Generar token secreto independiente para el segundo dispositivo
  const joinerToken = crypto.randomBytes(32).toString('hex');
  room.app2Token = joinerToken;

  activeTokens.set(joinerToken, {
    token: joinerToken,
    roomId: pending.roomId,
    role: 'app2',
    createdAt: Date.now(),
    revoked: false,
  });

  // Destruir código temporal inmediatamente (uso único)
  pendingPairCodes.delete(cleanCode);

  return res.json({
    success: true,
    pairCode: cleanCode,
    deviceToken: joinerToken,
    role: 'partner',
  });
});

// 3. DESVINCULAR DISPOSITIVO: Revoca el token Bearer autenticado
app.post('/api/sync/unpair', (req, res) => {
  const auth = authenticateBearer(req);
  if (!auth) {
    return res.status(401).json({ success: false, error: 'Credencial Bearer requerida o no autorizada' });
  }

  auth.session.revoked = true;
  activeTokens.delete(auth.token);

  return res.json({ success: true, message: 'Dispositivo desvinculado con éxito' });
});

// 4. PUSH PROTEGIDO: Modifica datos exigiendo Authorization: Bearer <deviceToken>
app.post('/api/sync/push', (req, res) => {
  const auth = authenticateBearer(req);
  if (!auth) {
    return res.status(401).json({
      success: false,
      error: 'No autorizado: Credencial Bearer requerida para modificar datos de sincronización',
    });
  }

  const { session, room } = auth;
  const slot = session.role;
  const targetPeer = session.role === 'app1' ? 'app2' : 'app1';

  const { userProfile, partnerProfile, newMessage, remindersShared, expensesShared } = req.body || {};

  if (userProfile) {
    room[slot].userProfile = userProfile;
    room[slot].lastUpdated = Date.now();
  }

  if (partnerProfile) {
    room[targetPeer].userProfile = partnerProfile;
    room[targetPeer].lastUpdated = Date.now();
  }

  if (newMessage) {
    room[slot].messages.push(newMessage);
    room[targetPeer].messages.push(newMessage);
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

  if (expensesShared && Array.isArray(expensesShared)) {
    room[slot].expensesShared = expensesShared;
    room[targetPeer].expensesShared = expensesShared;
    room[slot].lastUpdated = Date.now();
    room[targetPeer].lastUpdated = Date.now();
  }

  return res.json({ success: true, timestamp: Date.now() });
});

// 5. PULL PROTEGIDO: Recupera información exigiendo Authorization: Bearer <deviceToken>
app.get('/api/sync/pull', (req, res) => {
  const auth = authenticateBearer(req);
  if (!auth) {
    return res.status(401).json({
      success: false,
      error: 'No autorizado: Credencial Bearer requerida para consultar sincronización',
    });
  }

  const { session, room } = auth;
  const partnerSlot = session.role === 'app1' ? 'app2' : 'app1';
  const mySlot = session.role;

  return res.json({
    success: true,
    partnerProfile: room[partnerSlot].userProfile || null,
    messages: room[mySlot].messages || [],
    remindersShared: room[partnerSlot].remindersShared || null,
    expensesShared: room[partnerSlot].expensesShared || null,
    lastUpdated: room[partnerSlot].lastUpdated,
  });
});

// 6. RESPALDO PROTEGIDO EN LA NUBE: Guardar y restaurar con autenticación Bearer
app.post('/api/sync/backup', (req, res) => {
  const auth = authenticateBearer(req);
  if (!auth) {
    return res.status(401).json({
      success: false,
      error: 'No autorizado: Credencial Bearer requerida para respaldar datos',
    });
  }

  const { room } = auth;
  const { data, email } = req.body || {};
  if (!data) {
    return res.status(400).json({ error: 'Faltan parámetros de respaldo' });
  }

  room.backup = {
    data,
    email: email || null,
    savedAt: Date.now(),
  };

  return res.json({ success: true, savedAt: Date.now() });
});

app.get('/api/sync/backup', (req, res) => {
  const auth = authenticateBearer(req);
  if (!auth) {
    return res.status(401).json({
      success: false,
      error: 'No autorizado: Credencial Bearer requerida para restaurar respaldo',
    });
  }

  const { room } = auth;
  return res.json({
    success: true,
    backup: room.backup ? room.backup.data : null,
    savedAt: room.backup ? room.backup.savedAt : null,
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
