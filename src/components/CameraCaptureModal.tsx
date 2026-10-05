import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, X, Image as ImageIcon } from 'lucide-react';
import { ModalPortal } from './ModalPortal';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoCaptured: (dataUrl: string) => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onPhotoCaptured,
}) => {
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
      return;
    }

    let active = true;
    const startCamera = async () => {
      setCameraError(null);
      try {
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
          audio: false,
        });
        if (active) {
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
        }
      } catch (err: unknown) {
        console.warn('Camera stream error:', err);
        setCameraError('No se pudo acceder a la cámara. Puedes subir una foto desde tu galería.');
      }
    };

    startCamera();

    return () => {
      active = false;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, facingMode]);

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      if (facingMode === 'user') {
        // Mirror self
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      onPhotoCaptured(dataUrl);
      onClose();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onPhotoCaptured(event.target.result as string);
          onClose();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <ModalPortal
      isOpen={isOpen}
      onClose={onClose}
      title="Cámara Rápida y Galería"
      icon={<Camera className="w-6 h-6 text-rose-400" />}
    >
      <div className="space-y-4 text-center">
        {cameraError ? (
          <div className="p-6 rounded-3xl bg-red-950/40 border border-red-500/30 text-red-200 text-sm">
            <p>{cameraError}</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs inline-flex items-center gap-2 cursor-pointer"
            >
              <ImageIcon className="w-4 h-4 text-rose-300" />
              <span>Subir de la Galería</span>
            </button>
          </div>
        ) : (
          <div className="relative rounded-3xl overflow-hidden bg-black aspect-video max-h-72 border border-white/20 flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${
                facingMode === 'user' ? 'scale-x-[-1]' : ''
              }`}
            />
            {/* Overlay toggle front/back button */}
            <button
              type="button"
              onClick={toggleCameraFacing}
              className="absolute top-3 right-3 p-2.5 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              title="Cambiar frontal / trasera"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex items-center justify-center gap-4 pt-2">
          {!cameraError && (
            <button
              type="button"
              onClick={takeSnapshot}
              className="px-6 py-3.5 rounded-full btn-3d-rose text-white font-black text-sm flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <Camera className="w-5 h-5" />
              <span>Tomar Foto</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-5 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-2 border border-white/15 cursor-pointer transition-all"
          >
            <ImageIcon className="w-4 h-4 text-rose-300" />
            <span>Galería</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      </div>
    </ModalPortal>
  );
};
