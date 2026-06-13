import { Navbar } from "../components/Navbar";
import { motion } from "framer-motion";
import {
  ComposedChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { useGetAnalytics, getGetAnalyticsQueryKey } from "@workspace/api-client-react";

const HOUR_LABELS: Record<number, string> = {
  7: "7am", 8: "8am", 9: "9am", 10: "10am", 11: "11am", 12: "12pm",
  13: "1pm", 14: "2pm", 15: "3pm", 16: "4pm", 17: "5pm", 18: "6pm",
  19: "7pm", 20: "8pm", 21: "9pm", 22: "10pm",
};

function StatPill({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <div className="p-6 md:p-8 border-b md:border-b-0 md:border-r border-[var(--rule)] last:border-0">
      <div className="font-['Syne'] font-bold text-[8px] tracking-[0.22em] uppercase text-[var(--rule)] mb-2">{label}</div>
      <div className={`font-['Syne'] font-extrabold text-[52px] tracking-[-3px] leading-none ${accent ? 'text-[var(--accent)]' : 'text-[var(--ink)]'}`}>
        {value}
      </div>
      {sub && <div className="font-['Syne'] text-[9px] text-[var(--rule)] mt-1 tracking-[0.06em]">{sub}</div>}
    </div>
  );
}

function OccupancyBar({ label, pct, total, occupied, away, floor }: { label: string; pct: number; total: number; occupied: number; away: number; floor: number }) {
  const awayPct = (away / total) * 100;
  const occPct = (occupied / total) * 100;
  const freePct = 100 - occPct - awayPct;
  const floorColors = ['var(--accent)', '#D89040', '#A0B860'];

  return (
    <div className="border-b border-[var(--rule)] last:border-0 py-5 px-6">
      <div className="flex items-baseline justify-between mb-3">
        <div className="font-['Syne'] font-bold text-[11px] tracking-[0.1em] uppercase">{label}</div>
        <div className="font-['Syne_Mono'] text-[11px] text-[var(--rule)]">
          {occupied + away}/{total} occupied &nbsp;·&nbsp; {Math.round(pct)}%
        </div>
      </div>
      <div className="h-[12px] flex gap-[2px] mb-2">
        {occPct > 0 && (
          <div className="h-full transition-all" style={{ width: `${occPct}%`, background: floorColors[floor - 1] }} />
        )}
        {awayPct > 0 && (
          <div className="h-full transition-all" style={{ width: `${awayPct}%`, background: '#E8D050' }} />
        )}
        {freePct > 0 && (
          <div className="h-full bg-[var(--rule)] opacity-20 transition-all" style={{ width: `${freePct}%` }} />
        )}
      </div>
      <div className="flex gap-4">
        <span className="font-['Syne'] text-[9px] text-[var(--rule)]">
          <span className="inline-block w-2 h-2 mr-1" style={{ background: floorColors[floor - 1] }} />{occupied} active
        </span>
        {away > 0 && (
          <span className="font-['Syne'] text-[9px] text-[var(--rule)]">
            <span className="inline-block w-2 h-2 mr-1 bg-[#E8D050]" />{away} away
          </span>
        )}
        <span className="font-['Syne'] text-[9px] text-[var(--rule)]">{total - occupied - away} free</span>
      </div>
    </div>
  );
}

function ZoneRow({ zoneName, floor, pct, occupied, away, total }: { zoneName: string; floor: number; pct: number; occupied: number; away: number; total: number }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-[var(--rule)] last:border-0">
      <div className="w-[110px] shrink-0">
        <div className="font-['Syne'] font-bold text-[10px] tracking-[0.06em] truncate">{zoneName}</div>
        <div className="font-['Syne'] text-[8px] text-[var(--rule)] tracking-[0.1em] uppercase">Floor {floor}</div>
      </div>
      <div className="flex-1 h-[6px] bg-[var(--rule)] opacity-20 relative">
        <div
          className="absolute left-0 top-0 h-full bg-[var(--accent)] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="w-[52px] text-right font-['Syne_Mono'] text-[10px] text-[var(--rule)]">
        {Math.round(pct)}%
      </div>
      <div className="font-['Syne'] text-[9px] text-[var(--rule)] w-[56px] text-right">
        {occupied + away}/{total}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--ink)] text-[var(--paper)] px-3 py-2 border border-[var(--rule)] font-['Syne_Mono'] text-[10px]">
      <div className="font-bold mb-1">{HOUR_LABELS[Number(label)] ?? label}</div>
      <div>{payload[0]?.value ?? 0} check-ins</div>
    </div>
  );
};

export default function AnalyticsPage() {
  const { data, isLoading } = useGetAnalytics({
    query: { queryKey: getGetAnalyticsQueryKey(), refetchInterval: 10000 },
  });

  const hourlyData = data?.byHour.map((h) => ({
    hour: h.hour,
    label: HOUR_LABELS[h.hour] ?? `${h.hour}:00`,
    sessions: h.sessions,
  })) ?? [];

  const peak = hourlyData.reduce((best, h) => h.sessions > best.sessions ? h : best, { hour: 0, sessions: 0, label: '' });

  const totalOccupied = (data?.activeNow ?? 0) + (data?.awayNow ?? 0);
  const totalDesks = (data?.activeNow ?? 0) + (data?.freeNow ?? 0) + (data?.awayNow ?? 0);
  const overallPct = totalDesks > 0 ? Math.round((totalOccupied / totalDesks) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="min-h-[100dvh] bg-[var(--paper)] flex flex-col"
    >
      <Navbar />

      {/* ── STAT STRIP ── */}
      <div className="border-b-2 border-[var(--ink)] grid grid-cols-2 md:grid-cols-4">
        <StatPill
          label="Active Now"
          value={isLoading ? "—" : totalOccupied}
          sub={`of ${totalDesks} total seats · ${overallPct}% full`}
          accent
        />
        <StatPill
          label="Free Now"
          value={isLoading ? "—" : (data?.freeNow ?? 0)}
          sub={data?.awayNow ? `+ ${data.awayNow} away (20 min grace)` : "seats available"}
        />
        <StatPill
          label="Sessions Today"
          value={isLoading ? "—" : (data?.totalSessionsToday ?? 0)}
          sub={data?.avgSessionMinutes ? `avg ${data.avgSessionMinutes} min / session` : "check-ins since midnight"}
        />
        <StatPill
          label="Auto-freed"
          value={isLoading ? "—" : (data?.abandonedToday ?? 0)}
          sub="desks recovered by sweep"
        />
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_380px] min-h-0">

        {/* LEFT — Hourly chart */}
        <div className="p-8 border-b-2 lg:border-b-0 lg:border-r-2 border-[var(--ink)] flex flex-col">
          <div className="flex items-baseline justify-between mb-6">
            <div className="font-['Syne'] font-bold text-[11px] tracking-[0.14em] uppercase">Hourly Check-ins Today</div>
            {peak.sessions > 0 && (
              <div className="font-['Syne_Mono'] text-[10px] text-[var(--rule)]">
                Peak: {peak.label} ({peak.sessions})
              </div>
            )}
          </div>
          <div className="flex-1 min-h-[280px]">
            {isLoading ? (
              <div className="h-full flex items-center justify-center font-['Syne'] text-[11px] text-[var(--rule)] animate-pulse">Loading…</div>
            ) : hourlyData.every((h) => h.sessions === 0) ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 border-2 border-dashed border-[var(--rule)] opacity-40">
                <div className="font-['Syne'] font-bold text-[11px] tracking-[0.1em] uppercase text-[var(--rule)]">No sessions yet today</div>
                <div className="font-['Syne'] text-[10px] text-[var(--rule)]">Check-in data will appear here in real time</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={hourlyData} margin={{ top: 20, right: 8, bottom: 20, left: -20 }}>
                  <XAxis
                    dataKey="hour"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontFamily: 'Syne', fontSize: 9, fill: 'var(--rule)' }}
                    dy={10}
                    tickFormatter={(h) => HOUR_LABELS[h] ?? ''}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontFamily: 'Syne', fontSize: 9, fill: 'var(--rule)' }}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                  <Bar dataKey="sessions" radius={0} maxBarSize={44}>
                    {hourlyData.map((entry) => (
                      <Cell
                        key={entry.hour}
                        fill={entry.hour === peak.hour && peak.sessions > 0 ? 'var(--accent)' : 'var(--ink)'}
                        opacity={entry.hour === peak.hour && peak.sessions > 0 ? 1 : 0.55}
                      />
                    ))}
                  </Bar>
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Zone breakdown — full-width below chart */}
          {!isLoading && data?.byZone && data.byZone.length > 0 && (
            <div className="mt-8 border-t-2 border-[var(--ink)] pt-6">
              <div className="font-['Syne'] font-bold text-[11px] tracking-[0.14em] uppercase mb-4">Zone Popularity</div>
              <div>
                {data.byZone.map((z) => {
                  const pct = z.total > 0 ? ((z.occupied + z.away) / z.total) * 100 : 0;
                  return (
                    <ZoneRow
                      key={z.zone}
                      zoneName={z.zoneName}
                      floor={z.floor}
                      pct={pct}
                      occupied={z.occupied}
                      away={z.away}
                      total={z.total}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — Floor breakdown */}
        <div className="flex flex-col">
          <div className="border-b border-[var(--rule)] px-6 py-4">
            <div className="font-['Syne'] font-bold text-[11px] tracking-[0.14em] uppercase">Floor Occupancy</div>
          </div>

          {isLoading ? (
            <div className="flex-1 flex items-center justify-center font-['Syne'] text-[11px] text-[var(--rule)] animate-pulse">Loading…</div>
          ) : (
            <div className="flex-1">
              {(data?.byFloor ?? []).map((f) => {
                const pct = f.total > 0 ? ((f.occupied + f.away) / f.total) * 100 : 0;
                const FLOOR_NAMES: Record<number, string> = { 1: 'Ground Floor', 2: 'First Floor', 3: 'Second Floor' };
                return (
                  <OccupancyBar
                    key={f.floor}
                    label={FLOOR_NAMES[f.floor] ?? `Floor ${f.floor}`}
                    pct={pct}
                    total={f.total}
                    occupied={f.occupied}
                    away={f.away}
                    floor={f.floor}
                  />
                );
              })}
            </div>
          )}

          {/* Summary box */}
          {!isLoading && data && (
            <div className="border-t-2 border-[var(--ink)] bg-[var(--ink)] p-6 text-[var(--paper)]">
              <div className="font-['Syne'] font-bold text-[8px] tracking-[0.22em] uppercase text-[#555] mb-4">Library Health</div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Peak hour', value: peak.sessions > 0 ? peak.label : 'n/a' },
                  { label: 'Avg session', value: data.avgSessionMinutes > 0 ? `${data.avgSessionMinutes}m` : 'n/a' },
                  { label: 'Away right now', value: data.awayNow },
                  { label: 'Recovered today', value: data.abandonedToday },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div className="font-['Syne'] text-[8px] tracking-[0.12em] uppercase text-[#555] mb-0.5">{label}</div>
                    <div className="font-['Syne_Mono'] text-[18px] font-bold tracking-[-0.5px]">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
