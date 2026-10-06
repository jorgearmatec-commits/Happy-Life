import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { CurrentStatus } from './components/CurrentStatus';
import { RemindersSection } from './components/RemindersSection';
import { AlarmClockSection } from './components/AlarmClockSection';
import { LifeJournalSection } from './components/LifeJournalSection';
import { LocationSection } from './components/LocationSection';
import { RecorderCard } from './components/RecorderCard';
import { EmotionalSupportSection, COMPREHENSIVE_ADVICE } from './components/EmotionalSupportSection';
import { MenstrualCard } from './components/MenstrualCard';
import { MinigamesSection } from './components/MinigamesSection';
import { MiniChatModal } from './components/MiniChatModal';
import { BodyDoublingModal } from './components/BodyDoublingModal';
import { SettingsModal } from './components/SettingsModal';
import { SubmenuNav } from './components/SubmenuNav';
import { GeminiQuickModal } from './components/GeminiQuickModal';
import { Lock, Heart, Sparkles, X, Brain, Headphones, LogOut, Moon, Sun } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { settings, updateSettings, setActiveMenu, me } = useApp();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMiniChatOpen, setIsMiniChatOpen] = useState(false);
  const [isBodyDoublingOpen, setIsBodyDoublingOpen] = useState(false);
  const [isGeminiOpen, setIsGeminiOpen] = useState(false);

  // Exit dialog & App closed states
  const [isExitOpen, setIsExitOpen] = useState(false);
  const [isAppClosed, setIsAppClosed] = useState(false);
  const [exitCountdown, setExitCountdown] = useState(6);
  const [exitAdvice, setExitAdvice] = useState(() => COMPREHENSIVE_ADVICE[0]);

  const [pinAttempt, setPinAttempt] = useState('');
  const [pinError, setPinError] = useState(false);

  // Splash card inicial con micro-aprendizaje al abrir la app (1 sola vez por sesión)
  const [welcomeTip, setWelcomeTip] = useState<{ category: string; tag: string; text: string; actionTip?: string } | null>(null);

  // Sincronizar colores globales de texto y subtexto en todo el documento
  useEffect(() => {
    document.documentElement.style.setProperty('--app-text-color', settings.textColor || '#ffffff');
    document.documentElement.style.setProperty('--app-subtext-color', settings.subtextColor || '#cbd5e1');
  }, [settings.textColor, settings.subtextColor]);

  // Escalar el tamaño de fuente visiblemente en toda la aplicación
  useEffect(() => {
    const fontScaleMap: Record<string, string> = {
      small: '13.5px',
      normal: '16px',
      medium: '18.5px',
      large: '21.5px',
      extralarge: '25px',
    };
    const rootSize = fontScaleMap[settings.fontSize] || '16px';
    document.documentElement.style.fontSize = rootSize;
  }, [settings.fontSize]);

  // Selección de consejo inicial centrado al cargar (solo si no se ha visto en esta sesión)
  useEffect(() => {
    try {
      const seen = sessionStorage.getItem('hld_welcome_tip_seen');
      if (!seen) {
        const randomItem = COMPREHENSIVE_ADVICE[Math.floor(Math.random() * COMPREHENSIVE_ADVICE.length)];
        setWelcomeTip(randomItem);
        sessionStorage.setItem('hld_welcome_tip_seen', 'true');
      }
    } catch {
      // ignore
    }
  }, []);

  // Evitar recarga accidental por deslizamiento vertical en Android (Pull-to-refresh)
  useEffect(() => {
    let startY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        startY = e.touches[0].clientY;
      }
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const currentY = e.touches[0].clientY;
        const diffY = currentY - startY;
        // Si estamos al tope superior y el usuario desliza hacia abajo, prevenir pull-to-refresh accidental
        if (window.scrollY <= 0 && diffY > 0) {
          if (e.cancelable) e.preventDefault();
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  // Manejo de la cuenta regresiva al salir de la app
  useEffect(() => {
    let timer: any;
    if (isExitOpen) {
      setExitCountdown(6);
      const randomAdvice = COMPREHENSIVE_ADVICE[Math.floor(Math.random() * COMPREHENSIVE_ADVICE.length)];
      setExitAdvice(randomAdvice);

      timer = setInterval(() => {
        setExitCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleExecuteClose();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isExitOpen]);

  const handleExecuteClose = () => {
    setIsExitOpen(false);
    setIsAppClosed(true);
    try {
      window.close();
    } catch {
      // Ignorar si el navegador bloquea window.close()
    }
  };

  const getGreetingData = () => {
    const hr = new Date().getHours();
    if (hr >= 6 && hr < 12) return { text: `¡Que tengas un buen día, ${me.name}! 🌅`, time: 'mañana' };
    if (hr >= 12 && hr < 20) return { text: `¡Que tengas una buena tarde, ${me.name}! ☀️`, time: 'tarde' };
    return { text: `¡Que tengas una buena noche, ${me.name}! 🌙`, time: 'noche' };
  };

  const greeting = getGreetingData();

  // PANTALLA DE APLICACIÓN CERRADA
  if (isAppClosed) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-[#06080e] text-white text-center select-none">
        <div className="w-20 h-20 rounded-full bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-4xl mb-4 shadow-xl">
          🌙
        </div>
        <h2 className="text-2xl sm:text-3xl font-black font-heading text-rose-200 mb-2">
          Aplicación Cerrada
        </h2>
        <p className="text-xs sm:text-sm text-white/70 max-w-sm mb-6 leading-relaxed">
          Has salido de Nuestro Lugar Seguro. Recuerden que su amor, comprensión y paciencia mutua son su mayor fortaleza diaria.
        </p>
        <button
          type="button"
          onClick={() => {
            setIsAppClosed(false);
            if (settings.securityPin) updateSettings({ isLocked: true });
          }}
          className="px-8 py-3.5 rounded-2xl btn-3d-rose text-white font-black text-xs cursor-pointer shadow-xl active:scale-95 transition-all"
        >
          Volver a Iniciar 💖
        </button>
      </div>
    );
  }

  // PIN Lock check
  if (settings.securityPin && settings.isLocked) {
    const handleUnlock = (e: React.FormEvent) => {
      e.preventDefault();
      if (pinAttempt === settings.securityPin) {
        updateSettings({ isLocked: false });
        setPinAttempt('');
        setPinError(false);
      } else {
        setPinError(true);
        setPinAttempt('');
      }
    };

    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#0a0d14] text-white">
        <div className="max-w-xs w-full glass-card p-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-300 mx-auto text-2xl shadow-lg">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black font-heading">Nuestro Lugar Seguro</h2>
          <p className="text-xs text-white/60">Ingresa tu PIN de 4 dígitos para acceder a sus diarios y recuerdos:</p>

          <form onSubmit={handleUnlock} className="space-y-3">
            <input
              type="password"
              maxLength={4}
              value={pinAttempt}
              onChange={(e) => setPinAttempt(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="w-full py-3 text-center text-2xl font-black tracking-widest rounded-2xl bg-white/10 border border-white/20 text-white focus:outline-none focus:border-rose-400"
            />
            {pinError && <p className="text-xs text-rose-400 font-bold">PIN incorrecto, intenta de nuevo.</p>}
            <button
              type="submit"
              className="w-full py-3 rounded-2xl btn-3d-rose text-white font-bold text-xs cursor-pointer shadow-lg"
            >
              Desbloquear Amor
            </button>
          </form>
        </div>
      </div>
    );
  }

  const fontSizeClass =
    settings.fontSize === 'small'
      ? 'text-xs'
      : settings.fontSize === 'normal'
      ? 'text-[13px]'
      : settings.fontSize === 'medium'
      ? 'text-sm'
      : settings.fontSize === 'large'
      ? 'text-base'
      : 'text-lg'; // extralarge

  // Render ONLY the active single menu (Estático salvo selección en menú superior)
  const renderCurrentSection = () => {
    switch (settings.activeMenu) {
      case 'status':
        return <CurrentStatus />;
      case 'reminders':
        return <RemindersSection />;
      case 'alarms':
        return <AlarmClockSection />;
      case 'minigames':
        return <MinigamesSection />;
      case 'journal':
        return <LifeJournalSection />;
      case 'location':
        return <LocationSection />;
      case 'recorder':
        return <RecorderCard />;
      case 'emotional':
        return <EmotionalSupportSection />;
      case 'menstrual':
        return <MenstrualCard />;
      default:
        return <CurrentStatus />;
    }
  };

  const screenFitClass =
    settings.screenFit === 'honor_narrow'
      ? 'max-w-[420px] w-full px-2.5 sm:px-4 mx-auto overflow-x-hidden'
      : settings.screenFit === 'compact'
      ? 'scale-90 origin-top max-w-md w-full px-2 mx-auto'
      : settings.screenFit === 'fullscreen'
      ? 'max-w-none px-2 w-full'
      : settings.screenFit === 'qhd'
      ? 'scale-105 origin-top max-w-5xl w-full px-6 mx-auto'
      : 'max-w-4xl mx-auto px-3 sm:px-4 w-full';

  return (
    <div
      className={`min-h-screen w-full relative ${fontSizeClass} ${
        settings.lowEndDeviceMode ? 'low-end-device' : ''
      } transition-colors duration-500`}
      style={{
        filter: `brightness(${settings.brightness}%) contrast(${settings.contrast}%)`,
        color: settings.textColor,
      }}
    >
      {/* CAPA 1: FILTRO DE LUZ AZUL CÁLIDO RENDERIZADO EN BODY VIA PORTAL (Cubre toda la pantalla y modales) */}
      {typeof document !== 'undefined' &&
        settings.blueLightFilter > 0 &&
        createPortal(
          <div
            className="fixed inset-0 pointer-events-none z-[9999998] transition-opacity duration-300"
            style={{
              backgroundColor: `rgba(255, 145, 0, ${(settings.blueLightFilter / 100) * 0.42})`,
              mixBlendMode: 'color-burn',
            }}
          />,
          document.body
        )}

      {/* CAPA 2: ATENUADOR NOCTURNO / DESCANSO VISUAL EN BODY VIA PORTAL */}
      {typeof document !== 'undefined' &&
        settings.nightModeDim > 0 &&
        createPortal(
          <div
            className="fixed inset-0 pointer-events-none z-[9999997] transition-opacity duration-300"
            style={{
              backgroundColor: `rgba(0, 0, 0, ${(settings.nightModeDim / 100) * 0.85})`,
            }}
          />,
          document.body
        )}

      {/* CAPA 3: FONDO FIJO ADAPTADO A LA PANTALLA RENDERIZADO EN BODY VIA PORTAL (100% fijo e inamovible) */}
      {typeof document !== 'undefined' &&
        createPortal(
          <div
            id="app-fixed-viewport-bg"
            className="fixed inset-0 w-screen h-screen pointer-events-none select-none overflow-hidden"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              zIndex: -999999,
            }}
          >
            {settings.customBgImage ? (
              settings.customBgFit === 'cover' ? (
                <img
                  src={settings.customBgImage}
                  alt="Fondo Personalizado Fijo"
                  className="w-full h-full object-cover object-center pointer-events-none select-none"
                  style={{ width: '100vw', height: '100vh', objectFit: 'cover' }}
                />
              ) : settings.customBgFit === 'fill' ? (
                <img
                  src={settings.customBgImage}
                  alt="Fondo Personalizado Fijo"
                  className="w-full h-full object-fill object-center pointer-events-none select-none"
                  style={{ width: '100vw', height: '100vh', objectFit: 'fill' }}
                />
              ) : (
                /* Modo Contain por defecto: Foto 100% visible sin cortes con fondo ambiental difuso suave */
                <div className="relative w-screen h-screen flex items-center justify-center overflow-hidden bg-black/95">
                  <img
                    src={settings.customBgImage}
                    alt="Fondo ambiental difuso"
                    className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-110 pointer-events-none"
                  />
                  <img
                    src={settings.customBgImage}
                    alt="Fondo Personalizado Completo Fijo"
                    className="relative max-w-full max-h-full object-contain pointer-events-none select-none z-10"
                    style={{ maxWidth: '100vw', maxHeight: '100vh', objectFit: 'contain' }}
                  />
                </div>
              )
            ) : settings.backgroundTheme?.startsWith('#') || settings.backgroundTheme?.startsWith('bg-[#') ? (
              <div
                className="w-full h-full"
                style={{
                  backgroundColor: settings.backgroundTheme.startsWith('bg-[')
                    ? settings.backgroundTheme.replace('bg-[', '').replace(']', '')
                    : settings.backgroundTheme,
                }}
              />
            ) : settings.backgroundTheme && settings.backgroundTheme !== 'mesh-aurora-dark' ? (
              <div
                className={`w-full h-full ${settings.backgroundTheme} transition-all duration-700`}
              />
            ) : (
              /* Aurora Dinámica Pantalla Completa Uniforme */
              <div className="w-full h-full bg-[#090c12] relative overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[65vw] h-[65vw] rounded-full bg-[#722f37]/50 blur-[130px] pointer-events-none animate-aurora" />
                <div className="absolute top-[30%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-[#2563eb]/45 blur-[140px] pointer-events-none animate-aurora" />
                <div className="absolute bottom-[-10%] left-[10%] w-[55vw] h-[55vw] rounded-full bg-[#556b2f]/45 blur-[130px] pointer-events-none animate-aurora" />
                <div className="absolute top-[60%] right-[25%] w-[50vw] h-[50vw] rounded-full bg-[#38bdf8]/35 blur-[150px] pointer-events-none animate-aurora" />
              </div>
            )}
          </div>,
          document.body
        )}

      {/* Capa SVG Noise uniforme */}
      {!settings.highPerformanceMode && (
        <svg className="fixed inset-0 w-full h-full pointer-events-none -z-40 opacity-[0.035]">
          <filter id="noiseFilter">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noiseFilter)" />
        </svg>
      )}

      {/* TARJETA SPLASH DE BIENVENIDA CENTRADA AL 100% EN PANTALLA CON PORTAL */}
      {typeof document !== 'undefined' &&
        welcomeTip &&
        createPortal(
          <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              className="w-full max-w-md p-6 rounded-[2.5rem] bg-gradient-to-br from-purple-950/95 via-[#181a2e]/98 to-slate-900/98 border-2 border-purple-400/50 shadow-2xl backdrop-blur-2xl text-white space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
                    <Brain className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-purple-200">
                      Sabiduría para Nuestro Vínculo 🌿
                    </h4>
                    <span className="text-[10px] text-white/50">{welcomeTip.category}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setWelcomeTip(null)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-400/30">
                  {welcomeTip.tag}
                </span>
                <p className="text-sm font-semibold text-white/95 leading-relaxed">
                  "{welcomeTip.text}"
                </p>
                {welcomeTip.actionTip && (
                  <p className="text-xs text-purple-200/90 italic pt-1">
                    💡 <span className="font-bold">Para hoy:</span> {welcomeTip.actionTip}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    const nextTip = COMPREHENSIVE_ADVICE[Math.floor(Math.random() * COMPREHENSIVE_ADVICE.length)];
                    setWelcomeTip(nextTip);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Otro consejo 🎲</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWelcomeTip(null)}
                  className="flex-1 py-2.5 rounded-xl btn-3d-rose text-xs font-bold text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <span>Entrar con amor 💖</span>
                </button>
              </div>
            </motion.div>
          </div>,
          document.body
        )}

      {/* Header Sticky removido: Desaparece al bajar por la app naturalmente */}
      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenExit={() => setIsExitOpen(true)}
        onOpenGemini={() => setIsGeminiOpen(true)}
      />

      {/* Contenedor Principal (SIN DESLIZAMIENTO TÁCTIL LATERAL QUE CAMBIE LOS MENÚS) */}
      <main
        className={`max-w-4xl mx-auto px-4 py-6 space-y-6 ${screenFitClass} transition-transform duration-200`}
      >
        {/* Barra de Menús Independientes con Emojis Móviles (Sin 'Ver Todo') */}
        <SubmenuNav />

        {/* Solo la sección activa se muestra (Menú 100% independiente) */}
        <div className="w-full transition-all duration-300">
          {renderCurrentSection()}
        </div>

        {/* Footer */}
        <footer className="pt-8 pb-24 text-center space-y-1.5 select-none border-t border-white/10">
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-white/80">
            <span>Happy Life Duo</span>
            <span>•</span>
            <span className="text-rose-400">Nuestro Lugar Seguro</span>
          </div>
          <p className="text-[11px] text-white/50">
            Selecciona el menú que desees arriba en la barra de navegación.
          </p>
        </footer>
      </main>

      {/* DOCK FLOTANTE CENTRADO EN LA PARTE INFERIOR: MINI CHAT Y MÚSICA DÚO (Sin tocarse ni superponerse) */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center justify-center gap-2.5 sm:gap-3 pointer-events-auto select-none">
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsBodyDoublingOpen(true)}
          className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white font-black text-xs flex items-center gap-2 shadow-[0_8px_20px_rgba(79,70,229,0.45)] border border-white/25 cursor-pointer"
          title="Abrir YouTube Music Dúo"
        >
          <Headphones className="w-4 h-4 text-indigo-200 animate-pulse" />
          <span className="font-heading">Música Dúo</span>
        </motion.button>

        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsMiniChatOpen(true)}
          className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full bg-[#556b2f] hover:bg-[#485c26] text-white font-black text-xs flex items-center gap-2 shadow-[0_8px_20px_rgba(85,107,47,0.55)] border border-white/30 cursor-pointer"
          title="Abrir Mini Chat Seguro"
        >
          <span className="text-base">💘</span>
          <span className="font-heading">Mini Chat</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </motion.button>
      </div>

      {/* Modales Controlados (Ocultan sus botones de borde individuales para no chocar) */}
      <BodyDoublingModal
        isOpen={isBodyDoublingOpen}
        onClose={() => setIsBodyDoublingOpen(false)}
        onOpen={() => setIsBodyDoublingOpen(true)}
        hideFloatingButton={true}
      />
      <MiniChatModal
        isOpen={isMiniChatOpen}
        onClose={() => setIsMiniChatOpen(false)}
        hideFloatingButton={true}
      />

      {/* Modal de Ajustes */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onOpenExit={() => setIsExitOpen(true)}
      />

      {/* Mini Ventana Rápida Pregúntale a Gemini */}
      <GeminiQuickModal
        isOpen={isGeminiOpen}
        onClose={() => setIsGeminiOpen(false)}
      />

      {/* MODAL DE DESPEDIDA CON CONTEO REGRESIVO AL SALIR DE LA APP */}
      {typeof document !== 'undefined' &&
        isExitOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              className="w-full max-w-sm p-6 rounded-[2.5rem] bg-gradient-to-br from-rose-950/95 via-[#1e1526]/98 to-slate-900/98 border-2 border-rose-400/50 shadow-2xl backdrop-blur-2xl text-white text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-400/40 flex items-center justify-center mx-auto text-3xl shadow-lg">
                {greeting.time === 'mañana' ? '🌅' : greeting.time === 'tarde' ? '☀️' : '🌙'}
              </div>

              <h3 className="text-xl font-black font-heading text-rose-200">
                {greeting.text}
              </h3>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-white/90 leading-relaxed font-medium">
                "{exitAdvice.text}"
              </div>

              {/* Indicador de cierre automático con cuenta regresiva */}
              <div className="py-1">
                <span className="text-xs text-rose-300 font-bold flex items-center justify-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                  <span>Cerrando automáticamente en {exitCountdown} segundos...</span>
                </span>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleExecuteClose}
                  className="w-full py-3 rounded-2xl btn-3d-rose text-white font-black text-xs cursor-pointer shadow-lg"
                >
                  Cerrar Ahora 🚪
                </button>
                <button
                  type="button"
                  onClick={() => setIsExitOpen(false)}
                  className="w-full py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs cursor-pointer"
                >
                  Quedarme en Nuestro Lugar Seguro 💖
                </button>
              </div>
            </motion.div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
