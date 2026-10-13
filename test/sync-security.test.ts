import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import crypto from 'crypto';

// Setup isolated server for testing sync security
function createTestServer() {
  const app = express();
  app.use(express.json());

  interface SyncMessage {
    id: string;
    senderId: string;
    payload: any;
    timestamp: number;
  }

  interface SyncRoom {
    pairCode?: string;
    codeExpiresAt?: number;
    codeAttempts?: number;
    deviceTokens: Set<string>;
    data: {
      expenses?: any[];
      events?: any[];
      diary?: any[];
      capsules?: any[];
      settings?: any;
      updatedAt?: number;
    };
    messages: SyncMessage[];
    backup?: {
      data: any;
      updatedAt: number;
      email?: string;
    };
  }

  const syncRooms = new Map<string, SyncRoom>();
  const tokenToRoomId = new Map<string, string>();

  function authenticateBearer(req: express.Request, res: express.Response, next: express.NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Credencial requerida. Debes enviar el encabezado Authorization: Bearer <deviceToken>',
      });
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token Bearer vacío o inválido.',
      });
    }

    const roomId = tokenToRoomId.get(token);
    if (!roomId) {
      return res.status(401).json({
        success: false,
        error: 'Token no autorizado o revocado. Vuelve a emparejar tu dispositivo.',
      });
    }

    const room = syncRooms.get(roomId);
    if (!room || !room.deviceTokens.has(token)) {
      return res.status(401).json({
        success: false,
        error: 'Sesión no encontrada o credencial no vinculada a esta habitación.',
      });
    }

    (req as any).authRoom = room;
    (req as any).authRoomId = roomId;
    (req as any).deviceToken = token;
    next();
  }

  app.post('/api/sync/pair/code', (_req, res) => {
    const freshPairCode = 'HLD-' + crypto.randomInt(1000, 9999);
    const expiresAt = Date.now() + 10 * 60 * 1000;
    const roomId = 'room-' + crypto.randomBytes(8).toString('hex');
    const initiatorToken = 'tok-' + crypto.randomBytes(16).toString('hex');

    const newRoom: SyncRoom = {
      pairCode: freshPairCode,
      codeExpiresAt: expiresAt,
      codeAttempts: 0,
      deviceTokens: new Set([initiatorToken]),
      data: {},
      messages: [],
    };

    syncRooms.set(roomId, newRoom);
    tokenToRoomId.set(initiatorToken, roomId);

    res.json({
      success: true,
      pairCode: freshPairCode,
      deviceToken: initiatorToken,
      expiresInSeconds: 600,
    });
  });

  app.post('/api/sync/pair', (req, res) => {
    const { pairCode } = req.body || {};
    if (!pairCode || typeof pairCode !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Debes proporcionar un código de emparejamiento válido emitido por el anfitrión.',
      });
    }

    const formattedCode = pairCode.trim().toUpperCase();
    let targetRoomId: string | null = null;
    let targetRoom: SyncRoom | null = null;

    for (const [rId, room] of syncRooms.entries()) {
      if (room.pairCode === formattedCode) {
        targetRoomId = rId;
        targetRoom = room;
        break;
      }
    }

    if (!targetRoom || !targetRoomId) {
      return res.status(401).json({
        success: false,
        error: 'Código de emparejamiento no válido o expirado.',
      });
    }

    if (targetRoom.codeAttempts !== undefined) {
      targetRoom.codeAttempts += 1;
      if (targetRoom.codeAttempts > 5) {
        targetRoom.pairCode = undefined;
        return res.status(401).json({
          success: false,
          error: 'Código bloqueado por superar el límite de intentos fallidos.',
        });
      }
    }

    if (targetRoom.codeExpiresAt && Date.now() > targetRoom.codeExpiresAt) {
      targetRoom.pairCode = undefined;
      return res.status(401).json({
        success: false,
        error: 'El código de emparejamiento ha expirado. Solicita un nuevo código en el otro dispositivo.',
      });
    }

    if (targetRoom.deviceTokens.size >= 2) {
      return res.status(403).json({
        success: false,
        error: 'Esta habitación ya cuenta con el máximo de dispositivos autorizados (pareja completa).',
      });
    }

    const partnerToken = 'tok-' + crypto.randomBytes(16).toString('hex');
    targetRoom.deviceTokens.add(partnerToken);
    tokenToRoomId.set(partnerToken, targetRoomId);
    targetRoom.pairCode = undefined;

    res.json({
      success: true,
      deviceToken: partnerToken,
      paired: true,
    });
  });

  app.get('/api/sync/pull', authenticateBearer, (req: any, res) => {
    const room: SyncRoom = req.authRoom;
    res.json({
      success: true,
      data: room.data || {},
      messages: room.messages || [],
    });
  });

  app.post('/api/sync/push', authenticateBearer, (req: any, res) => {
    const room: SyncRoom = req.authRoom;
    const { data, message } = req.body || {};

    if (data) {
      room.data = {
        ...room.data,
        ...data,
        updatedAt: Date.now(),
      };
    }

    if (message) {
      room.messages.push({
        id: crypto.randomBytes(6).toString('hex'),
        senderId: req.deviceToken,
        payload: message,
        timestamp: Date.now(),
      });
    }

    res.json({
      success: true,
      updatedAt: Date.now(),
    });
  });

  app.post('/api/sync/unpair', authenticateBearer, (req: any, res) => {
    const room: SyncRoom = req.authRoom;
    const currentToken: string = req.deviceToken;
    room.deviceTokens.delete(currentToken);
    tokenToRoomId.delete(currentToken);
    res.json({ success: true, message: 'Dispositivo desvinculado y token revocado.' });
  });

  app.post('/api/sync/backup', authenticateBearer, (req: any, res) => {
    const room: SyncRoom = req.authRoom;
    const { data, email } = req.body || {};
    if (!data) {
      return res.status(400).json({ success: false, error: 'Faltan datos para el respaldo.' });
    }
    room.backup = {
      data,
      updatedAt: Date.now(),
      email,
    };
    res.json({ success: true, backupTimestamp: room.backup.updatedAt });
  });

  return app;
}

test('1. Las solicitudes sin token no pueden leer ni modificar datos', async () => {
  const app = createTestServer();
  const server = app.listen(0);
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const pullRes = await fetch(`${baseUrl}/api/sync/pull`);
    assert.equal(pullRes.status, 401);

    const pushRes = await fetch(`${baseUrl}/api/sync/push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: { expenses: [{ amount: 5000 }] } }),
    });
    assert.equal(pushRes.status, 401);
  } finally {
    server.close();
  }
});

test('2. Un pairCode por sí solo o query params no autorizan operaciones', async () => {
  const app = createTestServer();
  const server = app.listen(0);
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const pullRes = await fetch(`${baseUrl}/api/sync/pull?pairCode=HLD-1234&role=me`);
    assert.equal(pullRes.status, 401);
  } finally {
    server.close();
  }
});

test('3. Un identificador falsificado o X-Device-Id no permite acceder sin Bearer', async () => {
  const app = createTestServer();
  const server = app.listen(0);
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const pullRes = await fetch(`${baseUrl}/api/sync/pull`, {
      headers: { 'X-Device-Id': 'fake-device-id-123' },
    });
    assert.equal(pullRes.status, 401);
  } finally {
    server.close();
  }
});

test('4. Una pareja no puede acceder a la habitación de otra con credencial inválida', async () => {
  const app = createTestServer();
  const server = app.listen(0);
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const pullRes = await fetch(`${baseUrl}/api/sync/pull`, {
      headers: { Authorization: 'Bearer tok-alien-room-device' },
    });
    assert.equal(pullRes.status, 401);
  } finally {
    server.close();
  }
});

test('5. Los códigos caducados y reutilizados son rechazados', async () => {
  const app = createTestServer();
  const server = app.listen(0);
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const codeRes = await fetch(`${baseUrl}/api/sync/pair/code`, { method: 'POST' });
    const codeData = await codeRes.json();
    const pairCode = codeData.pairCode;

    // Primer canje exitoso
    const pairRes1 = await fetch(`${baseUrl}/api/sync/pair`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pairCode }),
    });
    assert.equal(pairRes1.status, 200);

    // Segundo canje con el mismo código quemado -> Rechazado
    const pairRes2 = await fetch(`${baseUrl}/api/sync/pair`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pairCode }),
    });
    assert.equal(pairRes2.status, 401);
  } finally {
    server.close();
  }
});

test('6. Las credenciales revocadas dejan de funcionar tras desvincularse', async () => {
  const app = createTestServer();
  const server = app.listen(0);
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const codeRes = await fetch(`${baseUrl}/api/sync/pair/code`, { method: 'POST' });
    const codeData = await codeRes.json();
    const initiatorToken = codeData.deviceToken;

    // Verificar que funciona antes de revocar
    const pushRes = await fetch(`${baseUrl}/api/sync/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${initiatorToken}`,
      },
      body: JSON.stringify({ data: { test: true } }),
    });
    assert.equal(pushRes.status, 200);

    // Desvincularse
    const unpairRes = await fetch(`${baseUrl}/api/sync/unpair`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${initiatorToken}` },
    });
    assert.equal(unpairRes.status, 200);

    // Verificar que el token revocado ya no funciona
    const pushAgain = await fetch(`${baseUrl}/api/sync/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${initiatorToken}`,
      },
      body: JSON.stringify({ data: { test: false } }),
    });
    assert.equal(pushAgain.status, 401);
  } finally {
    server.close();
  }
});

test('7. Dos dispositivos correctamente emparejados sí pueden sincronizar datos', async () => {
  const app = createTestServer();
  const server = app.listen(0);
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // Dispositivo 1 genera código
    const codeRes = await fetch(`${baseUrl}/api/sync/pair/code`, { method: 'POST' });
    const codeData = await codeRes.json();
    const deviceToken1 = codeData.deviceToken;
    const pairCode = codeData.pairCode;

    // Dispositivo 2 ingresa código
    const pairRes = await fetch(`${baseUrl}/api/sync/pair`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pairCode }),
    });
    assert.equal(pairRes.status, 200);
    const pairData = await pairRes.json();
    const deviceToken2 = pairData.deviceToken;

    // Dispositivo 1 envía datos
    const push1 = await fetch(`${baseUrl}/api/sync/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${deviceToken1}`,
      },
      body: JSON.stringify({
        data: {
          expenses: [{ id: '1', amount: 15000, description: 'Supermercado Yorsh' }],
        },
      }),
    });
    assert.equal(push1.status, 200);

    // Dispositivo 2 recibe datos
    const pull2 = await fetch(`${baseUrl}/api/sync/pull`, {
      headers: { Authorization: `Bearer ${deviceToken2}` },
    });
    assert.equal(pull2.status, 200);
    const pullData2 = await pull2.json();
    assert.equal(pullData2.data.expenses[0].amount, 15000);
  } finally {
    server.close();
  }
});

test('8. Respaldo protegido requiere credencial Bearer y guarda correctamente', async () => {
  const app = createTestServer();
  const server = app.listen(0);
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // Sin token -> Rechaza
    const backupNoToken = await fetch(`${baseUrl}/api/sync/backup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: { expenses: [] } }),
    });
    assert.equal(backupNoToken.status, 401);

    // Con token válido -> Guarda
    const codeRes = await fetch(`${baseUrl}/api/sync/pair/code`, { method: 'POST' });
    const codeData = await codeRes.json();
    const token = codeData.deviceToken;

    const backupValid = await fetch(`${baseUrl}/api/sync/backup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ data: { expenses: [{ amount: 45000 }] }, email: 'user@example.com' }),
    });
    assert.equal(backupValid.status, 200);
    const backupResult = await backupValid.json();
    assert.equal(backupResult.success, true);
  } finally {
    server.close();
  }
});

test('9. Mapeo de colores de categorías: colores claramente diferentes para las categorías especificadas', async () => {
  const { getCategoryColor, CATEGORY_COLORS } = await import('../src/components/ExpenseCalculator.js').catch(() =>
    import('../src/components/ExpenseCalculator.tsx')
  );

  // 1. Verificar colores requeridos específicamente por el usuario
  assert.equal(getCategoryColor('Comida de perro'), '#f97316', 'Comida de perro debe ser naranja');
  assert.equal(getCategoryColor('Feria'), '#10b981', 'Feria debe ser verde');
  assert.equal(getCategoryColor('Supermercado'), '#2563eb', 'Supermercado debe ser azul');
  assert.equal(getCategoryColor('Farmacia y salud'), '#ec4899', 'Farmacia y salud debe ser rosa');
  assert.equal(getCategoryColor('Transporte'), '#06b6d4', 'Transporte debe ser celeste');
  assert.equal(getCategoryColor('Hogar'), '#8b5cf6', 'Hogar debe ser violeta');
  assert.equal(getCategoryColor('Servicios y cuentas'), '#eab308', 'Servicios y cuentas debe ser amarillo');
  assert.equal(getCategoryColor('Salidas y ocio'), '#ef4444', 'Salidas y ocio debe ser rojo');
  assert.equal(getCategoryColor('Ropa y calzado'), '#14b8a6', 'Ropa y calzado debe ser turquesa');
  assert.equal(getCategoryColor('Regalos'), '#a855f7', 'Regalos debe ser morado');

  // 2. Verificar que todas las categorías requeridas tengan colores diferentes entre sí
  const requiredCategories = [
    'Comida de perro',
    'Feria',
    'Supermercado',
    'Farmacia y salud',
    'Transporte',
    'Hogar',
    'Servicios y cuentas',
    'Salidas y ocio',
    'Ropa y calzado',
    'Regalos',
  ];

  const colors = requiredCategories.map((c) => getCategoryColor(c));
  const uniqueColors = new Set(colors);
  assert.equal(uniqueColors.size, requiredCategories.length, 'Cada categoría debe tener un color diferente');

  // 3. Verificar estabilidad: el color no cambia al invocar múltiples veces o con índices distintos
  assert.equal(getCategoryColor('Comida de perro', 0), getCategoryColor('Comida de perro', 99));
  assert.equal(getCategoryColor('Feria', 2), getCategoryColor('Feria', 5));

  // 4. Categorías personalizadas: asignación determinista y no el mismo color para todas
  const customA = getCategoryColor('Veterinaria Especial');
  const customB = getCategoryColor('Gimnasio Crossfit');
  const customA_again = getCategoryColor('Veterinaria Especial');

  assert.equal(customA, customA_again, 'La categoría personalizada debe conservar un color estable y determinista');
  assert.ok(customA.startsWith('#'), 'El color personalizado debe ser un código hexadecimal válido');
  assert.ok(customB.startsWith('#'), 'El color personalizado debe ser un código hexadecimal válido');
});
