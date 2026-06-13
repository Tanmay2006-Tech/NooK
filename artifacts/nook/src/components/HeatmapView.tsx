import { motion } from "framer-motion";
import { useState } from "react";
import { mockAnalytics } from "../data/mockAnalytics";

export function HeatmapView() {
  const [period, setPeriod] = useState("TODAY");

  const getColor = (score: number) => {
    if (score > 85) return '#C05828';
    if (score > 70) return '#D89040';
    if (score > 55) return '#E8D050';
    if (score > 40) return '#C8D890';
    return '#D4EDBA';
  };

  const seats = Object.entries(mockAnalytics.heatScores).map(([id, score]) => ({
    id,
    score,
    zone: id[0],
    color: getColor(score)
  }));

  const getDesksForZone = (zone: string) => seats.filter(s => s.zone === zone).sort((a,b) => a.id.localeCompare(b.id));

  const renderSeat = (seat: any, i: number) => (
    <motion.div
      key={seat.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: i * 0.03 }}
      className="relative w-[38px] h-[26px] border-[1.5px] border-[var(--ink)] flex items-center justify-center cursor-default group"
      style={{ backgroundColor: seat.color }}
    >
      <span className="font-['Syne_Mono'] text-[8px] text-[var(--ink)] z-10">{seat.id}</span>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-max bg-[var(--ink)] text-[var(--paper)] text-[10px] font-['Syne_Mono'] px-2 py-1 border border-[var(--rule)] z-50 pointer-events-none whitespace-pre">
        Zone {seat.zone} · {seat.score}% Avg
        {'\n'}Peak: 2–4 PM
      </div>
    </motion.div>
  );

  const Section = ({ title, children, className }: { title: string, children: React.ReactNode, className?: string }) => (
    <div className={className}>
      <div className="font-['Syne'] font-bold text-[9px] tracking-[0.18em] text-[var(--rule)] uppercase border-b border-[var(--rule)] pb-1 mb-2.5">
        {title}
      </div>
      {children}
    </div>
  );

  return (
    <div className="flex flex-col items-center bg-[var(--paper2)] p-8 border-2 border-[var(--ink)]">
      <div className="flex gap-2 mb-8">
        {['TODAY', 'THIS WEEK', 'LAST 30 DAYS'].map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`border-2 border-[var(--ink)] px-3 py-1.5 font-['Syne'] font-bold text-[9px] uppercase transition-colors
              ${period === p ? 'bg-[var(--ink)] text-[var(--paper)]' : 'bg-[var(--paper)] text-[var(--ink)]'}
            `}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="bg-[var(--paper)] border-2 border-[var(--ink)] p-5 relative w-max h-max">
        <div className="grid grid-cols-2 gap-12">
          
          <Section title="Collaborative" className="self-end justify-self-end">
            <div className="flex flex-col gap-1 items-end">
              <div className="flex gap-1">{getDesksForZone('C').slice(0, 5).map((s,i) => renderSeat(s, i))}</div>
              <div className="flex gap-1">{getDesksForZone('C').slice(5).map((s,i) => renderSeat(s, i+5))}</div>
            </div>
          </Section>

          <Section title="Study Pods" className="self-end justify-self-start">
            <div className="flex gap-4">
              <div className="grid grid-cols-3 gap-1">{getDesksForZone('S').slice(0, 3).map((s,i) => renderSeat(s, i))}</div>
              <div className="grid grid-cols-3 gap-1">{getDesksForZone('S').slice(3, 6).map((s,i) => renderSeat(s, i+3))}</div>
              <div className="grid grid-cols-3 gap-1">{getDesksForZone('S').slice(6, 9).map((s,i) => renderSeat(s, i+6))}</div>
            </div>
          </Section>

          <Section title="Window Row" className="self-start justify-self-end">
            <div className="flex gap-1">{getDesksForZone('W').map((s,i) => renderSeat(s, i))}</div>
          </Section>

          <Section title="Quiet Zone" className="self-start justify-self-start">
            <div className="grid grid-cols-3 gap-1">{getDesksForZone('Q').map((s,i) => renderSeat(s, i))}</div>
          </Section>
          
        </div>
      </div>
    </div>
  );
}
