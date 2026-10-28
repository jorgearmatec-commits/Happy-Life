import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInAnonymously,
  updateProfile,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocFromServer,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

let db: Firestore;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  }, firebaseConfig.firestoreDatabaseId);
} catch {
  db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Validar conectividad con Firestore al iniciar (solo en navegador)
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Verifique la conectividad de red con Firestore.');
    }
  }
}
if (typeof window !== 'undefined') {
  testConnection();
}

// Manejador tipado y estructurado de errores de Firestore según Security Architect Spec
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function loginWithGoogle(): Promise<FirebaseUser> {
  const isNative = typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();

  // En Android nativo, las políticas de Google WebView impiden ventanas popup (disallowed_useragent)
  if (isNative) {
    try {
      console.log('[Firebase Auth] Intentando inicio con popup en Android...');
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (popupErr: any) {
      console.warn('[Firebase Auth] Falló popup en Android, evaluando alternativas:', popupErr?.code || popupErr?.message);
      if (
        popupErr?.code === 'auth/popup-blocked' ||
        popupErr?.code === 'auth/operation-not-supported-in-this-environment' ||
        popupErr?.code === 'auth/unauthorized-domain' ||
        popupErr?.message?.includes('disallowed_useragent') ||
        popupErr?.message?.includes('atomic-provider-6v4kj.firebaseapp.com')
      ) {
        try {
          await signInWithRedirect(auth, googleProvider);
          throw new Error('REDIRECT_IN_PROGRESS: Redirigiendo a Google para autorización segura...');
        } catch (redirectErr: any) {
          throw new Error(
            `ANDROID_WEBVIEW_AUTH: Google no permite ventanas emergentes OAuth dentro del WebView empaquetado de Android en dominios como ${firebaseConfig.authDomain}. Puedes usar «Acceso Rápido de Pareja» o tu «Código de Pareja (HLD-XXXX)» para sincronizar ambos celulares con la nube sin restricciones.`
          );
        }
      }
      throw popupErr;
    }
  }

  // En navegador Web estándar
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err: any) {
    if (err?.code === 'auth/popup-blocked' || err?.code === 'auth/operation-not-supported-in-this-environment') {
      await signInWithRedirect(auth, googleProvider);
      throw new Error('REDIRECT_IN_PROGRESS: Redirigiendo a Google...');
    }
    throw err;
  }
}

// Acceso rápido oficial para Android cuando Google OAuth popup está restringido en el WebView
export async function loginWithQuickAccount(displayName: string, email?: string): Promise<FirebaseUser> {
  const cred = await signInAnonymously(auth);
  if (cred.user) {
    await updateProfile(cred.user, {
      displayName: displayName || 'Usuario de Happy Life Duo',
    });
  }
  return cred.user;
}

export async function logoutUser(): Promise<void> {
  try {
    await fbSignOut(auth);
  } catch (err) {
    console.error('Sign-out error:', err);
  }
}

export {
  db,
  collection,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  onAuthStateChanged,
  type FirebaseUser,
};
