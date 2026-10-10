import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const APP_ROUTES = [
  '/dashboard',
  '/dates',
  '/chat',
  '/cupid',
  '/insights',
  '/settings',
  '/couple',
  '/more',
  '/together',
  '/daily',
  '/spending',
  '/map',
  '/capsules',
  '/quiz',
  '/wrapped',
  '/wishlist',
  '/onboarding',
];

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

  // 1. Chưa đăng nhập mà truy cập trang ứng dụng -> chuyển hướng sang /login kèm ?next=
  if (isAppPage && !isAuthed) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    if (pathname !== '/dashboard') {
      url.searchParams.set('next', pathname);
    }
    return NextResponse.redirect(url);
  }

  // 2. Đã đăng nhập mà truy cập trang auth (/login, /signup) -> chuyển hướng sang /dashboard
  if (isAuthPage && isAuthed) {
    const url = request.nextUrl.clone();
    const next = request.nextUrl.searchParams.get('next');
    url.pathname = next || '/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }

  // 3. Đã có tài khoản / phiên đăng nhập mà vào trang root (/) -> chuyển thẳng vào trang chủ /dashboard
  if (pathname === '/' && isAuthed) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
