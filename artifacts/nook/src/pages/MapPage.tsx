import { useEffect, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { FloorMap } from '../components/FloorMap';
import { SeatDrawer } from '../components/SeatDrawer';
import { AlertBanner } from '../components/AlertBanner';
import { CommandPalette } from '../components/CommandPalette';
import { useNookApi } from '../hooks/useNookApi';
import { Desk } from '../data/mockDesks';
import { toast } from '../hooks/useToast';
import { motion, AnimatePresence } from 'framer-motion';
import { formatHHMMSS } from '../utils/formatTime';
import { useLocation } from 'wouter';

const ZONES_BY_FLOOR: Record<number, { key: string; label: string }[]> = {
  1: [
    { key: 'Window Row', label: 'Window' },
    { key: 'Quiet Zone', label: 'Quiet' },
    { key: 'Study Pods', label: 'Pods' },
    { key: 'Collaborative', label: 'Collab' },
  ],
  2: [
    { key: 'Focus Booths', label: 'Focus' },
    { key: 'Group Study', label: 'Group' },
    { key: 'Reading Nook', label: 'Reading' },
  ],
  3: [
    { key: 'Seminar Pods', label: 'Seminar' },
    { key: 'Lounge Area', label: 'Lounge' },
    { key: 'Archive Alcoves', label: 'Archive' },
  ],
};

export default function MapPage() {
  const [, setLocation] = useLocation();
  const { desks, myBookedDesk, myRawDesk, bookDesk, releaseSeat, markAway, respondPrompt } = useNookApi();
  const [activeFloor, setActiveFloor] = useState(1);
  const [selectedSeat, setSelectedSeat] = useState<Desk | null>(null);
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const [isCmdOpen, setIsCmdOpen] = useState(false);
  const [timerDisplay, setTimerDisplay] = useState('2:00:00');
  const [awayDisplay, setAwayDisplay] = useState('20:00');

  // "Still here?" alert driven by server state
  useEffect(() => {
    if (!myRawDesk?.session) return;
    const { promptSentAt, promptRespondedAt } = myRawDesk.session;
    setIsAlertVisible(!!(promptSentAt && !promptRespondedAt));
  }, [myRawDesk]);

  // Session countdown timer
  useEffect(() => {
    if (!myBookedDesk?.sessionEnd) { setTimerDisplay('2:00:00'); return; }
    const update = () => {
      const diff = Math.max(0, Math.floor((myBookedDesk.sessionEnd!.getTime() - Date.now()) / 1000));
      setTimerDisplay(formatHHMMSS(diff));
    };
    const t = setInterval(update, 1000);
    update();
    return () => clearInterval(t);
  }, [myBookedDesk?.sessionEnd]);

  // Away countdown timer (when status = away)
  useEffect(() => {
    if (myBookedDesk?.status !== 'away' || !myRawDesk?.session?.awayExpiresAt) {
      setAwayDisplay('20:00');
      return;
    }
    const awayExp = new Date(myRawDesk.session.awayExpiresAt);
    const update = () => {
      const diff = Math.max(0, Math.floor((awayExp.getTime() - Date.now()) / 1000));
      const m = Math.floor(diff / 60).toString().padStart(2, '0');
      const s = (diff % 60).toString().padStart(2, '0');
      setAwayDisplay(`${m}:${s}`);
    };
    const t = setInterval(update, 1000);
    update();
    return () => clearInterval(t);
  }, [myBookedDesk?.status, myRawDesk?.session?.awayExpiresAt]);

  // ⌘K shortcut
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setIsCmdOpen(true); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const handleFloorChange = (f: number) => {
    setActiveFloor(f);
    setSelectedSeat(null);
    setActiveZone(null);
  };

  const floorDesks = desks.filter((d) => d.floor === activeFloor);
  const freeCount = floorDesks.filter((d) => d.status === 'free').length;
  const zones = ZONES_BY_FLOOR[activeFloor] ?? [];
  const isAway = myBookedDesk?.status === 'away';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18 }}
      className="h-[100dvh] flex flex-col bg-[var(--paper)] overflow-hidden"
    >
      <Navbar activeFloor={activeFloor} onFloorChange={handleFloorChange} desks={desks} />

      <div className="flex-1 flex relative overflow-hidden">
        {/* ── LEFT SIDEBAR ── */}
        <div className="w-[188px] border-r-2 border-[var(--ink)] bg-[var(--paper)] flex flex-col shrink-0">

          {/* Legend */}
          <div className="px-5 pt-5 pb-4 border-b border-[var(--rule)]">
            <div className="font-['Syne'] font-bold text-[8px] tracking-[0.22em] uppercase text-[var(--rule)] mb-3">Legend</div>
            <div className="flex flex-col gap-2">
              {[
                { label: 'Available', fill: 'var(--seat-free)', border: 'var(--seat-free-border)' },
                { label: 'Occupied', fill: 'var(--seat-occ)', border: 'var(--seat-occ-border)' },
                { label: 'Away 20 min', fill: 'var(--seat-away)', border: 'var(--seat-away-border)' },
                { label: 'Your seat', fill: 'var(--seat-mine)', border: 'var(--seat-mine-border)' },
              ].map(({ label, fill, border }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <div className="w-[13px] h-[13px] shrink-0" style={{ background: fill, border: `1.5px solid ${border}` }} />
                  <span className="font-['Syne'] text-[11px]">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Zone filter */}
          <div className="px-5 pt-4 pb-4 border-b border-[var(--rule)]">
            <div className="font-['Syne'] font-bold text-[8px] tracking-[0.22em] uppercase text-[var(--rule)] mb-3">Zones</div>
            <div className="flex flex-col gap-1.5">
              {zones.map(({ key, label }) => {
                const active = activeZone === key;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveZone(active ? null : key)}
                    className={`w-full h-[28px] px-3 text-left font-['Syne'] font-bold text-[10px] uppercase tracking-[0.1em] border transition-none
                      ${active ? 'bg-[var(--ink)] text-[var(--paper)] border-[var(--ink)]' : 'bg-transparent text-[var(--ink)] border-[var(--rule)] hover:border-[var(--ink)]'}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Floor seat count */}
          <div className="px-5 pt-4">
            <div className="font-['Syne'] font-bold text-[8px] tracking-[0.22em] uppercase text-[var(--rule)] mb-1">Floor {activeFloor}</div>
            <div className="font-['Syne'] font-extrabold text-[52px] tracking-[-3px] leading-none text-[var(--ink)]">
              {freeCount}
            </div>
            <div className="font-['Syne'] text-[9px] text-[var(--rule)] tracking-[0.08em] mt-0.5">
              of {floorDesks.length} seats free
            </div>
          </div>

          {/* My booking panel */}
          <div className="mt-auto">
            <AnimatePresence>
              {myBookedDesk && (
                <motion.div
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 40, opacity: 0 }}
                  className="bg-[var(--ink)] p-5 text-[var(--paper)]"
                >
                  {isAway ? (
                    /* ── AWAY STATE ── */
                    <>
                      <div className="flex items-center gap-2 mb-1">
                        <motion.div
                          animate={{ opacity: [1, 0.2, 1] }}
                          transition={{ duration: 1.2, repeat: Infinity }}
                          className="w-1.5 h-1.5 bg-[var(--seat-away-border)]"
                        />
                        <div className="font-['Syne'] font-bold text-[8px] tracking-[0.2em] uppercase text-[var(--seat-away-border)]">Away Mode</div>
                      </div>
                      <div className="font-['Syne'] font-extrabold text-[44px] tracking-[-3px] leading-none mb-0.5">{myBookedDesk.id}</div>
                      <div className="font-['Syne'] text-[9px] text-[#666] uppercase tracking-[0.06em] mb-4">{myBookedDesk.zoneName}</div>
                      <div className="mb-5">
                        <div className="font-['Syne_Mono'] text-[28px] text-[var(--seat-away-border)] leading-none tracking-[-1px]">{awayDisplay}</div>
                        <div className="font-['Syne'] text-[8px] tracking-[0.12em] text-[#555] uppercase mt-1">Away time left</div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={async () => {
                            await respondPrompt(myBookedDesk.id);
                            toast('Welcome back — session active');
                          }}
                          className="w-full h-8 bg-[var(--accent2)] text-[var(--paper)] font-['Syne'] font-bold text-[9px] tracking-[0.14em] uppercase"
                        >
                          I'm Back ↩
                        </button>
                        <button
                          onClick={async () => { await releaseSeat(myBookedDesk.id); toast('Seat released'); }}
                          className="w-full h-8 bg-transparent border border-[#444] text-[#999] font-['Syne'] font-bold text-[9px] tracking-[0.14em] uppercase"
                        >
                          Release
                        </button>
                      </div>
                    </>
                  ) : (
                    /* ── ACTIVE STATE ── */
                    <>
                      <div className="font-['Syne'] font-bold text-[8px] tracking-[0.2em] uppercase text-[#666] mb-1">Your Booking</div>
                      <div className="font-['Syne'] font-extrabold text-[44px] tracking-[-3px] leading-none mb-0.5">{myBookedDesk.id}</div>
                      <div className="font-['Syne'] text-[9px] text-[#666] uppercase tracking-[0.06em] mb-4">{myBookedDesk.zoneName} · Floor {myBookedDesk.floor}</div>
                      <div className="mb-5">
                        <div className="font-['Syne_Mono'] text-[22px] text-[var(--accent)] leading-none tracking-[-1px]">{timerDisplay}</div>
                        <div className="font-['Syne'] text-[8px] tracking-[0.12em] text-[#555] uppercase mt-1">Session remaining</div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={async () => { await markAway(myBookedDesk.id); toast('Away — 20-min grace period started'); }}
                          className="w-full h-8 bg-[var(--accent)] text-[var(--paper)] font-['Syne'] font-bold text-[9px] tracking-[0.14em] uppercase"
                        >
                          Away (20 min)
                        </button>
                        <button
                          onClick={async () => { await releaseSeat(myBookedDesk.id); toast('Seat released'); }}
                          className="w-full h-8 bg-transparent border border-[#444] text-[#999] font-['Syne'] font-bold text-[9px] tracking-[0.14em] uppercase"
                        >
                          Release
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── MAP AREA ── */}
        <div className="flex-1 relative overflow-hidden flex flex-col">
          <AlertBanner
            visible={isAlertVisible}
            promptSentAt={myRawDesk?.session?.promptSentAt ?? null}
            seatId={myBookedDesk?.id || ''}
            onStillHere={async () => {
              if (myBookedDesk) { await respondPrompt(myBookedDesk.id); toast('Session confirmed — clock reset'); }
              setIsAlertVisible(false);
            }}
            onRelease={async () => {
              if (myBookedDesk) { await releaseSeat(myBookedDesk.id); toast('Seat released'); }
              setIsAlertVisible(false);
            }}
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={activeFloor}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="flex-1 flex"
              style={{ marginTop: isAlertVisible ? 52 : 0, transition: 'margin-top 0.25s ease-out' }}
            >
              <FloorMap
                desks={desks}
                activeFloor={activeFloor}
                selectedSeat={selectedSeat}
                onSeatClick={(desk) => { if (desk.status === 'free') setSelectedSeat(desk); }}
                myBookedDesk={myBookedDesk}
                activeZoneFilter={activeZone || undefined}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── SEAT DRAWER ── */}
        <SeatDrawer
          seat={selectedSeat}
          onClose={() => setSelectedSeat(null)}
          onBook={async (id, studentName) => {
            await bookDesk(id, studentName);
            toast(`Seat ${id} reserved — 2-hour session`);
            setSelectedSeat(null);
          }}
        />
      </div>

      <CommandPalette
        isOpen={isCmdOpen}
        onClose={() => setIsCmdOpen(false)}
        onAction={(action) => {
          if (action === 'analytics') setLocation('/analytics');
          else if (action.startsWith('floor_')) handleFloorChange(parseInt(action.split('_')[1]!));
          else if (action === 'release_seat' && myBookedDesk) releaseSeat(myBookedDesk.id).then(() => toast('Seat released'));
        }}
      />
    </motion.div>
  );
}
