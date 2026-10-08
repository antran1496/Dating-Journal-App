#!/usr/bin/env node
/**
 * Backfill script: Chuyển dữ liệu v1 (location_*, checkin_image_urls) sang date_places và date_media
 * Idempotent, hỗ trợ cờ --dry-run
 *
 * Cách chạy:
 *   node scripts/backfill-v2-media.mjs [--dry-run]
 */

import { readFileSync } from 'node:fs';
import { Client } from 'pg';

const isDryRun = process.argv.includes('--dry-run');

function extractStoragePath(urlOrPath) {
  if (!urlOrPath) return null;
  const match = urlOrPath.match(/\/checkin-images\/(.+)$/);
  if (match) {
    return decodeURIComponent(match[1]);
  }
  return urlOrPath;
}

async function main() {
  const env = readFileSync('.env.local', 'utf8');
  const match = env.match(/DATABASE_URL=["']?([^"'\r\n]+)/);
  if (!match) {
    console.error('❌ Không tìm thấy DATABASE_URL trong .env.local');
    process.exit(1);
  }

  const client = new Client({ connectionString: match[1] });
  await client.connect();

  console.log(`\n🚀 Bắt đầu backfill dữ liệu v1 → v2 (Chế độ: ${isDryRun ? 'DRY RUN' : 'THỰC THI'})...\n`);

  try {
    const { rows: dates } = await client.query('SELECT * FROM public.dates ORDER BY created_at ASC');
    console.log(`Tìm thấy ${dates.length} kỷ niệm trong bảng dates.`);

    let placesAdded = 0;
    let mediaAdded = 0;

    for (const d of dates) {
      // 1. Backfill date_places từ location_*
      if (d.location_name) {
        const { rows: existingPlaces } = await client.query(
          'SELECT id FROM public.date_places WHERE date_id = $1 AND position = 0',
          [d.id]
        );

        if (existingPlaces.length === 0) {
          placesAdded++;
          if (!isDryRun) {
            await client.query(
              `INSERT INTO public.date_places (date_id, position, name, lat, lng)
               VALUES ($1, 0, $2, $3, $4)
               ON CONFLICT (date_id, position) DO NOTHING`,
              [d.id, d.location_name, d.location_lat, d.location_lng]
            );
          }
        }
      }

      // 2. Backfill date_media từ checkin_image_urls / checkin_image_url
      const rawUrls = [];
      if (Array.isArray(d.checkin_image_urls)) {
        rawUrls.push(...d.checkin_image_urls);
      } else if (d.checkin_image_url) {
        rawUrls.push(d.checkin_image_url);
      }

      for (let pos = 0; pos < rawUrls.length; pos++) {
        const path = extractStoragePath(rawUrls[pos]);
        if (!path) continue;

        const { rows: existingMedia } = await client.query(
          'SELECT id FROM public.date_media WHERE date_id = $1 AND path = $2',
          [d.id, path]
        );

        if (existingMedia.length === 0) {
          mediaAdded++;
          if (!isDryRun) {
            await client.query(
              `INSERT INTO public.date_media (date_id, couple_id, kind, path, position, created_by)
               VALUES ($1, $2, 'image', $3, $4, $5)`,
              [d.id, d.couple_id, path, pos, d.created_by]
            );
          }
        }
      }
    }

    console.log('\n=============================================');
    console.log(`✅ Kết quả ${isDryRun ? 'Dry-Run' : 'Backfill'}:`);
    console.log(`- Kỷ niệm đã duyệt: ${dates.length}`);
    console.log(`- Địa điểm (${isDryRun ? 'sẽ tạo' : 'đã tạo'}): ${placesAdded}`);
    console.log(`- Media (${isDryRun ? 'sẽ tạo' : 'đã tạo'}): ${mediaAdded}`);
    console.log('=============================================\n');
  } catch (err) {
    console.error('❌ Lỗi khi backfill:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
