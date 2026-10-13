import JSZip from 'jszip';
import {
  UserProfile,
  ReminderNote,
  AlarmItem,
  JournalEntry,
  ChatMessage,
  AudioRecording,
  AppSettings,
  ExpenseItem,
  ExpenseCurrency,
} from '../types';

export interface BackupPayload {
  version: string;
  exportedAt: string;
  me: UserProfile;
  partner: UserProfile;
  reminders: ReminderNote[];
  alarms: AlarmItem[];
  journal: JournalEntry[];
  messages: ChatMessage[];
  recordings: AudioRecording[];
  expenses: ExpenseItem[];
  settings: AppSettings;
}

export interface BackupStateInput {
  me: UserProfile;
  partner: UserProfile;
  reminders: ReminderNote[];
  alarms: AlarmItem[];
  journal: JournalEntry[];
  messages: ChatMessage[];
  recordings: AudioRecording[];
  expenses: ExpenseItem[];
  settings: AppSettings;
}

/**
 * Construye el payload canónico completo para la copia de seguridad.
 * Garantiza la presencia de todas las secciones, incluidos los gastos completos.
 */
export function buildBackupPayload(state: BackupStateInput): BackupPayload {
  return {
    version: '4.0',
    exportedAt: new Date().toISOString(),
    me: state.me,
    partner: state.partner,
    reminders: state.reminders,
    alarms: state.alarms,
    journal: state.journal,
    messages: state.messages,
    recordings: state.recordings,
    expenses: state.expenses,
    settings: state.settings,
  };
}

/**
 * Codifica el payload para el archivo .happyduo.
 * Utiliza URI Component encoding + Base64 (ofuscación para archivo ligero descargable, no cifrado criptográfico).
 * Compatible tanto en navegadores (btoa) como en entornos Node.js (Buffer).
 */
export function encodeBackupPayload(payload: any): string {
  const jsonStr = JSON.stringify(payload);
  const uriEncoded = encodeURIComponent(jsonStr);
  if (typeof btoa === 'function') {
    return btoa(uriEncoded);
  }
  return Buffer.from(uriEncoded, 'utf-8').toString('base64');
}

/**
 * Decodifica una cadena de respaldo .happyduo o un JSON directo.
 */
export function decodeBackupPayload(rawStr: string): any {
  const trimmed = rawStr.trim();
  let decodedStr = trimmed;
  try {
    if (typeof atob === 'function') {
      decodedStr = decodeURIComponent(atob(trimmed));
    } else {
      decodedStr = decodeURIComponent(Buffer.from(trimmed, 'base64').toString('utf-8'));
    }
  } catch {
    // Si no es Base64, se evalúa directamente como texto JSON plano
    decodedStr = trimmed;
  }
  return JSON.parse(decodedStr);
}

export interface ExpenseValidationResult {
  isValid: boolean;
  expenses?: ExpenseItem[];
  error?: string;
}

/**
 * Valida minuciosamente un arreglo de gastos conforme a la interfaz ExpenseItem de types.ts.
 * Rechaza datos corruptos, importes inválidos (<= 0, NaN), divisas no soportadas y tipos erróneos.
 * Preserva campos válidos e históricos (como creatorName o description omitidos en versiones anteriores).
 */
export function validateAndSanitizeExpenses(
  rawExpenses: any,
  defaultMeName = 'Yo',
  defaultPartnerName = 'Mi Pareja'
): ExpenseValidationResult {
  if (!Array.isArray(rawExpenses)) {
    return {
      isValid: false,
      error: 'La propiedad expenses debe ser un arreglo.',
    };
  }

  // Soporte explícito para vaciado intencional: expenses: [] es completamente válido
  if (rawExpenses.length === 0) {
    return {
      isValid: true,
      expenses: [],
    };
  }

  const sanitized: ExpenseItem[] = [];

  for (let i = 0; i < rawExpenses.length; i++) {
    const item = rawExpenses[i];
    if (!item || typeof item !== 'object') {
      return { isValid: false, error: `El gasto en el índice ${i} no es un objeto válido.` };
    }
    if (typeof item.id !== 'string' || item.id.trim().length === 0) {
      return { isValid: false, error: `El gasto en el índice ${i} carece de un id válido.` };
    }
    if (item.creator !== 'me' && item.creator !== 'partner') {
      return { isValid: false, error: `El gasto con id '${item.id}' tiene un creador inválido ('${item.creator}').` };
    }
    if (item.creatorName !== undefined && typeof item.creatorName !== 'string') {
      return { isValid: false, error: `El gasto con id '${item.id}' tiene un creatorName con tipo inválido.` };
    }
    if (typeof item.date !== 'string' || !/^\d{4}-\d{2}-\d{2}/.test(item.date)) {
      return { isValid: false, error: `El gasto con id '${item.id}' tiene un formato de fecha inválido ('${item.date}').` };
    }
    if (typeof item.category !== 'string' || item.category.trim().length === 0) {
      return { isValid: false, error: `El gasto con id '${item.id}' carece de una categoría válida.` };
    }
    if (item.description !== undefined && typeof item.description !== 'string') {
      return { isValid: false, error: `El gasto con id '${item.id}' tiene una descripción con tipo no admitido.` };
    }
    if (typeof item.amount !== 'number' || !Number.isFinite(item.amount) || item.amount <= 0) {
      return {
        isValid: false,
        error: `El gasto con id '${item.id}' tiene un importe inválido (${item.amount}). Debe ser un número positivo y finito.`,
      };
    }
    if (item.currency !== 'CLP' && item.currency !== 'ARS' && item.currency !== 'USD') {
      return { isValid: false, error: `El gasto con id '${item.id}' tiene una divisa no admitida ('${item.currency}').` };
    }
    if (item.createdAt !== undefined && typeof item.createdAt !== 'string') {
      return { isValid: false, error: `El gasto con id '${item.id}' tiene una fecha de creación con tipo no admitido.` };
    }

    sanitized.push({
      id: String(item.id).trim(),
      creator: item.creator as 'me' | 'partner',
      creatorName:
        typeof item.creatorName === 'string' && item.creatorName.trim().length > 0
          ? item.creatorName.trim()
          : item.creator === 'me'
          ? defaultMeName
          : defaultPartnerName,
      date: String(item.date).slice(0, 10),
      category: String(item.category).trim(),
      description: typeof item.description === 'string' ? item.description : '',
      amount: item.amount,
      currency: item.currency as ExpenseCurrency,
      createdAt: typeof item.createdAt === 'string' && item.createdAt.trim().length > 0
        ? item.createdAt
        : new Date().toISOString(),
    });
  }

  return {
    isValid: true,
    expenses: sanitized,
  };
}

export interface RestorationValidationResult {
  isValid: boolean;
  data?: any;
  sanitizedExpenses?: ExpenseItem[];
  hasExpensesProperty: boolean;
  error?: string;
}

/**
 * Valida de forma ATÓMICA una copia de seguridad antes de modificar cualquier estado.
 * Si algún componente de la copia (JSON, perfiles, gastos) es inválido, rechaza de inmediato
 * la operación devolviendo isValid: false, asegurando cero mutación parcial.
 */
export function validateBackupAtomically(
  rawStr: string,
  defaultMeName = 'Yo',
  defaultPartnerName = 'Mi Pareja'
): RestorationValidationResult {
  let data: any;
  try {
    data = decodeBackupPayload(rawStr);
  } catch (err: any) {
    return {
      isValid: false,
      hasExpensesProperty: false,
      error: `Error al decodificar o parsear JSON: ${err?.message || err}`,
    };
  }

  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      hasExpensesProperty: false,
      error: 'La copia de seguridad no contiene un objeto válido.',
    };
  }

  if (!data.me || !data.partner) {
    return {
      isValid: false,
      hasExpensesProperty: false,
      error: 'La copia de seguridad no contiene los perfiles requeridos (me y partner).',
    };
  }

  const hasExpensesProperty = 'expenses' in data;
  let sanitizedExpenses: ExpenseItem[] | undefined = undefined;

  if (hasExpensesProperty) {
    const expenseRes = validateAndSanitizeExpenses(
      data.expenses,
      data.me?.name || defaultMeName,
      data.partner?.name || defaultPartnerName
    );
    if (!expenseRes.isValid) {
      return {
        isValid: false,
        hasExpensesProperty: true,
        error: expenseRes.error,
      };
    }
    sanitizedExpenses = expenseRes.expenses;
  }

  return {
    isValid: true,
    data,
    sanitizedExpenses,
    hasExpensesProperty,
  };
}

/**
 * Crea la estructura JSZip con el backup JSON y el archivo de instrucciones.
 */
export function createBackupZip(payload: BackupPayload): JSZip {
  const zip = new JSZip();
  const jsonStr = JSON.stringify(payload, null, 2);
  zip.file('nuestro_lugar_seguro_backup.json', jsonStr);

  const readme =
    `=========================================================\n` +
    `HAPPY LIFE DUO - NUESTRO LUGAR SEGURO ❤\n` +
    `Copia de Seguridad Completa para Celular / PC\n` +
    `Fecha de Exportación: ${new Date().toLocaleString()}\n` +
    `=========================================================\n\n` +
    `Este archivo ZIP contiene todos sus datos:\n` +
    `- Diarios de vida compartidos y personales\n` +
    `- Recordatorios y listas de tareas\n` +
    `- Alarmas y tonos personalizados\n` +
    `- Grabaciones de voz y audios compartidos\n` +
    `- Historial del Mini Chat\n` +
    `- Gastos y balances de la Calculadora de Gastos\n` +
    `- Ajustes, colores de texto, fotos y preferencias\n\n` +
    `Para restaurar en la app:\n` +
    `1. Abre Happy Life Duo\n` +
    `2. Ve a Ajustes y Personalización -> Seguridad & Respaldos\n` +
    `3. Toca "Restaurar Copia" y selecciona este archivo ZIP o el JSON interior.\n` +
    `¡Todo volverá a quedar exactamente como lo dejaron! 💖\n`;

  zip.file('LEEME_INSTRUCCIONES.txt', readme);
  return zip;
}
