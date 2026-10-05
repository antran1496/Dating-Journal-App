import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { User } from '@supabase/supabase-js';

// Dùng getSession() thay vì getUser() để tiết kiệm 1 network round-trip.
// getSession() chỉ decode JWT từ cookie.
// Tính bảo mật vẫn được đảm bảo vì middleware đã gọi getUser() để kiểm tra session.
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session) {
    const { data: { user } } = await supabase.auth.getUser();
    return user ?? null;
  }
  
  return session.user;
});
