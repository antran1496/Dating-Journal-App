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
      // OpenStreetMap Nominatim with VN bias
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
          const addr = item.address || {};
          const area =
            addr.suburb ||
            addr.quarter ||
            addr.city_district ||
            addr.district ||
            addr.county ||
            addr.city ||
            addr.state ||
            null;

          const mainName =
            addr.amenity ||
            addr.shop ||
            addr.tourism ||
            addr.building ||
            item.name ||
            item.display_name.split(',')[0];

          return {
            name: mainName || item.display_name.split(',')[0],
            lat: item.lat ? parseFloat(item.lat) : null,
            lng: item.lon ? parseFloat(item.lon) : null,
            area_label: area,
          };
        });
      }
    }

    cacheMap.set(cacheKey, { timestamp: Date.now(), data: results });
    return NextResponse.json({ data: results });
  } catch (err) {
    console.error('Place search error:', err);
    return NextResponse.json({ error: 'Không thể tìm kiếm địa điểm' }, { status: 500 });
  }
}
