import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useGetDeskById, useCheckinDesk } from '@workspace/api-client-react';
import { motion } from 'framer-motion';
import { Check, ArrowLeft } from 'lucide-react';
import QRCode from 'react-qr-code';

const MY_DESK_KEY = 'nook_my_desk_id';

export default function CheckinPage() {
  const params = useParams<{ deskId: string }>();
  const deskId = params.deskId ?? '';
  const [, setLocation] = useLocation();
  const [studentName, setStudentName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { data: desk, isLoading } = useGetDeskById(deskId);
  const checkinMutation = useCheckinDesk();

  const checkinUrl = `${window.location.origin}/checkin/${deskId}`;

  const handleCheckin = async () => {
    const name = studentName.trim();
    if (!name) { setError('Please enter your name.'); return; }
    setError('');
    try {
      await checkinMutation.mutateAsync({ deskId, data: { studentName: name } });
      localStorage.setItem(MY_DESK_KEY, deskId);
      setSuccess(true);
      setTimeout(() => setLocation('/map'), 1800);
    } catch (e: unknown) {
      const msg = (e as { data?: { error?: string } })?.data?.error ?? 'Desk is no longer available.';
      setError(msg);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--paper)] flex items-center justify-center">
        <div className="font-['Syne_Mono'] text-[12px] text-[var(--rule)] uppercase tracking-[0.18em]">Loading...</div>
      </div>
    );
  }

  if (!desk) {
    return (
      <div className="min-h-screen bg-[var(--paper)] flex flex-col items-center justify-center gap-4">
        <div className="font-['Syne'] font-bold text-[20px] text-[var(--ink)]">Desk not found</div>
        <button onClick={() => setLocation('/map')} className="border-2 border-[var(--ink)] px-6 py-2 font-['Syne'] font-bold text-[11px] uppercase tracking-[0.14em]">
          Back to map
        </button>
      </div>
    );
  }

  const isOccupied = desk.status !== 'free';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[var(--paper)] flex flex-col"
      style={{ borderTop: '4px solid var(--ink)' }}
    >
      {/* Header */}
      <div className="border-b-2 border-[var(--ink)] h-[52px] flex items-center px-6 gap-4 shrink-0">
        <button
          onClick={() => setLocation('/map')}
          className="flex items-center gap-2 font-['Syne'] font-bold text-[11px] uppercase tracking-[0.14em] text-[var(--ink)] hover:text-[var(--accent)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="h-4 w-px bg-[var(--rule)]" />
        <div className="font-['Syne'] font-extrabold text-[20px] tracking-[-1px] text-[var(--ink)]">nook</div>
      </div>

      {/* Body — two-column on desktop */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left — QR code panel */}
        <div className="md:w-[320px] border-r-2 border-[var(--ink)] flex flex-col items-center justify-center p-10 gap-6 bg-[var(--paper2)] shrink-0">
          <div className="font-['Syne'] font-bold text-[8px] tracking-[0.22em] uppercase text-[var(--rule)]">
            Scan to check in
          </div>
          <div className="bg-white p-4 border-2 border-[var(--ink)]">
            <QRCode
              value={checkinUrl}
              size={160}
              bgColor="#ffffff"
              fgColor="#1a1a18"
              level="M"
            />
          </div>
          <div className="text-center">
            <div className="font-['Syne'] font-extrabold text-[52px] tracking-[-3px] leading-none text-[var(--ink)]">
              {desk.id}
            </div>
            <div className="font-['Syne'] text-[11px] text-[var(--rule)] uppercase tracking-[0.1em] mt-1">
              {desk.zoneName}
            </div>
          </div>
          <div className="flex flex-wrap gap-1 justify-center">
            {desk.amenities.map((a) => (
              <div key={a} className="border-2 border-[var(--ink)] px-2 py-0.5 font-['Syne'] font-bold text-[9px] uppercase">
                {a}
              </div>
            ))}
          </div>
        </div>

        {/* Right — form */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm">
            {success ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="w-16 h-16 bg-[var(--accent2)] flex items-center justify-center">
                  <Check className="w-8 h-8 text-white" />
                </div>
                <div className="font-['Syne'] font-bold text-[18px] text-[var(--ink)] uppercase tracking-[0.06em]">
                  Checked in!
                </div>
                <div className="font-['Syne'] text-[12px] text-[var(--rule)] text-center">
                  Session started · 2 hours<br />
                  Redirecting to map…
                </div>
              </motion.div>
            ) : isOccupied ? (
              <div className="border-2 border-[var(--ink)] p-8 text-center bg-[var(--paper2)]">
                <div className="font-['Syne'] font-bold text-[9px] tracking-[0.18em] uppercase text-[var(--rule)] mb-2">
                  Desk status
                </div>
                <div className="font-['Syne'] font-extrabold text-[28px] text-[var(--ink)] uppercase tracking-[-1px] mb-2">
                  {desk.status}
                </div>
                <div className="font-['Syne'] text-[12px] text-[var(--rule)] mb-6">
                  This desk is not available. Try scanning another QR code.
                </div>
                <button
                  onClick={() => setLocation('/map')}
                  className="w-full h-11 bg-[var(--ink)] text-[var(--paper)] font-['Syne'] font-bold text-[11px] uppercase tracking-[0.14em]"
                >
                  Find a free seat →
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                <div>
                  <div className="font-['Syne'] font-bold text-[9px] text-[var(--rule)] uppercase tracking-[0.18em] mb-3">
                    Your name
                  </div>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => { setStudentName(e.target.value); setError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleCheckin()}
                    placeholder="e.g. Arjun Sharma"
                    autoFocus
                    className="w-full h-12 px-4 border-2 border-[var(--ink)] bg-[var(--paper)] font-['Syne'] text-[14px] text-[var(--ink)] placeholder:text-[var(--rule)] outline-none focus:border-[var(--accent)]"
                    data-testid="input-student-name"
                  />
                  {error && (
                    <div className="mt-2 font-['Syne'] text-[11px] text-[var(--accent)]">{error}</div>
                  )}
                </div>

                {/* How it works */}
                <div className="border border-[var(--rule)] bg-[var(--paper2)] p-4 flex flex-col gap-2.5">
                  <div className="font-['Syne'] font-bold text-[8px] tracking-[0.2em] uppercase text-[var(--rule)]">How it works</div>
                  {[
                    ['2-hour session', 'Your desk is reserved for up to 2 hours.'],
                    ['Away button', 'Leaving briefly? Tap Away — 20-min grace period.'],
                    ['Still here?', 'Respond to keep your desk. No response = freed automatically.'],
                  ].map(([title, desc]) => (
                    <div key={title} className="flex gap-2.5">
                      <span className="font-['Syne_Mono'] text-[9px] text-[var(--accent)] mt-[2px] shrink-0">→</span>
                      <span className="font-['Syne'] text-[11px] text-[var(--rule)] leading-snug">
                        <strong className="text-[var(--ink)]">{title}</strong> — {desc}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleCheckin}
                  disabled={checkinMutation.isPending}
                  data-testid="button-checkin"
                  className="w-full h-12 bg-[var(--accent)] text-[var(--paper)] font-['Syne'] font-bold text-[12px] uppercase tracking-[0.14em] disabled:opacity-60"
                >
                  {checkinMutation.isPending ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-[var(--paper)] border-t-transparent animate-spin" />
                      Checking in...
                    </div>
                  ) : (
                    'Check In →'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
