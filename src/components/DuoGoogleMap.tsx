import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import {
  MapPin,
  Heart,
  Navigation,
  Compass,
  Layers,
  Sparkles,
  Plus,
  Trash2,
  ExternalLink,
  RefreshCw,
  LocateFixed,
} from 'lucide-react';

export interface CoupleSpot {
  id: string;
  title: string;
  category: 'cita' | 'recuerdo' | 'favorito' | 'por_visitar';
  emoji: string;
  lat: number;
  lng: number;
  notes?: string;
  addedBy: string;
  createdAt: string;
}

interface DuoGoogleMapProps {
  myLocation?: { lat: number; lng: number; name: string; updatedAt?: string; isRealTime?: boolean };
  partnerLocation?: { lat: number; lng: number; name: string; updatedAt?: string; isRealTime?: boolean };
  myName: string;
  myAvatar: string;
  partnerName: string;
  partnerAvatar: string;
  partnerStatus?: string;
  myStatus?: string;
  isRealTimeActive?: boolean;
  onRefreshGps?: () => void;
  isLoadingGps?: boolean;
  targetFocus?: 'partner' | 'me' | 'both';
}

// Haversine formula to compute distance between two coords in km
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Inner Controller component that has access to useMap() hook
const MapViewController: React.FC<{
  myCoords?: { lat: number; lng: number };
  partnerCoords?: { lat: number; lng: number };
  targetFocus?: 'partner' | 'me' | 'both';
  mapType: 'roadmap' | 'satellite' | 'hybrid';
}> = ({ myCoords, partnerCoords, targetFocus, mapType }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    map.setMapTypeId(mapType);
  }, [map, mapType]);

  const fitBoth = useCallback(() => {
    if (!map) return;
    if (myCoords && partnerCoords) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(myCoords);
      bounds.extend(partnerCoords);
      map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
    } else if (partnerCoords) {
      map.panTo(partnerCoords);
      map.setZoom(15);
    } else if (myCoords) {
      map.panTo(myCoords);
      map.setZoom(15);
    }
  }, [map, myCoords, partnerCoords]);

  useEffect(() => {
    if (!map) return;
    if (targetFocus === 'both') {
      fitBoth();
    } else if (targetFocus === 'me' && myCoords) {
      map.panTo(myCoords);
      map.setZoom(16);
    } else if (targetFocus === 'partner' && partnerCoords) {
      map.panTo(partnerCoords);
      map.setZoom(16);
    }
  }, [map, targetFocus, myCoords, partnerCoords, fitBoth]);

  return null;
};

export const DuoGoogleMap: React.FC<DuoGoogleMapProps> = ({
  myLocation,
  partnerLocation,
  myName,
  myAvatar,
  partnerName,
  partnerAvatar,
  partnerStatus,
  myStatus,
  isRealTimeActive,
  onRefreshGps,
  isLoadingGps,
  targetFocus: initialTargetFocus = 'both',
}) => {
  const apiKey = (import.meta as unknown as { env: Record<string, string> }).env.VITE_GOOGLE_MAPS_API_KEY || '';

  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid'>('roadmap');
  const [activeInfoWindow, setActiveInfoWindow] = useState<'me' | 'partner' | string | null>(null);
  const [targetFocus, setTargetFocus] = useState<'partner' | 'me' | 'both'>(initialTargetFocus);
  const [isAddSpotModalOpen, setIsAddSpotModalOpen] = useState(false);
  const [newSpotForm, setNewSpotForm] = useState({
    title: '',
    category: 'cita' as CoupleSpot['category'],
    emoji: '🍷',
    notes: '',
    lat: '',
    lng: '',
  });

  // Saved Couple spots (stored locally so couples can remember their special places)
  const [coupleSpots, setCoupleSpots] = useState<CoupleSpot[]>(() => {
    try {
      const saved = localStorage.getItem('hld_couple_spots');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'spot-1',
        title: 'Nuestra Primera Cita 💖',
        category: 'cita',
        emoji: '🍷',
        lat: -33.4372,
        lng: -70.6506,
        notes: 'Donde todo comenzó: miradas nerviosas y sonrisas infinitas.',
        addedBy: 'Ambos',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'spot-2',
        title: 'Café de las Charlas Profundas ☕',
        category: 'favorito',
        emoji: '☕',
        lat: -33.4429,
        lng: -70.6258,
        notes: 'El lugar donde siempre nos refugiamos para soñar juntos.',
        addedBy: 'Ambos',
        createdAt: new Date().toISOString(),
      },
    ];
  });

  const saveSpots = (spots: CoupleSpot[]) => {
    setCoupleSpots(spots);
    try {
      localStorage.setItem('hld_couple_spots', JSON.stringify(spots));
    } catch {}
  };

  const handleAddSpot = (e: React.FormEvent) => {
    e.preventDefault();
    const latNum = parseFloat(newSpotForm.lat) || (myLocation?.lat ?? -33.4489);
    const lngNum = parseFloat(newSpotForm.lng) || (myLocation?.lng ?? -70.6693);
    if (!newSpotForm.title.trim()) return;

    const newSpot: CoupleSpot = {
      id: 'spot-' + Date.now(),
      title: newSpotForm.title.trim(),
      category: newSpotForm.category,
      emoji: newSpotForm.emoji,
      lat: latNum,
      lng: lngNum,
      notes: newSpotForm.notes.trim() || undefined,
      addedBy: myName || 'Yo',
      createdAt: new Date().toISOString(),
    };

    saveSpots([...coupleSpots, newSpot]);
    setIsAddSpotModalOpen(false);
    setNewSpotForm({
      title: '',
      category: 'cita',
      emoji: '🍷',
      notes: '',
      lat: '',
      lng: '',
    });
  };

  const handleDeleteSpot = (id: string) => {
    saveSpots(coupleSpots.filter((s) => s.id !== id));
    if (activeInfoWindow === id) setActiveInfoWindow(null);
  };

  // Coordenadas seguras por defecto
  const myCoords = useMemo(() => {
    if (myLocation?.lat != null && myLocation?.lng != null) {
      return { lat: myLocation.lat, lng: myLocation.lng };
    }
    return undefined;
  }, [myLocation]);

  const partnerCoords = useMemo(() => {
    if (partnerLocation?.lat != null && partnerLocation?.lng != null) {
      return { lat: partnerLocation.lat, lng: partnerLocation.lng };
    }
    return undefined;
  }, [partnerLocation]);

  const defaultCenter = useMemo(() => {
    if (partnerCoords) return partnerCoords;
    if (myCoords) return myCoords;
    return { lat: -33.4489, lng: -70.6693 }; // Santiago centro
  }, [partnerCoords, myCoords]);

  // Cálculo de distancia en vivo
  const distanceKm = useMemo(() => {
    if (myCoords && partnerCoords) {
      return calculateDistanceKm(myCoords.lat, myCoords.lng, partnerCoords.lat, partnerCoords.lng);
    }
    return null;
  }, [myCoords, partnerCoords]);

  const distanceText = useMemo(() => {
    if (distanceKm === null) return 'Ubicación de un integrante pendiente';
    if (distanceKm < 0.05) return '¡Juntitos en el mismo lugar! 🏡❤️';
    if (distanceKm < 1) return `A unos ${Math.round(distanceKm * 1000)} metros de ti 🏃‍♀️`;
    return `A ${distanceKm.toFixed(1)} km de distancia 🚗`;
  }, [distanceKm]);

  if (!apiKey) {
    return (
      <div className="w-full p-6 rounded-3xl bg-black/40 border border-[#1a4fff]/30 text-center space-y-3 shadow-inner">
        <MapPin className="w-10 h-10 text-blue-400 mx-auto animate-bounce" />
        <h4 className="text-sm font-bold text-white">Google Maps Platform</h4>
        <p className="text-xs text-white/60 max-w-sm mx-auto">
          Falta la clave API de Google Maps Platform (`VITE_GOOGLE_MAPS_API_KEY`). Configúrala para activar el radar interactivo.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      {/* Barra de estado de proximidad y controles rápidos */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#1a4fff] to-pink-500 flex items-center justify-center text-white shadow-md">
            <Heart className="w-4 h-4 fill-white animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>{distanceText}</span>
              {isRealTimeActive && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              )}
            </div>
            <div className="text-[10px] text-white/60">
              Radar satelital y vectorial de alta precisión en vivo
            </div>
          </div>
        </div>

        {/* Botones de acción rápida en el mapa */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setTargetFocus('partner')}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer transition-all flex items-center gap-1 ${
              targetFocus === 'partner'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-white/10 hover:bg-white/20 text-white/80'
            }`}
            title={`Centrar en ${partnerName}`}
          >
            <span>{partnerAvatar || '💖'}</span>
            <span>{partnerName || 'Pareja'}</span>
          </button>

          <button
            type="button"
            onClick={() => setTargetFocus('me')}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer transition-all flex items-center gap-1 ${
              targetFocus === 'me'
                ? 'bg-[#1a4fff] text-white shadow-md'
                : 'bg-white/10 hover:bg-white/20 text-white/80'
            }`}
            title={`Centrar en ${myName}`}
          >
            <span>{myAvatar || '🎯'}</span>
            <span>Yo</span>
          </button>

          <button
            type="button"
            onClick={() => setTargetFocus('both')}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer transition-all flex items-center gap-1 ${
              targetFocus === 'both'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white/10 hover:bg-white/20 text-white/80'
            }`}
            title="Ver a ambos en el mapa"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Ambos</span>
          </button>

          {onRefreshGps && (
            <button
              type="button"
              onClick={onRefreshGps}
              disabled={isLoadingGps}
              className="p-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-400/30 cursor-pointer transition-all"
              title="Actualizar mi GPS ahora"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingGps ? 'animate-spin' : ''}`} />
            </button>
          )}

          <button
            type="button"
            onClick={() => setMapType(mapType === 'roadmap' ? 'hybrid' : 'roadmap')}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 cursor-pointer transition-all"
            title="Alternar vista Satélite / Mapa"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => {
              setNewSpotForm((f) => ({
                ...f,
                lat: myCoords ? String(myCoords.lat.toFixed(5)) : '',
                lng: myCoords ? String(myCoords.lng.toFixed(5)) : '',
              }));
              setIsAddSpotModalOpen(true);
            }}
            className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/30 cursor-pointer transition-all flex items-center gap-1"
            title="Guardar un lugar especial de cita"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Guardar Lugar</span>
          </button>
        </div>
      </div>

      {/* Contenedor del mapa Google Maps nativo con @vis.gl/react-google-maps */}
      <div className="relative w-full h-80 sm:h-96 rounded-3xl overflow-hidden border border-[#1a4fff]/40 shadow-2xl bg-slate-950">
        <APIProvider apiKey={apiKey} libraries={['marker']}>
          <Map
            mapId="DEMO_MAP_ID"
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            defaultZoom={15}
            defaultCenter={defaultCenter}
            gestureHandling="greedy"
            disableDefaultUI={false}
            className="w-full h-full"
          >
            {/* Controlador de Cámara */}
            <MapViewController
              myCoords={myCoords}
              partnerCoords={partnerCoords}
              targetFocus={targetFocus}
              mapType={mapType}
            />

            {/* MARCADOR: YO */}
            {myCoords && (
              <AdvancedMarker
                position={myCoords}
                title={`${myName} (Yo)`}
                onClick={() => setActiveInfoWindow(activeInfoWindow === 'me' ? null : 'me')}
              >
                <div className="relative flex items-center justify-center cursor-pointer group transform hover:scale-110 transition-transform">
                  <div className="w-11 h-11 rounded-2xl bg-[#1a4fff] border-2 border-white shadow-[0_0_15px_rgba(26,79,255,0.8)] flex items-center justify-center text-xl text-white">
                    {myAvatar || '🎯'}
                  </div>
                  <div className="absolute -bottom-1 w-3 h-3 bg-[#1a4fff] rotate-45 border-r border-b border-white" />
                  <span className="absolute -top-6 px-2 py-0.5 rounded-md bg-black/80 text-[10px] font-bold text-blue-200 border border-blue-400/40 whitespace-nowrap shadow-md">
                    {myName} (Yo)
                  </span>
                </div>
              </AdvancedMarker>
            )}

            {/* INFOWINDOW: YO */}
            {activeInfoWindow === 'me' && myCoords && (
              <InfoWindow
                position={myCoords}
                onCloseClick={() => setActiveInfoWindow(null)}
              >
                <div className="p-2 text-slate-900 max-w-xs space-y-1.5 font-sans">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-1.5">
                    <span className="text-2xl">{myAvatar || '🎯'}</span>
                    <div>
                      <h4 className="font-bold text-xs text-blue-700 leading-tight">
                        {myName} (Yo)
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        {myLocation?.name || 'Coordenadas GPS en vivo'}
                      </p>
                    </div>
                  </div>
                  {myStatus && (
                    <p className="text-[11px] text-slate-700 font-medium">
                      Estado: {myStatus}
                    </p>
                  )}
                  <p className="text-[9px] text-slate-400">
                    Actualizado: {myLocation?.updatedAt || 'Ahora'}
                  </p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${myCoords.lat},${myCoords.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 pt-1"
                  >
                    <span>Abrir en Google Maps</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </InfoWindow>
            )}

            {/* MARCADOR: PAREJA */}
            {partnerCoords && (
              <AdvancedMarker
                position={partnerCoords}
                title={partnerName}
                onClick={() => setActiveInfoWindow(activeInfoWindow === 'partner' ? null : 'partner')}
              >
                <div className="relative flex items-center justify-center cursor-pointer group transform hover:scale-110 transition-transform">
                  <div className="w-11 h-11 rounded-2xl bg-rose-600 border-2 border-white shadow-[0_0_18px_rgba(225,29,72,0.8)] flex items-center justify-center text-xl text-white">
                    {partnerAvatar || '💖'}
                  </div>
                  <div className="absolute -bottom-1 w-3 h-3 bg-rose-600 rotate-45 border-r border-b border-white" />
                  <span className="absolute -top-6 px-2 py-0.5 rounded-md bg-black/80 text-[10px] font-bold text-rose-200 border border-rose-400/40 whitespace-nowrap shadow-md">
                    {partnerName}
                  </span>
                </div>
              </AdvancedMarker>
            )}

            {/* INFOWINDOW: PAREJA */}
            {activeInfoWindow === 'partner' && partnerCoords && (
              <InfoWindow
                position={partnerCoords}
                onCloseClick={() => setActiveInfoWindow(null)}
              >
                <div className="p-2 text-slate-900 max-w-xs space-y-1.5 font-sans">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-1.5">
                    <span className="text-2xl">{partnerAvatar || '💖'}</span>
                    <div>
                      <h4 className="font-bold text-xs text-rose-700 leading-tight">
                        {partnerName}
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        {partnerLocation?.name || 'Coordenadas GPS de la pareja'}
                      </p>
                    </div>
                  </div>
                  {partnerStatus && (
                    <p className="text-[11px] text-slate-700 font-medium">
                      Estado: {partnerStatus}
                    </p>
                  )}
                  <p className="text-[9px] text-slate-400">
                    Actualizado: {partnerLocation?.updatedAt || 'Ahora'}
                  </p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${partnerCoords.lat},${partnerCoords.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 hover:text-rose-800 pt-1"
                  >
                    <span>Abrir en Google Maps</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </InfoWindow>
            )}

            {/* MARCADORES: LUGARES ESPECIALES DE LA PAREJA */}
            {coupleSpots.map((spot) => (
              <AdvancedMarker
                key={spot.id}
                position={{ lat: spot.lat, lng: spot.lng }}
                title={spot.title}
                onClick={() => setActiveInfoWindow(activeInfoWindow === spot.id ? null : spot.id)}
              >
                <div className="relative flex items-center justify-center cursor-pointer group transform hover:scale-110 transition-transform">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 border-2 border-white shadow-[0_0_12px_rgba(245,158,11,0.8)] flex items-center justify-center text-lg text-white">
                    {spot.emoji}
                  </div>
                  <div className="absolute -bottom-1 w-2.5 h-2.5 bg-amber-500 rotate-45 border-r border-b border-white" />
                </div>
              </AdvancedMarker>
            ))}

            {/* INFOWINDOW: LUGAR ESPECIAL SELECCIONADO */}
            {coupleSpots
              .filter((s) => s.id === activeInfoWindow)
              .map((spot) => (
                <InfoWindow
                  key={spot.id}
                  position={{ lat: spot.lat, lng: spot.lng }}
                  onCloseClick={() => setActiveInfoWindow(null)}
                >
                  <div className="p-2 text-slate-900 max-w-xs space-y-1.5 font-sans">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xl">{spot.emoji}</span>
                        <h4 className="font-bold text-xs text-amber-700 leading-tight">
                          {spot.title}
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteSpot(spot.id)}
                        className="text-red-500 hover:text-red-700 p-0.5"
                        title="Eliminar lugar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {spot.notes && (
                      <p className="text-[11px] text-slate-600 italic">
                        "{spot.notes}"
                      </p>
                    )}
                    <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1">
                      <span>Agregado por: {spot.addedBy}</span>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${spot.lat},${spot.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 font-bold text-amber-600 hover:text-amber-800"
                      >
                        <span>Cómo llegar</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                </InfoWindow>
              ))}
          </Map>
        </APIProvider>
      </div>

      {/* Lista de lugares especiales guardados */}
      <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
        <div className="flex items-center justify-between text-xs font-bold text-white">
          <div className="flex items-center gap-1.5 text-amber-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Nuestros Lugares Especiales & Citas ({coupleSpots.length})</span>
          </div>
          <span className="text-[10px] text-white/50">Toca para centrar en el mapa</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {coupleSpots.map((spot) => (
            <div
              key={spot.id}
              className="p-2.5 rounded-xl bg-black/40 border border-white/5 hover:border-amber-400/40 flex items-center justify-between gap-2 transition-all cursor-pointer group"
              onClick={() => {
                setActiveInfoWindow(spot.id);
                setTargetFocus(undefined as unknown as 'me');
              }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xl shrink-0 group-hover:scale-110 transition-transform">
                  {spot.emoji}
                </span>
                <div className="min-w-0">
                  <h5 className="text-xs font-bold text-white truncate group-hover:text-amber-300 transition-colors">
                    {spot.title}
                  </h5>
                  {spot.notes && (
                    <p className="text-[10px] text-white/50 truncate">
                      {spot.notes}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSpot(spot.id);
                  }}
                  className="p-1 text-white/40 hover:text-rose-400 cursor-pointer"
                  title="Eliminar lugar"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal para agregar nuevo lugar especial */}
      {isAddSpotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-white/20 p-5 space-y-4 shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2 text-amber-300">
                <Sparkles className="w-4 h-4" />
                <h4 className="text-sm font-bold">Guardar Lugar Especial</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsAddSpotModalOpen(false)}
                className="text-white/60 hover:text-white text-xs font-bold cursor-pointer"
              >
                Cerrar ✕
              </button>
            </div>

            <form onSubmit={handleAddSpot} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] text-white/70 mb-1 font-semibold">
                  Nombre del Lugar / Cita:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Cafetería de la esquina, Mirador..."
                  value={newSpotForm.title}
                  onChange={(e) => setNewSpotForm({ ...newSpotForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-white/70 mb-1 font-semibold">
                    Categoría:
                  </label>
                  <select
                    value={newSpotForm.category}
                    onChange={(e) => {
                      const cat = e.target.value as CoupleSpot['category'];
                      const emojiMap = {
                        cita: '🍷',
                        recuerdo: '💖',
                        favorito: '⭐',
                        por_visitar: '✈️',
                      };
                      setNewSpotForm({
                        ...newSpotForm,
                        category: cat,
                        emoji: emojiMap[cat] || '📍',
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/20 text-white focus:outline-none"
                  >
                    <option value="cita">Cita de Amor 🍷</option>
                    <option value="recuerdo">Lindo Recuerdo 💖</option>
                    <option value="favorito">Lugar Favorito ⭐</option>
                    <option value="por_visitar">Por Visitar ✈️</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-white/70 mb-1 font-semibold">
                    Emoji del Pin:
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={newSpotForm.emoji}
                    onChange={(e) => setNewSpotForm({ ...newSpotForm, emoji: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-center text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-white/70 mb-1 font-semibold">
                  Nota o recuerdo compartido (opcional):
                </label>
                <textarea
                  rows={2}
                  placeholder="¿Por qué es especial este lugar para nosotros?"
                  value={newSpotForm.notes}
                  onChange={(e) => setNewSpotForm({ ...newSpotForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <label className="text-white/60">Latitud:</label>
                  <input
                    type="text"
                    value={newSpotForm.lat}
                    onChange={(e) => setNewSpotForm({ ...newSpotForm, lat: e.target.value })}
                    placeholder={myCoords ? String(myCoords.lat.toFixed(4)) : '-33.4489'}
                    className="w-full px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="text-white/60">Longitud:</label>
                  <input
                    type="text"
                    value={newSpotForm.lng}
                    onChange={(e) => setNewSpotForm({ ...newSpotForm, lng: e.target.value })}
                    placeholder={myCoords ? String(myCoords.lng.toFixed(4)) : '-70.6693'}
                    className="w-full px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddSpotModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black cursor-pointer shadow-md"
                >
                  Guardar en el Mapa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
