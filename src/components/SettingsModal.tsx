import React, { useState, useRef, useEffect } from 'react';
import {
  Settings,
  Palette,
  Smartphone,
  Shield,
  Download,
  Upload,
  Image as ImageIcon,
  Check,
  Moon,
  Sun,
  Monitor,
  Bell,
  Mic,
  Camera,
  MapPin,
  Zap,
  Maximize,
  Share2,
  LogOut,
  Trash2,
  Sliders,
  Sparkles,
  HardDrive,
  Flower2,
  Gauge,
  RefreshCw,
  FileArchive,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ModalPortal } from './ModalPortal';

export const BACKGROUND_PRESETS = [
  { name: 'Violeta Místico', value: 'bg-[#4c1d95]', color: '#5b21b6' },
  { name: 'Burdeo Elegante', value: 'bg-[#4a0404]', color: '#4a0404' },
  { name: 'Negro Carbón', value: 'bg-[#18181b]', color: '#18181b' },
  { name: 'Blanco Suave', value: 'bg-[#f8fafc]', color: '#ffffff' },
  { name: 'Índigo Profundo', value: 'bg-[#1e1b4b]', color: '#312e81' },
  { name: 'Melocotón Suave', value: 'bg-[#ea580c]', color: '#fdba74' },
  { name: 'Lavanda Suave', value: 'bg-[#7e22ce]', color: '#c084fc' },
  { name: 'Rosa Romántico', value: 'bg-[#831843]', color: '#be185d' },
  { name: 'Azul Eléctrico', value: 'bg-[#1e40af]', color: '#1d4ed8' },
  { name: 'Azul Cielo', value: 'bg-[#0369a1]', color: '#0284c7' },
  { name: 'Rosado Dulce', value: 'bg-[#db2777]', color: '#f472b6' },
  { name: 'Aurora Dinámica', value: 'mesh-aurora-dark', color: '#8b5cf6' },
];

export const TEXT_COLORS = [
  { name: 'Blanco Puro', value: '#ffffff' },
  { name: 'Oro Cálido 🌟', value: '#facc15' },
  { name: 'Menta Fresca 🌿', value: '#34d399' },
  { name: 'Azul Eléctrico ⚡', value: '#38bdf8' },
  { name: 'Rosa Pastel 🌸', value: '#f472b6' },
  { name: 'Rosa Fucsia 💖', value: '#ec4899' },
  { name: 'Azul Zafiro 🌊', value: '#60a5fa' },
  { name: 'Lavanda Cósmica 🔮', value: '#c084fc' },
  { name: 'Amarillo Sol ☀️', value: '#fef08a' },
  { name: 'Naranja Atardecer 🍊', value: '#fb923c' },
  { name: 'Rojo Pasión ❤️', value: '#f87171' },
  { name: 'Vino Profundo 🍷', value: '#fda4af' },
  { name: 'Turquesa Neón 💎', value: '#2dd4bf' },
  { name: 'Plata Perlada 🪙', value: '#e2e8f0' },
  { name: 'Esmeralda Vital 🍀', value: '#10b981' },
];

export const SUBTEXT_COLORS = [
  { name: 'Gris Plata (Recomendado)', value: 'rgba(255, 255, 255, 0.7)' },
  { name: 'Blanco Nieve', value: '#ffffff' },
  { name: 'Oro Tenue', value: '#fde047' },
  { name: 'Menta Pastel', value: '#6ee7b7' },
  { name: 'Cian Claro', value: '#7dd3fc' },
  { name: 'Rosa Suave', value: '#fbcfe8' },
  { name: 'Lavanda Pálida', value: '#e9d5ff' },
  { name: 'Melocotón Claro', value: '#fed7aa' },
  { name: 'Gris Oscuro', value: '#94a3b8' },
  { name: 'Verde Musgo', value: '#a3e635' },
];

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenExit?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenExit,
}) => {
  const {
    settings,
    updateSettings,
    firebaseUser,
    handleGoogleLogin,
    handleLogout,
    exportEncryptedBackup,
    exportZipBackup,
    restoreFromEncryptedBackup,
    restoreFromZipFile,
    me,
    partner,
    activeRole,
    toggleRole,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'appearance' | 'comfort' | 'performance' | 'backup'>('appearance');
  const [restoreStatus, setRestoreStatus] = useState<string | null>(null);
  const [isExportingZip, setIsExportingZip] = useState(false);

  // Android Permissions live state
  const [permissionsState, setPermissionsState] = useState<{
    notifications: string;
    mic: string;
    camera: string;
    geo: string;
    wakeLock: boolean;
  }>({
    notifications: 'default',
    mic: 'prompt',
    camera: 'prompt',
    geo: 'prompt',
    wakeLock: 'wakeLock' in navigator,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupRestoreInputRef = useRef<HTMLInputElement>(null);

  const [customBgColor, setCustomBgColor] = useState<string>(() => {
    if (settings.backgroundTheme?.startsWith('#')) return settings.backgroundTheme;
    if (settings.backgroundTheme?.startsWith('bg-[#')) return settings.backgroundTheme.replace('bg-[', '').replace(']', '');
    return '#1e1b4b';
  });

  useEffect(() => {
    if ('Notification' in window) {
      setPermissionsState((prev) => ({ ...prev, notifications: Notification.permission }));
    }
  }, []);

  const handleCustomBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          updateSettings({ customBgImage: ev.target.result as string });
          setRestoreStatus('¡Foto de fondo fijada y adaptada a la pantalla!');
          setTimeout(() => setRestoreStatus(null), 3500);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExportZip = async () => {
    setIsExportingZip(true);
    try {
      await exportZipBackup();
      setRestoreStatus('¡Copia de seguridad en formato ZIP generada y descargada!');
      setTimeout(() => setRestoreStatus(null), 4000);
    } catch {
      setRestoreStatus('Error al generar la copia ZIP.');
    } finally {
      setIsExportingZip(false);
    }
  };

  const handleRestoreFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.toLowerCase().endsWith('.zip')) {
      const ok = await restoreFromZipFile(file);
      if (ok) {
        setRestoreStatus('¡Copia de seguridad ZIP restaurada correctamente!');
        setTimeout(() => setRestoreStatus(null), 4000);
      } else {
        setRestoreStatus('Error al leer el archivo ZIP.');
      }
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          const success = restoreFromEncryptedBackup(ev.target.result as string);
          if (success) {
            setRestoreStatus('¡Copia de seguridad restaurada con éxito!');
            setTimeout(() => setRestoreStatus(null), 4000);
          } else {
            setRestoreStatus('Error: El archivo de copia de seguridad no es válido.');
          }
        }
      };
      reader.readAsText(file);
    }
  };

  const handleRequestPushNotifications = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      setPermissionsState((prev) => ({ ...prev, notifications: perm }));
      if (perm === 'granted') {
        new Notification('Happy Life Duo 💘', {
          body: '¡Notificaciones push activadas correctamente!',
          icon: '/icon.svg',
        });
      }
    }
  };

  const handleRequestMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermissionsState((prev) => ({ ...prev, mic: 'granted' }));
      stream.getTracks().forEach((t) => t.stop());
      alert('¡Permiso de micrófono concedido!');
    } catch {
      setPermissionsState((prev) => ({ ...prev, mic: 'denied' }));
      alert('Permiso de micrófono denegado en el navegador.');
    }
  };

  const handleRequestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setPermissionsState((prev) => ({ ...prev, camera: 'granted' }));
      stream.getTracks().forEach((t) => t.stop());
      alert('¡Permiso de cámara concedido!');
    } catch {
      setPermissionsState((prev) => ({ ...prev, camera: 'denied' }));
      alert('Permiso de cámara denegado en el navegador.');
    }
  };

  const handleRequestGeoPermission = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setPermissionsState((prev) => ({ ...prev, geo: 'granted' }));
          alert('¡Permiso de ubicación GPS concedido!');
        },
        () => {
          setPermissionsState((prev) => ({ ...prev, geo: 'denied' }));
          alert('Permiso de ubicación no concedido.');
        }
      );
    }
  };

  const handleWebShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Happy Life Duo',
          text: 'Descarga nuestra app de pareja "Happy Life Duo - Nuestro Lugar Seguro"',
          url: window.location.href,
        });
      } catch {
        // cancelled
      }
    }
  };

  return (
    <ModalPortal
      isOpen={isOpen}
      onClose={onClose}
      title="Ajustes y Personalización"
      icon={<Settings className="w-6 h-6 text-white" />}
      maxWidth="max-w-2xl"
    >
      <div className="text-white space-y-4">
        {/* Navigation Tabs - 4 Pestañas Claras y Ordenadas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('appearance')}
            className={`py-2 px-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'appearance' ? 'bg-white/20 text-white shadow-sm' : 'text-white/60 hover:text-white'
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-rose-400" />
            <span>Fondos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('comfort')}
            className={`py-2 px-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'comfort' ? 'bg-white/20 text-white shadow-sm' : 'text-white/60 hover:text-white'
            }`}
          >
            <Moon className="w-3.5 h-3.5 text-amber-300" />
            <span>Luz & Noche</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('performance')}
            className={`py-2 px-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'performance' ? 'bg-white/20 text-white shadow-sm' : 'text-white/60 hover:text-white'
            }`}
          >
            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
            <span>Fluidez & Android</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`py-2 px-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'backup' ? 'bg-white/20 text-white shadow-sm' : 'text-white/60 hover:text-white'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
            <span>Respaldo ZIP</span>
          </button>
        </div>

        {/* CONTENEDOR ÚNICO DE SCROLL (Sin barras dobles anidadas) */}
        <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1 scrollbar-thin">
          {restoreStatus && (
            <div className="p-3 rounded-2xl bg-emerald-950/80 border border-emerald-400 text-emerald-200 text-xs text-center font-bold animate-fadeIn">
              {restoreStatus}
            </div>
          )}

          {/* TAB 1: APARIENCIA & FONDOS */}
          {activeTab === 'appearance' && (
            <div className="space-y-5">
              {/* Foto de Fondo Fija Adaptada */}
              <div className="p-4 rounded-3xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-white flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-rose-400" />
                      <span>Foto de Fondo Fija (Adaptada a Pantalla)</span>
                    </h4>
                    <p className="text-xs text-white/60 mt-0.5">
                      La foto se fija como fondo estático 100% de la pantalla sin moverse ni estirarse al deslizar.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl btn-3d-rose text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir Mi Foto de Galería</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCustomBgUpload}
                  />

                  {settings.customBgImage && (
                    <button
                      type="button"
                      onClick={() => updateSettings({ customBgImage: undefined })}
                      className="px-3 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Quitar Foto y Volver a Tema</span>
                    </button>
                  )}
                </div>

                {/* Opciones de Ajuste de Foto (Sin cortes) */}
                {settings.customBgImage && (
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2 mt-2">
                    <label className="text-[11px] font-bold text-white/90 uppercase tracking-wider block">
                      Ajuste de la foto a la pantalla:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => updateSettings({ customBgFit: 'contain' })}
                        className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                          (!settings.customBgFit || settings.customBgFit === 'contain')
                            ? 'bg-rose-500 text-white border-rose-400 shadow-md'
                            : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        🖼️ Completa (Sin cortes)
                      </button>
                      <button
                        type="button"
                        onClick={() => updateSettings({ customBgFit: 'cover' })}
                        className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                          settings.customBgFit === 'cover'
                            ? 'bg-rose-500 text-white border-rose-400 shadow-md'
                            : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        📱 Llenar pantalla
                      </button>
                      <button
                        type="button"
                        onClick={() => updateSettings({ customBgFit: 'fill' })}
                        className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                          settings.customBgFit === 'fill'
                            ? 'bg-rose-500 text-white border-rose-400 shadow-md'
                            : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        📐 Estirar
                      </button>
                    </div>
                    <p className="text-[10px] text-white/50">
                      "Completa (Sin cortes)" adapta tu foto a cualquier tamaño de pantalla sin recortar nada.
                    </p>
                  </div>
                )}
              </div>

              {/* Presets de Fondos Uniformes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white/90 uppercase tracking-wider block">
                    Fondos Uniformes Pantalla Completa:
                  </label>
                  <span className="text-[10px] text-rose-300 font-bold px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30">
                    12 Opciones
                  </span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {BACKGROUND_PRESETS.map((bg) => (
                    <button
                      key={bg.name}
                      type="button"
                      onClick={() => {
                        updateSettings({ backgroundTheme: bg.value, customBgImage: undefined });
                      }}
                      className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                        settings.backgroundTheme === bg.value && !settings.customBgImage
                          ? 'border-white ring-2 ring-rose-400 scale-105 shadow-lg bg-white/10'
                          : 'border-white/10 bg-white/5 hover:border-white/30'
                      }`}
                    >
                      <div
                        className="w-7 h-7 rounded-full shadow-md border border-white/30"
                        style={{ backgroundColor: bg.color }}
                      />
                      <span className="text-[10px] font-bold text-white truncate max-w-full">
                        {bg.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* PALETA DE COLORES AJUSTABLE PARA EL FONDO (NUEVA FUNCIÓN) */}
              <div className="p-4 rounded-3xl bg-black/40 border border-white/15 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-black uppercase tracking-wider text-white">
                      Paleta de Color Ajustable para Fondo:
                    </span>
                  </div>
                  <span className="text-[10px] text-white/50">Cualquier Color HEX</span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Selector visual de color nativo */}
                  <div className="relative">
                    <input
                      type="color"
                      value={customBgColor.startsWith('#') ? customBgColor : '#1e1b4b'}
                      onChange={(e) => setCustomBgColor(e.target.value)}
                      className="w-12 h-12 rounded-2xl cursor-pointer border-2 border-white/40 bg-transparent p-0 shadow-lg"
                      title="Haz clic para abrir el espectro y selector de color"
                    />
                  </div>

                  {/* Input de código HEX */}
                  <div className="flex-1">
                    <input
                      type="text"
                      value={customBgColor}
                      onChange={(e) => setCustomBgColor(e.target.value)}
                      placeholder="#1e1b4b"
                      className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white font-mono text-xs focus:outline-none focus:border-rose-400"
                    />
                    <span className="text-[9.5px] text-white/50 mt-0.5 block">
                      Escribe un código HEX o selecciona con el círculo de color
                    </span>
                  </div>

                  {/* Botón Aplicar a Fondo */}
                  <button
                    type="button"
                    onClick={() => {
                      updateSettings({ backgroundTheme: customBgColor, customBgImage: undefined });
                      setRestoreStatus(`¡Color de fondo ${customBgColor} aplicado a toda la pantalla!`);
                      setTimeout(() => setRestoreStatus(null), 3000);
                    }}
                    className="px-4 py-2.5 rounded-xl btn-3d-rose text-white text-xs font-bold cursor-pointer shrink-0 shadow-md"
                  >
                    Aplicar Fondo 🎨
                  </button>
                </div>

                {/* Muestras rápidas de colores ajustables */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-white/50 mr-1">Rápidos:</span>
                  {[
                    '#4c1d95', '#4a0404', '#18181b', '#f8fafc', '#1e1b4b',
                    '#ea580c', '#7e22ce', '#831843', '#1e40af', '#0284c7',
                    '#db2777', '#064e3b', '#2e1065', '#0f172a', '#701a75'
                  ].map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => {
                        setCustomBgColor(hex);
                        updateSettings({ backgroundTheme: hex, customBgImage: undefined });
                      }}
                      className="w-5 h-5 rounded-full border border-white/30 cursor-pointer shadow-sm hover:scale-125 transition-transform"
                      style={{ backgroundColor: hex }}
                      title={`Aplicar ${hex}`}
                    />
                  ))}
                </div>
              </div>

              {/* Colores de Texto Principal con Paleta Ajustable */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-white/90 uppercase tracking-wider">
                    Color de Texto Principal (Se Aplica a Toda la App):
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/50">Paleta Libre:</span>
                    <input
                      type="color"
                      value={settings.textColor.startsWith('#') ? settings.textColor : '#ffffff'}
                      onChange={(e) => updateSettings({ textColor: e.target.value })}
                      className="w-7 h-7 rounded-xl cursor-pointer border border-white/30 bg-transparent p-0 shadow-sm"
                      title="Seleccionar cualquier color para el texto principal"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {TEXT_COLORS.map((tc) => (
                    <button
                      key={tc.name}
                      type="button"
                      onClick={() => updateSettings({ textColor: tc.value })}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        settings.textColor === tc.value
                          ? 'border-white ring-2 ring-white/50 scale-105 shadow-md bg-white/10'
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full border border-black/30" style={{ backgroundColor: tc.value }} />
                      <span style={{ color: tc.value }}>{tc.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Colores de Subtexto y Letras Secundarias con Paleta Ajustable */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-white/90 uppercase tracking-wider">
                    Color del Subtexto y Letras Secundarias (Ajustable):
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/50">Paleta Libre:</span>
                    <input
                      type="color"
                      value={settings.subtextColor.startsWith('#') ? settings.subtextColor : '#cbd5e1'}
                      onChange={(e) => updateSettings({ subtextColor: e.target.value })}
                      className="w-7 h-7 rounded-xl cursor-pointer border border-white/30 bg-transparent p-0 shadow-sm"
                      title="Elegir cualquier color personalizado para el subtexto"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {SUBTEXT_COLORS.map((st) => (
                    <button
                      key={st.name}
                      type="button"
                      onClick={() => updateSettings({ subtextColor: st.value })}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        settings.subtextColor === st.value
                          ? 'border-white ring-2 ring-white/50 scale-105 shadow-md bg-white/15'
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/30 shrink-0"
                        style={{ backgroundColor: st.value }}
                      />
                      <span style={{ color: st.value }}>{st.name}</span>
                    </button>
                  ))}
                </div>

                {/* Vista previa en vivo de contraste */}
                <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between mt-2">
                  <div>
                    <p className="text-xs font-black" style={{ color: settings.textColor }}>
                      Texto Principal de Muestra (Menús y Títulos)
                    </p>
                    <p className="text-[11px] font-medium" style={{ color: settings.subtextColor }}>
                      Subtexto secundario: lectura nítida, relajada y descansada
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: settings.textColor }} title="Texto principal" />
                    <span className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: settings.subtextColor }} title="Subtexto" />
                  </div>
                </div>
              </div>

              {/* Tamaño de Tipografía (Pequeña, Normal, Media, Grande, Extra Grande) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-white/90 uppercase tracking-wider">
                  Tamaño de Tipografía General:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {(
                    [
                      { id: 'small', label: 'Pequeña 🐜' },
                      { id: 'normal', label: 'Normal 📱' },
                      { id: 'medium', label: 'Media 📝' },
                      { id: 'large', label: 'Grande 👓' },
                      { id: 'extralarge', label: 'Extra 🔍' },
                    ] as const
                  ).map((sz) => (
                    <button
                      key={sz.id}
                      type="button"
                      onClick={() => updateSettings({ fontSize: sz.id })}
                      className={`py-2 px-1 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                        settings.fontSize === sz.id
                          ? 'bg-white/20 border-white shadow-sm font-black ring-1 ring-white/50 text-white'
                          : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      {sz.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONFORT VISUAL & MODO NOCTURNO */}
          {activeTab === 'comfort' && (
            <div className="space-y-5">
              <div className="p-4 rounded-3xl bg-amber-950/20 border border-amber-500/30 space-y-4">
                <div className="flex items-center justify-between pb-1 border-b border-amber-500/20">
                  <h4 className="text-sm font-black text-amber-200 uppercase tracking-wider font-heading flex items-center gap-2">
                    <span>🌙</span>
                    <span>Confort Visual & Modo Nocturno</span>
                  </h4>
                  <span className="text-[10px] text-amber-300 font-bold px-2 py-0.5 rounded-full bg-amber-500/20">
                    Capa Visual Activa
                  </span>
                </div>

                {/* 1. FILTRO DE LUZ AZUL */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-amber-200">Filtro de Luz Azul (Tono Cálido Ocular)</span>
                    <span className="text-amber-300 font-mono text-sm">{settings.blueLightFilter}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="80"
                    value={settings.blueLightFilter}
                    onChange={(e) => updateSettings({ blueLightFilter: Number(e.target.value) })}
                    className="w-full accent-amber-500 cursor-pointer h-2 rounded-lg bg-white/20"
                  />
                  <div className="flex justify-between items-center text-[10px] text-white/50 mt-1.5">
                    <span>Desactivado (0%)</span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateSettings({ blueLightFilter: 0 })}
                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                      >
                        Off
                      </button>
                      <button
                        type="button"
                        onClick={() => updateSettings({ blueLightFilter: 35 })}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/25 text-amber-200 hover:bg-amber-500/40 cursor-pointer font-bold"
                      >
                        Suave 35%
                      </button>
                      <button
                        type="button"
                        onClick={() => updateSettings({ blueLightFilter: 65 })}
                        className="px-2.5 py-1 rounded-lg bg-amber-600/35 text-amber-200 hover:bg-amber-600/50 cursor-pointer font-bold"
                      >
                        Cálido 65%
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. ATENUADOR NOCTURNO */}
                <div className="pt-2 border-t border-white/10">
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-indigo-200">Atenuador de Luz / Modo Noche Profunda</span>
                    <span className="text-indigo-300 font-mono text-sm">{settings.nightModeDim}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="80"
                    value={settings.nightModeDim}
                    onChange={(e) => updateSettings({ nightModeDim: Number(e.target.value) })}
                    className="w-full accent-indigo-500 cursor-pointer h-2 rounded-lg bg-white/20"
                  />
                  <div className="flex justify-between items-center text-[10px] text-white/50 mt-1.5">
                    <span>Normal (0%)</span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateSettings({ nightModeDim: 0 })}
                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                      >
                        Off
                      </button>
                      <button
                        type="button"
                        onClick={() => updateSettings({ nightModeDim: 30 })}
                        className="px-2.5 py-1 rounded-lg bg-indigo-500/25 text-indigo-200 hover:bg-indigo-500/40 cursor-pointer font-bold"
                      >
                        Atenuar 30%
                      </button>
                      <button
                        type="button"
                        onClick={() => updateSettings({ nightModeDim: 60 })}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600/35 text-indigo-200 hover:bg-indigo-600/50 cursor-pointer font-bold"
                      >
                        Noche 60%
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. BRILLO & CONTRASTE */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/10">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span>Brillo General</span>
                      <span className="font-mono text-rose-300">{settings.brightness}%</span>
                    </div>
                    <input
                      type="range"
                      min="60"
                      max="140"
                      value={settings.brightness}
                      onChange={(e) => updateSettings({ brightness: Number(e.target.value) })}
                      className="w-full accent-rose-500 cursor-pointer h-1.5 rounded-lg bg-white/20"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span>Contraste</span>
                      <span className="font-mono text-cyan-300">{settings.contrast}%</span>
                    </div>
                    <input
                      type="range"
                      min="70"
                      max="130"
                      value={settings.contrast}
                      onChange={(e) => updateSettings({ contrast: Number(e.target.value) })}
                      className="w-full accent-cyan-500 cursor-pointer h-1.5 rounded-lg bg-white/20"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FLUIDEZ & OPTIMIZACIÓN ANDROID */}
          {activeTab === 'performance' && (
            <div className="space-y-5">
              {/* Opciones reales de optimización y fluidez visual */}
              <div className="p-4 rounded-3xl bg-cyan-950/20 border border-cyan-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-cyan-200 uppercase tracking-wider font-heading flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-cyan-400" />
                    <span>Optimización & Fluidez Visual Android</span>
                  </h4>
                  <span className="text-[10px] text-cyan-300 font-bold px-2 py-0.5 rounded-full bg-cyan-500/20">
                    60 FPS
                  </span>
                </div>
                <p className="text-xs text-white/70">
                  Opciones reales para eliminar tirones, lentitud y mejorar la respuesta táctil en tu teléfono Android:
                </p>

                <div className="space-y-2.5">
                  {/* Modo Alto Rendimiento */}
                  <div className="p-3 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Modo Alto Rendimiento / Liviano ⚡
                      </span>
                      <span className="text-[10px] text-white/50">
                        Desactiva filtros de desenfoque pesados (backdrop-filter) para acelerar teléfonos con poca RAM.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateSettings({ highPerformanceMode: !settings.highPerformanceMode })}
                      className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer flex items-center shrink-0 ${
                        settings.highPerformanceMode ? 'bg-cyan-500 justify-end' : 'bg-white/20 justify-start'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full bg-white shadow-md" />
                    </button>
                  </div>

                  {/* Modo Gama Baja / Poca RAM (Solicitado por el usuario) */}
                  <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-500/30 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-amber-200 block">
                        Modo Gama Baja / Ahorro Extremo ⚡
                      </span>
                      <span className="text-[10px] text-white/60">
                        Desactiva modelos 3D, bloquea a 30 FPS y elimina animaciones para celulares con poca RAM.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateSettings({ lowEndDeviceMode: !settings.lowEndDeviceMode })}
                      className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer flex items-center shrink-0 ${
                        settings.lowEndDeviceMode ? 'bg-amber-500 justify-end' : 'bg-white/20 justify-start'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full bg-white shadow-md" />
                    </button>
                  </div>

                  {/* Modo Audio Seguro / Universal (Anti-congelamiento en Honor) */}
                  <div className="p-3 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Modo Audio Seguro / Universal 🎵
                      </span>
                      <span className="text-[10px] text-white/50">
                        Evita congelamientos de pantalla al elegir tonos en teléfonos Honor, Huawei o procesadores lentos.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateSettings({ safeAudioMode: !settings.safeAudioMode })}
                      className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer flex items-center shrink-0 ${
                        settings.safeAudioMode ? 'bg-emerald-500 justify-end' : 'bg-white/20 justify-start'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full bg-white shadow-md" />
                    </button>
                  </div>

                  {/* Reducir Animaciones */}
                  <div className="p-3 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Reducir Animaciones y Efectos 🚀
                      </span>
                      <span className="text-[10px] text-white/50">
                        Transiciones instantáneas sin demoras en los menús y modales.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateSettings({ reduceAnimations: !settings.reduceAnimations })}
                      className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer flex items-center shrink-0 ${
                        settings.reduceAnimations ? 'bg-emerald-500 justify-end' : 'bg-white/20 justify-start'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full bg-white shadow-md" />
                    </button>
                  </div>

                  {/* Modo Bajo Estímulo */}
                  <div className="p-3 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Modo Bajo Estímulo Sensorial 🧘
                      </span>
                      <span className="text-[10px] text-white/50">
                        Reduce contrastes intensos para calmar la fatiga mental.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateSettings({ lowStimulusMode: !settings.lowStimulusMode })}
                      className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer flex items-center shrink-0 ${
                        settings.lowStimulusMode ? 'bg-emerald-500 justify-end' : 'bg-white/20 justify-start'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full bg-white shadow-md" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Adaptación de Pantalla & Pantalla Completa (Adaptado a Honor, Samsung y Xiaomi) */}
              <div className="p-4 rounded-3xl bg-white/5 border border-white/10 space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Maximize className="w-4 h-4 text-cyan-400" />
                  <span>Escala de Pantalla y Resolución</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'auto', label: 'Auto (Inteligente) 📱' },
                    { id: 'honor_narrow', label: 'Honor / Estrecha 📲' },
                    { id: 'standard', label: 'Samsung Galaxy (Normal)' },
                    { id: 'compact', label: 'Compacto 720p HD' },
                    { id: 'fullscreen', label: '100% Ancho Total' },
                    { id: 'qhd', label: 'Tablet / 2K QHD' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => updateSettings({ screenFit: opt.id as any })}
                      className={`py-2 px-2.5 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                        settings.screenFit === opt.id
                          ? 'bg-cyan-500/30 border-cyan-400 text-white shadow-md ring-1 ring-cyan-400'
                          : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs text-white/80">Modo Pantalla Completa Inmersiva</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (!document.fullscreenElement) {
                        document.documentElement.requestFullscreen?.().catch(() => {});
                        updateSettings({ screenFit: 'fullscreen' });
                      } else {
                        document.exitFullscreen?.().catch(() => {});
                        updateSettings({ screenFit: 'standard' });
                      }
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold cursor-pointer"
                  >
                    {typeof document !== 'undefined' && document.fullscreenElement
                      ? 'Salir de Pantalla Completa'
                      : 'Activar Pantalla Completa 🚀'}
                  </button>
                </div>
              </div>

              {/* Gestor de Permisos Android (Orden hacia abajo) */}
              <div className="p-4 rounded-3xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <span>Permisos de Hardware Android</span>
                  </h4>
                  <span className="text-[10px] text-white/50">En orden vertical</span>
                </div>

                <div className="flex flex-col gap-2.5 text-xs">
                  {/* 1. Micrófono */}
                  <div className="p-3 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-lime-500/20 border border-lime-400/30 flex items-center justify-center shrink-0">
                        <Mic className="w-4 h-4 text-lime-400" />
                      </div>
                      <div>
                        <p className="font-bold text-white text-xs">1. Micrófono</p>
                        <p className="text-[10px] text-white/50">Para notas de voz y grabaciones</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRequestMicPermission}
                      className="px-3 py-1.5 rounded-xl bg-lime-500/20 hover:bg-lime-500/30 border border-lime-400/40 text-[11px] font-bold text-lime-300 cursor-pointer transition-all"
                    >
                      {permissionsState.mic === 'granted' ? '✅ Concedido' : 'Conceder'}
                    </button>
                  </div>

                  {/* 2. Notificaciones */}
                  <div className="p-3 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0">
                        <Bell className="w-4 h-4 text-amber-300" />
                      </div>
                      <div>
                        <p className="font-bold text-white text-xs">2. Notificaciones Push</p>
                        <p className="text-[10px] text-white/50">Alertas de pareja y recordatorios</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRequestPushNotifications}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-[11px] font-bold text-amber-300 cursor-pointer transition-all"
                    >
                      {permissionsState.notifications === 'granted' ? '✅ Concedido' : 'Activar'}
                    </button>
                  </div>

                  {/* 3. Cámara */}
                  <div className="p-3 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center shrink-0">
                        <Camera className="w-4 h-4 text-purple-400" />
                      </div>
                      <div>
                        <p className="font-bold text-white text-xs">3. Cámara</p>
                        <p className="text-[10px] text-white/50">Para fotos del diario y fondo</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRequestCameraPermission}
                      className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/40 text-[11px] font-bold text-purple-300 cursor-pointer transition-all"
                    >
                      {permissionsState.camera === 'granted' ? '✅ Concedido' : 'Conceder'}
                    </button>
                  </div>

                  {/* 4. Ubicación GPS */}
                  <div className="p-3 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <p className="font-bold text-white text-xs">4. Ubicación GPS</p>
                        <p className="text-[10px] text-white/50">Sincronización de distancia mutua</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRequestGeoPermission}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-[11px] font-bold text-emerald-300 cursor-pointer transition-all"
                    >
                      {permissionsState.geo === 'granted' ? '✅ Concedido' : 'Conceder'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: COPIA DE SEGURIDAD (.ZIP & .JSON) */}
          {activeTab === 'backup' && (
            <div className="space-y-5">
              <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-950/30 via-black/40 to-slate-900/40 border border-emerald-500/30 space-y-4">
                <div className="flex items-center gap-2 text-emerald-300">
                  <FileArchive className="w-5 h-5" />
                  <h4 className="text-sm font-black uppercase tracking-wider font-heading">
                    Copia de Seguridad en Formato ZIP o JSON
                  </h4>
                </div>
                <p className="text-xs text-white/70 leading-relaxed">
                  Exporta un archivo <strong>.zip</strong> comprimido o <strong>.happyduo</strong> cifrado a tu teléfono. Contiene todos tus diarios, notas de voz, grabaciones, recordatorios, chat y fotos para restaurarlos en cualquier momento.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    disabled={isExportingZip}
                    onClick={handleExportZip}
                    className="py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 disabled:opacity-50"
                  >
                    <FileArchive className="w-4 h-4 text-emerald-200" />
                    <span>{isExportingZip ? 'Comprimiendo ZIP...' : 'Descargar en ZIP (.zip) 📦'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={exportEncryptedBackup}
                    className="py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-black text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Download className="w-4 h-4 text-emerald-300" />
                    <span>Copia Rápida (.happyduo)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => backupRestoreInputRef.current?.click()}
                    className="sm:col-span-2 py-3 px-4 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 font-black text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Restaurar Copia (.zip / .happyduo / .json)</span>
                  </button>
                  <input
                    ref={backupRestoreInputRef}
                    type="file"
                    accept=".zip,.happyduo,.json,.txt"
                    className="hidden"
                    onChange={handleRestoreFileSelected}
                  />
                </div>
              </div>

              {/* Autenticación Google Nube y Selección de Dispositivo */}
              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-indigo-950/40 via-purple-950/30 to-black/50 border border-indigo-400/30 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <span>Sincronización con Cuenta Google & Pareja</span>
                  </h4>
                  <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                    {firebaseUser ? '🟢 Sincronizado' : 'Modo Local'}
                  </span>
                </div>

                {/* Selección de quién usa este teléfono */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-white/90">
                    ¿Quién es el dueño de este teléfono? (Selección individual):
                  </label>
                  <p className="text-[10px] text-white/50">
                    Cada teléfono es independiente. Elige cuál de las dos personas eres tú en este celular:
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        updateSettings({ deviceRole: 'me' });
                        if (activeRole !== 'me') toggleRole();
                      }}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        activeRole === 'me'
                          ? 'bg-rose-500/30 border-rose-400 text-white font-bold ring-2 ring-rose-400/50 shadow-md'
                          : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-xl block mb-0.5">{me.avatar}</span>
                      <span className="text-xs font-bold block truncate">Soy Yo ({me.name})</span>
                      <span className="text-[10px] text-rose-300 font-semibold block">Persona 1</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        updateSettings({ deviceRole: 'partner' });
                        if (activeRole !== 'partner') toggleRole();
                      }}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        activeRole === 'partner'
                          ? 'bg-emerald-500/30 border-emerald-400 text-white font-bold ring-2 ring-emerald-400/50 shadow-md'
                          : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-xl block mb-0.5">{partner.avatar}</span>
                      <span className="text-xs font-bold block truncate">Soy Mi Pareja ({partner.name})</span>
                      <span className="text-[10px] text-emerald-300 font-semibold block">Persona 2</span>
                    </button>
                  </div>
                </div>

                {/* Estado de Cuenta de Google */}
                <div className="pt-2 border-t border-white/10">
                  {firebaseUser ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-black/40 border border-white/10">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <p className="text-xs font-bold text-white">{firebaseUser.displayName || 'Cuenta Google Conectada'}</p>
                        </div>
                        <p className="text-[10px] text-white/50">{firebaseUser.email}</p>
                        <p className="text-[10px] text-emerald-300 font-medium mt-0.5">
                          Tus estados, notas y diarios se comparten automáticamente con tu pareja.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-bold flex items-center gap-1 cursor-pointer self-start sm:self-center"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Desconectar</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={handleGoogleLogin}
                        className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 transition-all"
                      >
                        <Shield className="w-4 h-4 text-emerald-200" />
                        <span>Conectar Cuenta de Google para Vincular con Pareja</span>
                      </button>
                      <p className="text-[10px] text-center text-white/50">
                        Inicia sesión con tu cuenta de Google en ambos teléfonos para enlazar la app automáticamente sin errores.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Código de Pareja Duo (Sincronización en Tiempo Real entre App 1 y App 2) */}
              <div className="p-4 rounded-3xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span>🔗</span>
                    <span>Código de Pareja Duo (App 1 ↔ App 2)</span>
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    Enlace Activo ✨
                  </span>
                </div>
                <p className="text-[10px] text-white/60">
                  Usa este mismo código en ambos teléfonos para vincular el chat, estados, batería del celular y ubicación en tiempo real:
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={settings.duoPairCode || 'DUO-AMOR'}
                    onChange={(e) => updateSettings({ duoPairCode: e.target.value.toUpperCase().trim() })}
                    placeholder="DUO-AMOR"
                    className="flex-1 px-3 py-2 rounded-xl bg-black/60 border border-white/20 font-mono text-xs font-black text-rose-200 tracking-wider focus:outline-none focus:border-rose-400"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newCode = prompt('Ingresa tu nuevo Código de Pareja (ej. AMOR-2026):', settings.duoPairCode || 'DUO-AMOR');
                      if (newCode && newCode.trim()) {
                        updateSettings({ duoPairCode: newCode.trim().toUpperCase() });
                      }
                    }}
                    className="px-3 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold cursor-pointer transition-colors shadow-sm"
                  >
                    Guardar Código
                  </button>
                </div>
              </div>

              {/* Botón Salir de la App desde Ajustes */}
              <div className="p-4 rounded-3xl bg-red-950/30 border border-red-500/30 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-red-200">Salir de la App</h4>
                  <p className="text-[10px] text-white/60">
                    Cierra la sesión con un consejo amoroso final.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenExit) onOpenExit();
                  }}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Salir</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ModalPortal>
  );
};
