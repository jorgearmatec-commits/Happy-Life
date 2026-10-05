// Utilidad de almacenamiento IndexedDB para canciones MP3 locales de VLC
const DB_NAME = 'happy_life_vlc_music_db';
const DB_VERSION = 1;
const STORE_NAME = 'mp3_tracks';

export interface StoredVlcTrack {
  id: string;
  name: string;
  sizeStr: string;
  blob: Blob;
  createdAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB no está disponible en este dispositivo'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveMultipleVlcTracks(
  tracks: Array<{ id: string; name: string; sizeStr: string; blob: Blob }>
): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const now = Date.now();
    for (const t of tracks) {
      store.put({
        id: t.id,
        name: t.name,
        sizeStr: t.sizeStr,
        blob: t.blob,
        createdAt: now,
      });
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Error guardando canciones en IndexedDB:', err);
  }
}

export async function getStoredVlcTracks(): Promise<StoredVlcTrack[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const results = (request.result as StoredVlcTrack[]) || [];
        // Ordenar por fecha de creación (más recientes primero)
        results.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Error leyendo canciones de IndexedDB:', err);
    return [];
  }
}

export async function deleteStoredVlcTrack(id: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Error eliminando canción de IndexedDB:', err);
  }
}

export async function clearAllStoredVlcTracks(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Error limpiando IndexedDB:', err);
  }
}
