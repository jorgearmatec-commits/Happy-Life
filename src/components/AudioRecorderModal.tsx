import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Play,
  Pause,
  Download,
  Share2,
  Radio,
  Trash2,
  Mail,
  Send,
  MessageCircle,
  FileAudio
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ModalPortal } from './ModalPortal';

export const AudioRecorderModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { recordings, addRecording, deleteRecording, sendMessage, activeRole } = useApp();

  const [activeRecordingMode, setActiveRecordingMode] = useState<'normal' | 'live_shared'>('normal');
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [wakeLockActive, setWakeLockActive] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const wakeLockRef = useRef<unknown>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRecording) {
      setRecordDuration(0);
      timerRef.current = window.setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await (navigator as unknown as { wakeLock: { request: (type: string) => Promise<unknown> } }).wakeLock.request('screen');
        setWakeLockActive(true);
      }
    } catch {
      console.warn('WakeLock unavailable');
    }
  };

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      try {
        (wakeLockRef.current as { release: () => Promise<void> }).release();
      } catch {
        // ignore
      }
      wakeLockRef.current = null;
      setWakeLockActive(false);
    }
  };

  const handleStartRecording = async (mode: 'normal' | 'live_shared') => {
    try {
      setActiveRecordingMode(mode);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
      audioContextRef.current = ctx;
      analyserRef.current = analyser;

      drawVisualizer();

      const rec = new MediaRecorder(stream);
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      rec.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        // Nombre alfanumérico según fecha y hora exacta
        const now = new Date();
        const ymd = now.toISOString().slice(0, 10).replace(/-/g, '');
        const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
        const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
        const prefix = mode === 'live_shared' ? 'AUDIO-COMPARTIDO' : 'AUDIO-NORMAL';
        const fileName = `${prefix}-${ymd}-${timeStr}-${randomCode}.webm`;

        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            const dataUrl = reader.result as string;
            addRecording({
              fileName,
              duration: recordDuration,
              dataUrl,
              isShared: mode === 'live_shared',
              category: mode,
            });

            // Si es audio compartido, guardarlo también en el Mini Chat
            if (mode === 'live_shared') {
              sendMessage(undefined, undefined, dataUrl);
            }
          }
        };
        reader.readAsDataURL(blob);

        stream.getTracks().forEach((t) => t.stop());
        releaseWakeLock();
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      };

      rec.start();
      mediaRecorderRef.current = rec;
      setIsRecording(true);
      await requestWakeLock();
    } catch {
      alert('Por favor autoriza el micrófono para grabar audio.');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const drawVisualizer = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animFrameRef.current = requestAnimationFrame(render);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / bufferLength) * 1.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.9;
        ctx.fillStyle = activeRecordingMode === 'live_shared' ? '#f43f5e' : '#84cc16';
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
        x += barWidth;
      }
    };
    render();
  };

  const downloadFile = (dataUrl: string, fileName: string) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = fileName;
    a.click();
  };

  const handleShareRecording = async (rec: { fileName: string; dataUrl: string }) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Grabación de Voz Happy Life Duo',
          text: `Escucha esta grabación de voz: ${rec.fileName}`,
        });
      } catch {
        // cancelled
      }
    } else {
      downloadFile(rec.dataUrl, rec.fileName);
    }
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const normalRecordings = recordings.filter((r) => !r.isShared);
  const sharedRecordings = recordings.filter((r) => r.isShared);

  return (
    <ModalPortal
      isOpen={isOpen}
      onClose={() => {
        if (isRecording) handleStopRecording();
        onClose();
      }}
      title="Grabadora de Voz & Audio Compartido"
      icon={<Mic className="w-6 h-6 text-lime-400" />}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6 text-white">
        {/* Canvas de Visualización común cuando graba */}
        {isRecording && (
          <div className="p-5 rounded-3xl bg-black/60 border border-white/20 flex flex-col items-center justify-center space-y-3">
            <span
              className={`text-xs uppercase font-black px-3 py-1 rounded-full animate-pulse ${
                activeRecordingMode === 'live_shared'
                  ? 'bg-rose-500 text-white'
                  : 'bg-lime-500 text-slate-950'
              }`}
            >
              {activeRecordingMode === 'live_shared'
                ? '📡 Transmitiendo Audio Compartido en Vivo a Pareja'
                : '🎙️ Grabando Audio Normal'}
            </span>

            <canvas ref={canvasRef} width={280} height={60} className="w-full max-w-xs h-14 rounded-xl" />

            <div className="text-3xl font-black font-heading tracking-widest text-white">
              {formatDuration(recordDuration)}
            </div>

            <button
              type="button"
              onClick={handleStopRecording}
              className="px-8 py-3.5 rounded-full btn-3d-rose text-white font-black text-sm flex items-center gap-2 cursor-pointer shadow-xl animate-pulse"
            >
              <Square className="w-5 h-5 fill-current" />
              <span>Finalizar Grabación</span>
            </button>
          </div>
        )}

        {/* 1. SECCIÓN: GRABACIÓN NORMAL */}
        <div className="p-5 rounded-3xl bg-white/5 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-lime-500/20 text-lime-300 flex items-center justify-center border border-lime-400/30">
                <FileAudio className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Grabación de Audio Normal</h4>
                <p className="text-xs text-white/50">
                  Alta calidad con nombre alfanumérico según fecha y hora.
                </p>
              </div>
            </div>

            {!isRecording && (
              <button
                type="button"
                onClick={() => handleStartRecording('normal')}
                className="px-5 py-2.5 rounded-2xl btn-3d-olive text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
              >
                <Mic className="w-4 h-4" />
                <span>Grabar Normal</span>
              </button>
            )}
          </div>

          {/* Mini lista de grabaciones normales en orden */}
          <div className="space-y-2 pt-2">
            <span className="text-[11px] font-bold text-white/60 uppercase">
              Últimas grabaciones normales ({normalRecordings.length}):
            </span>
            {normalRecordings.length === 0 ? (
              <p className="text-xs text-white/40 italic">No hay grabaciones normales.</p>
            ) : (
              normalRecordings.slice(0, 4).map((rec) => (
                <div
                  key={rec.id}
                  className="p-3 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between text-xs gap-2"
                >
                  <div className="overflow-hidden">
                    <p className="font-bold text-white truncate">{rec.fileName}</p>
                    <p className="text-[10px] text-white/50">{formatDuration(rec.duration)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <audio src={rec.dataUrl} controls className="h-7 max-w-[120px]" />
                    <button
                      type="button"
                      onClick={() => handleShareRecording(rec)}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                      title="Compartir por correo o redes"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadFile(rec.dataUrl, rec.fileName)}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                      title="Descargar"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteRecording(rec.id)}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-red-500 text-white cursor-pointer"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 2. SECCIÓN: AUDIO COMPARTIDO EN VIVO (OPCIÓN APARTE MÁS ABAJO) */}
        <div className="p-5 rounded-3xl bg-rose-950/30 border border-rose-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-300 flex items-center justify-center border border-rose-500/40">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-rose-200">Audio Compartido 📡❤</h4>
                <p className="text-xs text-rose-100/60">
                  Transmite en vivo a tu pareja (pantalla encendida o apagada) y se guarda en el Mini Chat.
                </p>
              </div>
            </div>

            {!isRecording && (
              <button
                type="button"
                onClick={() => handleStartRecording('live_shared')}
                className="px-5 py-2.5 rounded-2xl btn-3d-rose text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
              >
                <Radio className="w-4 h-4" />
                <span>Transmitir en Vivo</span>
              </button>
            )}
          </div>

          {/* Sección aparte llamada Audio Compartido */}
          <div className="space-y-2 pt-2">
            <span className="text-[11px] font-bold text-rose-300 uppercase">
              Audios Compartidos con tu Pareja ({sharedRecordings.length}):
            </span>
            {sharedRecordings.length === 0 ? (
              <p className="text-xs text-white/40 italic">Aún no hay audios compartidos transmitidos.</p>
            ) : (
              sharedRecordings.slice(0, 4).map((rec) => (
                <div
                  key={rec.id}
                  className="p-3 rounded-2xl bg-black/40 border border-rose-500/20 flex items-center justify-between text-xs gap-2"
                >
                  <div className="overflow-hidden">
                    <p className="font-bold text-rose-100 truncate">{rec.fileName}</p>
                    <p className="text-[10px] text-white/50">{formatDuration(rec.duration)} • Sincronizado en Mini Chat 💬</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <audio src={rec.dataUrl} controls className="h-7 max-w-[120px]" />
                    <button
                      type="button"
                      onClick={() => handleShareRecording(rec)}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                      title="Compartir en redes"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadFile(rec.dataUrl, rec.fileName)}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                      title="Descargar"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteRecording(rec.id)}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-red-500 text-white cursor-pointer"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
