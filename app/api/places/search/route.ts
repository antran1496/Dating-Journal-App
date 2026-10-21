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
    const googleMapsKey =
      process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const goongKey = process.env.GOONG_API_KEY;

    // 1. Google Places Autocomplete API (if configured)
    if (googleMapsKey) {
      try {
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
            query
          )}&components=country:vn&language=vi&key=${encodeURIComponent(googleMapsKey)}`
        );
        if (res.ok) {
          const json = await res.json();
          const predictions = (json.predictions || []) as Array<{
            description: string;
            structured_formatting?: { main_text?: string; secondary_text?: string };
          }>;
          results = predictions.map((p) => ({
            name: p.structured_formatting?.main_text || p.description,
            lat: null,
            lng: null,
            area_label: p.structured_formatting?.secondary_text || null,
          }));
        }
      } catch (gErr) {
        console.warn('Google Places search error, falling back:', gErr);
      }
    }

    // 2. Goong Place Autocomplete (if configured)
    if (results.length === 0 && goongKey) {
      try {
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
            lat: null,
            lng: null,
            area_label: p.structured_formatting?.secondary_text || null,
          }));
        }
      } catch (goongErr) {
        console.warn('Goong search error, falling back:', goongErr);
      }
    }

    // 3. Photon API with Vietnam Bounding Box & Coordinates Bias
    if (results.length === 0) {
      try {
        const photonRes = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(
            query
          )}&lat=10.7769&lon=106.7009&bbox=102.14,8.18,109.46,23.39&limit=8&lang=default`,
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

          // Strictly filter Vietnam locations only
          const vnFeatures = features.filter((f) => {
            const p = f.properties || {};
            const coords = f.geometry?.coordinates;
            const isVnCoords =
              coords &&
              coords[0] >= 102 &&
              coords[0] <= 110 &&
              coords[1] >= 8 &&
              coords[1] <= 24;
            const isVnCountry = p.country && /việt nam|vietnam|vn/i.test(p.country);
            return isVnCoords || isVnCountry;
          });

          vnFeatures.forEach((f) => {
            const p = f.properties || {};
            const coords = f.geometry?.coordinates;
            const streetAddr = [p.housenumber, p.street].filter(Boolean).join(' ');
            const mainTitle = p.name || streetAddr || query;
            const secondaryParts = [
              p.name && streetAddr ? streetAddr : null,
              p.district || p.suburb,
              p.city || p.state,
            ].filter(Boolean);

            results.push({
              name: mainTitle,
              lat: coords ? coords[1] : null,
              lng: coords ? coords[0] : null,
              area_label: secondaryParts.length > 0 ? secondaryParts.join(', ') : (p.city || p.state || null),
            });
          });
        }
      } catch (photonErr) {
        console.warn('Photon search error:', photonErr);
      }
    }

    // 4. Complement / Fallback with OpenStreetMap Nominatim (Vietnam strictly)
    if (results.length < 5) {
      try {
        const nomRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(
            query
          )}&countrycodes=vn&limit=6`,
          {
            headers: {
              'User-Agent': 'DatingJournalApp/2.0 (contact@datingjournal.app)',
              'Accept-Language': 'vi,en;q=0.9',
            },
          }
        );

        if (nomRes.ok) {
          const items = (await nomRes.json()) as Array<{
            lat?: string;
            lon?: string;
            name?: string;
            display_name: string;
            address?: Record<string, string | undefined>;
          }>;

          items.forEach((item) => {
            const addr = item.address || {};
            const streetAddr = [
              addr.house_number,
              addr.road || addr.street || addr.pedestrian,
            ]
              .filter(Boolean)
              .join(' ');
            const mainTitle = item.name || streetAddr || item.display_name.split(',')[0].trim();
            const secondaryParts = [
              item.name && streetAddr ? streetAddr : null,
              addr.suburb || addr.quarter || addr.neighbourhood || addr.ward,
              addr.city_district || addr.district || addr.county,
              addr.city || addr.state || addr.province,
            ].filter(Boolean);

            const areaLabel = secondaryParts.length > 0 ? secondaryParts.join(', ') : null;

            // Avoid adding duplicates
            if (!results.some((r) => r.name.toLowerCase() === mainTitle.toLowerCase())) {
              results.push({
                name: mainTitle,
                lat: item.lat ? parseFloat(item.lat) : null,
                lng: item.lon ? parseFloat(item.lon) : null,
                area_label: areaLabel,
              });
            }
          });
        }
      } catch (nomErr) {
        console.warn('Nominatim search error:', nomErr);
      }
    }

    cacheMap.set(cacheKey, { timestamp: Date.now(), data: results });
    return NextResponse.json({ data: results });
  } catch (err) {
    console.error('Place search error:', err);
    return NextResponse.json({ error: 'Không thể tìm kiếm địa điểm' }, { status: 500 });
  }
}
