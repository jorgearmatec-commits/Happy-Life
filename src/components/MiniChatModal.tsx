import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send,
  Mic,
  Camera,
  Image as ImageIcon,
  Smile,
  Download,
  Share2,
  Minimize2,
  Maximize2,
  X,
  Heart,
  Clock
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ModalPortal } from './ModalPortal';
import { CameraCaptureModal } from './CameraCaptureModal';

// Rich WhatsApp emoji categories
const WHATSAPP_EMOJIS = [
  '❤️', '💖', '💘', '💕', '🥰', '😘', '😍', '🥺', '🫂', '🔥', '✨', '🌹',
  '☕', '🥑', '🍓', '🍰', '🍫', '🍷', '🍕', '🎉', '🌟', '💤', '🛌', '🐾',
  '🐶', '🐱', '🐼', '🦊', '🌸', '🌻', '🌈', '☀️', '🌙', '⚡', '🧠', '🎧',
  '💬', '😊', '😌', '🥱', '🤯', '😡', '😢', '😰', '🔋', '🛑', '💀', '🏃‍♀️'
];

export interface MiniChatModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  hideFloatingButton?: boolean;
}

export const MiniChatModal: React.FC<MiniChatModalProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
  hideFloatingButton = false,
}) => {
  const {
    messages,
    sendMessage,
    exportChatBackup,
    activeRole,
    me,
    partner,
    settings,
    addRecentEmoji,
  } = useApp();

  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = propIsOpen !== undefined ? propIsOpen : internalIsOpen;
  const setIsOpen = (val: boolean) => {
    setInternalIsOpen(val);
    if (!val && propOnClose) propOnClose();
  };

  const [isMinimized, setIsMinimized] = useState(false);
  const [draftText, setDraftText] = useState('');
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Audio voice note inside chat
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDraftText(e.target.value);
    if (!isPartnerTyping && Math.random() > 0.7) {
      setIsPartnerTyping(true);
      setTimeout(() => setIsPartnerTyping(false), 3000);
    }
  };

  const handleSend = () => {
    if (!draftText.trim()) return;
    sendMessage(draftText.trim());
    setDraftText('');
  };

  const handleSelectEmoji = (emoji: string) => {
    setDraftText((prev) => prev + emoji);
    addRecentEmoji(emoji);
  };

  const handleWebShare = async () => {
    if (navigator.share) {
      try {
        const lastMsg = messages[messages.length - 1];
        await navigator.share({
          title: 'Happy Life Duo - Chat Seguro',
          text: lastMsg ? `Mensaje de amor: "${lastMsg.text || 'Nota de voz/Foto'}"` : 'Nuestro chat en Happy Life Duo',
        });
      } catch {
        // cancelled
      }
    } else {
      exportChatBackup();
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          sendMessage(undefined, event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      rec.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            sendMessage(undefined, undefined, reader.result as string);
          }
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach((t) => t.stop());
      };

      rec.start();
      setMediaRecorder(rec);
      setAudioChunks(chunks);
      setIsRecordingAudio(true);
    } catch {
      alert('Por favor autoriza el micrófono para notas de voz.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecordingAudio) {
      mediaRecorder.stop();
      setIsRecordingAudio(false);
    }
  };

  return (
    <>
      {/* Botón Flotante 💘 Verde Oliva (solo si no se oculta para el dock central) */}
      {!hideFloatingButton && !isOpen && !isMinimized && (
        <motion.button
          type="button"
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-5 z-40 px-4 py-3 rounded-full bg-[#556b2f] hover:bg-[#485c26] text-white font-black text-sm flex items-center gap-2.5 shadow-[0_10px_25px_rgba(85,107,47,0.6)] border border-white/30 cursor-pointer select-none"
          title="Abrir Mini Chat Seguro"
        >
          <span className="text-2xl filter drop-shadow">💘</span>
          <span className="font-heading tracking-wide">Mini Chat</span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
        </motion.button>
      )}

      {/* Minimized Floating Bar */}
      {isMinimized && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 p-2.5 rounded-full bg-[#1e293b]/95 border border-white/20 backdrop-blur-xl shadow-2xl flex items-center gap-3 select-none"
        >
          <div className="flex items-center gap-2 pl-2">
            <span className="text-xl">💘</span>
            <span className="text-xs font-bold text-white">
              Mini Chat {draftText ? `(Borrador: "${draftText.slice(0, 10)}...")` : ''}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsMinimized(false);
              setIsOpen(true);
            }}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
            title="Restaurar chat"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setIsMinimized(false);
              setIsOpen(false);
            }}
            className="p-2 rounded-full bg-white/10 hover:bg-red-500 text-white cursor-pointer"
            title="Cerrar chat"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* Modal Chat Centrado Adaptado a Pantalla Completa Móvil */}
      <ModalPortal
        isOpen={isOpen && !isMinimized}
        onClose={() => setIsOpen(false)}
        maxWidth="max-w-md"
        hideHeader
        noPadding
      >
        <div className="flex flex-col h-[85vh] sm:h-[80vh] max-h-[90dvh] w-full overflow-hidden">
          {/* Header tipo WhatsApp */}
          <div className="p-4 bg-[#1e293b] border-b border-white/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-[#556b2f] flex items-center justify-center text-xl shadow-inner border border-white/20">
                💘
              </div>
              <div>
                <h3 className="text-sm font-black text-white font-heading leading-tight">
                  {activeRole === 'me' ? partner.name : me.name}
                </h3>
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  En línea en Nuestro Lugar Seguro
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleWebShare}
                className="p-2 rounded-full hover:bg-white/10 text-white/80 cursor-pointer"
                title="Compartir"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={exportChatBackup}
                className="p-2 rounded-full hover:bg-white/10 text-white/80 cursor-pointer"
                title="Descargar respaldo .txt"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsMinimized(true);
                }}
                className="p-2 rounded-full hover:bg-white/10 text-white/80 cursor-pointer"
                title="Minimizar a barra"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full hover:bg-white/10 text-white/80 cursor-pointer"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0f172a]/60 backdrop-blur-md min-h-0">
            {messages.map((msg) => {
              const isMine = msg.sender === activeRole;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed shadow-md select-text ${
                      isMine
                        ? 'bg-[#005c4b] text-white rounded-br-xs'
                        : 'bg-[#202c33] text-white rounded-bl-xs'
                    }`}
                  >
                    {msg.imageUrl && (
                      <img
                        src={msg.imageUrl}
                        alt="Foto compartida"
                        onClick={() => setZoomImage(msg.imageUrl || null)}
                        className="rounded-xl mb-1 max-h-48 w-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      />
                    )}

                    {msg.audioUrl && (
                      <div className="flex items-center gap-2 py-1">
                        <audio src={msg.audioUrl} controls className="h-8 max-w-[200px]" />
                      </div>
                    )}

                    {msg.text && <p>{msg.text}</p>}

                    <div className="flex items-center justify-end gap-1 text-[9px] text-white/50 mt-1">
                      <span>{msg.timestamp}</span>
                      {isMine && <span className="text-cyan-400">✓✓</span>}
                    </div>
                  </div>
                </div>
              );
            })}

            {isPartnerTyping && (
              <div className="flex items-center gap-2 p-2 rounded-2xl bg-[#202c33] text-xs text-rose-300 w-fit">
                <Heart className="w-4 h-4 text-rose-400 animate-ping fill-rose-500" />
                <span className="font-semibold">Tu pareja está escribiendo con amor... 💖</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Full Emoji Picker Drawer (Incluye Recientes adentro para no robar espacio en pantalla) */}
          {showEmojiPicker && (
            <div className="p-3 bg-[#1e293b] border-t border-white/10 max-h-48 overflow-y-auto space-y-2 shrink-0">
              {settings.recentEmojis.length > 0 && (
                <div className="pb-2 border-b border-white/10">
                  <span className="text-[10px] text-white/50 uppercase font-black tracking-wider block mb-1">
                    Últimos usados:
                  </span>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {settings.recentEmojis.map((em) => (
                      <button
                        key={`rec-${em}`}
                        type="button"
                        onClick={() => handleSelectEmoji(em)}
                        className="text-2xl hover:scale-125 transition-transform cursor-pointer p-1 shrink-0"
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <span className="text-[10px] text-white/50 uppercase font-black tracking-wider block mb-1">
                  Todos los emojis:
                </span>
                <div className="grid grid-cols-8 gap-2">
                  {WHATSAPP_EMOJIS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => handleSelectEmoji(em)}
                      className="text-xl hover:scale-125 transition-transform cursor-pointer p-1"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Input Bar con Botón Enviar de Corazón Rosado Oscuro Tipo Cupido 💘 */}
          <div className="p-2.5 sm:p-3 bg-[#1e293b] border-t border-white/10 flex items-center gap-1.5 shrink-0 select-none">
            {/* Emoji Picker toggle button */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1.5 sm:p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white cursor-pointer shrink-0"
              title="Emojis estilo WhatsApp"
            >
              <Smile className="w-5 h-5 text-amber-300" />
            </button>

            {/* Tomar foto rápida con la cámara */}
            <button
              type="button"
              onClick={() => setIsCameraOpen(true)}
              className="p-1.5 sm:p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white cursor-pointer shrink-0"
              title="Tomar foto con cámara"
            >
              <Camera className="w-5 h-5 text-rose-400" />
            </button>

            {/* Subir foto de galería */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 sm:p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white cursor-pointer shrink-0"
              title="Adjuntar imagen de la galería"
            >
              <ImageIcon className="w-5 h-5 text-cyan-400" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />

            <input
              type="text"
              value={draftText}
              onChange={handleTextChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              placeholder="Escribe un mensaje de amor..."
              className="min-w-0 flex-1 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-white/10 border border-white/15 text-white placeholder-white/40 text-xs focus:outline-none focus:border-rose-400"
            />

            <button
              type="button"
              onClick={isRecordingAudio ? stopRecording : startRecording}
              className={`p-2 rounded-full text-white cursor-pointer transition-all shrink-0 ${
                isRecordingAudio ? 'bg-red-600 animate-pulse' : 'hover:bg-white/10 text-white/70'
              }`}
              title={isRecordingAudio ? 'Detener nota' : 'Grabar nota'}
            >
              <Mic className="w-5 h-5" />
            </button>

            {/* Botón de Enviar en forma de Corazón Rosado Oscuro Tipo Cupido 💘 */}
            <button
              type="button"
              onClick={handleSend}
              disabled={!draftText.trim()}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-700 via-rose-800 to-rose-950 hover:from-rose-600 hover:to-rose-800 text-white disabled:opacity-40 cursor-pointer shadow-lg shadow-rose-950/60 flex items-center justify-center shrink-0 border-2 border-rose-400/50 active:scale-95 transition-all group"
              title="Enviar con Amor Cupido 💘"
            >
              <span className="text-xl group-hover:scale-115 transition-transform filter drop-shadow">
                💘
              </span>
            </button>
          </div>
        </div>
      </ModalPortal>

      {/* Cámara Rápida para el Mini Chat */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onPhotoCaptured={(photoUrl) => {
          sendMessage(undefined, photoUrl);
        }}
      />

      {/* Image Zoom Modal */}
      {zoomImage && (
        <ModalPortal isOpen={!!zoomImage} onClose={() => setZoomImage(null)}>
          <div className="text-center">
            <img src={zoomImage} alt="Zoom" className="max-h-[70vh] rounded-2xl mx-auto shadow-2xl" />
            <button
              type="button"
              onClick={() => setZoomImage(null)}
              className="mt-3 px-6 py-2 rounded-full bg-white/20 text-white font-bold text-xs cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </ModalPortal>
      )}
    </>
  );
};
