import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface AlertBannerProps {
  visible: boolean;
  promptSentAt?: string | null;
  onStillHere: () => void;
  onRelease: () => void;
  seatId: string;
}

const PROMPT_TIMEOUT_SECONDS = 10 * 60; // 10 min matches server PROMPT_TIMEOUT_MINUTES

export function AlertBanner({ visible, promptSentAt, onStillHere, onRelease, seatId }: AlertBannerProps) {
  const [timeLeft, setTimeLeft] = useState(PROMPT_TIMEOUT_SECONDS);

  useEffect(() => {
    if (!visible) {
      setTimeLeft(PROMPT_TIMEOUT_SECONDS);
      return;
    }
    // Compute remaining time from server timestamp so it's accurate after page reload
    const getRemaining = () => {
      if (promptSentAt) {
        const elapsed = Math.floor((Date.now() - new Date(promptSentAt).getTime()) / 1000);
        return Math.max(0, PROMPT_TIMEOUT_SECONDS - elapsed);
      }
      return PROMPT_TIMEOUT_SECONDS;
    };

    setTimeLeft(getRemaining());
    const timer = setInterval(() => {
      const remaining = getRemaining();
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        onRelease();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [visible, promptSentAt, onRelease]);

  const m = Math.floor(timeLeft / 60);
  const s = (timeLeft % 60).toString().padStart(2, '0');
  const urgency = timeLeft < 120; // last 2 minutes

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -52 }}
          animate={{ y: 0 }}
          exit={{ y: -52, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="absolute top-0 left-0 right-0 z-30 border-b-2 border-[var(--ink)] flex items-center justify-between px-6 shrink-0"
          style={{
            height: 52,
            backgroundColor: urgency ? 'var(--accent)' : 'var(--ink)',
          }}
        >
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 0.9, repeat: Infinity }}
              className="w-2 h-2 bg-[var(--paper)]"
            />
            <div className="font-['Syne'] font-bold text-[11px] tracking-[0.06em] text-[var(--paper)]">
              Still at seat <span className="font-['Syne_Mono']">{seatId}</span>? Respond or your seat will be released.
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div
              className="font-['Syne_Mono'] text-[20px] leading-none tracking-[-1px]"
              style={{ color: urgency ? 'var(--paper)' : 'var(--accent)' }}
            >
              {m}:{s}
            </div>
            <div className="flex gap-2 h-[30px]">
              <button
                onClick={onStillHere}
                className="bg-[var(--paper)] text-[var(--ink)] font-['Syne'] font-bold text-[10px] tracking-[0.1em] uppercase px-4 h-full hover:bg-[var(--paper2)] transition-none"
              >
                Still Here
              </button>
              <button
                onClick={onRelease}
                className="bg-transparent border-[1.5px] border-[var(--paper)] text-[var(--paper)] font-['Syne'] font-bold text-[10px] tracking-[0.1em] uppercase px-4 h-full opacity-70 hover:opacity-100 transition-none"
              >
                Release
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
