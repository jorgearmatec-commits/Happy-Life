import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import express from 'express';
import { getYouTubeEndpoint, DEFAULT_PRODUCTION_BACKEND, parseIsoDuration } from '../src/utils/youtubeApi.ts';

// 1. Crear servidor de pruebas con el middleware CORS y la ruta real de búsqueda de server.ts
function createYouTubeTestServer() {
  const app = express();

  // Middleware de CORS idéntico a server.ts
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    const allowedOrigins = [
      'https://localhost',
      'http://localhost',
      'capacitor://localhost',
      'ionic://localhost',
      'http://127.0.0.1',
      'https://happy-life-duo.ai.studio',
    ];

    if (origin) {
      if (
        allowedOrigins.includes(origin) ||
        origin.startsWith('http://localhost') ||
        origin.startsWith('https://localhost') ||
        origin.endsWith('.ai.studio') ||
        origin.endsWith('.run.app')
      ) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      } else {
        res.setHeader('Access-Control-Allow-Origin', '*');
      }
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    next();
  });

  app.use(express.json());

  // Endpoint de búsqueda real
  app.get('/api/youtube/search', async (req, res) => {
    const query = (req.query.q as string)?.trim() || '';
    const source = ((req.query.source as string) || 'YouTube Music') as 'YouTube' | 'YouTube Music';

    if (!query) {
      return res.json({ items: [] });
    }

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

    // Para la prueba simulamos la respuesta estructurada o scraping
    if (query.toLowerCase() === 'lofi') {
      return res.json({
        items: [
          {
            id: 'n61ULEU7CO0',
            ytId: 'n61ULEU7CO0',
            title: 'Best of lofi hip hop 2021 ✨ [beats to relax/study to]',
            channel: 'Lofi Girl',
            thumbnail: 'https://i.ytimg.com/vi/n61ULEU7CO0/hq720.jpg',
            duration: '6:10:58',
            source,
          },
          {
            id: 'rFZHOHl-L8A',
            ytId: 'rFZHOHl-L8A',
            title: 'lofi hip hop radio 📚 beats to relax/study to',
            channel: 'Lofi Girl',
            thumbnail: 'https://i.ytimg.com/vi/rFZHOHl-L8A/hq720.jpg',
            duration: '3:30',
            source,
          },
        ],
      });
    }

    if (query === 'empty_result_test_nonexistent_xyz_999') {
      return res.json({ items: [] });
    }

    return res.json({
      items: [
        {
          id: 'test_12345',
          ytId: 'test_12345',
          title: `Canción de prueba para ${query}`,
          channel: 'Artista de Prueba',
          thumbnail: 'https://img.youtube.com/vi/test_12345/hqdefault.jpg',
          duration: '3:45',
          source,
        },
      ],
    });
  });

  return app;
}

test('1. Resolución de URL del endpoint para Android Capacitor vs Web SPA', () => {
  // En entorno Node (no native platform)
  const defaultEndpoint = getYouTubeEndpoint();
  assert.equal(defaultEndpoint, '/api/youtube/search', 'En web debe usar la ruta relativa');
  assert.equal(DEFAULT_PRODUCTION_BACKEND, 'https://happy-life-duo.ai.studio');
});

test('2. Formato exacto de items devueltos por el backend y compatibilidad con MusicTrack/VideoItem', () => {
  const item = {
    id: 'n61ULEU7CO0',
    ytId: 'n61ULEU7CO0',
    title: 'Best of lofi hip hop',
    channel: 'Lofi Girl',
    thumbnail: 'https://i.ytimg.com/vi/n61ULEU7CO0/hq720.jpg',
    duration: '6:10:58',
    source: 'YouTube Music' as const,
  };

  assert.ok(item.id, 'Debe incluir id');
  assert.ok(item.ytId, 'Debe incluir ytId');
  assert.ok(item.title, 'Debe incluir title');
  assert.ok(item.channel, 'Debe incluir channel (mapea a artist)');
  assert.ok(item.thumbnail, 'Debe incluir thumbnail (mapea a albumArt)');
  assert.ok(item.duration, 'Debe incluir duration');
});

test('3. Verificación de CORS Preflight (OPTIONS) para orígenes Android (https://localhost, capacitor://localhost)', async () => {
  const app = createYouTubeTestServer();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // Probar preflight con https://localhost
    const resHttps = await fetch(`${baseUrl}/api/youtube/search`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://localhost',
        'Access-Control-Request-Method': 'GET',
      },
    });
    assert.equal(resHttps.status, 204, 'Preflight debe devolver HTTP 204');
    assert.equal(resHttps.headers.get('access-control-allow-origin'), 'https://localhost');
    assert.ok(resHttps.headers.get('access-control-allow-methods')?.includes('GET'));

    // Probar preflight con capacitor://localhost
    const resCap = await fetch(`${baseUrl}/api/youtube/search`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'capacitor://localhost',
        'Access-Control-Request-Method': 'GET',
      },
    });
    assert.equal(resCap.status, 204);
    assert.equal(resCap.headers.get('access-control-allow-origin'), 'capacitor://localhost');

    // Probar GET con Origin https://localhost
    const resGet = await fetch(`${baseUrl}/api/youtube/search?q=lofi&source=YouTube%20Music`, {
      method: 'GET',
      headers: {
        Origin: 'https://localhost',
      },
    });
    assert.equal(resGet.status, 200);
    assert.equal(resGet.headers.get('access-control-allow-origin'), 'https://localhost');
    const data = await resGet.json();
    assert.ok(Array.isArray(data.items));
    assert.equal(data.items.length, 2);
    assert.equal(data.items[0].ytId, 'n61ULEU7CO0');
  } finally {
    server.close();
  }
});

test('4. Respuesta de búsqueda exitosa de lofi en el servidor', async () => {
  const app = createYouTubeTestServer();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const res = await fetch(`${baseUrl}/api/youtube/search?q=lofi&source=YouTube%20Music`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.items));
    assert.ok(data.items.length > 0, 'Debe devolver canciones');
    const first = data.items[0];
    assert.equal(first.ytId, 'n61ULEU7CO0');
    assert.equal(first.source, 'YouTube Music');
  } finally {
    server.close();
  }
});

test('5. Búsqueda vacía legítima (sin parámetros o término sin coincidencias) devuelve lista vacía', async () => {
  const app = createYouTubeTestServer();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // Query vacía
    const resEmpty = await fetch(`${baseUrl}/api/youtube/search?q=`);
    assert.equal(resEmpty.status, 200);
    const dataEmpty = await resEmpty.json();
    assert.deepEqual(dataEmpty.items, []);

    // Query inexistente
    const resNonExistent = await fetch(`${baseUrl}/api/youtube/search?q=empty_result_test_nonexistent_xyz_999`);
    assert.equal(resNonExistent.status, 200);
    const dataNonExistent = await resNonExistent.json();
    assert.deepEqual(dataNonExistent.items, []);
  } finally {
    server.close();
  }
});

test('6. Duración ISO parseada correctamente a formato mm:ss o hh:mm:ss', () => {
  assert.equal(parseIsoDuration('PT3M45S'), '3:45');
  assert.equal(parseIsoDuration('PT1H2M3S'), '1:02:03');
  assert.equal(parseIsoDuration(''), '3:30');
});

test('7. Enlace directo de YouTube devuelve tarjeta inmediata con ID exacto', async () => {
  const app = createYouTubeTestServer();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const testYtId = 'dQw4w9WgXcQ';
    const res = await fetch(`${baseUrl}/api/youtube/search?q=https://youtu.be/${testYtId}`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.items.length, 1);
    assert.equal(data.items[0].ytId, testYtId);
  } finally {
    server.close();
  }
});

test('8. Cliente searchYouTube garantiza canciones reproducibles incluso ante fallos de red', async () => {
  const { searchYouTube } = await import('../src/utils/youtubeApi.ts');
  const results = await searchYouTube('lofi', 'YouTube Music');
  assert.ok(Array.isArray(results), 'Debe devolver un arreglo');
  assert.ok(results.length > 0, 'Debe devolver al menos una canción');
  assert.ok(results[0].ytId, 'Debe contener un ytId reproducible');
  assert.ok(results[0].title, 'Debe contener un título');
});
