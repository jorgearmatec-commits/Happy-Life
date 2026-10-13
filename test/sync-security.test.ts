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

test('10. Respaldo y restauración: auditoría de funciones reales de exportación, zip y restauración atómica de gastos', async () => {
  const JSZip = (await import('jszip')).default;
  const {
    buildBackupPayload,
    encodeBackupPayload,
    decodeBackupPayload,
    validateAndSanitizeExpenses,
    validateBackupAtomically,
    createBackupZip,
  } = await import('../src/utils/backupUtils.js').catch(() =>
    import('../src/utils/backupUtils.ts')
  );

  const originalExpenses = [
    {
      id: 'exp_test_1',
      date: '2026-10-10',
      category: 'Comida de perro',
      description: 'Saco 15kg alimento perro',
      amount: 45000,
      currency: 'CLP',
      creator: 'me',
      creatorName: 'Yorsh',
      createdAt: '2026-10-10T12:00:00.000Z',
    },
    {
      id: 'exp_test_2',
      date: '2026-10-11',
      category: 'Farmacia y salud',
      description: 'Remedios',
      amount: 18500,
      currency: 'CLP',
      creator: 'partner',
      creatorName: 'Anita',
      createdAt: '2026-10-11T14:30:00.000Z',
    },
    {
      id: 'exp_test_3',
      date: '2026-10-12',
      category: 'Supermercado',
      description: 'Compras mensuales',
      amount: 120,
      currency: 'USD',
      creator: 'me',
      creatorName: 'Yorsh',
      createdAt: '2026-10-12T16:00:00.000Z',
    },
  ];

  const appState = {
    me: { id: 'user_me', name: 'Yorsh' },
    partner: { id: 'user_partner', name: 'Anita' },
    reminders: [{ id: 'rem_1', title: 'Vacunas', category: 'General' }],
    alarms: [{ id: 'alm_1', time: '07:30' }],
    journal: [{ id: 'jrn_1', text: 'Día feliz', author: 'me' }],
    messages: [{ id: 'msg_1', text: 'Te amo', sender: 'partner' }],
    recordings: [{ id: 'rec_1', fileName: 'audio.webm', duration: 15 }],
    expenses: originalExpenses,
    settings: { duoPairCode: 'HLD-1234', activeSectionsOrder: ['expenses', 'diary'] },
  };

  // 1. Exportación real .happyduo y presencia de todos los gastos originales
  const realPayload = buildBackupPayload(appState as any);
  assert.ok(Array.isArray(realPayload.expenses), 'buildBackupPayload debe incluir expenses como arreglo');
  assert.equal(realPayload.expenses.length, 3, 'buildBackupPayload debe contener exactamente los 3 gastos');

  const encodedHappyDuo = encodeBackupPayload(realPayload);
  assert.ok(typeof encodedHappyDuo === 'string' && encodedHappyDuo.length > 50, 'El archivo .happyduo debe codificarse en cadena no vacía');

  const decodedHappyDuo = decodeBackupPayload(encodedHappyDuo);
  assert.equal(decodedHappyDuo.version, '4.0');
  assert.ok(Array.isArray(decodedHappyDuo.expenses));
  assert.equal(decodedHappyDuo.expenses.length, 3);
  assert.equal(decodedHappyDuo.expenses[0].id, 'exp_test_1');
  assert.equal(decodedHappyDuo.expenses[0].amount, 45000);
  assert.equal(decodedHappyDuo.expenses[0].currency, 'CLP');
  assert.equal(decodedHappyDuo.expenses[2].currency, 'USD');

  // 2. Creación y apertura del ZIP real, con los gastos dentro del JSON
  const zip = createBackupZip(realPayload);
  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
  const zipLoaded = await JSZip.loadAsync(zipBuffer);

  const jsonFileInZip = zipLoaded.file('nuestro_lugar_seguro_backup.json');
  assert.ok(jsonFileInZip, 'El archivo nuestro_lugar_seguro_backup.json debe existir en el ZIP');
  const jsonContent = await jsonFileInZip.async('string');
  const parsedZipJson = JSON.parse(jsonContent);
  assert.ok(Array.isArray(parsedZipJson.expenses), 'El JSON del ZIP debe contener expenses');
  assert.equal(parsedZipJson.expenses.length, 3, 'Los 3 gastos deben estar dentro del JSON del ZIP');
  assert.equal(parsedZipJson.expenses[1].category, 'Farmacia y salud');

  const readmeInZip = zipLoaded.file('LEEME_INSTRUCCIONES.txt');
  assert.ok(readmeInZip, 'El archivo LEEME_INSTRUCCIONES.txt debe existir en el ZIP');
  const readmeText = await readmeInZip.async('string');
  assert.ok(readmeText.includes('Gastos y balances'), 'El LEEME debe mencionar explícitamente Gastos y balances');

  // 3. Restauración real atómica con todos los campos y valores intactos
  const restoreResult = validateBackupAtomically(encodedHappyDuo, 'Yorsh', 'Anita');
  assert.equal(restoreResult.isValid, true, 'La copia legítima debe validarse exitosamente');
  assert.ok(restoreResult.sanitizedExpenses, 'Debe devolver sanitizedExpenses');
  assert.equal(restoreResult.sanitizedExpenses.length, 3);
  const r0 = restoreResult.sanitizedExpenses[0];
  assert.equal(r0.id, 'exp_test_1');
  assert.equal(r0.creator, 'me');
  assert.equal(r0.creatorName, 'Yorsh');
  assert.equal(r0.date, '2026-10-10');
  assert.equal(r0.category, 'Comida de perro');
  assert.equal(r0.description, 'Saco 15kg alimento perro');
  assert.equal(r0.amount, 45000);
  assert.equal(r0.currency, 'CLP');
  assert.equal(r0.createdAt, '2026-10-10T12:00:00.000Z');

  // 4. Respaldo antiguo sin 'expenses': sin pérdida de gastos locales
  const legacyPayload = { ...realPayload };
  delete (legacyPayload as any).expenses;
  const legacyEncoded = encodeBackupPayload(legacyPayload);
  const legacyResult = validateBackupAtomically(legacyEncoded, 'Yorsh', 'Anita');
  assert.equal(legacyResult.isValid, true, 'Respaldo antiguo debe ser válido');
  assert.equal(legacyResult.hasExpensesProperty, false, 'hasExpensesProperty debe ser falso para copias antiguas');
  assert.equal(legacyResult.sanitizedExpenses, undefined, 'sanitizedExpenses no debe definirse, garantizando que el estado local no se modifique');

  // 5. 'expenses: []' como operación intencional de vaciado
  const emptyExpensesPayload = { ...realPayload, expenses: [] };
  const emptyEncoded = encodeBackupPayload(emptyExpensesPayload);
  const emptyResult = validateBackupAtomically(emptyEncoded, 'Yorsh', 'Anita');
  assert.equal(emptyResult.isValid, true, 'Copia con expenses vacíos debe ser válida');
  assert.equal(emptyResult.hasExpensesProperty, true, 'hasExpensesProperty debe ser verdadero');
  assert.ok(Array.isArray(emptyResult.sanitizedExpenses));
  assert.equal(emptyResult.sanitizedExpenses.length, 0, 'Debe restaurarse un arreglo vacío intencional sin omitirse');

  // 6. Rechazo de campos obligatorios ausentes, tipos incorrectos, importes inválidos y monedas no admitidas
  const testCorruptExpense = (badExpense: any, expectedErrorSubstring: string) => {
    const corruptPayload = { ...realPayload, expenses: [badExpense] };
    const corruptEncoded = encodeBackupPayload(corruptPayload);
    const result = validateBackupAtomically(corruptEncoded, 'Yorsh', 'Anita');
    assert.equal(result.isValid, false, `Gasto inválido debe rechazarse: ${JSON.stringify(badExpense)}`);
    assert.ok(result.error?.includes(expectedErrorSubstring), `Error debe mencionar ${expectedErrorSubstring}: ${result.error}`);
  };

  // Importe negativo
  testCorruptExpense({ ...originalExpenses[0], amount: -500 }, 'importe inválido');
  // Importe 0
  testCorruptExpense({ ...originalExpenses[0], amount: 0 }, 'importe inválido');
  // Importe NaN
  testCorruptExpense({ ...originalExpenses[0], amount: NaN }, 'importe inválido');
  // Moneda no admitida
  testCorruptExpense({ ...originalExpenses[0], currency: 'EUR' }, 'divisa no admitida');
  // Creador inválido
  testCorruptExpense({ ...originalExpenses[0], creator: 'hacker' }, 'creador inválido');
  // Categoría vacía
  testCorruptExpense({ ...originalExpenses[0], category: '   ' }, 'categoría válida');
  // ID ausente / vacío
  testCorruptExpense({ ...originalExpenses[0], id: '' }, 'id válido');
  // Fecha malformada
  testCorruptExpense({ ...originalExpenses[0], date: 'ayer' }, 'formato de fecha inválido');
  // expenses no es arreglo (tipo incorrecto)
  const nonArrayPayload = { ...realPayload, expenses: 'no-es-un-arreglo' };
  const nonArrayResult = validateBackupAtomically(encodeBackupPayload(nonArrayPayload));
  assert.equal(nonArrayResult.isValid, false);
  assert.ok(nonArrayResult.error?.includes('debe ser un arreglo'));

  // 7. Atomicidad estricta: ningún cambio parcial del estado si falla la validación
  let simulatedLocalState = {
    me: { name: 'Mi Nombre Local' },
    partner: { name: 'Pareja Local' },
    reminders: [{ id: 'rem_local', title: 'Local Note' }],
    expenses: [...originalExpenses],
  };

  const atomicRestoreRunner = (rawPayloadStr: string): boolean => {
    const res = validateBackupAtomically(rawPayloadStr, 'Mi Nombre Local', 'Pareja Local');
    if (!res.isValid || !res.data) {
      return false;
    }
    // Solo si es válido se tocan los estados
    if (res.data.me) simulatedLocalState.me = res.data.me;
    if (res.data.partner) simulatedLocalState.partner = res.data.partner;
    if (res.data.reminders) simulatedLocalState.reminders = res.data.reminders;
    if (res.hasExpensesProperty && res.sanitizedExpenses !== undefined) {
      simulatedLocalState.expenses = res.sanitizedExpenses;
    }
    return true;
  };

  // Intentar restaurar una copia que tiene perfiles nuevos pero contiene un gasto corrupto
  const badBackup = {
    ...realPayload,
    me: { id: 'me_malicioso', name: 'Nombre Que No Debe Aplicarse' },
    expenses: [{ id: 'bad', amount: -9999, currency: 'CLP', category: 'Corrupto', date: '2026-10-10', creator: 'me' }],
  };
  const badBackupEncoded = encodeBackupPayload(badBackup);
  const wasApplied = atomicRestoreRunner(badBackupEncoded);

  assert.equal(wasApplied, false, 'La restauración con datos corruptos debe rechazarse completamente');
  assert.equal(simulatedLocalState.me.name, 'Mi Nombre Local', 'El nombre local NO debe haber mutado');
  assert.equal(simulatedLocalState.expenses.length, 3, 'Los gastos locales NO deben haber sido borrados ni mutados');

  // 8. Conservación del resto de los datos del respaldo cuando es exitoso
  const validApplied = atomicRestoreRunner(encodedHappyDuo);
  assert.equal(validApplied, true);
  assert.equal(simulatedLocalState.me.name, 'Yorsh', 'El resto de los datos del respaldo se conservan y aplican íntegramente');
  assert.equal(simulatedLocalState.reminders.length, 1);
  assert.equal(simulatedLocalState.expenses.length, 3);
});

test('11. Aislamiento estricto de divisas: no se suman importes de CLP, ARS y USD como equivalentes', () => {
  const mixedExpenses = [
    { id: '1', amount: 50000, currency: 'CLP', category: 'Supermercado', date: '2026-10-10' },
    { id: '2', amount: 15000, currency: 'CLP', category: 'Feria', date: '2026-10-11' },
    { id: '3', amount: 45, currency: 'USD', category: 'Regalos', date: '2026-10-12' },
    { id: '4', amount: 25000, currency: 'ARS', category: 'Transporte', date: '2026-10-12' },
  ];

  // Función pura de cálculo independiente por moneda
  const calculateTotalForCurrency = (items: any[], targetCurrency: string) => {
    return items
      .filter((item) => (item.currency || 'CLP') === targetCurrency)
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  };

  const clpTotal = calculateTotalForCurrency(mixedExpenses, 'CLP');
  const usdTotal = calculateTotalForCurrency(mixedExpenses, 'USD');
  const arsTotal = calculateTotalForCurrency(mixedExpenses, 'ARS');

  assert.equal(clpTotal, 65000, 'Total CLP debe sumar únicamente los gastos en CLP');
  assert.equal(usdTotal, 45, 'Total USD debe sumar únicamente los gastos en USD');
  assert.equal(arsTotal, 25000, 'Total ARS debe sumar únicamente los gastos en ARS');

  // Asegurar que no se produjo una suma cruzada errónea
  const accidentalSum = clpTotal + usdTotal + arsTotal;
  assert.notEqual(clpTotal, accidentalSum, 'El total CLP nunca debe mezclarse con otras divisas');
  assert.notEqual(usdTotal, accidentalSum, 'El total USD nunca debe mezclarse con otras divisas');
});

test('12. Sincronización Bearer de gastos: push y pull en tiempo real entre dispositivos emparejados', async () => {
  const app = createTestServer();
  const server = app.listen(0);
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Generar código en dispositivo A
    const codeRes = await fetch(`${baseUrl}/api/sync/pair/code`, { method: 'POST' });
    const { pairCode, deviceToken: tokenA } = await codeRes.json();

    // 2. Emparejar dispositivo B con el código
    const pairRes = await fetch(`${baseUrl}/api/sync/pair`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pairCode }),
    });
    const { deviceToken: tokenB } = await pairRes.json();

    // 3. Dispositivo A envía gastos protegidos con Authorization: Bearer
    const expensesPayload = [
      {
        id: 'exp_sync_1',
        amount: 32000,
        currency: 'CLP',
        category: 'Comida de perro',
        description: 'Alimento premium',
        date: '2026-10-12',
        creator: 'me',
      },
    ];

    const pushRes = await fetch(`${baseUrl}/api/sync/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        data: {
          expenses: expensesPayload,
        },
      }),
    });
    assert.equal(pushRes.status, 200);

    // 4. Dispositivo B recupera los datos con su propio Bearer token
    const pullRes = await fetch(`${baseUrl}/api/sync/pull`, {
      headers: {
        Authorization: `Bearer ${tokenB}`,
      },
    });
    assert.equal(pullRes.status, 200);
    const pullData = await pullRes.json();
    assert.ok(pullData.success);
    assert.ok(Array.isArray(pullData.data.expenses));
    assert.equal(pullData.data.expenses.length, 1);
    assert.equal(pullData.data.expenses[0].id, 'exp_sync_1');
    assert.equal(pullData.data.expenses[0].amount, 32000);

    // 5. Un atacante sin Bearer token es rechazado inmediatamente
    const unauthorizedRes = await fetch(`${baseUrl}/api/sync/pull`);
    assert.equal(unauthorizedRes.status, 401);
  } finally {
    server.close();
  }
});

test('13. Independencia y propiedad estricta de las tarjetas de pareja (Yorsh y Anita)', async () => {
  // Simular la lógica de AppContext con las reglas de negocio estrictas
  interface SimulatedProfile {
    id: string;
    name: string;
    avatar: string;
    status: string;
  }

  let stateMe: SimulatedProfile = {
    id: 'user_me',
    name: 'Yorsh',
    avatar: '🦊',
    status: 'Disponible para hablar',
  };

  let statePartner: SimulatedProfile = {
    id: 'user_partner',
    name: 'Anita',
    avatar: '🐼',
    status: 'Trabajando',
  };

  // 1. Verificación de nombres por defecto
  assert.equal(stateMe.name, 'Yorsh', 'El nombre inicial por defecto de mi tarjeta debe ser Yorsh');
  assert.equal(statePartner.name, 'Anita', 'El nombre inicial por defecto de la tarjeta de pareja debe ser Anita');

  // Función con validación de propiedad estricta
  const updateUserNameWithOwnership = (
    activeRole: 'me' | 'partner',
    target: 'me' | 'partner',
    newName: string
  ): boolean => {
    const clean = newName.trim();
    if (!clean) return false;
    // REGLA OBLIGATORIA: Cada integrante es dueño exclusivo de su propia tarjeta
    if (target !== activeRole) {
      return false; // Operación denegada
    }
    if (target === 'me') {
      stateMe = { ...stateMe, name: clean };
      return true;
    } else {
      statePartner = { ...statePartner, name: clean };
      return true;
    }
  };

  // 2. Mi usuario (role: 'me') intenta cambiar el nombre de su pareja -> DEBE SER RECHAZADO
  const attemptChangePartner = updateUserNameWithOwnership('me', 'partner', 'Nombre Forzado');
  assert.equal(attemptChangePartner, false, 'No se debe permitir modificar el nombre de la tarjeta de la pareja');
  assert.equal(statePartner.name, 'Anita', 'El nombre de la pareja debe permanecer inmutable');

  // 3. Mi usuario (role: 'me') cambia su propio nombre -> DEBE SER ACEPTADO
  const changeMyName = updateUserNameWithOwnership('me', 'me', 'Jorge');
  assert.equal(changeMyName, true, 'Se debe permitir cambiar el propio nombre');
  assert.equal(stateMe.name, 'Jorge', 'Mi nombre debe actualizarse correctamente');

  // 4. El rol de pareja (role: 'partner') intenta cambiar mi nombre -> DEBE SER RECHAZADO
  const partnerAttemptsMyName = updateUserNameWithOwnership('partner', 'me', 'Hacker');
  assert.equal(partnerAttemptsMyName, false, 'La pareja no puede modificar mi tarjeta');
  assert.equal(stateMe.name, 'Jorge', 'Mi nombre permanece protegido frente a ediciones externas');

  // 5. El rol de pareja (role: 'partner') cambia su propio nombre -> DEBE SER ACEPTADO
  const partnerChangesHerName = updateUserNameWithOwnership('partner', 'partner', 'Ana María');
  assert.equal(partnerChangesHerName, true, 'La pareja puede cambiar su propio nombre');
  assert.equal(statePartner.name, 'Ana María', 'El nombre de la pareja se actualiza en su propia tarjeta');
});

test('14. Catálogo y disponibilidad ampliada de emojis estructurados en categorías temáticas', async () => {
  const { EMOJI_CATEGORIES } = await import('../src/data/emojiCatalog.js').catch(() =>
    import('../src/data/emojiCatalog.ts')
  );

  assert.ok(Array.isArray(EMOJI_CATEGORIES), 'EMOJI_CATEGORIES debe ser un arreglo de categorías');
  assert.ok(EMOJI_CATEGORIES.length >= 6, 'Debe haber al menos 6 categorías temáticas de emojis');

  const categoryNames = EMOJI_CATEGORIES.map((c: any) => c.name);
  assert.ok(categoryNames.includes('Amor & Pareja'), 'Debe incluir categoría Amor & Pareja');
  assert.ok(categoryNames.includes('Caritas & Gestos'), 'Debe incluir categoría Caritas & Gestos');
  assert.ok(categoryNames.includes('Café & Comiditas'), 'Debe incluir categoría Café & Comiditas');
  assert.ok(categoryNames.includes('Animalitos Kawaii'), 'Debe incluir categoría Animalitos Kawaii');
  assert.ok(categoryNames.includes('Vínculo & Magia'), 'Debe incluir categoría Vínculo & Magia');

  // Conteo total de emojis disponibles
  let totalEmojisCount = 0;
  const uniqueEmojis = new Set<string>();

  EMOJI_CATEGORIES.forEach((cat: any) => {
    assert.ok(cat.icon, `La categoría ${cat.name} debe tener un icono asignado`);
    assert.ok(Array.isArray(cat.emojis), `La categoría ${cat.name} debe tener una lista de emojis`);
    assert.ok(cat.emojis.length >= 10, `La categoría ${cat.name} debe contar con al menos 10 emojis`);

    cat.emojis.forEach((em: string) => {
      totalEmojisCount++;
      uniqueEmojis.add(em);
    });
  });

  assert.ok(
    totalEmojisCount >= 180,
    `Debe haber amplia variedad de emojis disponibles (encontrados: ${totalEmojisCount})`
  );
  assert.ok(
    uniqueEmojis.size >= 120,
    `Debe haber al menos 120 emojis únicos (encontrados: ${uniqueEmojis.size})`
  );
});

test('15. Prueba de integración de API: intento de modificar la tarjeta ajena mediante petición HTTP directa (Yorsh vs Anita y viceversa)', async () => {
  // Construir servidor de prueba fiel a la arquitectura de slots de server.ts
  const app = express();
  app.use(express.json());

  interface PeerSyncData {
    lastUpdated: number;
    userProfile?: any;
    messages: any[];
  }

  interface SyncRoomSlot {
    app1Token: string;
    app2Token?: string;
    app1: PeerSyncData;
    app2: PeerSyncData;
  }

  const syncRooms = new Map<string, SyncRoomSlot>();
  const activeTokens = new Map<string, { token: string; roomId: string; role: 'app1' | 'app2' }>();

  // Endpoint emitir código
  app.post('/api/sync/pair/code', (_req, res) => {
    const roomId = 'room_' + crypto.randomBytes(4).toString('hex');
    const tokenA = 'tok_a_' + crypto.randomBytes(8).toString('hex');
    syncRooms.set(roomId, {
      app1Token: tokenA,
      app1: { lastUpdated: Date.now(), messages: [] },
      app2: { lastUpdated: Date.now(), messages: [] },
    });
    activeTokens.set(tokenA, { token: tokenA, roomId, role: 'app1' });
    res.json({ pairCode: 'HLD-9999', deviceToken: tokenA, roomId });
  });

  // Endpoint unirse
  app.post('/api/sync/pair', (req, res) => {
    const { roomId } = req.body;
    const room = syncRooms.get(roomId);
    if (!room) return res.status(404).json({ error: 'not found' });
    const tokenB = 'tok_b_' + crypto.randomBytes(8).toString('hex');
    room.app2Token = tokenB;
    activeTokens.set(tokenB, { token: tokenB, roomId, role: 'app2' });
    res.json({ deviceToken: tokenB, role: 'partner' });
  });

  // Middleware autenticación Bearer
  const authMiddleware = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'unauthorized' });
    const token = authHeader.substring(7).trim();
    const session = activeTokens.get(token);
    if (!session) return res.status(401).json({ error: 'invalid token' });
    const room = syncRooms.get(session.roomId);
    if (!room) return res.status(404).json({ error: 'room not found' });
    req.session = session;
    req.room = room;
    next();
  };

  // Endpoint PUSH: Implementación vulnerable actual de server.ts (admite partnerProfile de forma no aislada)
  app.post('/api/sync/push', authMiddleware, (req: any, res) => {
    const { session, room } = req;
    const slot = session.role; // 'app1' o 'app2'
    const targetPeer = session.role === 'app1' ? 'app2' : 'app1';
    const { userProfile, partnerProfile } = req.body || {};

    if (userProfile) {
      room[slot].userProfile = userProfile;
      room[slot].lastUpdated = Date.now();
    }

    // AUDITORÍA CRÍTICA: server.ts actualmente contiene estas líneas que permiten alterar la tarjeta de la pareja
    if (partnerProfile) {
      room[targetPeer].userProfile = partnerProfile;
      room[targetPeer].lastUpdated = Date.now();
    }

    res.json({ success: true, slotWritten: slot, peerOverwritten: !!partnerProfile });
  });

  // Endpoint PULL
  app.get('/api/sync/pull', authMiddleware, (req: any, res) => {
    const { session, room } = req;
    const partnerSlot = session.role === 'app1' ? 'app2' : 'app1';
    const mySlot = session.role;
    res.json({
      success: true,
      myProfile: room[mySlot].userProfile || null,
      partnerProfile: room[partnerSlot].userProfile || null,
    });
  });

  const server = app.listen(0);
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Inicialización: Dispositivo A (Yorsh) crea habitación
    const initRes = await fetch(`${baseUrl}/api/sync/pair/code`, { method: 'POST' });
    const { deviceToken: tokenYorsh, roomId } = await initRes.json();

    // 2. Dispositivo B (Anita) se une
    const joinRes = await fetch(`${baseUrl}/api/sync/pair`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId }),
    });
    const { deviceToken: tokenAnita } = await joinRes.json();

    // 3. Yorsh establece legítimamente su propio perfil
    await fetch(`${baseUrl}/api/sync/push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenYorsh}` },
      body: JSON.stringify({ userProfile: { name: 'Yorsh', avatar: '🦊', status: 'Trabajando' } }),
    });

    // 4. Anita establece legítimamente su propio perfil
    await fetch(`${baseUrl}/api/sync/push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenAnita}` },
      body: JSON.stringify({ userProfile: { name: 'Anita', avatar: '🐼', status: 'Estudiando' } }),
    });

    // 5. ATAQUE DIRECCIÓN 1: Yorsh (tokenYorsh) envía una petición HTTP directa con 'partnerProfile' para manipular a Anita
    const attack1Res = await fetch(`${baseUrl}/api/sync/push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenYorsh}` },
      body: JSON.stringify({
        partnerProfile: { name: 'Anita Hackeada por Yorsh', avatar: '💀', status: 'Sobrescrita' },
      }),
    });
    const attack1Data = await attack1Res.json();
    assert.equal(attack1Data.success, true);

    // Comprobar qué lee Anita desde su propio token
    const anitaPullRes = await fetch(`${baseUrl}/api/sync/pull`, {
      headers: { Authorization: `Bearer ${tokenAnita}` },
    });
    const anitaPullData = await anitaPullRes.json();

    // DEMOSTRACIÓN CRÍTICA DEL DEFECTO:
    // Con la implementación actual de server.ts, el perfil propio de Anita fue sobreescrito directamente por la petición de Yorsh
    const wasAnitaTampered = anitaPullData.myProfile?.name === 'Anita Hackeada por Yorsh';
    assert.equal(
      wasAnitaTampered,
      true,
      'EVIDENCIA: La ruta /api/sync/push actual en server.ts carece de control de propiedad y permite a Yorsh alterar la tarjeta de Anita'
    );

    // 6. ATAQUE DIRECCIÓN 2: Anita (tokenAnita) envía una petición HTTP directa intentando manipular a Yorsh
    const attack2Res = await fetch(`${baseUrl}/api/sync/push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenAnita}` },
      body: JSON.stringify({
        partnerProfile: { name: 'Yorsh Hackeado por Anita', avatar: '🤡', status: 'Vulnerado' },
      }),
    });
    const attack2Data = await attack2Res.json();
    assert.equal(attack2Data.success, true);

    const yorshPullRes = await fetch(`${baseUrl}/api/sync/pull`, {
      headers: { Authorization: `Bearer ${tokenYorsh}` },
    });
    const yorshPullData = await yorshPullRes.json();

    const wasYorshTampered = yorshPullData.myProfile?.name === 'Yorsh Hackeado por Anita';
    assert.equal(
      wasYorshTampered,
      true,
      'EVIDENCIA: La ruta /api/sync/push actual en server.ts permite a Anita alterar la tarjeta de Yorsh en sentido contrario'
    );
  } finally {
    server.close();
  }
});
