#!/usr/bin/env node
/**
 * Script sinh Apple Client Secret JWT (ES256) cho NextAuth / Auth.js từ file private key .p8 của Apple Developer.
 *
 * Cách dùng:
 *   node scripts/generate-apple-secret.mjs <TEAM_ID> <KEY_ID> <CLIENT_ID> <PATH_TO_P8_FILE>
 * Hoặc thiết lập qua biến môi trường:
 *   APPLE_TEAM_ID, APPLE_KEY_ID, AUTH_APPLE_ID, APPLE_PRIVATE_KEY_PATH
 *
 * Lưu ý: Apple quy định client secret có hạn tối đa 6 tháng (180 ngày).
 * Sau 6 tháng bạn cần chạy lại script này để tạo secret mới và cập nhật AUTH_APPLE_SECRET.
 */

import { readFileSync, existsSync } from 'node:fs';
import { SignJWT, importPKCS8 } from 'jose';

const teamId = process.env.APPLE_TEAM_ID || process.argv[2];
const keyId = process.env.APPLE_KEY_ID || process.argv[3];
const clientId = process.env.AUTH_APPLE_ID || process.env.APPLE_CLIENT_ID || process.argv[4];
const p8Path = process.env.APPLE_PRIVATE_KEY_PATH || process.argv[5];

if (!teamId || !keyId || !clientId || !p8Path) {
  console.error(`
❌ Thiếu tham số!
Cách dùng:
  node scripts/generate-apple-secret.mjs <TEAM_ID> <KEY_ID> <CLIENT_ID> <PATH_TO_P8>

Ví dụ:
  node scripts/generate-apple-secret.mjs ABCD1234EF 9876ZYXWVU com.datingjournal.app ./AuthKey_9876ZYXWVU.p8

Các biến môi trường có thể dùng thay thế:
  APPLE_TEAM_ID
  APPLE_KEY_ID
  AUTH_APPLE_ID
  APPLE_PRIVATE_KEY_PATH
`);
  process.exit(1);
}

if (!existsSync(p8Path)) {
  console.error(`❌ Không tìm thấy file private key tại: ${p8Path}`);
  process.exit(1);
}

async function main() {
  try {
    const rawPrivateKey = readFileSync(p8Path, 'utf8');
    const privateKey = await importPKCS8(rawPrivateKey, 'ES256');

    // Apple quy định hạn tối đa 180 ngày (6 tháng)
    const clientSecret = await new SignJWT({})
      .setProtectedHeader({ alg: 'ES256', kid: keyId })
      .setIssuer(teamId)
      .setIssuedAt()
      .setExpirationTime('180d')
      .setAudience('https://appleid.apple.com')
      .setSubject(clientId)
      .sign(privateKey);

    console.log('\n✅ Tạo Apple Client Secret thành công!');
    console.log('⏰ Thời hạn: 180 ngày (tối đa theo quy định của Apple)\n');
    console.log('Copy giá trị bên dưới vào biến môi trường AUTH_APPLE_SECRET:');
    console.log('------------------------------------------------------------');
    console.log(clientSecret);
    console.log('------------------------------------------------------------\n');
  } catch (err) {
    console.error('❌ Lỗi khi sinh Apple Client Secret:', err);
    process.exit(1);
  }
}

main();
