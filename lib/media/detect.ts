/**
 * Media detection and magic bytes validation for Dating Journal v2.
 * Supports JPEG, PNG, WebP, HEIC/HEIF images and MP4, MOV videos.
 */

export interface DetectedMedia {
  mime: string;
  ext: 'jpg' | 'png' | 'webp' | 'heic' | 'mp4' | 'mov';
  kind: 'image' | 'video';
  width?: number;
  height?: number;
}

/**
 * Checks buffer magic bytes to verify file authenticity and format.
 */
export function detectMedia(buffer: Buffer): DetectedMedia | null {
  if (!buffer || buffer.length < 12) {
    return null;
  }

  // 1. JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    const dimensions = parseJpegDimensions(buffer);
    return {
      mime: 'image/jpeg',
      ext: 'jpg',
      kind: 'image',
      width: dimensions?.width,
      height: dimensions?.height,
    };
  }

  // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    let width: number | undefined;
    let height: number | undefined;
    if (buffer.length >= 24) {
      width = buffer.readUInt32BE(16);
      height = buffer.readUInt32BE(20);
    }
    return {
      mime: 'image/png',
      ext: 'png',
      kind: 'image',
      width,
      height,
    };
  }

  // 3. WebP: RIFF .... WEBP
  const riff = buffer.subarray(0, 4).toString('ascii');
  const webp = buffer.subarray(8, 12).toString('ascii');
  if (riff === 'RIFF' && webp === 'WEBP') {
    const dimensions = parseWebpDimensions(buffer);
    return {
      mime: 'image/webp',
      ext: 'webp',
      kind: 'image',
      width: dimensions?.width,
      height: dimensions?.height,
    };
  }

  // 4. ISO Base Media File Format (HEIC, MP4, MOV, etc.)
  // Box header: [4 bytes size][4 bytes 'ftyp'][4 bytes major_brand]
  const boxType = buffer.subarray(4, 8).toString('ascii');
  if (boxType === 'ftyp') {
    const majorBrand = buffer.subarray(8, 12).toString('ascii').trim().toLowerCase();
    const restHeader = buffer.subarray(8, Math.min(64, buffer.length)).toString('ascii').toLowerCase();

    // HEIC / HEIF brands
    const heicBrands = ['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1', 'heim', 'heis'];
    if (heicBrands.some((brand) => restHeader.includes(brand))) {
      return {
        mime: 'image/heic',
        ext: 'heic',
        kind: 'image',
      };
    }

    // QuickTime / MOV
    if (majorBrand === 'qt' || restHeader.includes('qt  ')) {
      return {
        mime: 'video/quicktime',
        ext: 'mov',
        kind: 'video',
      };
    }

    // MP4 brands
    const mp4Brands = ['isom', 'iso2', 'mp41', 'mp42', 'avc1', 'mp71', 'm4v', 'dash'];
    if (mp4Brands.some((brand) => restHeader.includes(brand))) {
      return {
        mime: 'video/mp4',
        ext: 'mp4',
        kind: 'video',
      };
    }
  }

  // QuickTime MOV alternative headers without ftyp box (moov, mdat, wide)
  if (['moov', 'mdat', 'wide', 'skip', 'free'].includes(boxType)) {
    return {
      mime: 'video/quicktime',
      ext: 'mov',
      kind: 'video',
    };
  }

  return null;
}

/**
 * Extracts width/height from JPEG markers
 */
function parseJpegDimensions(buffer: Buffer): { width: number; height: number } | null {
  try {
    let offset = 2;
    const len = buffer.length;

    while (offset < len - 8) {
      if (buffer[offset] !== 0xff) {
        offset++;
        continue;
      }

      const marker = buffer[offset + 1];

      // Standalone markers without length
      if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) {
        offset += 2;
        continue;
      }

      const markerLen = buffer.readUInt16BE(offset + 2);
      if (markerLen < 2) break;

      // SOF0 (0xC0), SOF1 (0xC1), SOF2 (0xC2)
      if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
        const height = buffer.readUInt16BE(offset + 5);
        const width = buffer.readUInt16BE(offset + 7);
        return { width, height };
      }

      offset += 2 + markerLen;
    }
  } catch {
    // Graceful fallback
  }
  return null;
}

/**
 * Extracts width/height from WebP chunks (VP8, VP8L, VP8X)
 */
function parseWebpDimensions(buffer: Buffer): { width: number; height: number } | null {
  try {
    if (buffer.length < 30) return null;
    const chunkType = buffer.subarray(12, 16).toString('ascii');

    // Simple lossy VP8
    if (chunkType === 'VP8 ' && buffer.length >= 30) {
      // 23: 0x9d, 24: 0x01, 25: 0x2a (sync code)
      if (buffer[23] === 0x9d && buffer[24] === 0x01 && buffer[25] === 0x2a) {
        const width = buffer.readUInt16LE(26) & 0x3fff;
        const height = buffer.readUInt16LE(28) & 0x3fff;
        return { width, height };
      }
    }

    // Extended VP8X
    if (chunkType === 'VP8X' && buffer.length >= 30) {
      const width = 1 + buffer.readUIntLE(24, 3);
      const height = 1 + buffer.readUIntLE(27, 3);
      return { width, height };
    }

    // Lossless VP8L
    if (chunkType === 'VP8L' && buffer.length >= 26) {
      if (buffer[20] === 0x2f) {
        const b1 = buffer[21];
        const b2 = buffer[22];
        const b3 = buffer[23];
        const b4 = buffer[24];
        const width = 1 + (((b2 & 0x3f) << 8) | b1);
        const height = 1 + (((b4 & 0x0f) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6));
        return { width, height };
      }
    }
  } catch {
    // Graceful fallback
  }
  return null;
}
