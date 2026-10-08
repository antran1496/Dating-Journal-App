import { NextResponse } from 'next/server';

// T0.3 (S3/S4): Vô hiệu hoá endpoint join cũ theo mã v1
// Hệ thống lời mời v2 (token 1 lần, 48h, Crockford base32) sẽ được hoàn thiện ở P1.
export async function POST() {
  return NextResponse.json(
    { error: 'Tính năng nhập mã mời cũ đã ngưng hoạt động. Vui lòng sử dụng liên kết mời mới.' },
    { status: 410 }
  );
}
