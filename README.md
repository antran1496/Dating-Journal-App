This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

Key variables:
- `APP_URL`: Base application URL for invite links, magic links, QR codes
- `AUTH_SECRET`: Random 32-byte base64 string for signing session cookies (`openssl rand -base64 32`)
- `AUTH_URL`: Base URL (`http://localhost:3000` for development)
- `AUTH_GOOGLE_ID` & `AUTH_GOOGLE_SECRET`: Google OAuth credentials
- `NEXT_PUBLIC_APPLE_ENABLED`: Enable/disable Apple Sign In button (`false` by default)
- `AUTH_APPLE_ID` & `AUTH_APPLE_SECRET`: Apple Sign In credentials
- `SUPABASE_JWT_SECRET`: Supabase Legacy JWT Secret used to sign tokens for PostgREST & RLS
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for admin operations
- `RESEND_API_KEY` & `EMAIL_FROM`: Resend credentials for magic link emails
- `CRON_SECRET`: Bearer secret for background cron endpoints
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`: Web push notification keys
- `GEMINI_API_KEY`: Google Gemini API key for Cupid and Love Insights

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
