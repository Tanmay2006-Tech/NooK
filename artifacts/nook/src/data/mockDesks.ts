export type DeskStatus = 'free' | 'occupied' | 'away' | 'mine' | 'abandoned' | 'empty';

export type ZoneCode = 'W' | 'Q' | 'S' | 'C' | 'F' | 'G' | 'R' | 'P' | 'L' | 'A';

export interface Desk {
  id: string;
  floor: number;
  zone: ZoneCode;
  zoneName: string;
  amenities: string[];
  status: DeskStatus;
  occupant?: string;
  checkinTime?: Date;
  sessionEnd?: Date;
  remainingMin?: number;
}
