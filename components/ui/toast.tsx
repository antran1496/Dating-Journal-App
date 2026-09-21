'use client';
import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const icons = {
  success: <CheckCircle2 className="text-[var(--color-success)]" size={20} />,
  error: <XCircle className="text-[var(--color-error)]" size={20} />,
  info: <Info className="text-blue-500" size={20} />,
  warning: <AlertTriangle className="text-yellow-500" size={20} />,
};

function Toast({ id, type, title, message, duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);
    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  return (
    <div className="pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface p-4 shadow-lg transition-all animate-in slide-in-from-bottom-full sm:slide-in-from-right-full fade-in duration-300">
      <div className="flex flex-1 items-start gap-3">
        {icons[type]}
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-text">{title}</p>
          {message && <p className="text-sm text-text-muted">{message}</p>}
        </div>
      </div>
      <button
        onClick={() => onClose(id)}
        className="rounded-[var(--radius-full)] p-1 text-text-muted hover:bg-surface-hover hover:text-text transition-colors"
      >
        <X size={16} />
      </button>
      <div className="absolute bottom-0 left-0 h-1 w-full bg-surface-hover">
        <div 
          className="h-full bg-primary animate-[shrink_linear_forwards]"
          style={{ animationDuration: `${duration}ms` }}
        />
      </div>
      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}

interface ToastContextType {
  toast: (options: Omit<ToastProps, 'id' | 'onClose'>) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((options: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...options, id, onClose: removeToast }]);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px] gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
