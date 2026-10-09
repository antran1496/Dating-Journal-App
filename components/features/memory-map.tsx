'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Shield, Navigation, MapPin, Search, Loader2, ArrowRight } from 'lucide-react';
import type { DateEntry, DatePlace } from '@/types';
import { getVnDateParts } from '@/lib/spending';

interface MemoryMapProps {
  dates: DateEntry[];
  onUpdatePlaceCoords?: (placeId: string, lat: number, lng: number, areaLabel?: string) => Promise<void>;
}

export default function MemoryMap({ dates, onUpdatePlaceCoords }: MemoryMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const journeyLayerRef = useRef<L.Polyline | null>(null);

  const [selectedJourneyDateId, setSelectedJourneyDateId] = useState<string | null>(null);
  const [searchingPlaceId, setSearchingPlaceId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<
    Array<{ name: string; lat: number | null; lng: number | null; area_label: string | null }>
  >([]);
  const [isSearching, setIsSearching] = useState(false);

  // Extract all places with valid coordinates
  const validPlacedEntries: { date: DateEntry; place: DatePlace }[] = [];
  const multiStopDates: { date: DateEntry; places: DatePlace[] }[] = [];
  const unlocatedPlaces: { date: DateEntry; place: DatePlace }[] = [];

  for (const date of dates) {
    const places = (date.places || []).slice().sort((a, b) => a.position - b.position);

    // If no places array but legacy location exists
    if (places.length === 0 && date.location_name) {
      if (typeof date.location_lat === 'number' && typeof date.location_lng === 'number') {
        validPlacedEntries.push({
          date,
          place: {
            id: `legacy-${date.id}`,
            date_id: date.id,
            position: 0,
            name: date.location_name,
            lat: date.location_lat,
            lng: date.location_lng,
            area_label: null,
          },
        });
      } else {
        unlocatedPlaces.push({
          date,
          place: {
            id: `legacy-${date.id}`,
            date_id: date.id,
            position: 0,
            name: date.location_name,
            lat: null,
            lng: null,
            area_label: null,
          },
        });
      }
    }

    const placedForDate: DatePlace[] = [];
    for (const p of places) {
      if (typeof p.lat === 'number' && typeof p.lng === 'number') {
        validPlacedEntries.push({ date, place: p });
        placedForDate.push(p);
      } else {
        unlocatedPlaces.push({ date, place: p });
      }
    }

    if (placedForDate.length >= 2) {
      multiStopDates.push({ date, places: placedForDate });
    }
  }

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Default center to Vietnam (Ho Chi Minh City 10.7769, 106.7009 or Hanoi 21.0285, 105.8542)
    const initialCenter: [number, number] =
      validPlacedEntries.length > 0
        ? [validPlacedEntries[0].place.lat!, validPlacedEntries[0].place.lng!]
        : [10.7769, 106.7009];

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: validPlacedEntries.length > 0 ? 12 : 6,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    // OpenStreetMap Tile Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    if (validPlacedEntries.length === 0) return;

    const bounds = L.latLngBounds([]);

    for (const { date, place } of validPlacedEntries) {
      if (typeof place.lat !== 'number' || typeof place.lng !== 'number') continue;

      const latLng: [number, number] = [place.lat, place.lng];
      bounds.extend(latLng);

      const customIcon = L.divIcon({
        className: 'custom-map-marker',
        html: `
          <div style="
            background: var(--color-primary, #f43f5e);
            color: white;
            width: 32px;
            height: 32px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 10px rgba(0,0,0,0.25);
            border: 2px solid white;
          ">
            <span style="transform: rotate(45deg); font-size: 14px;">💗</span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });

      const parts = date.date_time ? getVnDateParts(date.date_time) : null;
      const dateText = parts ? `${parts.day}/${parts.month}/${parts.year}` : '';

      const popupContent = document.createElement('div');
      popupContent.className = 'p-1 text-xs space-y-1.5';
      popupContent.innerHTML = `
        <div style="font-weight: 700; font-size: 13px; color: #1e293b;">${place.name}</div>
        <div style="color: #64748b; font-size: 11px;">${date.title || 'Buổi hẹn'} · ${dateText}</div>
        ${place.area_label ? `<div style="color: #94a3b8; font-size: 10px;">📍 ${place.area_label}</div>` : ''}
        <div style="margin-top: 6px;">
          <a href="/dates/${date.id}" style="color: #f43f5e; font-weight: 600; text-decoration: underline;">Xem kỷ niệm →</a>
        </div>
      `;

      const marker = L.marker(latLng, { icon: customIcon });
      marker.bindPopup(popupContent);
      markersLayer.addLayer(marker);
    }

    if (bounds.isValid() && !selectedJourneyDateId) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [dates, selectedJourneyDateId]);

  // Handle Multi-Stop Journey Polyline
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (journeyLayerRef.current) {
      journeyLayerRef.current.remove();
      journeyLayerRef.current = null;
    }

    if (!selectedJourneyDateId) return;

    const journey = multiStopDates.find((m) => m.date.id === selectedJourneyDateId);
    if (!journey) return;

    const latLngs: [number, number][] = journey.places
      .filter((p) => typeof p.lat === 'number' && typeof p.lng === 'number')
      .map((p) => [p.lat!, p.lng!]);

    if (latLngs.length < 2) return;

    const polyline = L.polyline(latLngs, {
      color: '#f43f5e',
      weight: 4,
      dashArray: '8, 8',
      opacity: 0.85,
    }).addTo(map);

    journeyLayerRef.current = polyline;
    map.fitBounds(polyline.getBounds(), { padding: [60, 60], maxZoom: 16 });
  }, [selectedJourneyDateId]);

  // Handle Coordinate Search for unlocated places
  const handleSearchCoords = async (placeName: string) => {
    if (!placeName || placeName.length < 2) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/places/search?q=${encodeURIComponent(placeName)}`);
      if (res.ok) {
        const json = await res.json();
        setSearchResults(json.data || []);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleApplyCoords = async (
    placeId: string,
    lat: number,
    lng: number,
    areaLabel?: string
  ) => {
    if (onUpdatePlaceCoords) {
      await onUpdatePlaceCoords(placeId, lat, lng, areaLabel);
    }
    setSearchingPlaceId(null);
    setSearchResults([]);
  };

  return (
    <div className="space-y-6">
      {/* Privacy Notice Banner */}
      <div className="bg-primary/10 border border-primary/20 rounded-[var(--radius-xl)] p-4 flex items-center gap-3 text-xs sm:text-sm text-text">
        <Shield size={20} className="text-primary shrink-0" />
        <p className="leading-relaxed">
          <strong>Riêng tư:</strong> Địa điểm chính xác chỉ hiện với hai bạn. Thẻ chia sẻ và tổng
          kết không bao giờ in toạ độ hay vị trí chi tiết ra ngoài.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Map Box */}
        <div className="lg:col-span-8 bg-surface rounded-[var(--radius-2xl)] border border-border overflow-hidden shadow-xs relative">
          <div
            ref={mapContainerRef}
            className="w-full h-[450px] sm:h-[550px] z-0"
            style={{ minHeight: '400px' }}
          />

          {validPlacedEntries.length === 0 && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-10">
              <MapPin size={36} className="text-text-muted mb-2 animate-bounce" />
              <h3 className="font-heading text-base font-bold text-text">Chưa có toạ độ nào</h3>
              <p className="text-xs text-text-muted max-w-sm mt-1">
                Các buổi hẹn của bạn chưa được lưu toạ độ. Hãy chọn &quot;Tìm vị trí&quot; ở danh sách
                bên cạnh để ghim kỷ niệm lên bản đồ.
              </p>
            </div>
          )}
        </div>

        {/* Sidebar: Journeys & Missing coordinates */}
        <div className="lg:col-span-4 space-y-6">
          {/* 1. Multi-stop Journeys */}
          <div className="bg-surface rounded-[var(--radius-xl)] border border-border p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-sm font-bold text-text flex items-center gap-1.5">
                <Navigation size={16} className="text-primary" />
                <span>Hành trình nhiều điểm</span>
              </h3>
              {selectedJourneyDateId && (
                <button
                  type="button"
                  onClick={() => setSelectedJourneyDateId(null)}
                  className="text-[11px] text-text-muted hover:text-text cursor-pointer"
                >
                  Bỏ chọn
                </button>
              )}
            </div>

            {multiStopDates.length === 0 ? (
              <p className="text-xs text-text-muted py-2">
                Chưa có buổi hẹn nào ghi từ 2 địa điểm trở lên.
              </p>
            ) : (
              <div className="space-y-2">
                {multiStopDates.map(({ date, places }) => {
                  const isSelected = selectedJourneyDateId === date.id;
                  const parts = date.date_time ? getVnDateParts(date.date_time) : null;
                  const dateStr = parts ? `${parts.day}/${parts.month}` : '';

                  return (
                    <button
                      key={date.id}
                      type="button"
                      onClick={() =>
                        setSelectedJourneyDateId(isSelected ? null : date.id)
                      }
                      className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all cursor-pointer ${
                        isSelected
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border hover:bg-surface-hover text-text'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold">
                        <span className="truncate">{date.title || 'Buổi hẹn'}</span>
                        <span className="text-[11px] opacity-75">{dateStr}</span>
                      </div>
                      <div className="text-[11px] text-text-muted mt-1 truncate">
                        {places.map((p) => p.name).join(' → ')}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Unlocated places helper */}
          {unlocatedPlaces.length > 0 && (
            <div className="bg-surface rounded-[var(--radius-xl)] border border-border p-5 shadow-xs space-y-3.5">
              <h3 className="font-heading text-sm font-bold text-text flex items-center gap-1.5">
                <MapPin size={16} className="text-amber-500" />
                <span>Chưa có toạ độ ({unlocatedPlaces.length})</span>
              </h3>
              <p className="text-xs text-text-muted">
                Tìm vị trí để hiển thị điểm hẹn này trên bản đồ.
              </p>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {unlocatedPlaces.slice(0, 10).map(({ place }) => {
                  const isCurrent = searchingPlaceId === place.id;

                  return (
                    <div
                      key={place.id}
                      className="p-2.5 rounded-lg border border-border bg-surface-hover/30 text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-text truncate max-w-[150px]">
                          {place.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSearchingPlaceId(isCurrent ? null : place.id);
                            setSearchQuery(place.name);
                            if (!isCurrent) handleSearchCoords(place.name);
                          }}
                          className="text-primary font-semibold text-[11px] hover:underline cursor-pointer"
                        >
                          {isCurrent ? 'Đóng' : 'Tìm vị trí'}
                        </button>
                      </div>

                      {/* Coordinate Search drawer */}
                      {isCurrent && (
                        <div className="pt-2 border-t border-border space-y-2">
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder="Nhập tên địa điểm..."
                              className="flex-1 px-2 py-1 text-xs border border-border rounded-md bg-background text-text"
                            />
                            <button
                              type="button"
                              onClick={() => handleSearchCoords(searchQuery)}
                              disabled={isSearching}
                              className="p-1.5 bg-primary text-white rounded-md hover:opacity-90 cursor-pointer"
                            >
                              {isSearching ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <Search size={13} />
                              )}
                            </button>
                          </div>

                          {searchResults.length > 0 && (
                            <div className="space-y-1 max-h-32 overflow-y-auto pt-1">
                              {searchResults.map((res, rIdx) => (
                                <button
                                  key={rIdx}
                                  type="button"
                                  onClick={() =>
                                    res.lat &&
                                    res.lng &&
                                    handleApplyCoords(
                                      place.id,
                                      res.lat,
                                      res.lng,
                                      res.area_label ?? undefined
                                    )
                                  }
                                  className="w-full text-left p-1.5 rounded hover:bg-surface-hover text-[11px] flex justify-between items-center group cursor-pointer"
                                >
                                  <div className="truncate flex-1">
                                    <span className="font-medium text-text block truncate">
                                      {res.name}
                                    </span>
                                    {res.area_label && (
                                      <span className="text-[10px] text-text-muted block truncate">
                                        {res.area_label}
                                      </span>
                                    )}
                                  </div>
                                  <ArrowRight
                                    size={12}
                                    className="text-primary opacity-0 group-hover:opacity-100 transition-opacity ml-1 shrink-0"
                                  />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
