'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Sparkles, X, Filter } from 'lucide-react';
import Link from 'next/link';
import { DatesInfiniteList } from '@/components/features/dates-infinite-list';
import { OfflineDraftsBanner } from '@/components/features/offline-drafts-banner';
import { useCouple } from '@/hooks/use-couple';
import { useInfiniteDates } from '@/hooks/use-dates';
import type { DateMood } from '@/types';

const MOOD_FILTERS: { id: DateMood; label: string; emoji: string }[] = [
  { id: 'love', label: 'Yêu', emoji: '❤️' },
  { id: 'happy', label: 'Vui', emoji: '😊' },
  { id: 'calm', label: 'Bình yên', emoji: '🌿' },
  { id: 'excited', label: 'Hào hứng', emoji: '✨' },
  { id: 'tired', label: 'Mệt', emoji: '🥱' },
  { id: 'sad', label: 'Buồn', emoji: '🥺' },
];

export default function DatesPage() {
  const { couple, isLoading: isLoadingCouple } = useCouple();

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedMood, setSelectedMood] = useState<string | undefined>(undefined);
  const [selectedTag, setSelectedTag] = useState<string | undefined>(undefined);

  // Debounce search input 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const activeFilters = {
    search: debouncedSearch || undefined,
    mood: selectedMood,
    tag: selectedTag,
  };

  const { data } = useInfiniteDates(couple?.id, activeFilters);
  const totalCount = data?.pages?.[0]?.total ?? (data?.pages ? data.pages.flatMap((p) => (Array.isArray(p) ? p : p.data)).length : 0);

  if (isLoadingCouple) {
    return <div className="p-8 text-center text-text-muted">Đang tải dữ liệu...</div>;
  }

  if (!couple) {
    return null; // CoupleGuard handles redirect
  }

  const hasActiveFilters = Boolean(debouncedSearch || selectedMood || selectedTag);

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Offline Drafts Banner */}
      <OfflineDraftsBanner coupleId={couple.id} />

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text">Buổi hẹn hò 📅</h1>
          <p className="text-text-muted text-sm mt-0.5">
            {totalCount > 0 ? `${totalCount} kỷ niệm đã ghi lại` : 'Cùng nhau lưu giữ từng khoảnh khắc'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dates/on-this-day"
            className="flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-md)] border border-border bg-surface text-text hover:bg-surface-hover text-xs sm:text-sm font-medium transition-colors"
          >
            <Sparkles size={15} className="text-primary" />
            <span className="hidden sm:inline">Ngày này năm ngoái</span>
          </Link>

          <Link
            href="/dates/new"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-[var(--radius-md)] bg-primary text-primary-fg font-medium text-xs sm:text-sm hover:opacity-90 transition-opacity shadow-sm"
          >
            <Plus size={16} /> Ghi mới
          </Link>
        </div>
      </div>

      {/* Search Bar & Filters */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm kỷ niệm theo tên, địa điểm, ghi chú..."
            className="w-full pl-9 pr-9 py-2 rounded-[var(--radius-md)] bg-surface border border-border text-text placeholder:text-text-muted text-sm focus:outline-none focus:border-primary transition-colors"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Mood filter chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            type="button"
            onClick={() => setSelectedMood(undefined)}
            className={`px-3 py-1 rounded-full font-medium shrink-0 transition-colors ${
              !selectedMood
                ? 'bg-primary text-primary-fg'
                : 'bg-surface hover:bg-surface-hover border border-border text-text-muted'
            }`}
          >
            Tất cả
          </button>

          {MOOD_FILTERS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelectedMood(selectedMood === m.id ? undefined : m.id)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-medium shrink-0 transition-colors ${
                selectedMood === m.id
                  ? 'bg-primary text-primary-fg'
                  : 'bg-surface hover:bg-surface-hover border border-border text-text'
              }`}
            >
              <span>{m.emoji}</span>
              <span>{m.label}</span>
            </button>
          ))}

          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setSelectedMood(undefined);
                setSelectedTag(undefined);
              }}
              className="px-2 py-1 text-xs text-primary font-medium hover:underline shrink-0 ml-1"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Infinite List */}
      <DatesInfiniteList coupleId={couple.id} filters={activeFilters} />
    </div>
  );
}
