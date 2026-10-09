export type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  birth_date: string | null;
  onboarded_at?: string | null;
  consent_at?: string | null;
  consent_version?: string | null;
  created_at: string;
};

export type Couple = {
  id: string;
  invite_code: string;
  anniversary_date: string | null;
  relationship_status: 'talking' | 'dating' | 'official' | 'engaged' | 'married';
  timezone?: string;
  monthly_budget_vnd?: number | null;
  dissolved_at?: string | null;
  purge_after?: string | null;
  created_by: string;
  created_at: string;
};

export type CoupleMember = {
  couple_id: string;
  profile_id: string;
  nickname: string | null;
  role: string;
  left_at?: string | null;
};

export type DateMood = 'love' | 'happy' | 'calm' | 'excited' | 'tired' | 'sad';

export type DateEntry = {
  id: string;
  couple_id: string;
  title?: string | null;
  note?: string | null;
  mood?: DateMood | null;
  date_time: string | null;
  end_date: string | null;
  location_name: string | null;
  location_lat: number | null;
  location_lng: number | null;
  spend_vnd?: number | null;
  paid_by?: string | null;
  paid_split?: boolean;
  song?: string | null;
  tags?: string[];
  client_id?: string | null;
  checkin_image_url: string | null;
  checkin_image_urls: string[] | null;
  pros: string | null;
  cons: string | null;
  wish_next_time: string | null;
  rating: number | null;
  created_by: string;
  created_at: string;
  updated_at?: string;
  places?: DatePlace[];
  media?: DateMedia[];
  reactions?: DateReaction[];
  comments?: DateComment[];
  views?: DateView[];
};

export type DateReaction = {
  date_id: string;
  profile_id: string;
  emoji: string;
  created_at: string;
  profile?: Profile;
};

export type DateComment = {
  id: string;
  date_id: string;
  author_id: string | null;
  body: string;
  created_at: string;
  edited_at?: string | null;
  deleted_at?: string | null;
  author?: Profile;
};

export type DateView = {
  date_id: string;
  profile_id: string;
  seen_at: string;
  profile?: Profile;
};

export type Question = {
  id: number;
  text_vi: string;
  text_en?: string | null;
  category: string;
  active: boolean;
  created_at: string;
};

export type CoupleDailyQuestion = {
  couple_id: string;
  day: string;
  question_id: number;
  question?: Question;
};

export type DailyAnswer = {
  couple_id: string;
  day: string;
  profile_id: string;
  body: string;
  answered_at: string;
  profile?: Profile;
};

export type WishlistItem = {
  id: string;
  couple_id: string;
  title: string;
  note?: string | null;
  budget_vnd?: number | null;
  created_by?: string | null;
  done_at?: string | null;
  done_by?: string | null;
  linked_date_id?: string | null;
  created_at: string;
};

export type DatePlace = {
  id: string;
  date_id: string;
  position: number;
  name: string;
  lat: number | null;
  lng: number | null;
  area_label?: string | null;
};

export type DateMedia = {
  id: string;
  date_id: string;
  couple_id: string;
  kind: 'image' | 'video';
  path: string;
  thumb_path?: string | null;
  width?: number | null;
  height?: number | null;
  duration_s?: number | null;
  bytes?: number | null;
  position: number;
  created_by?: string | null;
  created_at: string;
};

export type UserPreferences = {
  profile_id: string;
  theme_mode: 'light' | 'dark' | 'system';
  primary_color: string;
  font_heading: string;
  font_body: string;
  locale: 'vi' | 'en';
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

export type UsageCounter = {
  scope: string;
  feature: string;
  day: string;
  count: number;
};

export type CoupleInvite = {
  id: string;
  couple_id: string;
  created_by: string | null;
  token_hash: string;
  code_hash: string;
  code_hint: string;
  message: string | null;
  expires_at: string;
  used_at: string | null;
  used_by: string | null;
  revoked_at: string | null;
  created_at: string;
};

export type InviteAttempt = {
  id: number;
  profile_id: string | null;
  ip: string | null;
  success: boolean;
  created_at: string;
};


