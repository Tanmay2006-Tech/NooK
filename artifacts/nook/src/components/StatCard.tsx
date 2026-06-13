export function StatCard({ 
  label, 
  value, 
  unit, 
  accent = false 
}: { 
  label: string; 
  value: string | number; 
  unit?: string; 
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline gap-1">
        <span className={`font-['Syne'] font-extrabold text-[44px] tracking-[-0.04em] leading-none ${accent ? 'text-[var(--accent)]' : 'text-[var(--ink)]'}`}>
          {value}
        </span>
        {unit && (
          <span className={`font-['Syne'] font-bold text-[18px] leading-none ${accent ? 'text-[var(--accent)]' : 'text-[var(--ink)]'}`}>
            {unit}
          </span>
        )}
      </div>
      <span className="font-['Syne'] font-bold text-[9px] uppercase tracking-[0.18em] text-[var(--rule)] mt-1">
        {label}
      </span>
    </div>
  );
}
