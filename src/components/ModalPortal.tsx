import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface ModalPortalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string; // e.g. 'max-w-lg', 'max-w-2xl'
  hideHeader?: boolean;
  noPadding?: boolean;
}

export const ModalPortal: React.FC<ModalPortalProps> = ({
  isOpen,
  onClose,
  title,
  icon,
  children,
  maxWidth = 'max-w-xl',
  hideHeader = false,
  noPadding = false,
}) => {
  const modalContentRef = useRef<HTMLDivElement>(null);

  // Lock body scroll cleanly without erratic jitter on virtual keyboard
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-md transition-all select-none"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
        >
          <motion.div
            ref={modalContentRef}
            initial={{ opacity: 0, scale: 0.88, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            onClick={(e) => e.stopPropagation()}
            className={`w-full ${maxWidth} max-h-[92dvh] sm:max-h-[88vh] flex flex-col rounded-[2.5rem] bg-[#121826]/95 border border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.4)] backdrop-blur-2xl overflow-hidden`}
          >
            {!hideHeader && (
              <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-3">
                  {icon && (
                    <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white border border-white/15 shadow-inner">
                      {icon}
                    </div>
                  )}
                  {title && (
                    <h2 className="text-xl font-bold tracking-tight text-white font-heading">
                      {title}
                    </h2>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Cerrar modal"
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 text-white/80 hover:text-white flex items-center justify-center transition-all border border-white/10 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
            
            {noPadding ? (
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {children}
              </div>
            ) : (
              <div className="p-5 sm:p-6 overflow-y-auto overscroll-contain flex-1 min-h-0">
                {children}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
