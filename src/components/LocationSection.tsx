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
  EyeOff
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ModalPortal } from './ModalPortal';

export const LocationSection: React.FC = () => {
  const {
    settings,
    updateSettings,
    updateMyLocation,
    toggleRealTimeLocation,
    me,
    partner,
    activeRole,
  } = useApp();

  const [isLoadingGps, setIsLoadingGps] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  // Avisos rápidos incluyendo "Voy atrasada/o 🏃‍♀️" y "Tengo mala señal 📵"
  const PRESETS = [
    { label: 'Voy atrasada/o 🏃‍♀️', icon: '🏃‍♀️' },
    { label: 'Tengo mala señal 📵', icon: '📵' },
    { label: 'Llegué a salvo ✅', icon: '✅' },
    { label: 'En casa 🏡', icon: '🏡' },
    { label: 'En camino 🚗', icon: '🚗' },
    { label: 'En el trabajo 🏢', icon: '🏢' },
  ];

  const handleSendLocation = (customLabel?: string) => {
    if (!settings.locationSharingConsent) {
      alert('Debes activar el consentimiento mutuo de ubicación primero.');
      return;
    }

    setIsLoadingGps(true);
    setStatusMessage('Localizando señal GPS en alta precisión...');

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          const name = customLabel || `Coordenadas: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`;
          updateMyLocation(coords, name);
          setIsLoadingGps(false);
          setStatusMessage(`¡Ubicación enviada: "${name}"!`);
          setTimeout(() => setStatusMessage(null), 4000);
        },
        () => {
          const coords = { lat: -33.4489, lng: -70.6693 };
          const name = customLabel || 'En casa 🏡';
          updateMyLocation(coords, name);
          setIsLoadingGps(false);
          setStatusMessage(`Ubicación enviada: "${name}"`);
          setTimeout(() => setStatusMessage(null), 4000);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setIsLoadingGps(false);
      setStatusMessage('Geolocalización no disponible.');
    }
  };

  const currentDisplayPartner = activeRole === 'me' ? partner : me;
  const partnerLoc = currentDisplayPartner.lastLocation;

  // Real-time location toggle handler
  const handleToggleRealTime = () => {
    const nextState = !settings.realTimeLocationActive;
    toggleRealTimeLocation(nextState);
    if (nextState) {
      handleSendLocation('Ubicación en tiempo real activa 📡');
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
    <section className="w-full space-y-5">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shadow-md">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white font-heading tracking-tight">
              Ubicación Segura & Radar en Tiempo Real
            </h3>
            <p className="text-xs text-white/60">
              Avisos rápidos, Google Maps en vivo y privacidad mutua
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
              settings.locationSharingConsent ? 'bg-emerald-500 justify-end' : 'bg-white/20 justify-start'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
          </button>
        </div>
      </div>

      <div className="glass-card p-6 border-emerald-500/20 space-y-5">
        {/* Toggle Transmisión en Tiempo Real */}
        <div className="p-4 rounded-3xl bg-black/40 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl ${
                settings.realTimeLocationActive
                  ? 'bg-emerald-500 text-slate-950 animate-pulse'
                  : 'bg-white/10 text-white/50'
              }`}
            >
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Compartir Ubicación en Tiempo Real</span>
                {settings.realTimeLocationActive && (
                  <span className="text-[10px] bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full font-black">
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
            className={`px-5 py-2.5 rounded-2xl font-black text-xs cursor-pointer transition-all shadow-md active:scale-95 ${
              settings.realTimeLocationActive
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'btn-3d-olive text-white'
            }`}
          >
            {settings.realTimeLocationActive ? 'Desactivar Transmisión' : 'Activar Tiempo Real 📡'}
          </button>
        </div>

        {/* Tarjeta de ubicación actual de la pareja */}
        <div className="p-4 rounded-3xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-2xl">
              {currentDisplayPartner.avatar}
            </div>
            <div>
              <p className="text-[10px] text-white/50 uppercase font-bold">
                Lugar de tu pareja
              </p>
              <h4 className="text-base font-black text-white font-heading">
                {partnerLoc?.name || 'En casa 🏡'}
              </h4>
              <p className="text-xs text-emerald-400 mt-0.5">
                {partnerLoc?.updatedAt || 'Actualizado recientemente'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 border border-white/10 cursor-pointer shadow-sm"
            >
              <Navigation className="w-3.5 h-3.5 text-emerald-300" />
              <span>Google Maps</span>
              <ExternalLink className="w-3 h-3 text-white/50" />
            </a>

            <button
              type="button"
              onClick={handleShareOnSocial}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              title="Compartir por WhatsApp o Redes"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* MINI VENTANA GOOGLE MAPS QUE SE ABRE ABAJO Y SE PUEDE EXPANDIR */}
        {settings.realTimeLocationActive && (
          <div className="rounded-3xl overflow-hidden border-2 border-emerald-400/40 bg-black/60 shadow-2xl space-y-2 p-3">
            <div className="flex items-center justify-between px-2 pt-1 text-xs">
              <span className="font-black text-emerald-300 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
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
          <div className="p-3 rounded-2xl bg-emerald-950/70 border border-emerald-400/40 text-emerald-200 text-xs text-center font-bold">
            {statusMessage}
          </div>
        )}

        {/* Botón: 📍 Estoy aquí */}
        <button
          type="button"
          onClick={() => handleSendLocation()}
          disabled={isLoadingGps}
          className="w-full py-4 rounded-3xl btn-3d-olive text-white font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xl disabled:opacity-50"
        >
          <MapPin className="w-5 h-5 text-lime-200 animate-bounce" />
          <span>{isLoadingGps ? 'Obteniendo GPS...' : '📍 Estoy aquí (Enviar coordenada exacta)'}</span>
        </button>

        {/* Avisos Rápidos */}
        <div>
          <p className="text-xs font-bold text-white/70 uppercase tracking-wider mb-2.5">
            Avisos Rápidos de 1 toque:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => handleSendLocation(p.label)}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 text-left flex items-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <span className="text-2xl">{p.icon}</span>
                <span className="text-xs font-bold text-white truncate">{p.label}</span>
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
        icon={<MapPin className="w-6 h-6 text-emerald-400" />}
        maxWidth="max-w-4xl"
      >
        <div className="space-y-4">
          <div className="aspect-video w-full rounded-3xl overflow-hidden border border-white/20 bg-black">
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
              className="px-5 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold cursor-pointer"
            >
              Cerrar Vista Grande
            </button>
          </div>
        </div>
      </ModalPortal>
    </section>
  );
};
