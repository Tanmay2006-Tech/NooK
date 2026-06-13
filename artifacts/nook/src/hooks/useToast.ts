import { useState, useCallback, useEffect } from 'react';

export interface ToastMessage {
  id: string;
  message: string;
}

let toastListeners: ((toasts: ToastMessage[]) => void)[] = [];
let toasts: ToastMessage[] = [];

function emitChange() {
  toastListeners.forEach(listener => listener(toasts));
}

export function toast(message: string) {
  const id = Math.random().toString(36).substring(2, 9);
  toasts = [...toasts, { id, message }].slice(-3); // max 3
  emitChange();
  
  setTimeout(() => {
    toasts = toasts.filter(t => t.id !== id);
    emitChange();
  }, 3000);
}

export function useToastStore() {
  const [state, setState] = useState<ToastMessage[]>(toasts);

  useEffect(() => {
    const listener = (newToasts: ToastMessage[]) => setState(newToasts);
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter(l => l !== listener);
    };
  }, []);

  return state;
}
