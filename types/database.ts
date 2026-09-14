export type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  birth_date: string | null;
  created_at: string;
};

export type Couple = {
  id: string;
  invite_code: string;
  anniversary_date: string | null;
  relationship_status: 'talking' | 'dating' | 'official' | 'engaged' | 'married';
  created_by: string;
  created_at: string;
};

export type CoupleMember = {
  couple_id: string;
  profile_id: string;
  nickname: string | null;
  role: string;
};

export type DateEntry = {
  id: string;
  couple_id: string;
  date_time: string | null;
  end_date: string | null;
  location_name: string | null;
  location_lat: number | null;
  location_lng: number | null;
  checkin_image_url: string | null;
  checkin_image_urls: string[] | null;
  pros: string | null;
  cons: string | null;
  wish_next_time: string | null;
  rating: number | null;
  created_by: string;
  created_at: string;
};

export type UserPreferences = {
  profile_id: string;
  theme_mode: 'light' | 'dark' | 'system';
  primary_color: string;
  font_heading: string;
  font_body: string;
};

export type Nickname = {
  id: string;
  couple_id: string;
  given_by: string;
  given_to: string;
  nickname: string;
  created_at: string;
};

export type CoupleWithMembers = Couple & {
  couple_members: (CoupleMember & {
    profile: Profile;
  })[];
};

export type AiReading = {
  id: string;
  profile_id: string;
  type: 'numerology' | 'zodiac' | 'tarot' | 'palm';
  input_data: Record<string, unknown>;
  result_text: string;
  created_at: string;
};

export type AiChatSession = {
  id: string;
  couple_id: string;
  title: string;
  created_by: string;
  created_at: string;
};

export type AiChatMessage = {
  id: string;
  session_id: string;
  sender: 'user' | 'ai';
  content: string;
  created_at: string;
};
