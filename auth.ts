import NextAuth, { CredentialsSignin } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { loginSchema } from '@/types/forms';
import { authenticateWithPassword, RateLimitedError, upsertGoogleUser } from '@/lib/auth/users';

class InvalidCredentials extends CredentialsSignin {
  code = 'invalid_credentials';
}
class RateLimited extends CredentialsSignin {
  code = 'rate_limited';
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  useSecureCookies: process.env.NODE_ENV === 'production', // phải khớp secureCookie trong proxy.ts
  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24 },
  pages: { signIn: '/login', error: '/login' },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: { params: { prompt: 'select_account' } }, // giữ hành vi cũ
    }),
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw, request) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) throw new InvalidCredentials();
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
        try {
          const user = await authenticateWithPassword(parsed.data.email, parsed.data.password, ip);
          if (!user) throw new InvalidCredentials();
          return { id: user.id, email: user.email };
        } catch (e) {
          if (e instanceof RateLimitedError) throw new RateLimited();
          throw e;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === 'google') return profile?.email_verified === true && !!profile.email;
      return true;
    },
    async jwt({ token, user, account, profile }) {
      // Chỉ chạy nhánh này lúc đăng nhập (account có giá trị)
      if (account?.provider === 'google' && profile?.sub && profile.email) {
        const u = await upsertGoogleUser({
          sub: profile.sub,
          email: profile.email,
          name: profile.name as string | undefined,
          picture: profile.picture as string | undefined,
        });
        token.sub = u.id; // ghi đè sub của Google bằng UUID nội bộ
      } else if (account?.provider === 'credentials' && user?.id) {
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
