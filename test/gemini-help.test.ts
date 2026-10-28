import test from 'node:test';
import assert from 'node:assert/strict';
import { getGeminiEndpoint, getOfflineHelpResponse, askGemini } from '../src/utils/geminiApi';

test('1. Resolución de URL del endpoint Gemini para Android vs Web', () => {
  const url = getGeminiEndpoint();
  assert.ok(url.includes('/api/gemini/ask'), 'La URL del endpoint debe apuntar a /api/gemini/ask');
});

test('2. Intent recognition: ¿Cómo agrego un gasto? y sinónimos cotidianos', () => {
  const res1 = getOfflineHelpResponse('¿Cómo agrego un gasto?');
  assert.ok(res1 !== null);
  assert.ok(res1.success);
  assert.ok(res1.text.includes('Recordatorios'));
  assert.ok(res1.text.includes('Calculadora de Gastos'));
  assert.ok(res1.text.includes('Añadir Gasto'));

  // Sinónimo coloquial
  const res2 = getOfflineHelpResponse('¿cómo pongo una compra que hice?');
  assert.ok(res2 !== null);
  assert.ok(res2.success);
  assert.ok(res2.text.includes('Recordatorios'));
  assert.ok(res2.text.includes('Calculadora de Gastos'));
});

test('3. Intent recognition: ¿Dónde veo los gastos de este mes?', () => {
  const res = getOfflineHelpResponse('¿Dónde veo los gastos de este mes?');
  assert.ok(res !== null);
  assert.ok(res.success);
  assert.ok(res.text.includes('Recordatorios'));
  assert.ok(res.text.includes('Este Mes'));
});

test('4. Intent recognition: ¿Cómo sincronizo con mi pareja?', () => {
  const res = getOfflineHelpResponse('¿Cómo sincronizo con mi pareja?');
  assert.ok(res !== null);
  assert.ok(res.success);
  assert.ok(res.text.includes('Ajustes'));
  assert.ok(res.text.includes('Respaldo y Pareja'));
});

test('5. Intent recognition: ¿Dónde cambio mi nombre?', () => {
  const res = getOfflineHelpResponse('¿Dónde cambio mi nombre?');
  assert.ok(res !== null);
  assert.ok(res.success);
  assert.ok(res.text.includes('Ajustes'));
  assert.ok(res.text.includes('Apariencia') || res.text.includes('Respaldo y Pareja'));
});

test('6. Intent recognition: ¿Cómo busco canciones?', () => {
  const res = getOfflineHelpResponse('¿Cómo busco canciones?');
  assert.ok(res !== null);
  assert.ok(res.success);
  assert.ok(res.text.includes('Música Dúo'));
});

test('7. Contexto dinámico según la pantalla actual («¿Cómo funciona esta pantalla?»)', () => {
  const resLocation = getOfflineHelpResponse('¿Cómo funciona esta pantalla?', 'location');
  assert.ok(resLocation !== null);
  assert.ok(resLocation.text.includes('Ubicación') || resLocation.text.includes('Google Maps'));

  const resStatus = getOfflineHelpResponse('¿Cómo funciona esta pantalla?', 'status');
  assert.ok(resStatus !== null);
  assert.ok(resStatus.text.includes('Estado actual') || resStatus.text.includes('batería social'));

  const resMinigames = getOfflineHelpResponse('¿Cómo funciona esta pantalla?', 'minigames');
  assert.ok(resMinigames !== null);
  assert.ok(resMinigames.text.includes('Minijuegos') || resMinigames.text.includes('Uno'));
});

test('8. Resiliencia y fallback offline seguro: askGemini nunca lanza excepciones no controladas', async () => {
  const result = await askGemini('¿Cómo pongo una compra?', 'reminders');
  assert.ok(result.success, 'Debe devolver un resultado exitoso incluso si la red está simulada');
  assert.ok(result.text.length > 20, 'El texto debe contener una respuesta informativa');
  assert.ok(Array.isArray(result.suggestions), 'Las sugerencias deben ser un array');
});

test('9. Las preguntas generales (clima, temperatura, matemáticas, recetas) NO activan la descripción de la app', () => {
  assert.strictEqual(getOfflineHelpResponse('temperatura para mañana en buenos aires'), null);
  assert.strictEqual(getOfflineHelpResponse('¿va a llover hoy en santiago?'), null);
  assert.strictEqual(getOfflineHelpResponse('¿cuánto es 50 dividido 2?'), null);
  assert.strictEqual(getOfflineHelpResponse('receta rápida de panqueques'), null);
  assert.strictEqual(getOfflineHelpResponse('traduce thank you al español'), null);
});

test('10. Endpoint /api/gemini/ask responde sobre el clima real y no sobre los menús de Happy Life Duo', async () => {
  const response = await fetch('http://localhost:3000/api/gemini/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: 'temperatura para mañana en buenos aires' }),
  });
  assert.strictEqual(response.status, 200);
  const data: any = await response.json();
  assert.strictEqual(data.success, true);
  assert.ok(data.text.toLowerCase().includes('buenos aires') || data.text.toLowerCase().includes('temperatura') || data.text.toLowerCase().includes('°c'));
  assert.ok(!data.text.includes('Calculadora de Gastos'), 'No debe hablar de la Calculadora de Gastos ante preguntas de clima');
  assert.ok(!data.text.includes('Batería social'), 'No debe hablar de batería social ante preguntas de clima');
});
