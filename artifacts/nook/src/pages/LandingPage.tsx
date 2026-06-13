import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useListDesks, useSeedDemo, getListDesksQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { FloorMap } from "../components/FloorMap";
import type { Desk } from "../data/mockDesks";
import type { DeskInfo } from "@workspace/api-client-react";

function deskInfoToDesk(info: DeskInfo): Desk {
  return {
    id: info.id,
    floor: info.floor,
    zone: info.zone as Desk["zone"],
    zoneName: info.zoneName,
    amenities: info.amenities,
    status: info.status as Desk["status"],
    occupant: info.session?.studentName,
  };
}

const STUDENT_STEPS = [
  { n: "01", title: "Browse the live map", body: "Open Nook on any device. See all 90 seats across 3 floors updated in real time — green means free, orange means taken." },
  { n: "02", title: "Reserve in one tap", body: "Click any free seat, enter your name. A 2-hour session starts immediately. No account needed — works on any browser." },
  { n: "03", title: "Mark Away for breaks", body: "Stepping out? Hit Away. Your seat is held for 20 minutes so no one takes it while you get coffee." },
  { n: "04", title: "Confirm or lose the seat", body: "If you don't respond to a 'Still here?' prompt within 10 minutes, the sweep job automatically frees your seat for someone else." },
];

const LIBRARIAN_STEPS = [
  { n: "01", title: "Sign in to the dashboard", body: "PIN-protected access. Librarians see every desk, every student name, and every session timer across all floors live." },
  { n: "02", title: "Monitor all 90 seats", body: "Three-floor map updates every 4 seconds. Colour coding shows active, away, and abandoned desks at a glance." },
  { n: "03", title: "Alert or override any desk", body: "Send a 'Still here?' alert to any student in one click. Or force-release a desk instantly — no confrontation needed." },
  { n: "04", title: "Background sweep does the rest", body: "A server-side job runs every 60 seconds. Abandoned desks are freed automatically — zero manual work for library staff." },
];

const FEATURES = [
  { label: "Real-time seat map", sub: "3-second live refresh" },
  { label: "QR check-in", sub: "Scan & reserve instantly" },
  { label: "Server-side timers", sub: "No client cheating" },
  { label: "Away grace period", sub: "20-min seat hold" },
  { label: "Auto-sweep job", sub: "Runs every 60 s" },
  { label: "Librarian dashboard", sub: "PIN-protected override" },
  { label: "Analytics", sub: "Per-floor occupancy" },
  { label: "3 floors · 90 desks", sub: "Scales to any layout" },
];

export default function LandingPage() {
  const queryClient = useQueryClient();
  const [demoState, setDemoState] = useState<"idle" | "loading" | "done">("idle");

  const { data: rawDesks } = useListDesks(undefined, {
    query: { queryKey: getListDesksQueryKey(), refetchInterval: 5000 },
  });
  const { mutateAsync: seedDemo } = useSeedDemo();

  const desks: Desk[] = (rawDesks ?? []).map(deskInfoToDesk);
  const free = desks.filter((d) => d.status === "free").length;
  const occ = desks.filter((d) => d.status === "occupied").length;
  const away = desks.filter((d) => d.status === "away").length;
  const hasData = desks.length > 0;

  const byFloor = [1, 2, 3].map((f) => {
    const fd = desks.filter((d) => d.floor === f);
    return { floor: f, total: fd.length, free: fd.filter((d) => d.status === "free").length };
  });

  const handleLoadDemo = async () => {
    setDemoState("loading");
    try {
      await seedDemo();
      await queryClient.invalidateQueries();
      setDemoState("done");
      setTimeout(() => setDemoState("idle"), 4000);
    } catch {
      setDemoState("idle");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.22 }}
      className="min-h-[100dvh] bg-[var(--paper)] flex flex-col"
      style={{ borderTop: "4px solid var(--ink)" }}
    >
      {/* ── LIVE STATS TAPE ── */}
      <div className="border-b border-[var(--rule)] h-[34px] flex items-center px-8 gap-6 shrink-0 overflow-hidden">
        <div className="flex items-center gap-2">
          <motion.div animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.6, repeat: Infinity }} className="w-[6px] h-[6px] bg-[var(--accent2)]" />
          <span className="font-['Syne'] font-bold text-[9px] tracking-[0.2em] uppercase text-[var(--accent2)]">Live</span>
        </div>
        {hasData ? (
          <div className="font-['Syne_Mono'] text-[10px] text-[var(--rule)] tracking-[0.08em]">
            {free} FREE &nbsp;·&nbsp; {occ} OCCUPIED &nbsp;·&nbsp; {away} AWAY
          </div>
        ) : (
          <div className="font-['Syne_Mono'] text-[10px] text-[var(--rule)] animate-pulse">Loading…</div>
        )}
        {hasData && (
          <div className="hidden md:flex items-center gap-4 ml-2">
            {byFloor.map(({ floor, total, free: f }) => (
              <div key={floor} className="flex items-center gap-1.5">
                <span className="font-['Syne'] font-bold text-[9px] text-[var(--rule)] uppercase tracking-[0.12em]">FL.{floor}</span>
                <div className="w-[36px] h-[4px] bg-[var(--rule)] opacity-30">
                  <div className="h-full bg-[var(--accent2)]" style={{ width: `${(f / total) * 100}%` }} />
                </div>
                <span className="font-['Syne_Mono'] text-[9px] text-[var(--rule)]">{f}/{total}</span>
              </div>
            ))}
          </div>
        )}
        <div className="ml-auto font-['Syne_Mono'] text-[9px] text-[var(--rule)] tracking-[0.06em]">SEMESTER 01 · AUTUMN 2026</div>
      </div>

      {/* ── HERO ── */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0" style={{ minHeight: 480 }}>
        {/* LEFT */}
        <div className="md:w-[420px] lg:w-[480px] flex flex-col justify-between border-r-2 border-[var(--ink)] shrink-0 px-10 py-12">
          <div>
            <div className="font-['Syne'] font-extrabold text-[96px] tracking-[-6px] text-[var(--ink)] leading-none mb-1">nook</div>
            <p className="font-['Syne'] font-normal text-[16px] text-[var(--rule)] leading-snug mt-3 max-w-[300px]">
              Smart library seat booking — reserve, step away, and come back without losing your spot.
            </p>
          </div>

          <div className="my-8">
            <div className="font-['Syne'] font-extrabold leading-none tracking-[-6px] text-[var(--paper2)]"
              style={{ fontSize: "clamp(80px,14vw,160px)", WebkitTextStroke: "2px var(--rule)" }}>
              {hasData ? free : "—"}
            </div>
            <div className="font-['Syne'] font-bold text-[10px] tracking-[0.22em] uppercase text-[var(--rule)] mt-2">
              Seats available right now
            </div>
            {hasData && (
              <div className="mt-5 flex flex-col gap-2">
                {byFloor.map(({ floor, total, free: f }) => {
                  const pct = Math.round((f / total) * 100);
                  return (
                    <div key={floor} className="flex items-center gap-3">
                      <span className="font-['Syne'] font-bold text-[9px] tracking-[0.12em] uppercase text-[var(--rule)] w-[30px]">Fl.{floor}</span>
                      <div className="flex-1 h-[3px] bg-[var(--rule)] opacity-20">
                        <div className="h-full bg-[var(--ink)]" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="font-['Syne_Mono'] text-[9px] text-[var(--rule)] w-[52px] text-right">{f}/{total} free</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 w-full max-w-[280px]">
            <Link href="/map"
              className="flex items-center justify-between w-full h-[52px] bg-[var(--accent)] text-[var(--paper)] px-5 font-['Syne'] font-bold text-[12px] tracking-[0.14em] uppercase">
              <span>Find a Seat</span>
              <span className="text-[18px] leading-none">→</span>
            </Link>
            <Link href="/librarian"
              className="flex items-center justify-between w-full h-[52px] bg-transparent border-2 border-[var(--ink)] text-[var(--ink)] px-5 font-['Syne'] font-bold text-[12px] tracking-[0.14em] uppercase">
              <span>Librarian View</span>
              <span className="text-[14px] leading-none font-normal">↗</span>
            </Link>
            <button onClick={handleLoadDemo} disabled={demoState === "loading"}
              className="flex items-center justify-center gap-2 w-full h-[36px] bg-transparent border border-[var(--rule)] text-[var(--rule)] font-['Syne'] font-bold text-[9px] tracking-[0.14em] uppercase hover:border-[var(--ink)] hover:text-[var(--ink)] transition-colors disabled:opacity-40">
              <AnimatePresence mode="wait">
                {demoState === "loading" ? (
                  <motion.span key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="font-['Syne_Mono'] text-[9px]">Seeding…</motion.span>
                ) : demoState === "done" ? (
                  <motion.span key="d" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[var(--accent2)]">✓ Demo loaded — 24 sessions active</motion.span>
                ) : (
                  <motion.span key="i" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>▶ Load demo data</motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>

        {/* RIGHT — live map preview */}
        <div className="flex-1 relative overflow-hidden bg-[var(--paper2)] pointer-events-none flex items-center justify-center min-h-[420px]">
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: "linear-gradient(var(--ink) 1px, transparent 1px), linear-gradient(90deg, var(--ink) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
          <div className="absolute top-4 left-5 font-['Syne'] font-bold text-[9px] tracking-[0.18em] uppercase text-[var(--rule)] z-10">Floor 1 / Live</div>
          <div className="scale-95 origin-center"><FloorMap desks={desks} /></div>
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "linear-gradient(to right, var(--paper2) 0%, transparent 12%, transparent 88%, var(--paper2) 100%)" }} />
        </div>
      </div>

      {/* ── PROBLEM STRIP ── */}
      <div className="border-t-2 border-[var(--ink)] border-b-2 bg-[var(--ink)] text-[var(--paper)]">
        <div className="grid grid-cols-1 md:grid-cols-3">
          {[
            { n: "15–20 min", body: "wasted every day by students hunting for a free desk in a crowded library." },
            { n: "Hours", body: "that bags and jackets 'reserve' seats while students are away — no enforcement exists." },
            { n: "Zero", body: "visibility for library staff — no way to know how full each floor is at any moment." },
          ].map(({ n, body }, i) => (
            <div key={n} className={`px-10 py-8 ${i < 2 ? "border-b-2 md:border-b-0 md:border-r-2 border-[#333]" : ""}`}>
              <div className="font-['Syne'] font-extrabold text-[40px] tracking-[-2px] leading-none text-[var(--accent)] mb-3">{n}</div>
              <div className="font-['Syne'] text-[13px] text-[#999] leading-snug">{body}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div className="border-b-2 border-[var(--ink)]">
        {/* Section header */}
        <div className="border-b-2 border-[var(--ink)] px-10 py-6 flex items-baseline gap-6">
          <div className="font-['Syne'] font-bold text-[9px] tracking-[0.24em] uppercase text-[var(--rule)]">03 / How it works</div>
          <div className="font-['Syne'] font-extrabold text-[28px] tracking-[-1.5px] text-[var(--ink)]">Two roles. One system.</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Student flow */}
          <div className="border-b-2 lg:border-b-0 lg:border-r-2 border-[var(--ink)] px-10 py-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-[32px] h-[32px] border-2 border-[var(--ink)] flex items-center justify-center">
                <span className="font-['Syne_Mono'] text-[11px]">S</span>
              </div>
              <div>
                <div className="font-['Syne'] font-extrabold text-[18px] tracking-[-0.5px]">Student</div>
                <div className="font-['Syne'] text-[10px] text-[var(--rule)] tracking-[0.08em]">Finds and holds a seat</div>
              </div>
            </div>
            <div className="flex flex-col gap-6">
              {STUDENT_STEPS.map((step, i) => (
                <div key={step.n} className="flex gap-5">
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-[28px] h-[28px] border-2 border-[var(--ink)] flex items-center justify-center shrink-0">
                      <span className="font-['Syne_Mono'] text-[9px]">{step.n}</span>
                    </div>
                    {i < STUDENT_STEPS.length - 1 && <div className="w-px flex-1 bg-[var(--rule)] opacity-30 mt-1" style={{ minHeight: 24 }} />}
                  </div>
                  <div className="pb-2">
                    <div className="font-['Syne'] font-bold text-[14px] tracking-[-0.3px] mb-1">{step.title}</div>
                    <div className="font-['Syne'] text-[12px] text-[var(--rule)] leading-snug">{step.body}</div>
                  </div>
                </div>
              ))}
            </div>

            <Link href="/map"
              className="mt-8 inline-flex items-center gap-2 h-[38px] px-5 bg-[var(--accent)] text-[var(--paper)] font-['Syne'] font-bold text-[10px] tracking-[0.12em] uppercase">
              Try student flow →
            </Link>
          </div>

          {/* Librarian flow */}
          <div className="px-10 py-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-[32px] h-[32px] border-2 border-[var(--ink)] bg-[var(--ink)] flex items-center justify-center">
                <span className="font-['Syne_Mono'] text-[11px] text-[var(--paper)]">L</span>
              </div>
              <div>
                <div className="font-['Syne'] font-extrabold text-[18px] tracking-[-0.5px]">Librarian</div>
                <div className="font-['Syne'] text-[10px] text-[var(--rule)] tracking-[0.08em]">Monitors &amp; enforces</div>
              </div>
            </div>
            <div className="flex flex-col gap-6">
              {LIBRARIAN_STEPS.map((step, i) => (
                <div key={step.n} className="flex gap-5">
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-[28px] h-[28px] border-2 border-[var(--ink)] bg-[var(--ink)] flex items-center justify-center shrink-0">
                      <span className="font-['Syne_Mono'] text-[9px] text-[var(--paper)]">{step.n}</span>
                    </div>
                    {i < LIBRARIAN_STEPS.length - 1 && <div className="w-px flex-1 bg-[var(--rule)] opacity-30 mt-1" style={{ minHeight: 24 }} />}
                  </div>
                  <div className="pb-2">
                    <div className="font-['Syne'] font-bold text-[14px] tracking-[-0.3px] mb-1">{step.title}</div>
                    <div className="font-['Syne'] text-[12px] text-[var(--rule)] leading-snug">{step.body}</div>
                  </div>
                </div>
              ))}
            </div>

            <Link href="/librarian"
              className="mt-8 inline-flex items-center gap-2 h-[38px] px-5 border-2 border-[var(--ink)] text-[var(--ink)] font-['Syne'] font-bold text-[10px] tracking-[0.12em] uppercase">
              Try librarian view ↗
            </Link>
          </div>
        </div>
      </div>

      {/* ── FEATURE STRIP ── */}
      <div className="border-b-2 border-[var(--ink)] overflow-x-auto">
        <div className="flex min-w-max">
          {FEATURES.map((f, i) => (
            <div key={f.label}
              className={`px-7 py-5 shrink-0 ${i < FEATURES.length - 1 ? "border-r border-[var(--rule)]" : ""}`}>
              <div className="font-['Syne'] font-bold text-[12px] tracking-[-0.2px] text-[var(--ink)] mb-0.5">{f.label}</div>
              <div className="font-['Syne_Mono'] text-[9px] text-[var(--rule)] tracking-[0.08em]">{f.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── IMPACT NUMBERS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 border-b-2 border-[var(--ink)]">
        {/* Before */}
        <div className="p-10 md:p-14 border-b-2 md:border-b-0 md:border-r-2 border-[var(--ink)]">
          <div className="font-['Syne'] font-bold text-[9px] tracking-[0.22em] uppercase text-[var(--rule)] mb-3">04 / Before Nook</div>
          <h3 className="font-['Syne'] font-extrabold text-[38px] tracking-[-2px] text-[var(--ink)] leading-tight mb-6">The problem<br />is fairness.</h3>
          <ul className="space-y-3">
            {[
              "Students lose 15–20 min searching for a free desk.",
              "Bags block seats for hours with no recourse.",
              "No visibility. No fairness. No enforcement.",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3">
                <span className="font-['Syne_Mono'] text-[10px] text-[var(--rule)] mt-[3px] shrink-0">—</span>
                <span className="font-['Syne'] text-[13px] text-[var(--rule)] leading-snug">{t}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* After */}
        <div className="p-10 md:p-14">
          <div className="font-['Syne'] font-bold text-[9px] tracking-[0.22em] uppercase text-[var(--rule)] mb-3">05 / After Nook</div>
          <h3 className="font-['Syne'] font-extrabold text-[38px] tracking-[-2px] text-[var(--accent)] leading-tight mb-8">The solution<br />is Nook.</h3>
          <div className="grid grid-cols-3 gap-0 border-t border-[var(--rule)]">
            {[
              { n: "3×", label: "seat utilisation" },
              { n: "0", label: "confrontations" },
              { n: "47h", label: "recovered / week" },
            ].map(({ n, label }, i) => (
              <div key={n} className={`pt-5 pr-4 ${i < 2 ? "border-r border-[var(--rule)]" : ""}`} style={{ paddingLeft: i > 0 ? "1rem" : 0 }}>
                <div className="font-['Syne'] font-extrabold text-[44px] tracking-[-2px] leading-none text-[var(--ink)] mb-1">{n}</div>
                <div className="font-['Syne'] text-[11px] text-[var(--rule)] leading-tight">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div className="flex items-center justify-between px-10 py-5 shrink-0">
        <div className="font-['Syne'] font-extrabold text-[16px] tracking-[-0.5px]">nook</div>
        <div className="font-['Syne'] text-[10px] text-[var(--rule)] tracking-[0.08em]">
          Smart library seat booking · Prototype Round 1
        </div>
        <div className="flex items-center gap-5">
          <Link href="/map" className="font-['Syne'] text-[10px] text-[var(--rule)] hover:text-[var(--ink)] tracking-[0.08em] uppercase">Map</Link>
          <Link href="/analytics" className="font-['Syne'] text-[10px] text-[var(--rule)] hover:text-[var(--ink)] tracking-[0.08em] uppercase">Analytics</Link>
          <Link href="/librarian" className="font-['Syne'] text-[10px] text-[var(--rule)] hover:text-[var(--ink)] tracking-[0.08em] uppercase">Librarian</Link>
        </div>
      </div>
    </motion.div>
  );
}
