'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, X, Loader2, Check } from 'lucide-react';
import type { DatePlaceInput } from '@/types/forms';

interface PlacePickerProps {
  value?: DatePlaceInput;
  onChange: (val: DatePlaceInput) => void;
  placeholder?: string;
}

export function PlacePicker({
  value,
  onChange,
  placeholder = 'Nhập tên quán hoặc địa chỉ (như Google Maps)...',
}: PlacePickerProps) {
  const [query, setQuery] = useState(value?.name || '');
  const [suggestions, setSuggestions] = useState<
    { name: string; lat: number | null; lng: number | null; area_label: string | null }[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [prevName, setPrevName] = useState(value?.name);
  if (value?.name !== prevName) {
    setPrevName(value?.name);
    setQuery(value?.name || '');
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/places/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const json = await res.json();
          setSuggestions(json.data || []);
          setIsOpen(true);
        }
      } catch (err) {
        console.error('Fetch place suggestions error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (item: {
    name: string;
    lat: number | null;
    lng: number | null;
    area_label: string | null;
  }) => {
    let formattedName = item.name;
    if (item.area_label) {
      const lowerName = item.name.toLowerCase();
      const lowerArea = item.area_label.toLowerCase();
      if (lowerName.includes(lowerArea)) {
        formattedName = item.name;
      } else if (lowerArea.includes(lowerName)) {
        formattedName = item.area_label;
      } else {
        formattedName = `${item.name}, ${item.area_label}`;
      }
    }

    setQuery(formattedName);
    setIsOpen(false);
    onChange({
      name: formattedName,
      lat: item.lat ?? undefined,
      lng: item.lng ?? undefined,
      area_label: item.area_label ?? undefined,
    });
  };

  const handleSelectCustom = () => {
    setIsOpen(false);
    onChange({
      name: query.trim(),
      lat: value?.lat,
      lng: value?.lng,
      area_label: value?.area_label,
    });
  };

  const handleManualChange = (text: string) => {
    setQuery(text);
    onChange({
      name: text,
      lat: value?.lat,
      lng: value?.lng,
      area_label: value?.area_label,
    });
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
    onChange({ name: '' });
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <div className="absolute left-3 text-text-muted pointer-events-none">
          <MapPin size={16} />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => handleManualChange(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0 || query.trim().length >= 2) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full pl-9 pr-9 py-2 text-sm rounded-[var(--radius-lg)] border border-border bg-surface text-text focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />
        <div className="absolute right-3 flex items-center gap-1">
          {isLoading && <Loader2 size={15} className="animate-spin text-text-muted" />}
          {query && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className="text-text-muted hover:text-text p-0.5 rounded-full transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-surface border border-border rounded-[var(--radius-lg)] shadow-lg divide-y divide-border/50">
          {/* Quick option to use custom typed address */}
          {query.trim().length > 0 && (
            <button
              type="button"
              onClick={handleSelectCustom}
              className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-primary/10 bg-primary/5 transition-colors flex items-center justify-between gap-2.5 text-primary font-medium cursor-pointer"
            >
              <div className="flex items-center gap-2 truncate">
                <MapPin size={14} className="shrink-0" />
                <span className="truncate">Sử dụng: &quot;{query.trim()}&quot;</span>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-primary/10">
                Nhập tay
              </span>
            </button>
          )}

          {suggestions.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelect(item)}
              className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-surface-hover transition-colors flex items-start gap-2.5 cursor-pointer"
            >
              <Search size={14} className="text-primary shrink-0 mt-0.5" />
              <div className="flex-1 truncate">
                <span className="font-semibold text-text block truncate">{item.name}</span>
                {item.area_label && (
                  <span className="text-[11px] text-text-muted truncate block mt-0.5">
                    📍 {item.area_label}
                  </span>
                )}
              </div>
            </button>
          ))}

          {suggestions.length === 0 && !isLoading && query.trim().length >= 2 && (
            <div className="p-3 text-xs text-text-muted text-center">
              Không có gợi ý phù hợp. Bấm &quot;Sử dụng: {query.trim()}&quot; ở trên để dùng địa chỉ này.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
