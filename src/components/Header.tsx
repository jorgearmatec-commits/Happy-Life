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
    <header className="w-full bg-black/40 backdrop-blur-md border-b border-white/10 px-3 sm:px-4 py-2.5 sm:py-3 select-none transition-all">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
        {/* Left: Logo Happy Life Duo */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <img
            src="/icon.svg"
            alt="Happy Life Duo"
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl shadow-lg shrink-0 object-cover border border-white/20"
          />

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-2xl font-black tracking-tight text-white font-heading drop-shadow-sm truncate">
                Happy Life Duo
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Oficial
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-white/60">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="truncate">
                {firebaseUser ? `Conectado: ${firebaseUser.displayName || firebaseUser.email}` : 'Modo Privado'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Actions: Pregúntale a Gemini, Sincronización Google, Ajustes, Salir */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* BOTÓN RESTAURADO ORIGINAL: «Pregúntale a Gemini» */}
          {onOpenGemini && (
            <button
              type="button"
              onClick={onOpenGemini}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-2xl text-xs font-black cursor-pointer shadow-md active:scale-95 transition-all border bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-sky-500/20 hover:from-purple-500/30 hover:via-indigo-500/30 hover:to-sky-500/30 text-purple-200 border-purple-400/40"
              title="Pregúntale a Gemini"
              aria-label="Pregúntale a Gemini"
            >
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-300 animate-pulse shrink-0" />
              <span className="hidden xs:inline sm:inline whitespace-nowrap">
                Pregúntale a Gemini
              </span>
            </button>
          )}

          {/* BOTÓN VISIBLE DE SINCRONIZACIÓN CON GOOGLE (Móvil y Escritorio) */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-2xl text-xs font-black cursor-pointer shadow-md active:scale-95 transition-all border ${
              firebaseUser
                ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
                : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
            }`}
            title="Sincronizar con tu Cuenta de Google"
          >
            {/* Google G Icon */}
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" viewBox="0 0 24 24">
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
            <span className="hidden xs:inline sm:inline">
              {firebaseUser ? 'Google OK' : 'Sincronizar'}
            </span>
          </button>

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
