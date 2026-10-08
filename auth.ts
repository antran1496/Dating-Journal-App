import NextAuth, { CredentialsSignin } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import Apple from 'next-auth/providers/apple';
import { loginSchema } from '@/types/forms';
import { authenticateWithPassword, RateLimitedError, upsertOAuthUser } from '@/lib/auth/users';
import { consumeMagicToken } from '@/lib/auth/magic';

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
    ...(process.env.AUTH_APPLE_ID && process.env.AUTH_APPLE_SECRET
      ? [
          Apple({
            clientId: process.env.AUTH_APPLE_ID,
            clientSecret: process.env.AUTH_APPLE_SECRET,
          }),
        ]
      : []),
    Credentials({
      id: 'credentials',
      name: 'Password',
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
    Credentials({
      id: 'magic-link',
      name: 'Magic Link',
      credentials: { token: {} },
      async authorize(credentials) {
        if (!credentials?.token || typeof credentials.token !== 'string') {
          throw new InvalidCredentials();
        }
        const user = await consumeMagicToken(credentials.token);
        if (!user) throw new InvalidCredentials();
        return { id: user.id, email: user.email };
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === 'google') return profile?.email_verified === true && !!profile.email;
      if (account?.provider === 'apple') {
        const rawVerified = (profile as Record<string, unknown> | undefined)?.email_verified;
        const isVerified = rawVerified === true || rawVerified === 'true';
        return isVerified && !!profile?.email;
      }
      return true;
    },
    async jwt({ token, user, account, profile }) {
      // Chỉ chạy nhánh này lúc đăng nhập (account có giá trị)
      if ((account?.provider === 'google' || account?.provider === 'apple') && profile?.sub && profile.email) {
        let nameStr: string | undefined = undefined;
        if (typeof profile.name === 'string') {
          nameStr = profile.name;
        } else if (profile.name && typeof profile.name === 'object') {
          const { firstName, lastName } = profile.name as { firstName?: string; lastName?: string };
          nameStr = [firstName, lastName].filter(Boolean).join(' ') || undefined;
        }

        const u = await upsertOAuthUser({
          provider: account.provider as 'google' | 'apple',
          sub: profile.sub,
          email: profile.email,
          name: nameStr,
          picture: (profile as { picture?: string }).picture,
          emailVerified: profile.email_verified as boolean | string | undefined,
        });
        token.sub = u.id; // ghi đè sub của OAuth bằng UUID nội bộ
      } else if ((account?.provider === 'credentials' || account?.provider === 'magic-link') && user?.id) {
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

