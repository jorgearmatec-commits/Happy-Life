import React, { useState } from 'react';
import {
  MapPin,
  Navigation,
  ShieldCheck,
  ExternalLink,
  Radio,
  Share2,
  Maximize2,
  Minimize2,
  WifiOff,
  Clock,
  CheckCircle,
  Eye,
  EyeOff,
  Send,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ModalPortal } from './ModalPortal';

export const LocationSection: React.FC = () => {
  const {
    settings,
    updateSettings,
    updateMyLocation,
    updateMyStatus,
    toggleRealTimeLocation,
    sendMessage,
    me,
    partner,
    activeRole,
  } = useApp();

  const [isLoadingGps, setIsLoadingGps] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  // Avisos rápidos completos en lista vertical
  const PRESETS = [
    { label: 'Llegué a salvo ✅', icon: '✅', desc: 'Confirmación rápida de llegada segura' },
    { label: 'Voy atrasada/o 🏃‍♀️', icon: '🏃‍♀️', desc: 'Aviso de retraso leve en el trayecto' },
    { label: 'En camino a casa 🏡', icon: '🏡', desc: 'Rumbo directo a nuestro hogar' },
    { label: 'En el trabajo o estudio 🏢', icon: '🏢', desc: 'Iniciando jornada laboral o académica' },
    { label: 'Tengo mala señal / Poca batería 📵', icon: '📵', desc: 'Para que no te preocupes si no respondo' },
    { label: 'Haciendo compras del hogar 🛒', icon: '🛒', desc: 'En el supermercado o almacén' },
  ];

  // 1. FUNCIÓN REAL: "📍 ESTOY AQUÍ" (Envía coordenada exacta GPS y actualiza estado)
  const handleSendExactLocation = () => {
    if (!settings.locationSharingConsent) {
      alert('Debes activar el consentimiento mutuo de ubicación primero.');
      return;
    }

    setIsLoadingGps(true);
    setStatusMessage('Obteniendo coordenadas GPS de alta precisión...');

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          const name = `Ubicación GPS: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`;
          updateMyLocation(coords, name);
          updateMyStatus({ lastAction: `📍 Estoy aquí (${name})` });
          setIsLoadingGps(false);
          setStatusMessage(`¡Ubicación exacta compartida en tu estado: "${name}"!`);
          setTimeout(() => setStatusMessage(null), 4000);
        },
        () => {
          const coords = { lat: -33.4489, lng: -70.6693 };
          const name = 'En casa / Zona segura 🏡';
          updateMyLocation(coords, name);
          updateMyStatus({ lastAction: `📍 Estoy aquí (${name})` });
          setIsLoadingGps(false);
          setStatusMessage(`Ubicación enviada a tu estado: "${name}"`);
          setTimeout(() => setStatusMessage(null), 4000);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setIsLoadingGps(false);
      setStatusMessage('Geolocalización GPS no disponible en este dispositivo.');
    }
  };

  // 2. AVISOS RÁPIDOS: SOLO ENVÍAN TEXTO AL ESTADO (NO envían coordenadas GPS)
  const handleSendQuickNotice = (presetText: string) => {
    updateMyStatus({ lastAction: presetText });
    try {
      sendMessage(`📌 Aviso rápido: ${presetText}`);
    } catch {}
    setStatusMessage(`¡Aviso enviado a tu estado: "${presetText}"!`);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const currentDisplayPartner = activeRole === 'me' ? partner : me;
  const partnerLoc = currentDisplayPartner.lastLocation;

  // Real-time location toggle handler
  const handleToggleRealTime = () => {
    const nextState = !settings.realTimeLocationActive;
    toggleRealTimeLocation(nextState);
    if (nextState) {
      handleSendExactLocation();
    }
  };

  const handleShareOnSocial = async () => {
    if (partnerLoc && navigator.share) {
      try {
        await navigator.share({
          title: 'Ubicación Happy Life Duo',
          text: `Estoy aquí: ${partnerLoc.name}. Ver en Google Maps:`,
          url: `https://www.google.com/maps/search/?api=1&query=${partnerLoc.lat},${partnerLoc.lng}`,
        });
      } catch {
        // user cancelled
      }
    }
  };

  const lat = partnerLoc?.lat || -33.4489;
  const lng = partnerLoc?.lng || -70.6693;

  return (
    <section className="w-full space-y-5 select-none">
      {/* Title - AZUL ELÉCTRICO #1a4fff */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[#1a4fff]/20 border border-[#1a4fff]/40 flex items-center justify-center text-blue-300 shadow-[0_0_20px_rgba(26,79,255,0.35)]">
            <MapPin className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white font-heading tracking-tight">
              Ubicación Segura & Radar en Tiempo Real
            </h3>
            <p className="text-xs text-white/60">
              Avisos rápidos, Google Maps en vivo y privacidad mutua elegante
            </p>
          </div>
        </div>

        {/* Consentimiento General Toggle */}
        <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-2xl border border-white/10">
          <span className="text-[11px] font-bold text-white/80">Consentimiento</span>
          <button
            type="button"
            onClick={() =>
              updateSettings({ locationSharingConsent: !settings.locationSharingConsent })
            }
            className={`w-10 h-6 rounded-full p-1 transition-colors cursor-pointer flex items-center ${
              settings.locationSharingConsent ? 'bg-[#1a4fff] justify-end shadow-[0_0_10px_rgba(26,79,255,0.7)]' : 'bg-white/20 justify-start'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
          </button>
        </div>
      </div>

      <div className="glass-card p-5 sm:p-6 border-[#1a4fff]/30 bg-gradient-to-br from-[#0a122e]/40 via-black/50 to-slate-900/50 space-y-5 shadow-2xl">
        {/* Toggle Transmisión en Tiempo Real */}
        <div className="p-4 rounded-3xl bg-black/40 border border-[#1a4fff]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 ${
                settings.realTimeLocationActive
                  ? 'bg-[#1a4fff] text-white shadow-[0_0_18px_rgba(26,79,255,0.8)] animate-pulse'
                  : 'bg-white/10 text-white/50'
              }`}
            >
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Compartir Ubicación en Tiempo Real</span>
                {settings.realTimeLocationActive && (
                  <span className="text-[10px] bg-[#1a4fff]/30 text-blue-300 border border-[#1a4fff]/40 px-2 py-0.5 rounded-full font-black">
                    ACTIVO 📡
                  </span>
                )}
              </h4>
              <p className="text-xs text-white/60">
                Tu pareja puede ver tu movimiento exacto en Google Maps hasta que lo desactives.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleRealTime}
            className={`px-5 py-2.5 rounded-2xl font-black text-xs cursor-pointer transition-all shadow-md active:scale-95 shrink-0 ${
              settings.realTimeLocationActive
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-gradient-to-r from-[#1a4fff] to-[#0038d1] hover:from-blue-600 hover:to-blue-800 text-white shadow-[0_0_15px_rgba(26,79,255,0.5)]'
            }`}
          >
            {settings.realTimeLocationActive ? 'Desactivar Transmisión' : 'Activar Tiempo Real 📡'}
          </button>
        </div>

        {/* Tarjeta de ubicación actual de la pareja */}
        <div className="p-4 rounded-3xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#1a4fff]/20 border border-[#1a4fff]/30 flex items-center justify-center text-2xl shadow-md">
              {currentDisplayPartner.avatar}
            </div>
            <div>
              <p className="text-[10px] text-white/50 uppercase font-bold tracking-wider">
                Lugar de tu pareja ({currentDisplayPartner.name})
              </p>
              <h4 className="text-base font-black text-white font-heading">
                {partnerLoc?.name || 'En casa 🏡'}
              </h4>
              <p className="text-xs text-blue-400 mt-0.5 font-medium">
                {partnerLoc?.updatedAt || 'Actualizado recientemente'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 rounded-xl bg-[#1a4fff]/20 hover:bg-[#1a4fff]/30 text-white text-xs font-bold flex items-center gap-1.5 border border-[#1a4fff]/30 cursor-pointer shadow-sm transition-all"
            >
              <Navigation className="w-3.5 h-3.5 text-blue-300" />
              <span>Google Maps</span>
              <ExternalLink className="w-3 h-3 text-white/50" />
            </a>

            <button
              type="button"
              onClick={handleShareOnSocial}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
              title="Compartir por WhatsApp o Redes"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* MINI VENTANA GOOGLE MAPS QUE SE ABRE ABAJO Y SE PUEDE EXPANDIR */}
        {settings.realTimeLocationActive && (
          <div className="rounded-3xl overflow-hidden border-2 border-[#1a4fff]/40 bg-black/60 shadow-2xl space-y-2 p-3">
            <div className="flex items-center justify-between px-2 pt-1 text-xs">
              <span className="font-black text-blue-300 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1a4fff] animate-ping" />
                Mapa Satelital en Tiempo Real de tu Pareja
              </span>
              <button
                type="button"
                onClick={() => setIsMapExpanded(true)}
                className="flex items-center gap-1 text-[11px] font-bold text-white/80 hover:text-white bg-white/10 px-2.5 py-1 rounded-lg cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Expandir Mapa</span>
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden aspect-video max-h-56 bg-slate-900 border border-white/10 relative">
              <iframe
                title="Google Maps Miniatura"
                src={`https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`}
                className="w-full h-full border-0"
                loading="lazy"
              />
            </div>
            <p className="text-[10px] text-white/50 text-center">
              Transmisión activa hasta que desactives el botón de tiempo real.
            </p>
          </div>
        )}

        {statusMessage && (
          <div className="p-3 rounded-2xl bg-[#1a4fff]/20 border border-[#1a4fff]/40 text-blue-200 text-xs text-center font-bold shadow-md">
            {statusMessage}
          </div>
        )}

        {/* Botón Principal: 📍 Estoy aquí (Envía coordenada exacta y actualiza estado) */}
        <button
          type="button"
          onClick={handleSendExactLocation}
          disabled={isLoadingGps}
          className="w-full py-4 rounded-3xl bg-gradient-to-r from-[#1a4fff] via-[#003be3] to-[#00259e] hover:from-blue-600 hover:to-blue-800 text-white font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-[0_8px_25px_rgba(26,79,255,0.45)] border border-[#1a4fff]/40 active:scale-98 transition-all disabled:opacity-50"
        >
          <MapPin className="w-5 h-5 text-blue-200 animate-bounce" />
          <span>{isLoadingGps ? 'Obteniendo GPS de alta precisión...' : '📍 Estoy aquí (Enviar ubicación exacta a mi estado)'}</span>
        </button>

        {/* Avisos Rápidos en LISTA VERTICAL HACIA ABAJO (NO envían ubicación, solo aviso de estado) */}
        <div className="space-y-3 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-white/80 uppercase tracking-wider flex items-center gap-1.5">
              <span>💬</span>
              <span>Avisos Rápidos de Estado (Sin GPS):</span>
            </p>
            <span className="text-[10px] text-white/50">Toca para actualizar tu estado</span>
          </div>

          {/* LISTA HACIA ABAJO VERTICAL (Sin cortes ni columnas apretadas) */}
          <div className="flex flex-col gap-2.5 w-full">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => handleSendQuickNotice(p.label)}
                className="w-full p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-98 border border-white/10 text-left flex items-center justify-between gap-3 transition-all cursor-pointer shadow-sm group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl shrink-0 group-hover:scale-110 transition-transform">
                    {p.icon}
                  </span>
                  <div className="min-w-0">
                    <span className="text-xs sm:text-sm font-bold text-white block group-hover:text-blue-300 transition-colors">
                      {p.label}
                    </span>
                    <span className="text-[10px] text-white/50 block truncate">
                      {p.desc}
                    </span>
                  </div>
                </div>

                <div className="px-3 py-1 rounded-xl bg-white/10 group-hover:bg-[#1a4fff]/30 group-hover:text-blue-200 text-white/70 text-[11px] font-bold flex items-center gap-1 shrink-0 transition-all">
                  <Send className="w-3 h-3" />
                  <span>Avisar</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MAPA EXPANDIDO EN GRANDE */}
      <ModalPortal
        isOpen={isMapExpanded}
        onClose={() => setIsMapExpanded(false)}
        title="Ubicación en Tiempo Real (Vista Grande)"
        icon={<MapPin className="w-6 h-6 text-[#1a4fff]" />}
        maxWidth="max-w-4xl"
      >
        <div className="space-y-4">
          <div className="aspect-video w-full rounded-3xl overflow-hidden border border-white/20 bg-black shadow-2xl">
            <iframe
              title="Google Maps Grande"
              src={`https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`}
              className="w-full h-full border-0"
              loading="lazy"
            />
          </div>
          <div className="flex justify-between items-center text-xs text-white/80">
            <span>Coordenadas exactas: {lat.toFixed(5)}, {lng.toFixed(5)}</span>
            <button
              type="button"
              onClick={() => setIsMapExpanded(false)}
              className="px-5 py-2 rounded-xl bg-[#1a4fff] hover:bg-blue-600 text-white font-bold cursor-pointer transition-colors shadow-md"
            >
              Cerrar Vista Grande
            </button>
          </div>
        </div>
      </ModalPortal>
    </section>
  );
};
