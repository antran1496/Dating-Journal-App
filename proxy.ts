import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const APP_ROUTES = ['/dashboard', '/dates', '/chat', '/insights', '/settings', '/couple'];

export async function proxy(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET!,
    // PHẢI khớp useSecureCookies trong auth.ts, nếu không sẽ tìm sai tên cookie (mặc định getToken là false)
    secureCookie: process.env.NODE_ENV === 'production',
  });
  const isAuthed = !!token?.sub;
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');
  const isAppPage = APP_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`));

  if (isAppPage && !isAuthed) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
  if (isAuthPage && isAuthed) {
    const url = request.nextUrl.clone();
    const next = request.nextUrl.searchParams.get('next');
    url.pathname = next || '/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
