import { useState } from 'react';
import { useListDesks } from '@workspace/api-client-react';
import QRCode from 'react-qr-code';
import { Printer, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

const FLOORS: { floor: number; label: string }[] = [
  { floor: 1, label: 'Floor 1' },
  { floor: 2, label: 'Floor 2' },
  { floor: 3, label: 'Floor 3' },
];

export default function QRCodesPage() {
  const [activeFloor, setActiveFloor] = useState(1);
  const { data: desks = [], isLoading } = useListDesks(undefined, {});

  const floorDesks = desks
    .filter((d) => d.floor === activeFloor)
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

  const base = `${window.location.origin}/checkin`;

  return (
    <div
      className="min-h-screen bg-[var(--paper)] flex flex-col print:bg-white"
      style={{ borderTop: '4px solid var(--ink)' }}
    >
      {/* Header — hidden when printing */}
      <div className="border-b-2 border-[var(--ink)] px-8 h-[52px] flex items-center justify-between shrink-0 print:hidden">
        <div className="flex items-center gap-4">
          <Link
            href="/librarian"
            className="flex items-center gap-2 font-['Syne'] font-bold text-[10px] tracking-[0.12em] uppercase text-[var(--rule)] hover:text-[var(--ink)] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </Link>
          <div className="h-5 w-px bg-[var(--rule)]" />
          <span className="font-['Syne'] font-extrabold text-[20px] tracking-[-1px] text-[var(--ink)]">nook</span>
          <div className="h-5 w-px bg-[var(--rule)]" />
          <span className="font-['Syne'] font-bold text-[10px] tracking-[0.18em] uppercase text-[var(--rule)]">
            QR Codes — Print &amp; Affix to Desks
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Floor tabs */}
          {FLOORS.map(({ floor, label }) => (
            <button
              key={floor}
              onClick={() => setActiveFloor(floor)}
              className={`h-[30px] px-4 font-['Syne'] font-bold text-[10px] tracking-[0.12em] uppercase border transition-none ${
                activeFloor === floor
                  ? 'bg-[var(--ink)] text-[var(--paper)] border-[var(--ink)]'
                  : 'bg-transparent text-[var(--ink)] border-[var(--rule)] hover:border-[var(--ink)]'
              }`}
            >
              {label}
            </button>
          ))}
          <div className="w-px h-5 bg-[var(--rule)]" />
          <button
            onClick={() => window.print()}
            className="h-[30px] px-4 flex items-center gap-2 bg-[var(--accent)] text-[var(--paper)] font-['Syne'] font-bold text-[10px] tracking-[0.12em] uppercase"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Floor {activeFloor}
          </button>
        </div>
      </div>

      {/* Print header — only shown when printing */}
      <div className="hidden print:flex items-center justify-between px-6 py-4 border-b-2 border-black">
        <div>
          <div className="font-['Syne'] font-extrabold text-[28px] tracking-[-2px]">nook</div>
          <div className="font-['Syne'] text-[10px] tracking-[0.18em] uppercase text-gray-500 mt-0.5">
            Desk QR Codes — Floor {activeFloor}
          </div>
        </div>
        <div className="font-['Syne'] text-[10px] text-gray-400 uppercase tracking-[0.1em]">
          Scan to reserve · nook.library
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <span className="font-['Syne_Mono'] text-[12px] tracking-[0.14em] uppercase text-[var(--rule)]">Loading…</span>
        </div>
      ) : (
        <div className="flex-1 p-8 print:p-6">
          {/* Zone groups */}
          {Object.entries(
            floorDesks.reduce<Record<string, typeof floorDesks>>((acc, d) => {
              (acc[d.zoneName] ??= []).push(d);
              return acc;
            }, {})
          ).map(([zoneName, zoneDesks]) => (
            <div key={zoneName} className="mb-8 print:mb-6 print:break-inside-avoid">
              <div className="flex items-center gap-3 mb-4">
                <span className="font-['Syne'] font-bold text-[9px] tracking-[0.22em] uppercase text-[var(--rule)]">
                  {zoneName}
                </span>
                <div className="flex-1 h-px bg-[var(--rule)] opacity-40" />
              </div>

              <div className="flex flex-wrap gap-4 print:gap-3">
                {zoneDesks.map((desk) => {
                  const url = `${base}/${desk.id}`;
                  return (
                    <div
                      key={desk.id}
                      className="w-[148px] border-2 border-[var(--ink)] p-4 flex flex-col items-center gap-3 bg-[var(--paper)] print:border-black print:w-[136px] print:p-3 print:break-inside-avoid"
                    >
                      {/* QR code */}
                      <div className="bg-white p-2">
                        <QRCode
                          value={url}
                          size={100}
                          bgColor="#ffffff"
                          fgColor="#1a1a18"
                          level="M"
                        />
                      </div>

                      {/* Desk ID */}
                      <div className="text-center">
                        <div className="font-['Syne'] font-extrabold text-[32px] tracking-[-2px] leading-none text-[var(--ink)]">
                          {desk.id}
                        </div>
                        <div className="font-['Syne'] text-[9px] text-[var(--rule)] uppercase tracking-[0.1em] mt-0.5">
                          {desk.zoneName}
                        </div>
                      </div>

                      {/* URL (tiny, for manual entry) */}
                      <div className="font-['Syne_Mono'] text-[7px] text-[var(--rule)] text-center break-all leading-tight">
                        {url.replace('https://', '').replace('http://', '')}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
