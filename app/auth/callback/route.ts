import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const DEFAULT_REDIRECT_PATH = '/dashboard';

/**
 * Only allow internal relative paths to prevent open-redirect attacks
 * (e.g. `?next=//evil.com` or `?next=https://evil.com`).
 */
function getSafeRedirectPath(next: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return DEFAULT_REDIRECT_PATH;
  }
  return next;
}

/**
 * OAuth callback (PKCE flow).
 * Google → Supabase → here with `?code=...` → exchange code for a session cookie.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const next = getSafeRedirectPath(searchParams.get('next'));
  const providerError = searchParams.get('error_description') ?? searchParams.get('error');

  if (providerError) {
    console.error('[GET /auth/callback] provider error:', providerError);
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=oauth_missing_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('[GET /auth/callback] exchangeCodeForSession:', error.message);
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
  }

  // Behind a proxy/load balancer (e.g. Vercel), prefer the forwarded host
  const forwardedHost = request.headers.get('x-forwarded-host');
  const isLocalEnv = process.env.NODE_ENV === 'development';

  if (!isLocalEnv && forwardedHost) {
    return NextResponse.redirect(`https://${forwardedHost}${next}`);
  }
  return NextResponse.redirect(`${origin}${next}`);
}
