import { Link, useLocation } from "wouter";
import type { Desk } from "../data/mockDesks";

interface NavbarProps {
  activeFloor?: number;
  onFloorChange?: (f: number) => void;
  desks?: Desk[];
}

export function Navbar({ activeFloor = 1, onFloorChange, desks = [] }: NavbarProps) {
  const [location] = useLocation();
  const freeSeats = desks.filter((d) => d.status === "free").length;

  return (
    <nav className="h-[52px] border-b-2 border-[var(--ink)] bg-[var(--paper)] flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center h-full">
        <Link href="/" className="mr-8">
          <div className="font-['Syne'] font-extrabold text-[20px] tracking-[-1px] text-[var(--ink)] flex items-center">
            <span>n</span>
            <span className="inline-flex items-center justify-center w-[12px] h-[12px] border-[1.5px] border-[var(--ink)] rounded-full -ml-[2px]"></span>
            <span className="inline-flex items-center justify-center w-[12px] h-[12px] border-[1.5px] border-[var(--ink)] rounded-full -ml-[4px]"></span>
            <span className="-ml-[2px]">k</span>
          </div>
        </Link>

        {onFloorChange &&
          [1, 2, 3].map((floor) => (
            <button
              key={floor}
              data-testid={`button-floor-${floor}`}
              onClick={() => onFloorChange(floor)}
              className={`h-full px-4 border-l border-[var(--rule)] font-['Syne'] font-bold text-[11px] tracking-[0.12em] uppercase transition-colors
                ${
                  activeFloor === floor
                    ? "bg-[var(--ink)] text-[var(--paper)]"
                    : "bg-transparent text-[var(--ink)] hover:bg-[var(--paper2)]"
                }`}
            >
              Floor {floor}
            </button>
          ))}
      </div>

      <div className="flex items-center h-full gap-6">
        <div className="flex items-center gap-4">
          <Link
            href="/analytics"
            className={`font-['Syne'] font-bold text-[11px] tracking-[0.12em] uppercase ${
              location === "/analytics"
                ? "text-[var(--accent)]"
                : "text-[var(--ink)] hover:text-[var(--accent)]"
            }`}
          >
            Analytics
          </Link>
          <Link
            href="/librarian"
            className={`font-['Syne'] font-bold text-[11px] tracking-[0.12em] uppercase ${
              location === "/librarian"
                ? "text-[var(--accent)]"
                : "text-[var(--ink)] hover:text-[var(--accent)]"
            }`}
          >
            Librarian
          </Link>
        </div>

        <div className="h-full border-l border-[var(--rule)] mx-2" />

        <div className="flex items-center gap-4">
          {desks.length > 0 && (
            <div className="bg-[var(--accent)] text-[var(--paper)] font-['Syne'] font-bold text-[9px] tracking-[0.14em] px-2 py-1 flex items-center">
              {freeSeats} FREE
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="font-['Syne_Mono'] text-[10px] text-[var(--rule)]">⌘K</span>
            <div className="w-[28px] h-[28px] bg-[var(--ink)] text-[var(--paper)] flex items-center justify-center font-['Syne'] font-bold text-[11px]">
              JS
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
