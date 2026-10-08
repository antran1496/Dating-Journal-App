import { describe, it, expect } from 'vitest';
import { detectMedia } from './detect';

describe('detectMedia', () => {
  it('detects PNG format with dimensions', () => {
    // 8-byte signature + 4-byte chunk len + 4-byte 'IHDR' + 4-byte width (800) + 4-byte height (600)
    const buf = Buffer.alloc(32);
    // Signature
    buf.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
    buf.write('IHDR', 12);
    buf.writeUInt32BE(800, 16);
    buf.writeUInt32BE(600, 20);

    const result = detectMedia(buf);
    expect(result).not.toBeNull();
    expect(result?.mime).toBe('image/png');
    expect(result?.ext).toBe('png');
    expect(result?.kind).toBe('image');
    expect(result?.width).toBe(800);
    expect(result?.height).toBe(600);
  });

  it('detects JPEG format', () => {
    const buf = Buffer.alloc(30);
    buf[0] = 0xff;
    buf[1] = 0xd8;
    buf[2] = 0xff;
    buf[3] = 0xe0; // APP0 marker
    buf.writeUInt16BE(16, 4); // len

    const result = detectMedia(buf);
    expect(result).not.toBeNull();
    expect(result?.mime).toBe('image/jpeg');
    expect(result?.ext).toBe('jpg');
    expect(result?.kind).toBe('image');
  });

  it('detects WebP format', () => {
    const buf = Buffer.alloc(40);
    buf.write('RIFF', 0);
    buf.writeUInt32LE(32, 4);
    buf.write('WEBP', 8);
    buf.write('VP8X', 12);

    const result = detectMedia(buf);
    expect(result).not.toBeNull();
    expect(result?.mime).toBe('image/webp');
    expect(result?.ext).toBe('webp');
    expect(result?.kind).toBe('image');
  });

  it('detects HEIC format', () => {
    const buf = Buffer.alloc(32);
    buf.writeUInt32BE(24, 0);
    buf.write('ftyp', 4);
    buf.write('heic', 8);

    const result = detectMedia(buf);
    expect(result).not.toBeNull();
    expect(result?.mime).toBe('image/heic');
    expect(result?.ext).toBe('heic');
    expect(result?.kind).toBe('image');
  });

  it('detects MP4 format', () => {
    const buf = Buffer.alloc(32);
    buf.writeUInt32BE(24, 0);
    buf.write('ftyp', 4);
    buf.write('isom', 8);

    const result = detectMedia(buf);
    expect(result).not.toBeNull();
    expect(result?.mime).toBe('video/mp4');
    expect(result?.ext).toBe('mp4');
    expect(result?.kind).toBe('video');
  });

  it('detects QuickTime MOV format', () => {
    const buf = Buffer.alloc(32);
    buf.writeUInt32BE(24, 0);
    buf.write('ftyp', 4);
    buf.write('qt  ', 8);

    const result = detectMedia(buf);
    expect(result).not.toBeNull();
    expect(result?.mime).toBe('video/quicktime');
    expect(result?.ext).toBe('mov');
    expect(result?.kind).toBe('video');
  });

  it('rejects unknown binary data or short buffers', () => {
    const shortBuf = Buffer.from('hello');
    expect(detectMedia(shortBuf)).toBeNull();

    const randomBuf = Buffer.alloc(40);
    randomBuf.fill(0xaa);
    expect(detectMedia(randomBuf)).toBeNull();
  });
});
