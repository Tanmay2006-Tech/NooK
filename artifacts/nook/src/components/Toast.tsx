import { useToastStore } from '../hooks/useToast';
import { motion, AnimatePresence } from 'framer-motion';

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const toasts = useToastStore();

  return (
    <>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ y: -16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -8, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="bg-[var(--ink)] text-[var(--paper)] border-2 border-[var(--ink)] rounded-none px-4 py-3 shadow-none pointer-events-auto"
              style={{ fontFamily: 'var(--font-sans)', fontSize: '12px' }}
            >
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
