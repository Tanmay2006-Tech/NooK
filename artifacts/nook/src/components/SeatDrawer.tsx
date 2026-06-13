import { motion, AnimatePresence } from 'framer-motion';
import { Desk } from '../data/mockDesks';
import { useState } from 'react';
import { Check } from 'lucide-react';

interface SeatDrawerProps {
  seat: Desk | null;
  onClose: () => void;
  onBook: (id: string, studentName: string) => Promise<void>;
}

export function SeatDrawer({ seat, onClose, onBook }: SeatDrawerProps) {
  const [studentName, setStudentName] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleBook = async () => {
    if (!seat) return;
    const name = studentName.trim();
    if (!name) {
      setError('Enter your name to reserve.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await onBook(seat.id, name);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setStudentName('');
        onClose();
      }, 800);
    } catch {
      setError('Desk no longer available.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {seat && (
        <motion.div
          initial={{ x: 260 }}
          animate={{ x: 0 }}
          exit={{ x: 260 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="w-[260px] bg-[var(--paper)] border-l-2 border-[var(--ink)] flex flex-col shrink-0 h-full absolute right-0 top-0 bottom-0 z-40"
        >
          <div className="border-b-2 border-[var(--ink)] p-4 relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-6 h-6 flex items-center justify-center border border-transparent hover:border-[var(--ink)] transition-colors text-[var(--ink)]"
            >
              ×
            </button>
            <div className="font-['Syne'] font-bold text-[9px] text-[var(--rule)] uppercase tracking-[0.18em] mb-1">
              Selected Seat
            </div>
            <div className="font-['Syne'] font-extrabold text-[52px] text-[var(--ink)] tracking-[-3px] leading-none mb-1">
              {seat.id}
            </div>
            <div className="font-['Syne'] text-[10px] text-[var(--rule)] uppercase mb-4">
              {seat.zoneName}
            </div>
            <div className="flex flex-wrap gap-1">
              {seat.amenities.map((amenity) => (
                <div
                  key={amenity}
                  className="border-2 border-[var(--ink)] px-2 py-0.5 font-['Syne'] font-bold text-[9px] uppercase"
                >
                  {amenity}
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 flex flex-col gap-4 flex-1">
            {seat.status === 'free' ? (
              <>
                <div className="flex flex-col gap-2">
                  <div className="font-['Syne'] font-bold text-[9px] text-[var(--rule)] uppercase tracking-[0.18em]">
                    Your Name
                  </div>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => { setStudentName(e.target.value); setError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleBook()}
                    placeholder="e.g. Arjun Sharma"
                    className="w-full h-10 px-3 border-2 border-[var(--ink)] bg-[var(--paper)] font-['Syne'] text-[12px] text-[var(--ink)] placeholder:text-[var(--rule)] outline-none focus:border-[var(--accent)]"
                    data-testid="input-student-name"
                  />
                  {error && (
                    <div className="font-['Syne'] text-[10px] text-[var(--accent)] tracking-[0.06em]">
                      {error}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <div className="font-['Syne'] font-bold text-[9px] text-[var(--rule)] uppercase tracking-[0.18em]">
                    Session — 2 Hours
                  </div>
                  <div className="font-['Syne'] text-[10px] text-[var(--rule)]">
                    Respond to "Still here?" prompts to keep your desk.
                  </div>
                </div>

                <button
                  onClick={handleBook}
                  disabled={loading || success}
                  data-testid="button-reserve-seat"
                  className="w-full h-12 bg-[var(--accent)] text-[var(--paper)] font-['Syne'] font-bold text-[11px] tracking-[0.14em] uppercase mt-auto relative overflow-hidden disabled:opacity-60"
                >
                  {success ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: [1.1, 1] }}
                      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                      className="absolute inset-0 flex items-center justify-center bg-[var(--accent2)]"
                    >
                      <Check className="w-5 h-5" />
                    </motion.div>
                  ) : loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-3 h-3 border-2 border-[var(--paper)] border-t-transparent animate-spin"></div>
                      RESERVING...
                    </div>
                  ) : (
                    'RESERVE THIS SEAT'
                  )}
                </button>
              </>
            ) : (
              <div className="mt-auto p-4 border border-[var(--rule)] bg-[var(--paper2)] text-center">
                <div className="font-['Syne'] font-bold text-[9px] uppercase tracking-[0.1em] text-[var(--rule)] mb-2">
                  Status
                </div>
                <div className="font-['Syne'] font-bold text-[14px] text-[var(--ink)] uppercase">
                  {seat.status === 'occupied' ? 'Occupied' : seat.status === 'away' ? 'Away' : seat.status}
                </div>
                {seat.occupant && (
                  <div className="font-['Syne'] text-[11px] text-[var(--rule)] mt-1">{seat.occupant}</div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
