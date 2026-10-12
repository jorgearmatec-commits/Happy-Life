import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Shield,
  Check,
  RefreshCw,
  LogOut,
  Copy,
  CheckCheck,
  Link2,
  Lock,
  User,
  Mail,
  AlertCircle,
  CloudUpload,
  CloudDownload,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { loginWithGoogle } from '../firebase';
import { playTone } from './AudioSynthesizer';

interface GoogleSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleSyncModal: React.FC<GoogleSyncModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    firebaseUser,
    setFirebaseUser,
    me,
    settings,
    updateSettings,
    trigger3DConfetti,
    handleLogout,
    restoreFromEncryptedBackup,
    exportEncryptedBackup,
  } = useApp();

  // Estados de proceso de autenticación de Google oficial
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Estados de respaldo en la nube
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupNotice, setBackupNotice] = useState<string | null>(null);

  // Código temporal de vinculación de pareja y token de dispositivo
  const [partnerVerificationCode, setPartnerVerificationCode] = useState('');
  const [myVerificationCode, setMyVerificationCode] = useState(
    settings.duoPairCode || ''
  );
  const [copiedCode, setCopiedCode] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (settings.duoPairCode) {
      setMyVerificationCode(settings.duoPairCode);
    }
  }, [settings.duoPairCode]);

  if (!isOpen) return null;

  const handleCopyMyCode = () => {
    if (!myVerificationCode) return;
    try {
      navigator.clipboard.writeText(myVerificationCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
      try { playTone('water'); } catch {}
    } catch {}
  };

  const handleRegeneratePairCode = async () => {
    try {
      const res = await fetch('/api/sync/pair/code', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setMyVerificationCode(data.pairCode);
        updateSettings({ duoPairCode: data.pairCode, deviceToken: data.deviceToken });
        setStatusMessage(`✓ Nuevo código temporal generado: ${data.pairCode} (Expira en 10 min de un solo uso).`);
        try { playTone('water'); } catch {}
      } else {
        setStatusMessage('No se pudo generar un código temporal.');
      }
    } catch {
      setStatusMessage('Error de red al conectar con el servidor.');
    }
  };

  // INICIO DE SESIÓN OFICIAL CON GOOGLE (OAuth Firebase Oficial - Sin solicitar contraseñas)
  const handleGoogleOAuthLogin = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    setStatusMessage(null);

    try {
      const user = await loginWithGoogle();
      if (user) {
        setFirebaseUser(user);
        try { playTone('cathedral_bells'); } catch {}
        try { trigger3DConfetti(); } catch {}
        setStatusMessage(
          `✓ Sesión iniciada con éxito como ${user.displayName || user.email}.`
        );

        // Auto-sincronizar respaldo en nube si existe token de dispositivo
        if (settings.deviceToken) {
          try {
            const res = await fetch('/api/sync/backup', {
              headers: {
                Authorization: `Bearer ${settings.deviceToken}`,
              },
            });
            if (res.ok) {
              const cloudData = await res.json();
              if (cloudData.backup) {
                restoreFromEncryptedBackup(JSON.stringify(cloudData.backup));
                setBackupNotice('✓ Respaldo previo restaurado desde la nube.');
              }
            }
          } catch {}
        }
      }
    } catch (err: any) {
      console.warn('Google Auth Error:', err);
      if (err?.message?.includes('CONFIG_PENDING')) {
        setAuthError(
          'Configuración de Firebase OAuth pendiente: Para activar el inicio de sesión oficial con Google en producción, agrega las credenciales de Firebase en tu archivo de variables de entorno (.env). La vinculación entre celulares sigue activa mediante el código de pareja.'
        );
      } else if (err?.code === 'auth/popup-closed-by-user') {
        setAuthError('La ventana de Google se cerró antes de completar la autenticación.');
      } else if (err?.code === 'auth/cancelled-popup-request') {
        setAuthError('Se canceló la solicitud de autenticación.');
      } else {
        setAuthError(
          err?.message || 'No se pudo conectar con el servicio de autenticación de Google.'
        );
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  // VINCULACIÓN CON LA PAREJA MEDIANTE CÓDIGO TEMPORAL Y TOKEN BEARER INDEPENDIENTE
  const handleLinkPartnerCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = partnerVerificationCode.trim().toUpperCase();
    if (!cleanCode) {
      setStatusMessage('Ingresa el código que te compartió tu pareja.');
      return;
    }

    try {
      const res = await fetch('/api/sync/pair', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pairCode: cleanCode,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        updateSettings({ duoPairCode: cleanCode, deviceToken: data.deviceToken });
        setMyVerificationCode(cleanCode);
        setPartnerVerificationCode('');
        try { playTone('water'); } catch {}
        try { trigger3DConfetti(); } catch {}
        setStatusMessage(
          `💖 ¡Dispositivos emparejados con éxito mediante token Bearer seguro! La sincronización de estados, chat y gastos está activa.`
        );
      } else {
        const errJson = await res.json().catch(() => ({}));
        setStatusMessage(errJson.error || 'Código inválido o expirado. Solicita un código fresco a tu pareja.');
      }
    } catch {
      setStatusMessage('Error de conexión al verificar el código con el servidor.');
    }
  };

  // SUBIR RESPALDO MANUAL A LA NUBE CON AUTENTICACIÓN BEARER
  const handleUploadCloudBackup = async () => {
    if (!settings.deviceToken) {
      setBackupNotice('Debes vincular tus dispositivos mediante código de pareja para autorizar el respaldo seguro.');
      return;
    }

    setIsBackingUp(true);
    setBackupNotice(null);
    try {
      const currentState = localStorage.getItem('happy_life_duo_v4_state');
      if (!currentState) {
        setBackupNotice('No hay datos locales para respaldar.');
        return;
      }

      const res = await fetch('/api/sync/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.deviceToken}`,
        },
        body: JSON.stringify({
          email: firebaseUser?.email || null,
          data: JSON.parse(currentState),
        }),
      });

      if (res.ok) {
        try { playTone('water'); } catch {}
        setBackupNotice('✓ Copia de seguridad guardada con éxito en la nube protegida.');
      } else {
        const err = await res.json().catch(() => ({}));
        setBackupNotice(err.error || 'Error al enviar la copia de seguridad.');
      }
    } catch {
      setBackupNotice('Error de red al subir la copia de seguridad.');
    } finally {
      setIsBackingUp(false);
    }
  };

  // RESTAURAR RESPALDO MANUAL DESDE LA NUBE CON AUTENTICACIÓN BEARER
  const handleDownloadCloudBackup = async () => {
    if (!settings.deviceToken) {
      setBackupNotice('Debes vincular tus dispositivos mediante código de pareja para acceder al respaldo.');
      return;
    }

    setIsRestoring(true);
    setBackupNotice(null);
    try {
      const res = await fetch('/api/sync/backup', {
        headers: {
          Authorization: `Bearer ${settings.deviceToken}`,
        },
      });

      if (res.ok) {
        const cloudData = await res.json();
        if (cloudData.backup) {
          const ok = restoreFromEncryptedBackup(JSON.stringify(cloudData.backup));
          if (ok) {
            try { playTone('cathedral_bells'); } catch {}
            try { trigger3DConfetti(); } catch {}
            setBackupNotice('✓ Datos restaurados exitosamente desde la nube.');
          } else {
            setBackupNotice('El formato de respaldo no pudo ser restaurado.');
          }
        } else {
          setBackupNotice('No se encontró ninguna copia previa en la nube.');
        }
      } else {
        const err = await res.json().catch(() => ({}));
        setBackupNotice(err.error || 'Error al descargar el respaldo.');
      }
    } catch {
      setBackupNotice('Error de conexión al descargar la copia de seguridad.');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    await handleLogout();
    setAuthError(null);
    setStatusMessage('Has cerrado sesión de Google.');
  };

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md select-none">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-lg rounded-3xl bg-gradient-to-br from-[#121526] via-[#0d101e] to-[#181226] border-2 border-emerald-500/40 shadow-2xl p-5 sm:p-6 text-white space-y-4 max-h-[92vh] overflow-y-auto"
        >
          {/* Header Oficial con Logotipo Oficial de Google */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white p-2 flex items-center justify-center shadow-md shrink-0">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white font-heading">
                  Sincronización y Cuenta de Google
                </h3>
                <p className="text-xs text-white/60">
                  Autenticación oficial OAuth y enlace de pareja
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white/70 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Avisos de estado */}
          {statusMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-bold leading-relaxed shadow-sm">
              {statusMessage}
            </div>
          )}

          {authError && (
            <div className="p-3.5 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs leading-relaxed space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Información de Autenticación:</span>
              </div>
              <p className="text-white/80">{authError}</p>
            </div>
          )}

          {/* 1. SECCIÓN: INICIO DE SESIÓN CON GOOGLE (FLUJO OFICIAL OAUTH) */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white/5 border border-white/10 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>1. Tu Cuenta de Google (Individual)</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                {firebaseUser ? '✓ Conectado' : 'Sin iniciar'}
              </span>
            </div>

            {firebaseUser ? (
              <div className="p-4 rounded-2xl bg-black/50 border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {firebaseUser.photoURL ? (
                      <img
                        src={firebaseUser.photoURL}
                        alt="Avatar"
                        className="w-11 h-11 rounded-full border-2 border-emerald-400 object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 border-2 border-emerald-300 flex items-center justify-center text-lg font-black text-black shrink-0">
                        {firebaseUser.displayName?.charAt(0) || 'G'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-black text-white truncate">
                        {firebaseUser.displayName || 'Usuario de Google'}
                      </p>
                      <p className="text-xs text-white/60 truncate">{firebaseUser.email}</p>
                      <span className="text-[10px] text-emerald-300 font-bold flex items-center gap-1 mt-0.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Autenticado con Firebase OAuth
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleDisconnectGoogle}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>

                {/* Acciones de respaldo en la nube para usuario conectado */}
                <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={handleUploadCloudBackup}
                    disabled={isBackingUp}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <CloudUpload className="w-3.5 h-3.5" />
                    <span>{isBackingUp ? 'Subiendo...' : 'Subir Respaldo a Nube'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadCloudBackup}
                    disabled={isRestoring}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-400/30 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <CloudDownload className="w-3.5 h-3.5" />
                    <span>{isRestoring ? 'Descargando...' : 'Restaurar de Nube'}</span>
                  </button>
                </div>

                {backupNotice && (
                  <p className="text-[11px] text-emerald-300 font-bold text-center pt-1">
                    {backupNotice}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-white/70 leading-relaxed">
                  Inicia sesión de forma segura a través del flujo oficial de Google. No requerimos ni almacenamos tu contraseña.
                </p>

                <button
                  type="button"
                  onClick={handleGoogleOAuthLogin}
                  disabled={isAuthenticating}
                  className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 cursor-pointer shadow-lg active:scale-98 transition-all disabled:opacity-50"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>
                    {isAuthenticating
                      ? 'Abriendo Google OAuth...'
                      : 'Continuar con Google (OAuth Oficial)'}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* 2. SECCIÓN: VINCULACIÓN DE PAREJA POR CÓDIGOS TEMPORALES Y TOKEN DE DISPOSITIVO */}
          <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-rose-950/30 via-purple-950/20 to-black/40 border border-rose-500/30 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                <Link2 className="w-4 h-4 text-rose-400" />
                <span>2. Vinculación con tu Pareja</span>
              </span>
              <span className="text-[10px] text-rose-200/80 font-mono font-bold">
                Códigos Temporales
              </span>
            </div>

            <p className="text-[11px] text-white/70 leading-relaxed">
              Cada usuario mantiene su propia cuenta individual. Para enlazar las dos aplicaciones, comparte tu código temporal o ingresa el de tu pareja:
            </p>

            {/* Código generado temporal para compartir */}
            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-white/70 font-semibold">
                <span>Tu código de vinculación:</span>
                <button
                  type="button"
                  onClick={handleRegeneratePairCode}
                  className="text-[10px] text-amber-300 hover:text-amber-200 font-bold flex items-center gap-1 cursor-pointer"
                  title="Generar un nuevo código temporal"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Nuevo código</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 py-2 px-3 rounded-xl bg-black/60 border border-rose-400/40 text-center font-mono text-base font-black text-rose-300 tracking-widest">
                  {myVerificationCode || 'Generando...'}
                </div>
                <button
                  type="button"
                  onClick={handleCopyMyCode}
                  className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 active:scale-95 text-rose-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-rose-400/30"
                >
                  {copiedCode ? (
                    <>
                      <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between text-[10px] text-white/40 pt-0.5">
                <span className="flex items-center gap-1">
                  <Smartphone className="w-3 h-3 text-white/40" />
                  Token de dispositivo:
                </span>
                <span className="font-mono text-white/60">
                  {settings.deviceToken ? settings.deviceToken.slice(0, 12) + '...' : 'Activo'}
                </span>
              </div>
            </div>

            {/* Formulario para ingresar el código de la pareja */}
            <form onSubmit={handleLinkPartnerCode} className="space-y-2 pt-1">
              <label className="text-[11px] font-bold text-white/80 block">
                Ingresa el código que te dio tu pareja:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={partnerVerificationCode}
                  onChange={(e) => setPartnerVerificationCode(e.target.value.toUpperCase())}
                  placeholder="Ej. HLD-8921"
                  className="flex-1 px-3 py-2.5 rounded-xl bg-black/60 border border-white/20 text-xs sm:text-sm font-mono font-bold text-white focus:outline-none focus:border-rose-400 tracking-wider"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-400 hover:to-purple-500 text-white font-bold text-xs cursor-pointer shadow-md active:scale-95 transition-all shrink-0"
                >
                  Vincular
                </button>
              </div>
            </form>
          </div>

          {/* 3. RESPALDO LOCAL / DESCARGA OFFLINE */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
            <span className="text-white/70">¿Deseas una copia de seguridad en archivo?</span>
            <button
              type="button"
              onClick={exportEncryptedBackup}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-[11px] cursor-pointer"
            >
              Descargar archivo JSON
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>,
    document.body
  );
};
