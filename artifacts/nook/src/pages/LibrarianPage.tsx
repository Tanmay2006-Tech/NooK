import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';
import { toast } from '../hooks/useToast';
import { FloorMap } from '../components/FloorMap';
import {
  useListLibrarianDesks,
  getListLibrarianDesksQueryKey,
  useResetDesk,
  useAlertDesk,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import type { Desk } from '../data/mockDesks';
import type { LibrarianDeskInfo } from '@workspace/api-client-react';

function libToDesk(d: LibrarianDeskInfo): Desk {
  return {
    id: d.id, floor: d.floor,
    zone: d.zone as Desk['zone'], zoneName: d.zoneName,
    amenities: d.amenities, status: d.status as Desk['status'],
    occupant: d.session?.studentName,
    checkinTime: d.session ? new Date(d.session.checkinAt) : undefined,
    sessionEnd: d.session ? new Date(d.session.sessionExpiresAt) : undefined,
  };
}

function ts() {
  return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function OccBar({ pct }: { pct: number }) {
  return (
    <div className="w-full h-[3px] bg-[var(--paper2)] mt-2">
      <motion.div
        className="h-full bg-[var(--accent)]"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
    </div>
  );
}

const FLOOR_NAMES: Record<number, string> = { 1: 'Ground Floor', 2: 'First Floor', 3: 'Second Floor' };
const FLOOR_ZONES: Record<number, string[]> = {
  1: ['Window Row', 'Quiet Zone', 'Study Pods', 'Collaborative'],
  2: ['Focus Booths', 'Group Study', 'Reading Nook'],
  3: ['Seminar Pods', 'Lounge Area', 'Archive Alcoves'],
};

export default function LibrarianPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [activeFloor, setActiveFloor] = useState(1);
  const [feed, setFeed] = useState<{ time: string; text: string; kind: 'info' | 'warn' | 'ok' }[]>([]);
  const feedRef = useRef<HTMLDivElement>(null);

  const qc = useQueryClient();
  const { data: rawDesks } = useListLibrarianDesks({
    query: {
      queryKey: getListLibrarianDesksQueryKey(),
      refetchInterval: 4000,
      enabled: isAuthenticated,
    },
  });
  const resetMut = useResetDesk();
  const alertMut = useAlertDesk();

  const invalidate = () => qc.invalidateQueries({ queryKey: getListLibrarianDesksQueryKey() });
  const addFeed = (text: string, kind: 'info' | 'warn' | 'ok' = 'info') =>
    setFeed((p) => [{ time: ts(), text, kind }, ...p].slice(0, 60));

  const allDesks: Desk[] = (rawDesks ?? []).map(libToDesk);
  const floorDesks = allDesks.filter((d) => d.floor === activeFloor);
  const occupied = (f: Desk[]) => f.filter((d) => d.status === 'occupied' || d.status === 'mine' || d.status === 'away').length;
  const pct = (f: Desk[]) => f.length ? Math.round((occupied(f) / f.length) * 100) : 0;

  const activeSessions = allDesks.filter((d) => d.occupant);

  useEffect(() => {
    if (!isAuthenticated) return;
    addFeed(`Dashboard loaded — ${allDesks.length} desks across 3 floors`, 'ok');
    addFeed('Sweep job active — checking every 60s', 'info');
  }, [isAuthenticated]);

  // PIN handling
  useEffect(() => {
    if (pin.length < 4) return;
    if (pin === '1234') {
      setTimeout(() => setIsAuthenticated(true), 200);
    } else {
      setPinError(true);
      setTimeout(() => { setPin(''); setPinError(false); }, 600);
    }
  }, [pin]);

  if (!isAuthenticated) {
    return (
      <div
        className="min-h-screen bg-[var(--paper)] flex flex-col items-center justify-center"
        style={{ borderTop: '4px solid var(--ink)' }}
      >
        <div className="font-['Syne'] font-bold text-[9px] tracking-[0.24em] uppercase text-[var(--rule)] mb-6">
          Librarian Access
        </div>
        <div className="font-['Syne'] font-extrabold text-[48px] tracking-[-2px] text-[var(--ink)] mb-10">nook</div>

        <motion.div
          animate={pinError ? { x: [-10, 10, -8, 8, 0] } : {}}
          transition={{ duration: 0.35 }}
          className="flex gap-3 mb-4"
        >
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="w-[32px] h-[32px] border-2 border-[var(--ink)] flex items-center justify-center">
              {pin[i] && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}>
                  <span className="font-['Syne_Mono'] text-[16px] leading-none">●</span>
                </motion.div>
              )}
            </div>
          ))}
        </motion.div>

        <div className={`font-['Syne'] text-[10px] tracking-[0.14em] uppercase mb-8 h-4 ${pinError ? 'text-[var(--accent)]' : 'text-[var(--rule)]'}`}>
          {pinError ? 'Incorrect PIN' : 'Demo PIN: 1234'}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '←'].map((key, i) => (
            <button
              key={i}
              onClick={() => {
                if (key === '←') setPin((p) => p.slice(0, -1));
                else if (key !== '' && pin.length < 4) setPin((p) => p + key);
              }}
              disabled={key === ''}
              className={`w-[64px] h-[64px] font-['Syne'] font-bold text-[20px] transition-none
                ${key !== '' ? 'hover:bg-[var(--paper2)] active:scale-95' : 'opacity-0 pointer-events-none'}`}
            >
              {key}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[100dvh] bg-[var(--paper)] flex flex-col overflow-hidden">

      {/* ── TOP BAR ── */}
      <div className="h-[48px] border-b-2 border-[var(--ink)] flex items-center px-6 shrink-0 gap-6">
        <div className="font-['Syne'] font-extrabold text-[18px] tracking-[-0.5px]">nook</div>
        <div className="font-['Syne'] font-bold text-[9px] tracking-[0.22em] uppercase text-[var(--rule)]">Librarian Dashboard</div>
        <div className="ml-auto flex items-center gap-4">
          <Link
            href="/qrcodes"
            className="flex items-center gap-2 h-[28px] px-3 border border-[var(--rule)] font-['Syne'] font-bold text-[9px] tracking-[0.12em] uppercase text-[var(--rule)] hover:border-[var(--ink)] hover:text-[var(--ink)] transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            Print QR Codes
          </Link>
          <div className="flex items-center gap-2">
            <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.6, repeat: Infinity }} className="w-[6px] h-[6px] bg-[var(--accent2)]" />
            <span className="font-['Syne_Mono'] text-[10px] text-[var(--rule)] tracking-[0.06em]">LIVE</span>
          </div>
        </div>
      </div>

      {/* ── FLOOR OVERVIEW STRIP ── */}
      <div className="border-b-2 border-[var(--ink)] grid grid-cols-3 shrink-0">
        {[1, 2, 3].map((f) => {
          const fd = allDesks.filter((d) => d.floor === f);
          const occ = occupied(fd);
          const free = fd.length - occ;
          const p = pct(fd);
          const isActive = activeFloor === f;
          return (
            <button
              key={f}
              onClick={() => setActiveFloor(f)}
              className={`px-6 py-4 text-left border-r border-[var(--rule)] last:border-r-0 transition-none relative
                ${isActive ? 'bg-[var(--ink)] text-[var(--paper)]' : 'bg-[var(--paper)] text-[var(--ink)] hover:bg-[var(--paper2)]'}`}
            >
              <div className={`font-['Syne'] font-bold text-[8px] tracking-[0.22em] uppercase mb-1 ${isActive ? 'text-[#666]' : 'text-[var(--rule)]'}`}>
                Floor {f} · {FLOOR_NAMES[f]}
              </div>
              <div className="flex items-baseline gap-3">
                <div className={`font-['Syne'] font-extrabold text-[36px] tracking-[-2px] leading-none ${isActive ? 'text-[var(--paper)]' : 'text-[var(--ink)]'}`}>
                  {occ}
                </div>
                <div className={`font-['Syne'] text-[10px] ${isActive ? 'text-[#888]' : 'text-[var(--rule)]'}`}>
                  occupied · {free} free
                </div>
              </div>
              <OccBar pct={p} />
              <div className={`font-['Syne_Mono'] text-[9px] mt-1 ${isActive ? 'text-[#666]' : 'text-[var(--rule)]'}`}>
                {p}% utilised
              </div>
              {isActive && (
                <motion.div layoutId="floor-active-bar" className="absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--accent)]" />
              )}
            </button>
          );
        })}
      </div>

      {/* ── MAIN AREA ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Floor Map */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeFloor}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16 }}
              className="flex-1 flex"
            >
              <FloorMap
                desks={allDesks}
                activeFloor={activeFloor}
                isLibrarianMode
                onSeatClick={async (d) => {
                  if (!['occupied', 'mine', 'away'].includes(d.status)) return;
                  if (!window.confirm(`Force-release seat ${d.id}?`)) return;
                  await resetMut.mutateAsync({ deskId: d.id });
                  addFeed(`${d.id} → force-released by librarian`, 'warn');
                  invalidate();
                  toast(`Released ${d.id}`);
                }}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Activity Feed */}
        <div className="w-[240px] border-l-2 border-[var(--ink)] flex flex-col shrink-0 bg-[var(--paper)]">
          <div className="px-4 py-3 border-b border-[var(--rule)] font-['Syne'] font-bold text-[8px] tracking-[0.22em] uppercase text-[var(--rule)]">
            Activity Feed
          </div>
          <div ref={feedRef} className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2.5">
            <AnimatePresence initial={false}>
              {feed.map((e, i) => (
                <motion.div
                  key={e.time + i}
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-0.5 border-b border-[var(--rule)] pb-2.5 last:border-0"
                >
                  <span className={`font-['Syne_Mono'] text-[9px] ${e.kind === 'warn' ? 'text-[var(--accent)]' : e.kind === 'ok' ? 'text-[var(--accent2)]' : 'text-[var(--ink)]'}`}>
                    {e.text}
                  </span>
                  <span className="font-['Syne_Mono'] text-[8px] text-[var(--rule)]">{e.time}</span>
                </motion.div>
              ))}
            </AnimatePresence>
            {feed.length === 0 && (
              <div className="font-['Syne'] text-[10px] text-[var(--rule)] italic">No events yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* ── STUDENT TABLE ── */}
      <div className="h-[220px] border-t-2 border-[var(--ink)] flex flex-col shrink-0">
        {/* Table header with floor tab label */}
        <div className="flex items-center gap-0 border-b border-[var(--ink)] shrink-0 bg-[var(--paper2)]">
          <div className="px-4 py-2 font-['Syne'] font-bold text-[8px] tracking-[0.22em] uppercase text-[var(--rule)]">
            Active Sessions — Floor {activeFloor}
          </div>
          <div className="ml-auto px-4 font-['Syne_Mono'] text-[9px] text-[var(--rule)]">
            {floorDesks.filter((d) => d.occupant).length} students
          </div>
        </div>
        {/* Column headers */}
        <div className="grid px-4 py-2 bg-[var(--paper2)] border-b border-[var(--rule)] font-['Syne'] font-bold text-[8px] uppercase tracking-[0.12em] text-[var(--ink)]"
          style={{ gridTemplateColumns: '1fr 60px 120px 70px 60px 110px' }}>
          <span>Student</span><span>Seat</span><span>Zone</span><span>Check-in</span><span>Status</span><span>Actions</span>
        </div>
        {/* Rows */}
        <div className="overflow-y-auto flex-1">
          {floorDesks.filter((d) => d.occupant).length === 0 ? (
            <div className="flex items-center justify-center h-full font-['Syne'] text-[11px] text-[var(--rule)]">
              No active sessions on Floor {activeFloor}.
            </div>
          ) : (
            floorDesks.filter((d) => d.occupant).map((d, i) => (
              <div
                key={d.id}
                className={`grid px-4 py-2.5 items-center font-['Syne'] text-[11px] border-b border-[var(--rule)] last:border-0 ${i % 2 === 0 ? 'bg-[var(--paper)]' : 'bg-[var(--paper2)]'}`}
                style={{ gridTemplateColumns: '1fr 60px 120px 70px 60px 110px' }}
              >
                <span className="truncate">{d.occupant}</span>
                <span className="font-['Syne_Mono'] text-[10px]">{d.id}</span>
                <span className="text-[10px] text-[var(--rule)] truncate">{d.zoneName}</span>
                <span className="font-['Syne_Mono'] text-[10px] text-[var(--rule)]">
                  {d.checkinTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className={`font-bold text-[9px] tracking-[0.1em] uppercase ${d.status === 'away' ? 'text-[var(--seat-away-border)]' : 'text-[var(--ink)]'}`}>
                  {d.status}
                </span>
                <div className="flex gap-3">
                  <button
                    onClick={async () => {
                      await alertMut.mutateAsync({ deskId: d.id });
                      addFeed(`Alert → ${d.id} (${d.occupant})`, 'info');
                      invalidate();
                      toast(`Alert sent to ${d.occupant}`);
                    }}
                    className="font-['Syne'] font-bold text-[9px] uppercase tracking-[0.1em] text-[var(--accent)] hover:underline"
                  >
                    Alert
                  </button>
                  <button
                    onClick={async () => {
                      await resetMut.mutateAsync({ deskId: d.id });
                      addFeed(`${d.id} released by librarian`, 'warn');
                      invalidate();
                      toast(`Released ${d.id}`);
                    }}
                    className="font-['Syne'] font-bold text-[9px] uppercase tracking-[0.1em] text-[var(--ink)] hover:underline"
                  >
                    Release
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}
