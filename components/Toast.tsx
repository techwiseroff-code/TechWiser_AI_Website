'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export const ToastContainer: React.FC<{ toasts: Toast[]; onRemove: (id: string) => void }> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed bottom-24 md:top-24 right-4 md:right-6 z-[100] flex flex-col gap-3 pointer-events-none w-[calc(100%-2rem)] md:w-auto">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, x: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="pointer-events-auto"
          >
            <div className={`glass-panel px-4 py-3 rounded-2xl border flex items-center gap-3 shadow-2xl backdrop-blur-xl ${
              toast.type === 'success' ? 'border-emerald-500/30 bg-emerald-500/5' : 
              toast.type === 'error' ? 'border-red-500/30 bg-red-500/5' :
              'border-blue-500/30 bg-blue-500/5'
            }`}>
              <div className={
                toast.type === 'success' ? 'text-emerald-500' : 
                toast.type === 'error' ? 'text-red-500' :
                'text-blue-500'
              }>
                {toast.type === 'success' ? <CheckCircle size={18} /> : 
                 toast.type === 'error' ? <AlertCircle size={18} /> :
                 <Info size={18} />}
              </div>
              <p className="text-xs md:text-sm font-bold tracking-tight flex-1">{toast.message}</p>
              <button 
                onClick={() => onRemove(toast.id)}
                className="p-1 hover:bg-white/5 rounded-lg text-white/20 hover:text-white transition-all"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
