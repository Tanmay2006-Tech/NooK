import type { Desk, DeskStatus } from '../data/mockDesks';

export function getSeatFillColor(status: DeskStatus): string {
  switch (status) {
    case 'free': return 'var(--seat-free)';
    case 'occupied': return 'var(--seat-occ)';
    case 'away': return 'var(--seat-away)';
    case 'mine': return 'var(--seat-mine)';
    case 'empty': return 'var(--seat-empty)';
    default: return 'var(--seat-empty)';
  }
}

export function getSeatBorderColor(status: DeskStatus): string {
  switch (status) {
    case 'free': return 'var(--seat-free-border)';
    case 'occupied': return 'var(--seat-occ-border)';
    case 'away': return 'var(--seat-away-border)';
    case 'mine': return 'var(--seat-mine-border)';
    case 'empty': return 'var(--seat-empty-border)';
    default: return 'var(--seat-empty-border)';
  }
}

export function getZoneName(zone: string): string {
  switch (zone) {
    case 'W': return 'Window Row';
    case 'Q': return 'Quiet Zone';
    case 'S': return 'Study Pods';
    case 'C': return 'Collaborative';
    default: return 'Unknown Zone';
  }
}

export function groupDesksByZone(desks: Desk[]): Record<string, Desk[]> {
  return desks.reduce((acc, desk) => {
    if (!acc[desk.zone]) acc[desk.zone] = [];
    acc[desk.zone].push(desk);
    return acc;
  }, {} as Record<string, Desk[]>);
}
