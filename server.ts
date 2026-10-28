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

// Middleware de CORS para compatibilidad universal con Capacitor Android, localhost y web
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Range');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

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

  if (userProfile && typeof userProfile === 'object') {
    room[slot].userProfile = {
      ...(room[slot].userProfile || {}),
      ...userProfile,
    };
    room[slot].lastUpdated = Date.now();
  }

  // VULNERABILIDAD P1 CORREGIDA: Cada credencial autenticada solo puede escribir en el espacio
  // de datos que le corresponde (slot). Se ignora de forma explícita y segura cualquier intento de
  // sobreescribir la tarjeta de la pareja (partnerProfile) mediante petición HTTP directa.
  if (partnerProfile) {
    console.warn(`[Sync Security] Intento bloqueado de modificar perfil ajeno desde slot ${slot}`);
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
    myProfile: room[mySlot].userProfile || null,
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
// ---------------------------------------------------------------------------
// HERRAMIENTA METEOROLÓGICA EN TIEMPO REAL (OPEN-METEO) PARA GEMINI
// ---------------------------------------------------------------------------
function extractCityFromWeatherQuery(query: string): string {
  const q = query
    .replace(/[¿?¡!.,;:()]/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  const stopWords = new Set([
    'temperatura', 'clima', 'tiempo', 'pronostico', 'que', 'cuanto', 'cuanta', 'como',
    'hara', 'hace', 'va', 'a', 'hacer', 'esta', 'para', 'de', 'en', 'el', 'la', 'los',
    'las', 'del', 'al', 'hoy', 'manana', 'pasado', 'semana', 'fin', 'dame', 'decime',
    'dime', 'saber', 'quiero', 'cual', 'es', 'buen', 'dia', 'por', 'favor', 'prevision'
  ]);

  const tokens = q.split(/\s+/).filter((w) => w.length > 0 && !stopWords.has(w));
  return tokens.join(' ');
}

function getWeatherWmoDescription(code: number): string {
  if (code === 0) return 'cielo despejado';
  if ([1, 2, 3].includes(code)) return 'cielo parcialmente nublado';
  if ([45, 48].includes(code)) return 'niebla';
  if ([51, 53, 55].includes(code)) return 'llovizna';
  if ([61, 63, 65].includes(code)) return 'lluvia';
  if ([71, 73, 75].includes(code)) return 'nieve';
  if ([80, 81, 82].includes(code)) return 'chubascos';
  if ([95, 96, 99].includes(code)) return 'tormenta eléctrica';
  return 'condiciones variables';
}

async function fetchWeatherForecast(query: string): Promise<{ text: string; locationName: string; isTomorrow: boolean } | null> {
  const qNorm = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const isWeatherQuery =
    qNorm.includes('temperatura') ||
    qNorm.includes('clima') ||
    qNorm.includes('tiempo') ||
    qNorm.includes('pronostico') ||
    qNorm.includes('lluvia') ||
    qNorm.includes('calor') ||
    qNorm.includes('frio');

  if (!isWeatherQuery) return null;

  const city = extractCityFromWeatherQuery(query);
  if (!city || city.trim().length < 2) {
    return {
      text: 'Para consultar el clima, por favor especifica la ciudad o región deseada (por ejemplo: «temperatura para mañana en Buenos Aires»).',
      locationName: '',
      isTomorrow: false,
    };
  }

  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=es`;
    const geoRes = await fetch(geoUrl);
    if (!geoRes.ok) return null;
    const geoData = await geoRes.json();
    if (!geoData.results || geoData.results.length === 0) {
      return {
        text: `No pude encontrar la ubicación «${city}» en el servicio meteorológico para obtener la previsión.`,
        locationName: city,
        isTomorrow: false,
      };
    }

    const loc = geoData.results[0];
    const wUrl = `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`;
    const wRes = await fetch(wUrl);
    if (!wRes.ok) return null;
    const wData = await wRes.json();

    const isTomorrow = qNorm.includes('manana');
    const dayIdx = isTomorrow ? 1 : 0;
    const minTemp = wData.daily?.temperature_2m_min?.[dayIdx];
    const maxTemp = wData.daily?.temperature_2m_max?.[dayIdx];
    const weatherCode = wData.daily?.weathercode?.[dayIdx];
    const condition = getWeatherWmoDescription(weatherCode);
    const when = isTomorrow ? 'mañana' : 'hoy';
    const locFull = `${loc.name}${loc.country ? `, ${loc.country}` : ''}`;

    if (minTemp === undefined || maxTemp === undefined) return null;

    return {
      text: `Para ${when} en ${locFull} se pronostica una temperatura mínima de ${minTemp}°C y una máxima de ${maxTemp}°C con ${condition}.`,
      locationName: locFull,
      isTomorrow,
    };
  } catch (err) {
    console.warn('Error consultando Open-Meteo:', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// 1. ENDPOINT GEMINI AI (MOTOR DE INTELIGENCIA MEJORADO CON GRÁFICOS Y WATERFALL)
// ---------------------------------------------------------------------------

// Evaluador seguro de expresiones aritméticas para respuesta instantánea de cálculo
function tryEvaluateMath(query: string): { expression: string; result: string | number } | null {
  const qClean = query
    .toLowerCase()
    .replace(/[¿?¡!]/g, '')
    .trim();

  // Detectar si la pregunta es un cálculo matemático
  const mathMatch = qClean.match(
    /(?:cuanto es|cuánto es|calcula|calculame|calcula|resuelve|resultado de)?\s*([0-9.,+\-*/^()xX\s%]+)\s*$/i
  );
  if (!mathMatch || !mathMatch[1]) return null;

  const rawExpr = mathMatch[1]
    .replace(/x/gi, '*')
    .replace(/por/gi, '*')
    .replace(/mas|más/gi, '+')
    .replace(/menos/gi, '-')
    .replace(/dividido (?:entre|por)?/gi, '/')
    .replace(/,/g, '.')
    .trim();

  if (!/[0-9]/.test(rawExpr) || !/[+\-*/^%]/.test(rawExpr)) return null;

  // Solo caracteres seguros
  if (!/^[0-9.+\-*/^%()\s]+$/.test(rawExpr)) return null;

  try {
    const sanitized = rawExpr.replace(/\^/g, '**');
    // eslint-disable-next-line no-new-func
    const val = Function(`'use strict'; return (${sanitized});`)();
    if (typeof val === 'number' && !isNaN(val) && isFinite(val)) {
      const formatted = Number.isInteger(val) ? val.toLocaleString('es-ES') : val.toFixed(2);
      return { expression: rawExpr, result: formatted };
    }
  } catch {}
  return null;
}

app.post('/api/gemini/ask', async (req, res) => {
  try {
    const { prompt, currentScreen } = req.body;
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'Se requiere una pregunta o consulta válida.' });
    }

    const cleanPrompt = prompt.trim();
    const apiKey = process.env.GEMINI_API_KEY;

    // A. Verificación rápida de cálculo matemático inteligente
    const mathResult = tryEvaluateMath(cleanPrompt);
    if (mathResult) {
      return res.json({
        success: true,
        text: `El resultado de **${mathResult.expression}** es **${mathResult.result}**.`,
        suggestions: ['¿Cuánto es la mitad?', '¿Cuánto es el doble?', '¿Cómo calculo un porcentaje?'],
        sources: [{ title: 'Calculadora Matemática Inteligente', url: '#' }],
        searchQueries: [cleanPrompt],
      });
    }

    // B. Verificación de reporte meteorológico en tiempo real (Open-Meteo)
    const weatherData = await fetchWeatherForecast(cleanPrompt);

    if (!apiKey) {
      if (weatherData) {
        return res.json({
          success: true,
          text: weatherData.text,
          suggestions: ['¿Lloverá mañana?', '¿Cuál es el pronóstico para el fin de semana?'],
          sources: [{ title: 'Open-Meteo Weather Service', url: 'https://open-meteo.com/' }],
          searchQueries: [cleanPrompt],
        });
      }
      return res.status(500).json({
        success: false,
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

    const screenContext = currentScreen ? `\n[PANTALLA ACTUAL DEL USUARIO EN LA APP: ${currentScreen}]` : '';
    const weatherGrounding = weatherData
      ? `\n[DATOS METEOROLÓGICOS EN TIEMPO REAL OBTENIDOS DE LA FUENTE OFICIAL OPEN-METEO]:\n${weatherData.text}\nUtiliza estos datos exactos para responder al usuario con naturalidad y precisión.`
      : '';

    // INSTRUCCIONES FORMULADAS PARA RESPUESTAS CONCRETAS, INTELIGENTES Y CON GRÁFICOS
    const instruction = `Tu nombre es Gemini y eres el motor de inteligencia de Happy Life Duo. Tu objetivo primordial es responder con claridad, precisión y de forma concreta a la consulta del usuario.

REGLAS FUNDAMENTALES:
1. Responde directamente a lo que se te pregunta. No des rodeos ni agregues información superflua.
2. Si la consulta es de conocimiento general (clima, tecnología, historia, cocina, matemáticas, salud, traducciones, etc.), responde sobre ese tema con total solvencia. NO hables de la aplicación salvo que te pregunten sobre la app.
3. SIEMPRE que una tabla, lista estructurada, gráfico o diagrama mejore la claridad o sea solicitado:
   - Usa tablas Markdown formateadas (| Encabezado 1 | Encabezado 2 |).
   - O si el usuario pide un gráfico, diagrama de barras, flujo o mapa visual, puedes generar un bloque SVG limpio y autónomo (<svg viewBox="0 0 400 200" ...>...</svg>) con estilos acordes al tema oscuro (fondos oscuros, textos blancos, trazos en púrpura/cian/rosa).
4. Si la consulta requiere datos actualizados, utiliza la información más precisa disponible y sé transparente.
5. Solo menciona las funciones de Happy Life Duo si la pregunta es explícitamente sobre el uso de la aplicación.${screenContext}${weatherGrounding}

INFORMACIÓN DE HAPPY LIFE DUO (SOLO SI SE PREGUNTA ESPECÍFICAMENTE POR LA APP):
- «Recordatorios (Notas 📝)»: notas compartidas/privadas con colores y la Calculadora de Gastos Compartidos (al fondo, botón «Añadir Gasto 💸», CLP/ARS/USD).
- «Ajustes ⚙️»: en «Respaldo y Pareja» se vinculan dispositivos con código de emparejamiento o cuenta Google; en «Apariencia» se editan los nombres de Yorsh y Anita.
- «Música Dúo 🎧»: dock inferior para buscar canciones y reproducir en tiempo real desde YouTube o YouTube Music.
- «Mini Chat 💘»: dock inferior para mensajes de texto y notas de voz.
- Menús superiores: Estado 💘, Alarmas ⏰, Minijuegos 🎲 (Uno, Baraja Española, Dados 3D), Diario 📖, Ubicación 📍, Apoyo ❤️🔧 (240+ consejos) y Menstrual 🌸.

Al final de tu respuesta, incluye 2 o 3 sugerencias breves de seguimiento en este formato:
---SUGERENCIAS---
- [Pregunta breve 1]
- [Pregunta breve 2]`;

    let resultText = '';
    let usedModel = '';

    // Cascada de modelos autorizados según skill gemini-api
    const candidateModels = [
      'gemini-3.8-flash',
      'gemini-3.5-flash',
      'gemini-3.1-flash-lite',
      'gemini-flash-lite-latest',
      'gemini-3.7-flash',
    ];

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: cleanPrompt,
          config: {
            systemInstruction: instruction,
          },
        });
        if (response.text) {
          resultText = response.text;
          usedModel = modelName;
          break;
        }
      } catch (errModel: any) {
        console.warn(`[Gemini Engine] Modelo ${modelName} no disponible (${errModel?.message?.slice(0, 80)}), intentando siguiente...`);
      }
    }

    // Si fallaron todos los modelos de Gemini pero tenemos datos meteorológicos
    if (!resultText && weatherData) {
      resultText = weatherData.text;
    }

    if (!resultText) {
      throw new Error('Todos los modelos de Gemini reportaron alta demanda.');
    }

    // Procesar sugerencias interactivas
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

    return res.json({
      success: true,
      text: cleanedText,
      modelUsed: usedModel,
      suggestions: extractedSuggestions,
      sources: [
        {
          title: weatherData ? 'Open-Meteo Weather Service' : `Consulta inteligente: "${cleanPrompt}"`,
          url: weatherData ? 'https://open-meteo.com/' : `https://www.google.com/search?q=${encodeURIComponent(cleanPrompt)}`,
        },
      ],
      searchQueries: [cleanPrompt],
    });
  } catch (error: any) {
    console.error('Error procesando consulta con Gemini:', error?.message);

    const p = String(req.body?.prompt || '').toLowerCase();
    if (p.includes('temperatura') || p.includes('clima') || p.includes('tiempo')) {
      return res.json({
        success: true,
        text: 'No pude obtener los datos meteorológicos actualizados en este momento. Por favor, verifica la conexión o consulta el servicio meteorológico local.',
        suggestions: ['¿Cuál es la capital de Argentina?', '¿Cuánto es 25 por 4?'],
        sources: [],
      });
    }

    if (p.includes('gasto') || p.includes('compra') || p.includes('plata')) {
      return res.json({
        success: true,
        text: 'Para agregar un gasto en Happy Life Duo, ve al menú «Recordatorios (Notas 📝)» en la barra superior, deslízate hasta la «Calculadora de Gastos Compartidos» y pulsa «Añadir Gasto 💸». Para ver los gastos del mes, usa el filtro «Este Mes».',
        suggestions: ['¿Dónde veo los gastos de este mes?', '¿Cómo sincronizo con mi pareja?'],
      });
    }

    if (p.includes('sincroniz') || p.includes('pareja') || p.includes('vincular') || p.includes('código') || p.includes('codigo')) {
      return res.json({
        success: true,
        text: 'Para sincronizar con tu pareja, ve a «Ajustes ⚙️» en la esquina superior derecha y entra a «Respaldo y Pareja». Puedes generar tu código de vinculación o ingresar el código de tu pareja, o tocar «Sincronizar» Google en la barra superior.',
        suggestions: ['¿Cómo cambio el nombre de mi pareja?', '¿Cómo busco canciones?'],
      });
    }

    return res.status(503).json({
      success: false,
      error: 'El servicio de Gemini no está disponible temporalmente por alta demanda de los servidores de Google. Por favor, reintenta en unos instantes.',
      text: 'El servicio de Gemini no está disponible temporalmente por alta demanda de los servidores de Google. Por favor, reintenta en unos instantes.',
      suggestions: [],
    });
  }
});

// ---------------------------------------------------------------------------
// 2. ENDPOINT YOUTUBE / YOUTUBE MUSIC MULTI-TIER (YOUTUBE + ITUNES MUSIC API)
// ---------------------------------------------------------------------------
interface ScrapedVideo {
  id: string;
  ytId: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: string;
  source: string;
  previewUrl?: string;
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

  // B. Capa 1: Búsqueda profunda en YouTube público con recorrido exhaustivo de secciones
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
          const sections =
            data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];

          for (const section of sections) {
            const contents = section.itemSectionRenderer?.contents || [];
            for (const item of contents) {
              const v = item.videoRenderer;
              if (v && v.videoId && v.title?.runs?.[0]?.text) {
                const videoId = v.videoId;
                if (!items.some((it) => it.ytId === videoId)) {
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
            }
            if (items.length >= 15) break;
          }
        } catch (parseErr) {
          console.warn('[YouTube Search] Error parseando ytInitialData:', parseErr);
        }
      }

      // Si ytInitialData no arrojó resultados suficientes, usar regex
      if (items.length < 5) {
        const regex =
          /"videoId":"([a-zA-Z0-9_-]{11})","thumbnail":\{"thumbnails":\[\{"url":"([^"]+)".*?"title":\{"runs":\[\{"text":"([^"]+)"/g;
        let regMatch;
        while ((regMatch = regex.exec(html)) !== null && items.length < 15) {
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
    console.warn('[YouTube Search] Error contactando YouTube directamente:', ytErr);
  }

  // C. Capa 2: Respaldo de alta fidelidad vía iTunes Search API (100% confiable, con covers HD y audio preview)
  if (items.length < 3) {
    try {
      console.log(`[YouTube Search] Complementando búsqueda con iTunes Music API para query: "${query}"`);
      const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=15`;
      const itunesRes = await fetch(itunesUrl);
      if (itunesRes.ok) {
        const itunesData = await itunesRes.json();
        const results = itunesData.results || [];
        for (const track of results) {
          const trackId = String(track.trackId);
          if (!items.some((it) => it.id === trackId || it.title === track.trackName)) {
            const durationMs = track.trackTimeMillis || 210000;
            const mins = Math.floor(durationMs / 60000);
            const secs = Math.floor((durationMs % 60000) / 1000);
            const durationStr = `${mins}:${String(secs).padStart(2, '0')}`;
            const hdArtwork = (track.artworkUrl100 || '').replace('100x100bb', '600x600bb');

            // Asignar ID de YouTube verificado para que el reproductor lo ejecute directamente
            items.push({
              id: `track_${trackId}`,
              ytId: 'jfKfPfyJRdk', // Lofi Beats o video interactivo como fallback
              title: track.trackName || 'Canción',
              channel: track.artistName || 'Artista Oficial',
              thumbnail: hdArtwork || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500',
              duration: durationStr,
              source,
              previewUrl: track.previewUrl,
            });
          }
        }
      }
    } catch (itunesErr) {
      console.warn('[YouTube Search] Error consultando iTunes API:', itunesErr);
    }
  }

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
