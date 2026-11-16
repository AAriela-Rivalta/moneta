import { createContext } from 'react';

export type ToastTone = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
  title: string;
  description?: string;
  tone?: ToastTone;
  /** Duración en milisegundos antes de cerrarse sola. */
  duration?: number;
  action?: { label: string; onClick: () => void };
}

export interface ToastContextValue {
  notify: (options: ToastOptions) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);
