import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { DEFAULT_PRODUCTION_BACKEND } from './youtubeApi';

export interface GeminiResponse {
  success: boolean;
  text: string;
  suggestions: string[];
  isOfflineFallback?: boolean;
  isError?: boolean;
  error?: string;
  modelUsed?: string;
  sources?: Array<{ title: string; url: string }>;
  svgDiagram?: string;
}

/**
 * Obtiene la URL completa del endpoint /api/gemini/ask:
 * - En Android APK (Capacitor nativo): URL absoluta hacia DEFAULT_PRODUCTION_BACKEND o VITE_BACKEND_URL.
 * - En Web SPA: URL relativa '/api/gemini/ask'.
 */
export function getGeminiEndpoint(): string {
  const envUrl =
    (typeof process !== 'undefined' && (process.env?.VITE_BACKEND_URL || process.env?.VITE_API_URL)) ||
    (typeof import.meta !== 'undefined' &&
      ((import.meta as any).env?.VITE_BACKEND_URL || (import.meta as any).env?.VITE_API_URL)) ||
    '';

  if (envUrl) {
    return `${envUrl.replace(/\/$/, '')}/api/gemini/ask`;
  }

  if (typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform()) {
    return `${DEFAULT_PRODUCTION_BACKEND}/api/gemini/ask`;
  }

  return '/api/gemini/ask';
}

/**
 * Base de conocimiento local de Happy Life Duo:
 * Solo se activa cuando la consulta es ESPECÍFICAMENTE sobre funciones de la aplicación.
 * Para preguntas generales (clima, matemáticas, recetas, traducciones, etc.), devuelve null
 * para nunca confundir una consulta general con los menús de la aplicación.
 */
export function getOfflineHelpResponse(query: string, currentScreen: string = 'status'): GeminiResponse | null {
  const q = query.toLowerCase().trim();

  // 1. Cómo agregar un gasto / compra en la app
  if (
    q.includes('gasto') ||
    q.includes('compra') ||
    q.includes('plata') ||
    q.includes('dinero') ||
    q.includes('pagar') ||
    q.includes('anotar gasto') ||
    q.includes('agregar un gasto') ||
    q.includes('poner una compra')
  ) {
    if (q.includes('mes') || q.includes('este mes') || q.includes('ver') || q.includes('donde') || q.includes('dónde')) {
      return {
        success: true,
        text: 'Para ver los gastos de este mes, entra al menú «Recordatorios (Notas 📝)» en la barra superior y baja hasta la Calculadora de Gastos Compartidos. En el selector de período, pulsa «Este Mes» para ver el desglose y balance exacto.',
        suggestions: ['¿Cómo agrego un nuevo gasto?', '¿Cómo dividimos los gastos 50/50?'],
        isOfflineFallback: true,
      };
    }
    return {
      success: true,
      text: 'Para agregar un gasto en Happy Life Duo, entra al menú «Recordatorios (Notas 📝)» en la barra de navegación superior y desplázate hacia abajo hasta la Calculadora de Gastos Compartidos. Ingresa el monto, selecciona la categoría y moneda (CLP, ARS o USD) y pulsa «Añadir Gasto 💸».',
      suggestions: ['¿Dónde veo los gastos de este mes?', '¿Cómo funciona la división 50/50?'],
      isOfflineFallback: true,
    };
  }

  // 2. Sincronización con pareja
  if (
    q.includes('sincroniz') ||
    q.includes('pareja') ||
    q.includes('vincular') ||
    q.includes('conectar') ||
    q.includes('codigo de vinculacion') ||
    q.includes('código de vinculación') ||
    q.includes('emparejar')
  ) {
    return {
      success: true,
      text: 'Para sincronizarte con tu pareja, toca el botón «Ajustes ⚙️» en la esquina superior derecha y entra a la pestaña «Respaldo y Pareja». Allí puedes generar tu código de vinculación o ingresar el código de tu pareja. También puedes pulsar «Sincronizar» en el encabezado con tu cuenta Google.',
      suggestions: ['¿Cómo cambio el nombre de mi pareja?', '¿Cómo busco canciones?'],
      isOfflineFallback: true,
    };
  }

  // 3. Cambiar nombre en la app
  if (
    (q.includes('nombre') && (q.includes('cambio') || q.includes('cambiar') || q.includes('editar'))) ||
    q.includes('yorsh') ||
    q.includes('anita')
  ) {
    return {
      success: true,
      text: 'Para cambiar tu nombre o el de tu pareja en Happy Life Duo, pulsa el botón «Ajustes ⚙️» en la parte superior derecha. En la pestaña «Apariencia» o «Respaldo y Pareja», encontrarás los campos editables para personalizar sus nombres.',
      suggestions: ['¿Cómo cambio el fondo de pantalla?', '¿Cómo sincronizo con mi pareja?'],
      isOfflineFallback: true,
    };
  }

  // 4. Buscar canciones / Música Dúo
  if (
    (q.includes('cancion') || q.includes('canción') || q.includes('musica') || q.includes('música')) &&
    (q.includes('app') || q.includes('buscar') || q.includes('duo') || q.includes('dúo') || q.includes('reproducir') || q.includes('como') || q.includes('cómo'))
  ) {
    return {
      success: true,
      text: 'Para buscar música en Happy Life Duo, toca el botón «Música Dúo 🎧» en el dock flotante inferior. Se abrirá el reproductor con buscador integrado para reproducir temas en tiempo real desde YouTube o YouTube Music.',
      suggestions: ['¿Dónde está el Mini Chat?', '¿Cómo comparto una nota?'],
      isOfflineFallback: true,
    };
  }

  // 5. Explicar cómo funciona la pantalla actual
  if (
    q.includes('esta pantalla') ||
    q.includes('esta seccion') ||
    q.includes('esta sección') ||
    q.includes('como funciona aqui') ||
    q.includes('cómo funciona esta pantalla')
  ) {
    switch (currentScreen) {
      case 'status':
        return {
          success: true,
          text: 'Esta es la pantalla de «Estado actual 💘»: permite ajustar tu batería social (0-100%), tu estado de ánimo, tu actividad actual y ver la carga de batería de ambos en tiempo real con tarjetas individuales.',
          suggestions: ['¿Cómo cambio mi actividad?', '¿Dónde agrego un recordatorio?'],
          isOfflineFallback: true,
        };
      case 'reminders':
        return {
          success: true,
          text: 'En «Recordatorios 📝» puedes crear notas adhesivas con colores, tareas compartidas o privadas, checklists y, al final de la pantalla, gestionar la Calculadora de Gastos Compartidos.',
          suggestions: ['¿Cómo agrego un gasto?', '¿Cómo creo una nota privada?'],
          isOfflineFallback: true,
        };
      case 'alarms':
        return {
          success: true,
          text: 'En «Alarmas y reloj ⏰» programas alarmas diarias o por fecha con tonos relajantes seleccionables (Samsung, Huawei, Google, campanas zen) y opción de vincular con Google Calendar.',
          suggestions: ['¿Cómo cambio el tono de alarma?', '¿Cómo activo el modo nocturno?'],
          isOfflineFallback: true,
        };
      case 'minigames':
        return {
          success: true,
          text: 'En «Minijuegos 🎲» disfrutas de juegos interactivos para parejas: Cartas Uno, Baraja Española tradicional y lanzamiento de Dados 3D para tomar decisiones divertidas.',
          suggestions: ['¿Cómo lanzo los dados 3D?', '¿Dónde está el diario de vida?'],
          isOfflineFallback: true,
        };
      case 'journal':
        return {
          success: true,
          text: 'En «Diario de vida 📖» pueden escribir memorias juntos, adjuntar fotos de momentos especiales y registrar reflexiones de la mañana, tarde o noche.',
          suggestions: ['¿Cómo subo una foto al diario?', '¿Dónde está el apoyo emocional?'],
          isOfflineFallback: true,
        };
      case 'location':
        return {
          success: true,
          text: 'En «Ubicación 📍» visualizan su posición en un mapa de Google Maps con cálculo de distancia entre ustedes y marcas seguras sin invadir su privacidad.',
          suggestions: ['¿Cómo activo la ubicación en tiempo real?', '¿Dónde veo el estado actual?'],
          isOfflineFallback: true,
        };
      case 'emotional':
        return {
          success: true,
          text: 'En «Apoyo emocional ❤️🔧» tienes acceso a más de 240 consejos psicológicos organizados por categorías (TEA, TDAH, TLP y Regulación, Pareja) y el botón «Cambiar Tarjeta al Azar 🎲».',
          suggestions: ['¿Cómo cambio de consejo?', '¿Dónde está el calendario menstrual?'],
          isOfflineFallback: true,
        };
      case 'menstrual':
        return {
          success: true,
          text: 'En «Calendario menstrual 🌸» registras la fecha del último ciclo para predecir los próximos periodos, días fértiles y apoyar a tu pareja con empatía en cada fase.',
          suggestions: ['¿Cómo ajusto la duración del ciclo?', '¿Dónde están los ajustes de la app?'],
          isOfflineFallback: true,
        };
      default:
        break;
    }
  }

  // 6. Mini Chat en la app
  if ((q.includes('chat') || q.includes('mensaje')) && (q.includes('donde') || q.includes('dónde') || q.includes('como') || q.includes('cómo'))) {
    return {
      success: true,
      text: 'Para chatear con tu pareja, toca el botón «Mini Chat 💘» en el dock flotante inferior. Puedes enviar mensajes rápidos de texto, notas de voz y reacciones con emojis cariñosos.',
      suggestions: ['¿Dónde busco música?', '¿Cómo agrego un recordatorio?'],
      isOfflineFallback: true,
    };
  }

  // Si la pregunta es sobre Happy Life Duo en general
  if (q.includes('happy life duo') || q.includes('esta aplicacion') || q.includes('esta aplicación') || q.includes('esta app')) {
    return {
      success: true,
      text: `Happy Life Duo cuenta con 8 menús principales en la barra superior (Estado 💘, Recordatorios 📝 con Calculadora de Gastos, Alarmas ⏰, Minijuegos 🎲, Diario 📖, Ubicación 📍, Apoyo ❤️🔧 y Menstrual 🌸). En el dock inferior tienes Música Dúo 🎧 y Mini Chat 💘.`,
      suggestions: [
        '¿Cómo agrego un gasto?',
        '¿Cómo sincronizo con mi pareja?',
        '¿Cómo busco canciones?',
      ],
      isOfflineFallback: true,
    };
  }

  // Para cualquier consulta general (clima, ciencia, matemáticas, traducciones, etc.):
  // Devolver null para que NUNCA se reemplace por la descripción de la app
  return null;
}

/**
 * Consulta a Gemini mediante el endpoint /api/gemini/ask (vía servidor con clave segura),
 * compatible tanto con la Web SPA como con el APK Android de Capacitor.
 */
export async function askGemini(
  prompt: string,
  currentScreen: string = 'status',
  customInstruction?: string
): Promise<GeminiResponse> {
  const cleanPrompt = prompt.trim();
  if (!cleanPrompt) {
    return {
      success: false,
      text: 'Por favor, escribe una pregunta para consultar.',
      suggestions: [],
    };
  }

  const endpointUrl = getGeminiEndpoint();
  const isNative = typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();

  // 1. INTENTO NATIVO EN ANDROID VÍA CAPACITOR HTTP (SIN BLOQUEOS DE CORS EN EL WEBVIEW)
  if (isNative) {
    try {
      console.log(`[Gemini API] Solicitando respuesta nativa CapacitorHttp hacia: ${endpointUrl}`);
      const nativeRes = await CapacitorHttp.post({
        url: endpointUrl,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        data: {
          prompt: cleanPrompt,
          currentScreen,
          systemInstruction: customInstruction,
        },
      });

      if (nativeRes.status >= 200 && nativeRes.status < 300) {
        const data = typeof nativeRes.data === 'string' ? JSON.parse(nativeRes.data) : nativeRes.data;
        if (data && data.text) {
          return {
            success: data.success !== false,
            text: data.text,
            suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
            isOfflineFallback: false,
            modelUsed: data.modelUsed,
            sources: Array.isArray(data.sources) ? data.sources : [],
            svgDiagram: data.svgDiagram,
          };
        }
      } else {
        console.warn(`[Gemini API] CapacitorHttp devolvió HTTP ${nativeRes.status}:`, nativeRes.data);
      }
    } catch (nativeErr) {
      console.warn(`[Gemini API] Error en CapacitorHttp nativo conectando a ${endpointUrl}:`, nativeErr);
    }
  }

  // 2. INTENTO VÍA FETCH ESTÁNDAR (EN NAVEGADOR WEB O COMO RESPALDO)
  try {
    const res = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        prompt: cleanPrompt,
        currentScreen,
        systemInstruction: customInstruction,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.text) {
        return {
          success: data.success !== false,
          text: data.text,
          suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
          isOfflineFallback: false,
          modelUsed: data.modelUsed,
          sources: Array.isArray(data.sources) ? data.sources : [],
          svgDiagram: data.svgDiagram,
        };
      }
    } else {
      console.warn(`[Gemini API] Fetch HTTP ${res.status} al contactar ${endpointUrl}`);
      try {
        const errorData = await res.json();
        if (errorData && errorData.text) {
          return {
            success: false,
            isError: true,
            text: errorData.text,
            suggestions: Array.isArray(errorData.suggestions) ? errorData.suggestions : [],
            error: errorData.error,
          };
        }
      } catch {}
    }
  } catch (fetchErr) {
    console.warn(`[Gemini API] Error de red o servidor al consultar ${endpointUrl}:`, fetchErr);
  }

  // 3. RESPALDO INTELIGENTE DE CÁLCULO MATEMÁTICO DIRECTO
  const mathMatch = cleanPrompt.match(
    /(?:cuanto es|cuánto es|calcula|calculame|resultado de)?\s*([0-9.,+\-*/^()xX\s%]+)\s*$/i
  );
  if (mathMatch && mathMatch[1]) {
    try {
      const raw = mathMatch[1].replace(/x/gi, '*').replace(/por/gi, '*').replace(/,/g, '.').trim();
      if (/^[0-9.+\-*/^%()\s]+$/.test(raw)) {
        // eslint-disable-next-line no-new-func
        const val = Function(`'use strict'; return (${raw.replace(/\^/g, '**')});`)();
        if (typeof val === 'number' && !isNaN(val) && isFinite(val)) {
          return {
            success: true,
            text: `El resultado de **${raw}** es **${Number.isInteger(val) ? val.toLocaleString('es-ES') : val.toFixed(2)}**.`,
            suggestions: ['¿Cuánto es el doble?', '¿Cuánto es la mitad?'],
            isOfflineFallback: true,
          };
        }
      }
    } catch {}
  }

  // 4. RESPALDO METEOROLÓGICO DIRECTO EN CLIENTE (OPEN-METEO REST API SIN CORS)
  const qLower = cleanPrompt.toLowerCase();
  if (qLower.includes('temperatura') || qLower.includes('clima') || qLower.includes('tiempo')) {
    try {
      const cityWords = cleanPrompt
        .replace(/[¿?¡!.,;:()]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 2 && !['temperatura', 'clima', 'tiempo', 'para', 'manana', 'mañana', 'hoy', 'en', 'el', 'la', 'de'].includes(w.toLowerCase()));
      const city = cityWords.join(' ') || 'Buenos Aires';
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=es`);
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (geoData.results && geoData.results[0]) {
          const loc = geoData.results[0];
          const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`);
          if (wRes.ok) {
            const wData = await wRes.json();
            const isTomorrow = qLower.includes('manana') || qLower.includes('mañana');
            const dayIdx = isTomorrow ? 1 : 0;
            const min = wData.daily?.temperature_2m_min?.[dayIdx];
            const max = wData.daily?.temperature_2m_max?.[dayIdx];
            if (min !== undefined && max !== undefined) {
              const when = isTomorrow ? 'mañana' : 'hoy';
              return {
                success: true,
                text: `Para ${when} en ${loc.name}${loc.country ? `, ${loc.country}` : ''} se pronostica una temperatura mínima de ${min}°C y una máxima de ${max}°C.`,
                suggestions: ['¿Lloverá mañana?', '¿Cuál es el pronóstico para el fin de semana?'],
                sources: [{ title: 'Open-Meteo Global Weather Service', url: 'https://open-meteo.com/' }],
                isOfflineFallback: true,
              };
            }
          }
        }
      }
    } catch {}
  }

  // 5. RESPALDO LOCAL EXCLUSIVAMENTE SI LA PREGUNTA ERA SOBRE HAPPY LIFE DUO
  const appOfflineResponse = getOfflineHelpResponse(cleanPrompt, currentScreen);
  if (appOfflineResponse) {
    return appOfflineResponse;
  }

  // 6. REPORTE TRANSPARENTE DEL ESTADO DE CONEXIÓN
  return {
    success: false,
    isError: true,
    text: 'No se pudo conectar con el servicio de Gemini en este momento. Por favor, verifica tu conexión a internet o intenta nuevamente.',
    suggestions: [],
    error: 'Servicio de Gemini no disponible temporalmente',
  };
}
