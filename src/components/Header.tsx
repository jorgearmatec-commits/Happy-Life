import React from 'react';
import { Settings, Shield, Sparkles, LogIn, LogOut, Heart } from 'lucide-react';
import { ThreeHeart } from './ThreeHeart';
import { useApp } from '../context/AppContext';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenExit?: () => void;
  onOpenGemini?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings, onOpenExit, onOpenGemini }) => {
  const { me, partner, activeRole, firebaseUser, handleGoogleLogin, settings } = useApp();

  return (
    <header className="w-full bg-black/40 backdrop-blur-md border-b border-white/10 px-3 sm:px-4 py-3 select-none transition-all">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
        {/* Left: Corazón (3D WebGL o 2D ligero en modo ahorro de RAM) */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          {settings.lowEndDeviceMode ? (
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-600 to-pink-500 flex items-center justify-center shadow-lg shrink-0 animate-pulse">
              <Heart className="w-6 h-6 fill-white text-white drop-shadow-md" />
            </div>
          ) : (
            <ThreeHeart size={48} className="shrink-0" />
          )}

          <div className="flex flex-col min-w-0">
            <h1 className="text-lg sm:text-2xl font-black tracking-tight text-white font-heading drop-shadow-sm truncate">
              Nuestro Lugar Seguro
            </h1>
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-white/60">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="truncate">
                {firebaseUser ? 'Sincronizado con Google' : 'Espacio Seguro Privado'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Actions: Pregúntale a Gemini, Ajustes, Salir (Sin botones duplicados ni selector de rol aquí) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* BOTÓN PREGÚNTALE A GEMINI EN EL ENCABEZADO */}
          {onOpenGemini && (
            <button
              type="button"
              onClick={onOpenGemini}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-2xl bg-gradient-to-r from-amber-500/25 via-rose-500/25 to-purple-600/25 hover:from-amber-500/40 hover:to-purple-600/40 border border-amber-300/40 text-amber-200 text-[11px] sm:text-xs font-black cursor-pointer shadow-md active:scale-95 transition-all"
              title="Pregúntale a Gemini"
            >
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 animate-spin" />
              <span>Pregúntale a Gemini ✨</span>
            </button>
          )}

          {/* Google Login Badge si no está conectado */}
          {!firebaseUser ? (
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl text-xs font-semibold bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/15 transition-all cursor-pointer"
              title="Iniciar sesión con Google para sincronizar"
            >
              <LogIn className="w-3.5 h-3.5 text-amber-300" />
              <span>Google</span>
            </button>
          ) : (
            <div className="hidden lg:flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs border border-emerald-500/30">
              <Shield className="w-3 h-3" />
              <span>Conectado</span>
            </div>
          )}

          {/* Botón Ajustes */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-90 text-white flex items-center justify-center border border-white/15 transition-all cursor-pointer shadow-md"
            aria-label="Ajustes y Personalización"
            title="Ajustes"
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-white/90" />
          </button>

          {/* Único Botón Salir de la App Funcional con Mensaje Cálido */}
          {onOpenExit && (
            <button
              type="button"
              onClick={onOpenExit}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-red-500/20 hover:bg-red-500/30 active:scale-90 text-red-200 border border-red-500/30 flex items-center justify-center transition-all cursor-pointer shadow-md"
              aria-label="Salir de la App"
              title="Salir con consejo del día"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
