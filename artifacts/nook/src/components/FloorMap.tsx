import { Desk } from '../data/mockDesks';
import { getSeatFillColor, getSeatBorderColor } from '../utils/deskHelpers';

interface FloorMapProps {
  desks: Desk[];
  selectedSeat?: Desk | null;
  onSeatClick?: (desk: Desk) => void;
  myBookedDesk?: Desk;
  activeZoneFilter?: string;
  isLibrarianMode?: boolean;
  activeFloor?: number;
}

export function FloorMap({
  desks,
  selectedSeat,
  onSeatClick,
  activeZoneFilter,
  isLibrarianMode = false,
  activeFloor = 1,
}: FloorMapProps) {
  const byFloor = desks.filter((d) => d.floor === activeFloor);

  const renderSeat = (desk: Desk) => {
    const isSelected = selectedSeat?.id === desk.id;
    const isFree = desk.status === 'free';
    const isAway = desk.status === 'away';
    const isEmpty = desk.status === 'empty';
    const isOccupied = desk.status === 'occupied';
    const isMine = desk.status === 'mine';
    const fill = getSeatFillColor(desk.status);
    const border = getSeatBorderColor(desk.status);
    const isMuted = activeZoneFilter ? activeZoneFilter !== desk.zoneName : false;
    const clickable = !isMuted && !isEmpty;

    return (
      <div
        key={desk.id}
        className={[
          'relative w-[44px] h-[30px] border-[1.5px] flex items-center justify-center transition-all duration-300 group select-none',
          isFree && !isMuted ? 'animate-pulse-seat cursor-pointer hover:scale-110 hover:z-10' : '',
          isAway && !isMuted ? 'animate-blink-away cursor-pointer hover:scale-110 hover:z-10' : '',
          (isMine || isOccupied) && !isMuted ? 'cursor-pointer hover:scale-110 hover:z-10' : '',
          isEmpty ? 'cursor-default opacity-40' : '',
          isSelected ? 'outline outline-2 outline-[var(--ink)] outline-offset-2 z-20' : '',
          isMuted ? 'opacity-20 saturate-0 pointer-events-none' : '',
        ].filter(Boolean).join(' ')}
        style={{ backgroundColor: isAway ? undefined : fill, borderColor: border }}
        onClick={() => { if (clickable && onSeatClick) onSeatClick(desk); }}
      >
        <span className="font-['Syne_Mono'] text-[9px] text-[var(--ink)] z-10 leading-none">{desk.id}</span>

        {isLibrarianMode && (isOccupied || isMine) && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-[var(--accent)] text-[var(--paper)] flex items-center justify-center text-[7px] font-bold z-20 opacity-0 group-hover:opacity-100 transition-opacity">
            ×
          </div>
        )}

        {!isMuted && !isEmpty && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col w-max bg-[var(--ink)] text-[var(--paper)] text-[9px] px-2.5 py-1.5 z-50 pointer-events-none gap-0.5">
            <span className="font-['Syne'] font-bold text-[8px] tracking-[0.16em] uppercase text-[var(--rule)]">{desk.zoneName}</span>
            <span className="font-['Syne_Mono']">{desk.status.toUpperCase()}</span>
            {desk.occupant && <span className="font-['Syne_Mono'] text-[var(--rule)]">{desk.occupant}</span>}
          </div>
        )}
      </div>
    );
  };

  const zone = (code: string) =>
    byFloor
      .filter((d) => d.zone === code)
      .sort((a, b) => parseInt(a.id.replace(/\D/g, '')) - parseInt(b.id.replace(/\D/g, '')));

  const ZoneLabel = ({ title, width }: { title: string; width?: string }) => (
    <div className="flex items-center gap-2 mb-3" style={width ? { width } : {}}>
      <span className="font-['Syne'] font-bold text-[8px] tracking-[0.22em] text-[var(--rule)] uppercase whitespace-nowrap shrink-0">
        {title}
      </span>
      <div className="flex-1 h-px bg-[var(--rule)] opacity-40" />
    </div>
  );

  // Each seat is 44px wide, gap-1.5 = 6px
  const SEAT = 44;
  const GAP = 6;
  const w = (n: number) => n * SEAT + (n - 1) * GAP; // pixel width for n seats in a row

  const Floor1 = () => {
    const colW = `${w(5)}px`;   // Collaborative row 1 = 5 seats = 246px
    const podW = `${w(3) + 2 * 12}px`; // 3 pod cols * 44 + 2 * gap-3 (12px) = 156px
    const winW = `${w(9)}px`;   // Window Row = 9 seats = 450px
    const quietW = `${w(3)}px`; // Quiet Zone = 3 cols = 132px

    return (
      <div className="flex flex-col gap-10">
        {/* Top: Collaborative | Study Pods */}
        <div className="flex items-start gap-14">
          <div>
            <ZoneLabel title="Collaborative" width={colW} />
            <div className="flex flex-col gap-1.5">
              <div className="flex gap-1.5">{zone('C').slice(0, 5).map(renderSeat)}</div>
              <div className="flex gap-1.5">{zone('C').slice(5).map(renderSeat)}</div>
            </div>
          </div>
          <div>
            <ZoneLabel title="Study Pods" width={podW} />
            <div className="flex gap-3">
              {[0, 3, 6].map((s) => (
                <div key={s} className="flex flex-col gap-1.5">
                  {zone('S').slice(s, s + 3).map(renderSeat)}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-[var(--rule)] opacity-20" />

        {/* Bottom: Window Row | Quiet Zone */}
        <div className="flex items-start gap-14">
          <div>
            <ZoneLabel title="Window Row" width={winW} />
            <div className="flex gap-1.5">{zone('W').map(renderSeat)}</div>
          </div>
          <div>
            <ZoneLabel title="Quiet Zone" width={quietW} />
            <div className="grid grid-cols-3 gap-1.5">{zone('Q').map(renderSeat)}</div>
          </div>
        </div>
      </div>
    );
  };

  const Floor2 = () => (
    <div className="flex flex-col gap-10">
      {/* Top: Focus Booths | Group Study */}
      <div className="flex items-start gap-14">
        <div>
          <ZoneLabel title="Focus Booths" />
          <div className="grid grid-cols-3 gap-1.5">{zone('F').map(renderSeat)}</div>
        </div>
        <div>
          <ZoneLabel title="Group Study" />
          <div className="flex gap-3">
            {[0, 3, 6].map((s) => (
              <div key={s} className="flex flex-col gap-1.5">
                {zone('G').slice(s, s + 3).map(renderSeat)}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="h-px bg-[var(--rule)] opacity-20" />
      {/* Bottom: Reading Nook */}
      <div>
        <ZoneLabel title="Reading Nook" width={`${w(9)}px`} />
        <div className="flex gap-1.5">{zone('R').map(renderSeat)}</div>
      </div>
    </div>
  );

  const Floor3 = () => (
    <div className="flex flex-col gap-10">
      {/* Top: Seminar Pods | Lounge Area */}
      <div className="flex items-start gap-14">
        <div>
          <ZoneLabel title="Seminar Pods" />
          <div className="grid grid-cols-3 gap-1.5">{zone('P').map(renderSeat)}</div>
        </div>
        <div>
          <ZoneLabel title="Lounge Area" />
          <div className="grid grid-cols-3 gap-1.5">{zone('L').map(renderSeat)}</div>
        </div>
      </div>
      <div className="h-px bg-[var(--rule)] opacity-20" />
      {/* Bottom: Archive Alcoves */}
      <div>
        <ZoneLabel title="Archive Alcoves" width={`${w(9)}px`} />
        <div className="flex gap-1.5">{zone('A').map(renderSeat)}</div>
      </div>
    </div>
  );

  return (
    /* Outer: overflow-auto, min-width max-content so flex-center works correctly with overflow */
    <div className="flex-1 bg-[var(--paper2)] overflow-auto">
      <div
        className="flex items-center justify-center p-10"
        style={{ minWidth: 'max-content', minHeight: '100%' }}
      >
        <div className="bg-[var(--paper)] border-2 border-[var(--ink)] p-10 relative">
          {/* Floor label */}
          <div className="absolute top-3 right-4 font-['Syne_Mono'] text-[8px] text-[var(--rule)] tracking-[0.14em]">
            FL.{activeFloor}
          </div>

          {activeFloor === 1 && <Floor1 />}
          {activeFloor === 2 && <Floor2 />}
          {activeFloor === 3 && <Floor3 />}
        </div>
      </div>
    </div>
  );
}
