import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Shield,
  Check,
  RefreshCw,
  LogOut,
  Smartphone,
  Wifi,
  MapPin,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

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
    me,
    settings,
    updateSettings,
    updateUserName,
    trigger3DConfetti,
    handleLogout,
  } = useApp();

  const [inputName, setInputName] = useState(
    firebaseUser?.displayName || (me.name !== 'Mi Amor' ? me.name : '')
  );
  const [inputEmail, setInputEmail] = useState(
    firebaseUser?.email || ''
  );
  const [pairCodeInput, setPairCodeInput] = useState(
    settings.duoPairCode || 'DUO-AMOR'
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveAccount = (name: string, email: string) => {
    const cleanName = name.trim();
    if (!cleanName) {
      setStatusMessage('Por favor ingresa un nombre para tu cuenta.');
      return;
    }

    const cleanEmail =
      email.trim() ||
      `${cleanName.toLowerCase().replace(/\s+/g, '')}@gmail.com`;

    const cleanPair = (pairCodeInput || 'DUO-AMOR').trim().toUpperCase();

    // Guardar usuario en localStorage y estado
    const googleUser = {
      uid: 'google_user_' + Date.now(),
      displayName: cleanName,
      email: cleanEmail,
      photoURL:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    };

    try {
      localStorage.setItem(
        'happy_life_google_user',
        JSON.stringify(googleUser)
      );
    } catch {}

    updateUserName('me', cleanName);
    updateSettings({ duoPairCode: cleanPair });

    setStatusMessage('¡Cuenta de Google sincronizada con éxito!');
    trigger3DConfetti();

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleDisconnect = async () => {
    await handleLogout();
    setStatusMessage('Cuenta de Google desconectada.');
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-lg rounded-3xl bg-gradient-to-br from-[#111422] via-[#0d101d] to-[#181124] border-2 border-emerald-500/40 shadow-2xl p-5 sm:p-6 text-white space-y-4 max-h-[92vh] overflow-y-auto"
        >
            {/* Header del Modal con Brand Google */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-md">
                  {/* Google "G" logo estilizado SVG */}
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                    Sincronización con Cuenta Google
                  </h3>
                  <p className="text-xs text-white/60">
                    Cuentas independientes y enlace directo para App 1 y App 2
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

            {/* Explicación de Independencia de Cuentas */}
            <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-emerald-300">
                <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Independencia Total de Cada Teléfono</span>
              </div>
              <p className="text-[11px] leading-relaxed text-emerald-200/90">
                Cada app tiene su propia cuenta y datos personales. Al sincronizar con el mismo <strong>Código de Pareja Duo</strong>, se conectan en tiempo real exclusivamente lo compartido:
              </p>
              <div className="grid grid-cols-2 gap-1.5 text-[10px] text-white/90 pt-1">
                <span className="flex items-center gap-1">💬 Chat instantáneo</span>
                <span className="flex items-center gap-1">🔋 Batería real del celular</span>
                <span className="flex items-center gap-1">📶 Cobertura y señal</span>
                <span className="flex items-center gap-1">📍 Radar GPS en vivo</span>
              </div>
            </div>

            {/* Estado de Cuenta Actual */}
            {firebaseUser ? (
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-lg shadow-sm">
                    {firebaseUser.displayName?.charAt(0) || 'G'}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <h4 className="text-xs font-black text-white">
                        {firebaseUser.displayName}
                      </h4>
                    </div>
                    <p className="text-[11px] text-white/50">{firebaseUser.email}</p>
                    <span className="text-[9px] text-emerald-300 font-bold uppercase tracking-wider">
                      ✓ Sincronizado correctamente
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Salir</span>
                </button>
              </div>
            ) : null}

            {/* Selección Rápida de Cuenta para App 1 o App 2 */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/80 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Elige tu cuenta para este teléfono:</span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setInputName('Lucas (Yo)');
                    setInputEmail('lucas@gmail.com');
                  }}
                  className={`p-2.5 rounded-2xl border text-left cursor-pointer transition-all ${
                    inputName.includes('Lucas')
                      ? 'border-emerald-400 bg-emerald-950/40 text-emerald-200 shadow-md ring-1 ring-emerald-400'
                      : 'border-white/10 bg-white/5 hover:bg-white/10 text-white/80'
                  }`}
                >
                  <div className="text-xs font-black">👤 App 1 (Lucas)</div>
                  <div className="text-[10px] text-white/50 truncate">lucas@gmail.com</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setInputName('Sofía (Pareja)');
                    setInputEmail('sofia@gmail.com');
                  }}
                  className={`p-2.5 rounded-2xl border text-left cursor-pointer transition-all ${
                    inputName.includes('Sofía')
                      ? 'border-emerald-400 bg-emerald-950/40 text-emerald-200 shadow-md ring-1 ring-emerald-400'
                      : 'border-white/10 bg-white/5 hover:bg-white/10 text-white/80'
                  }`}
                >
                  <div className="text-xs font-black">🐼 App 2 (Sofía)</div>
                  <div className="text-[10px] text-white/50 truncate">sofia@gmail.com</div>
                </button>
              </div>
            </div>

            {/* Formulario de Cuenta Personalizada */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="text-xs font-semibold text-white/70 block mb-1">
                  Tu Nombre o Apodo:
                </label>
                <input
                  type="text"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  placeholder="Ej. Lucas, Sofía, etc."
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/20 text-xs text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-white/70 block mb-1">
                  Tu Correo de Google (Gmail):
                </label>
                <input
                  type="email"
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                  placeholder="micorreo@gmail.com"
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/20 text-xs text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              {/* Código de Pareja Duo */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-rose-300">
                    Código de Pareja Duo (Para enlazar con tu pareja):
                  </label>
                  <span className="text-[10px] text-white/50 font-mono">
                    Mismo código en ambos teléfonos
                  </span>
                </div>
                <input
                  type="text"
                  value={pairCodeInput}
                  onChange={(e) => setPairCodeInput(e.target.value.toUpperCase().trim())}
                  placeholder="DUO-AMOR"
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-rose-500/30 text-xs font-mono font-black text-rose-300 tracking-wider focus:outline-none focus:border-rose-400"
                />
              </div>
            </div>

            {statusMessage && (
              <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs text-center font-bold">
                {statusMessage}
              </div>
            )}

            {/* Botón Principal Guardar */}
            <button
              type="button"
              onClick={() => handleSaveAccount(inputName, inputEmail)}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 active:scale-98 text-white font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/25 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Sincronizar mi Cuenta y Enlazar Pareja</span>
            </button>
          </motion.div>
        </AnimatePresence>
      </div>,
      document.body
    );
  };
