import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl shadow-slate-900/20 overflow-hidden border border-slate-200 flex flex-col"
          >
            <div className="px-8 pt-8 pb-4 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">{title}</h2>
              <button 
                onClick={onClose} 
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-all active:scale-90"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="px-8 pb-6 overflow-y-auto flex-1 no-scrollbar max-h-[70vh]">
              {children}
            </div>

            {footer && (
              <div className="px-8 py-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
