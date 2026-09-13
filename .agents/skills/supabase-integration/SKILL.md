# Supabase Integration Skill

---
name: supabase-integration
description: Guidelines for Supabase client setup, RLS policies, and database operations in the Dating Journal App.
---

## Client Setup

### Browser Client (`lib/supabase/client.ts`)
```ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Server Client (`lib/supabase/server.ts`)
```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

### Middleware (`lib/supabase/middleware.ts`)
- Refresh session tokens on every request
- Redirect unauthenticated users to `/login`
- Redirect authenticated users away from `/login` and `/signup`

## RLS Policy Patterns

### Profile access
```sql
-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can read partner's profile
CREATE POLICY "Users can view partner profile" ON profiles
  FOR SELECT USING (
    id IN (
      SELECT cm2.profile_id FROM couple_members cm1
      JOIN couple_members cm2 ON cm1.couple_id = cm2.couple_id
      WHERE cm1.profile_id = auth.uid()
    )
  );
```

### Couple-scoped access
```sql
-- Generic pattern for couple-scoped tables
CREATE POLICY "Couple members can access" ON [table_name]
  FOR ALL USING (
    couple_id IN (
      SELECT couple_id FROM couple_members
      WHERE profile_id = auth.uid()
    )
  );
```

## Environment Variables Required
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # Server-side only, for admin operations
```
