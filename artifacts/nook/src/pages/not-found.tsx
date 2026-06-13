import { Link } from "wouter";

export default function NotFound() {
  return (
    <div
      className="min-h-screen bg-[var(--paper)] flex flex-col items-center justify-center gap-6 px-6"
      style={{ borderTop: "4px solid var(--ink)" }}
    >
      <div className="font-['Syne'] font-extrabold text-[72px] tracking-[-4px] text-[var(--ink)] leading-none">
        404
      </div>
      <p className="font-['Syne'] text-[14px] text-[var(--rule)] text-center max-w-sm">
        That page doesn&apos;t exist. Head back to the map or the home screen.
      </p>
      <div className="flex gap-3">
        <Link
          href="/"
          className="border-2 border-[var(--ink)] px-5 py-2 font-['Syne'] font-bold text-[11px] uppercase tracking-[0.14em] text-[var(--ink)] hover:bg-[var(--paper2)]"
        >
          Home
        </Link>
        <Link
          href="/map"
          className="bg-[var(--ink)] text-[var(--paper)] px-5 py-2 font-['Syne'] font-bold text-[11px] uppercase tracking-[0.14em]"
        >
          Floor map
        </Link>
      </div>
    </div>
  );
}
