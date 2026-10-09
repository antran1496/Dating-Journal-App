'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, X, Loader2 } from 'lucide-react';
import type { DatePlaceInput } from '@/types/forms';

interface PlacePickerProps {
  value?: DatePlaceInput;
  onChange: (val: DatePlaceInput) => void;
  placeholder?: string;
}

export function PlacePicker({
  value,
  onChange,
  placeholder = 'Tìm địa điểm hoặc nhập tên quán...',
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
    setQuery(item.name);
    setIsOpen(false);
    onChange({
      name: item.name,
      lat: item.lat ?? undefined,
      lng: item.lng ?? undefined,
      area_label: item.area_label ?? undefined,
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
            if (suggestions.length > 0) setIsOpen(true);
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
      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-surface border border-border rounded-[var(--radius-lg)] shadow-lg divide-y divide-border/50">
          {suggestions.map((item, idx) => (
            <li key={idx}>
              <button
                type="button"
                onClick={() => handleSelect(item)}
                className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-surface-hover transition-colors flex items-start gap-2.5 cursor-pointer"
              >
                <Search size={14} className="text-primary shrink-0 mt-0.5" />
                <div className="flex-1 truncate">
                  <span className="font-semibold text-text block truncate">{item.name}</span>
                  {item.area_label && (
                    <span className="text-[11px] text-text-muted truncate block">
                      {item.area_label}
                    </span>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
