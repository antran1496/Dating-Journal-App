import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';

interface CacheEntry {
  timestamp: number;
  data: PlaceResult[];
}

interface PlaceResult {
  name: string;
  lat: number | null;
  lng: number | null;
  area_label: string | null;
}

// In-memory rate limiting: 30 requests / 60s per user
const rateLimitMap = new Map<string, number[]>();
// In-memory search cache: 10 minutes
const cacheMap = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(userId) || [];
  const recent = timestamps.filter((t) => now - t < 60 * 1000);

  if (recent.length >= 30) {
    return false;
  }

  recent.push(now);
  rateLimitMap.set(userId, recent);
  return true;
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  if (!checkRateLimit(user.id)) {
    return NextResponse.json(
      { error: 'Bạn đang tìm kiếm quá nhanh, vui lòng thử lại sau giây lát.' },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('q') || '').trim();

  if (!query || query.length < 2) {
    return NextResponse.json({ data: [] });
  }

  const cacheKey = query.toLowerCase();
  const cached = cacheMap.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json({ data: cached.data });
  }

  try {
    let results: PlaceResult[] = [];
    const goongKey = process.env.GOONG_API_KEY;

    if (goongKey) {
      // Goong Place Autocomplete
      const res = await fetch(
        `https://rsapi.goong.io/Place/AutoComplete?api_key=${encodeURIComponent(
          goongKey
        )}&input=${encodeURIComponent(query)}&limit=8`
      );
      if (res.ok) {
        const json = await res.json();
        const predictions = (json.predictions || []) as Array<{
          description: string;
          structured_formatting?: { main_text?: string; secondary_text?: string };
        }>;
        results = predictions.map((p) => ({
          name: p.structured_formatting?.main_text || p.description,
          lat: null, // Goong AutoComplete requires separate Place Detail call if coordinates needed
          lng: null,
          area_label: p.structured_formatting?.secondary_text || null,
        }));
      }
    } else {
      // 1. Try Photon first (fast POI autocomplete with prefix matching)
      try {
        const photonRes = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=10&lang=default`,
          { headers: { 'Accept-Language': 'vi,en;q=0.9' } }
        );
        if (photonRes.ok) {
          const photonJson = await photonRes.json();
          const features = (photonJson.features || []) as Array<{
            geometry?: { coordinates?: [number, number] };
            properties?: {
              name?: string;
              street?: string;
              housenumber?: string;
              district?: string;
              suburb?: string;
              city?: string;
              state?: string;
              country?: string;
            };
          }>;

          const vnFeatures = features.filter((f) => {
            const p = f.properties || {};
            if (p.country && /việt nam|vietnam/i.test(p.country)) return true;
            const coords = f.geometry?.coordinates;
            if (coords && coords[0] >= 102 && coords[0] <= 110 && coords[1] >= 8 && coords[1] <= 24) return true;
            return !p.country;
          });

          if (vnFeatures.length > 0) {
            results = vnFeatures.map((f) => {
              const p = f.properties || {};
              const coords = f.geometry?.coordinates;
              const addrParts = [
                p.housenumber,
                p.street,
                p.district || p.suburb,
                p.city || p.state,
              ].filter(Boolean);
              return {
                name: p.name || addrParts[0] || query,
                lat: coords ? coords[1] : null,
                lng: coords ? coords[0] : null,
                area_label: addrParts.length > 0 ? addrParts.join(', ') : (p.city || p.state || null),
              };
            });
          }
        }
      } catch (photonErr) {
        console.warn('Photon search error, falling back to Nominatim:', photonErr);
      }

      // 2. Fallback to Nominatim if Photon returned no results
      if (results.length === 0) {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(
            query
          )}&countrycodes=vn&limit=8`,
          {
            headers: {
              'User-Agent': 'DatingJournalApp/2.0 (contact@datingjournal.app)',
              'Accept-Language': 'vi,en;q=0.9',
            },
          }
        );

        if (res.ok) {
          const items = (await res.json()) as Array<{
            lat?: string;
            lon?: string;
            name?: string;
            display_name: string;
            address?: Record<string, string | undefined>;
          }>;
          results = items.map((item) => {
            const parts = item.display_name.split(',').map((s) => s.trim());
            const mainName = item.name || parts[0];
            const secondaryParts = parts
              .slice(1)
              .filter((p) => p !== 'Việt Nam' && !/^\d{5,6}$/.test(p));

            return {
              name: mainName,
              lat: item.lat ? parseFloat(item.lat) : null,
              lng: item.lon ? parseFloat(item.lon) : null,
              area_label: secondaryParts.length > 0 ? secondaryParts.join(', ') : null,
            };
          });
        }
      }
    }

    cacheMap.set(cacheKey, { timestamp: Date.now(), data: results });
    return NextResponse.json({ data: results });
  } catch (err) {
    console.error('Place search error:', err);
    return NextResponse.json({ error: 'Không thể tìm kiếm địa điểm' }, { status: 500 });
  }
}
