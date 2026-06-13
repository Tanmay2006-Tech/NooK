import { useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useListDesks,
  getListDesksQueryKey,
  useCheckinDesk,
  useMarkAway as useMarkAwayHook,
  useReleaseDesk,
  useRespondPrompt,
} from '@workspace/api-client-react';
import type { DeskInfo } from '@workspace/api-client-react';
import type { Desk, ZoneCode } from '../data/mockDesks';

const MY_DESK_KEY = 'nook_my_desk_id';

function deskInfoToDesk(info: DeskInfo, myDeskId: string | null): Desk {
  let status: Desk['status'] = info.status as Desk['status'];
  if (info.id === myDeskId) {
    if (info.status === 'occupied') status = 'mine';
    else if (info.status === 'away') status = 'away';
  }
  return {
    id: info.id,
    floor: info.floor,
    zone: info.zone as ZoneCode,
    zoneName: info.zoneName,
    amenities: info.amenities,
    status,
    occupant: info.session?.studentName,
    checkinTime: info.session?.checkinAt ? new Date(info.session.checkinAt) : undefined,
    sessionEnd: info.session?.sessionExpiresAt ? new Date(info.session.sessionExpiresAt) : undefined,
  };
}

export function useNookApi() {
  const [myDeskId, setMyDeskId] = useState<string | null>(() =>
    localStorage.getItem(MY_DESK_KEY)
  );
  const queryClient = useQueryClient();

  const { data: rawDesks, isLoading } = useListDesks(undefined, {
    query: { queryKey: getListDesksQueryKey(), refetchInterval: 3000 },
  });

  const checkinMutation = useCheckinDesk();
  const awayMutation = useMarkAwayHook();
  const releaseMutation = useReleaseDesk();
  const respondMutation = useRespondPrompt();

  const desks: Desk[] = (rawDesks ?? []).map((d) => deskInfoToDesk(d, myDeskId));
  const myBookedDesk = desks.find(
    (d) => d.id === myDeskId && (d.status === 'mine' || d.status === 'away')
  );
  const myRawDesk = (rawDesks ?? []).find((d) => d.id === myDeskId);

  useEffect(() => {
    if (!myDeskId || !rawDesks) return;
    const raw = rawDesks.find((d) => d.id === myDeskId);
    if (!raw || raw.status === 'free' || raw.status === 'abandoned') {
      setMyDeskId(null);
      localStorage.removeItem(MY_DESK_KEY);
    }
  }, [rawDesks, myDeskId]);

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: getListDesksQueryKey() });
  }, [queryClient]);

  const bookDesk = useCallback(async (id: string, studentName: string) => {
    await checkinMutation.mutateAsync({ deskId: id, data: { studentName } });
    setMyDeskId(id);
    localStorage.setItem(MY_DESK_KEY, id);
    invalidate();
  }, [checkinMutation, invalidate]);

  const releaseSeat = useCallback(async (id: string) => {
    await releaseMutation.mutateAsync({ deskId: id });
    setMyDeskId(null);
    localStorage.removeItem(MY_DESK_KEY);
    invalidate();
  }, [releaseMutation, invalidate]);

  const markAway = useCallback(async (id: string) => {
    await awayMutation.mutateAsync({ deskId: id });
    invalidate();
  }, [awayMutation, invalidate]);

  const respondPrompt = useCallback(async (id: string) => {
    await respondMutation.mutateAsync({ deskId: id });
    invalidate();
  }, [respondMutation, invalidate]);

  return { desks, myBookedDesk, myDeskId, myRawDesk, bookDesk, releaseSeat, markAway, respondPrompt, isLoading };
}
