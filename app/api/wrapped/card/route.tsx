import { NextRequest, NextResponse } from 'next/server';
import { ImageResponse } from 'next/og';
import { getCurrentUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { toShareable, RawWrappedData } from '@/lib/wrapped/sanitize';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

// Load fonts from assets/fonts/
let regularFont: Buffer | null = null;
let boldFont: Buffer | null = null;

function getFonts() {
  if (!regularFont) {
    const regPath = path.join(process.cwd(), 'assets', 'fonts', 'BeVietnamPro-Regular.ttf');
    regularFont = fs.readFileSync(regPath);
  }
  if (!boldFont) {
    const boldPath = path.join(process.cwd(), 'assets', 'fonts', 'BeVietnamPro-Bold.ttf');
    boldFont = fs.readFileSync(boldPath);
  }
  return { regularFont, boldFont };
}

const TEMPLATES = {
  classic: {
    bg: 'linear-gradient(135deg, #FF6B8B 0%, #FF8E53 100%)',
    textColor: '#FFFFFF',
    cardBg: 'rgba(255, 255, 255, 0.2)',
    accent: '#FFE5EC',
  },
  modern: {
    bg: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)',
    textColor: '#FFFFFF',
    cardBg: 'rgba(255, 255, 255, 0.1)',
    accent: '#818CF8',
  },
  sunset: {
    bg: 'linear-gradient(135deg, #FB923C 0%, #F43F5E 50%, #881337 100%)',
    textColor: '#FFFFFF',
    cardBg: 'rgba(255, 255, 255, 0.2)',
    accent: '#FED7AA',
  },
  minimal: {
    bg: 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)',
    textColor: '#0F172A',
    cardBg: 'rgba(0, 0, 0, 0.05)',
    accent: '#64748B',
  },
  retro: {
    bg: 'linear-gradient(135deg, #FEF08A 0%, #F472B6 100%)',
    textColor: '#4A044E',
    cardBg: 'rgba(255, 255, 255, 0.4)',
    accent: '#831843',
  },
  milestone: {
    bg: 'linear-gradient(135deg, #F59E0B 0%, #D97706 50%, #78350F 100%)',
    textColor: '#FFFFFF',
    cardBg: 'rgba(255, 255, 255, 0.18)',
    accent: '#FDE68A',
  },
};

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || '2026';
  const templateKey = (searchParams.get('template') || 'classic') as keyof typeof TEMPLATES;
  const showWatermark = searchParams.get('watermark') !== 'false';
  const includeSpend = searchParams.get('spend') === 'true';

  const template = TEMPLATES[templateKey] || TEMPLATES.classic;

  const supabase = await createClient(user);
  const { data: member } = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('profile_id', user.id)
    .maybeSingle();

  if (!member?.couple_id) {
    return new NextResponse('Couple not found', { status: 404 });
  }

  // Fetch aggregate data via RPC
  const { data: rawWrapped, error: rpcError } = await supabase.rpc('get_wrapped', {
    p_couple_id: member.couple_id,
    p_period: period,
  });

  if (rpcError || !rawWrapped) {
    return new NextResponse('Error generating wrapped card', { status: 500 });
  }

  // Whitelist sanitize - guarantees zero notes/coordinates leak
  const data = toShareable(rawWrapped as unknown as RawWrappedData, { includeSpend });

  const { regularFont: regData, boldFont: boldData } = getFonts();

  // Generate QR code pointing to app
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dating-journal-app.vercel.app';
  const qrDataUrl = await QRCode.toDataURL(`${appUrl}/?ref=wrapped`, {
    margin: 1,
    width: 140,
    color: {
      dark: '#1e293b',
      light: '#ffffff',
    },
  });

  const periodLabel = period.length === 7 ? `Tháng ${period.slice(5)}/${period.slice(0, 4)}` : `Năm ${period}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '1080px',
          height: '1920px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '100px 80px',
          background: template.bg,
          color: template.textColor,
          fontFamily: 'Be Vietnam Pro',
          position: 'relative',
        }}
      >
        {/* Top Header */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              fontSize: '32px',
              fontWeight: 700,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: template.accent,
            }}
          >
            <span>Dating Journal</span>
            <span>•</span>
            <span>Wrapped {periodLabel}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', marginTop: '30px' }}>
            <span style={{ fontSize: '72px', fontWeight: 800, lineHeight: 1.1 }}>
              {data.days_together > 0 ? `${data.days_together} ngày bên nhau` : 'Hành trình bên nhau'}
            </span>
            <span style={{ fontSize: '42px', fontWeight: 500, marginTop: '16px', opacity: 0.9 }}>
              {data.partner1_name} &amp; {data.partner2_name}
            </span>
          </div>
        </div>

        {/* Middle Stats Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', margin: '40px 0' }}>
          <div style={{ display: 'flex', gap: '30px' }}>
            {/* Stat Box 1 */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                padding: '40px',
                borderRadius: '36px',
                background: template.cardBg,
                backdropFilter: 'blur(20px)',
              }}
            >
              <span style={{ fontSize: '76px', fontWeight: 800 }}>{data.total_dates}</span>
              <span style={{ fontSize: '30px', marginTop: '10px', opacity: 0.9 }}>Buổi hẹn hò đã lưu</span>
            </div>

            {/* Stat Box 2 */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                padding: '40px',
                borderRadius: '36px',
                background: template.cardBg,
                backdropFilter: 'blur(20px)',
              }}
            >
              <span style={{ fontSize: '76px', fontWeight: 800 }}>{data.unique_locations}</span>
              <span style={{ fontSize: '30px', marginTop: '10px', opacity: 0.9 }}>Địa điểm khám phá</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '30px' }}>
            {/* Stat Box 3 */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                padding: '40px',
                borderRadius: '36px',
                background: template.cardBg,
                backdropFilter: 'blur(20px)',
              }}
            >
              <span style={{ fontSize: '76px', fontWeight: 800 }}>{data.total_photos}</span>
              <span style={{ fontSize: '30px', marginTop: '10px', opacity: 0.9 }}>Khoảnh khắc hình ảnh</span>
            </div>

            {/* Stat Box 4 */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                padding: '40px',
                borderRadius: '36px',
                background: template.cardBg,
                backdropFilter: 'blur(20px)',
              }}
            >
              <span style={{ fontSize: '76px', fontWeight: 800 }}>{data.longest_streak}</span>
              <span style={{ fontSize: '30px', marginTop: '10px', opacity: 0.9 }}>Ngày chuỗi trả lời</span>
            </div>
          </div>

          {/* Area Labels or Mood Pill */}
          {data.area_labels.length > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '30px 40px',
                borderRadius: '30px',
                background: template.cardBg,
                fontSize: '28px',
                gap: '16px',
              }}
            >
              <span>📍 Khám phá tại:</span>
              <span style={{ fontWeight: 600 }}>{data.area_labels.join(' · ')}</span>
            </div>
          )}
        </div>

        {/* Bottom Footer / Watermark */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '2px solid rgba(255, 255, 255, 0.2)',
            paddingTop: '40px',
          }}
        >
          {showWatermark ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrDataUrl}
                alt="QR Code"
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '16px',
                  padding: '8px',
                  background: '#FFFFFF',
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '32px', fontWeight: 700 }}>Tạo bằng Dating Journal 💗</span>
                <span style={{ fontSize: '24px', opacity: 0.8 }}>Ứng dụng nhật ký tình yêu</span>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex' }} />
          )}

          <div style={{ display: 'flex', fontSize: '26px', opacity: 0.8 }}>
            <span>{period}</span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1920,
      fonts: [
        {
          name: 'Be Vietnam Pro',
          data: regData,
          style: 'normal',
          weight: 400,
        },
        {
          name: 'Be Vietnam Pro',
          data: boldData,
          style: 'normal',
          weight: 700,
        },
      ],
      headers: {
        'Cache-Control': 'private, max-age=3600',
      },
    }
  );
}
