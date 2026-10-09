'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCouple } from '@/hooks/use-couple';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import type { DateEntry } from '@/types';

const MemoryMap = dynamic(() => import('@/components/features/memory-map'), {
  ssr: false,
  loading: () => (
    <div className="space-y-4">
      <LoadingSkeleton variant="rect" height="40px" width="300px" className="rounded-lg" />
      <LoadingSkeleton variant="rect" height="550px" className="rounded-2xl" />
    </div>
  ),
});

export default function MapPage() {
  const { couple, isLoading: isLoadingCouple } = useCouple();
  const queryClient = useQueryClient();

  const { data: dates = [], isLoading: isLoadingDates } = useQuery<DateEntry[]>({
    queryKey: ['dates', couple?.id, 'map'],
    queryFn: async () => {
      const res = await fetch('/api/dates?limit=200');
      if (!res.ok) throw new Error('Failed to fetch dates');
      const json = await res.json();
      return json.data || [];
    },
    enabled: !!couple?.id,
  });

  const handleUpdatePlaceCoords = async (
    placeId: string,
    lat: number,
    lng: number,
    areaLabel?: string
  ) => {
    const res = await fetch(`/api/places/${placeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lng, area_label: areaLabel }),
    });

    if (res.ok) {
      queryClient.invalidateQueries({ queryKey: ['dates', couple?.id] });
    }
  };

  if (isLoadingCouple || isLoadingDates) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
        <LoadingSkeleton variant="rect" height="40px" width="260px" className="rounded-lg" />
        <LoadingSkeleton variant="rect" height="550px" className="rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-text flex items-center gap-2">
          <span>🗺️</span> Bản đồ kỷ niệm
        </h1>
        <p className="text-text-muted text-sm mt-1">
          Những dấu chân và hành trình hai bạn đã cùng nhau đi qua.
        </p>
      </div>

      <MemoryMap dates={dates} onUpdatePlaceCoords={handleUpdatePlaceCoords} />
    </div>
  );
}
