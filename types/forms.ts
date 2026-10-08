import { z } from 'zod';

// Auth
export const loginSchema = z.object({
  email: z.string().min(1, 'Vui lòng nhập email').email('Email không đúng định dạng'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu').min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  display_name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
  email: z.string().min(1, 'Vui lòng nhập email').email('Email không đúng định dạng'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  confirm_password: z.string(),
}).refine((d) => d.password === d.confirm_password, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirm_password'],
});
export type SignupFormValues = z.infer<typeof signupSchema>;

// Couple
export const createCoupleSchema = z.object({
  anniversary_date: z.string().min(1, 'Vui lòng chọn ngày bắt đầu yêu'),
  relationship_status: z.enum(['talking', 'dating', 'official', 'engaged', 'married']),
});
export type CreateCoupleFormValues = z.infer<typeof createCoupleSchema>;

export const joinCoupleSchema = z.object({
  invite_code: z.string().length(6, 'Mã mời phải đúng 6 ký tự').toUpperCase(),
});
export type JoinCoupleFormValues = z.infer<typeof joinCoupleSchema>;

// Date Entry
export const datePlaceInputSchema = z.object({
  name: z.string().min(1, 'Tên địa điểm không được để trống'),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  area_label: z.string().nullable().optional(),
  position: z.number().optional(),
});
export type DatePlaceInput = z.infer<typeof datePlaceInputSchema>;

export const dateMediaInputSchema = z.object({
  path: z.string().min(1, 'Thiếu đường dẫn tệp'),
  thumb_path: z.string().nullable().optional(),
  kind: z.enum(['image', 'video']),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
  duration_s: z.number().nullable().optional(),
  bytes: z.number().nullable().optional(),
  position: z.number().optional(),
});
export type DateMediaInput = z.infer<typeof dateMediaInputSchema>;

export const dateMoodSchema = z.enum(['love', 'happy', 'calm', 'excited', 'tired', 'sad']);
export type DateMoodValue = z.infer<typeof dateMoodSchema>;

export const dateFormSchema = z
  .object({
    title: z.string().max(100, 'Tiêu đề tối đa 100 ký tự').optional(),
    note: z.string().max(500, 'Ghi chú tối đa 500 ký tự').optional(),
    mood: dateMoodSchema.optional(),
    location_name: z.string().optional(),
    date_time: z.string().optional(),
    end_date: z.string().nullable().optional(),
    places: z.array(datePlaceInputSchema).max(8, 'Tối đa 8 địa điểm').optional(),
    media: z
      .array(dateMediaInputSchema)
      .max(9, 'Tối đa 9 ảnh hoặc video')
      .refine((items) => !items || items.filter((m) => m.kind === 'video').length <= 1, {
        message: 'Mỗi kỷ niệm chỉ được lưu tối đa 1 video',
      })
      .optional(),
    tags: z.array(z.string().max(20, 'Mỗi thẻ tối đa 20 ký tự')).max(5, 'Tối đa 5 thẻ').optional(),
    spend_vnd: z.coerce.number().min(0, 'Chi tiêu không thể âm').nullable().optional(),
    paid_by: z.string().nullable().optional(),
    paid_split: z.boolean().optional(),
    song: z.string().max(120, 'Tên bài hát tối đa 120 ký tự').optional(),
    client_id: z.string().optional(),
    pros: z.string().optional(),
    cons: z.string().optional(),
    wish_next_time: z.string().optional(),
    rating: z.coerce.number().min(1, 'Vui lòng chọn điểm đánh giá').max(5).optional(),
    checkin_image_url: z.string().optional(),
    checkin_image_urls: z.array(z.string()).optional(),
  })
  .refine(
    (d) =>
      (d.media && d.media.length > 0) ||
      (d.note && d.note.trim().length > 0) ||
      (d.checkin_image_url && d.checkin_image_url.trim().length > 0) ||
      (d.checkin_image_urls && d.checkin_image_urls.length > 0) ||
      (d.pros && d.pros.trim().length > 0) ||
      (d.location_name && d.location_name.trim().length > 0),
    {
      message: 'Cần ít nhất một ảnh/video hoặc một dòng ghi chú',
      path: ['note'],
    }
  );
export type DateFormValues = z.infer<typeof dateFormSchema>;

export const createDateSchema = z
  .object({
    couple_id: z.string().uuid('couple_id không hợp lệ'),
    title: z.string().max(100, 'Tiêu đề tối đa 100 ký tự').nullable().optional(),
    note: z.string().max(500, 'Ghi chú tối đa 500 ký tự').nullable().optional(),
    mood: dateMoodSchema.nullable().optional(),
    date_time: z.string().nullable().optional(),
    end_date: z.string().nullable().optional(),
    location_name: z.string().nullable().optional(),
    location_lat: z.number().nullable().optional(),
    location_lng: z.number().nullable().optional(),
    places: z.array(datePlaceInputSchema).max(8, 'Tối đa 8 địa điểm').optional(),
    media: z
      .array(dateMediaInputSchema)
      .max(9, 'Tối đa 9 ảnh hoặc video')
      .refine((items) => !items || items.filter((m) => m.kind === 'video').length <= 1, {
        message: 'Mỗi kỷ niệm chỉ được lưu tối đa 1 video',
      })
      .optional(),
    tags: z.array(z.string().max(20, 'Mỗi thẻ tối đa 20 ký tự')).max(5, 'Tối đa 5 thẻ').optional(),
    spend_vnd: z.coerce.number().min(0, 'Chi tiêu không thể âm').nullable().optional(),
    paid_by: z.string().nullable().optional(),
    paid_split: z.boolean().optional(),
    song: z.string().max(120, 'Tên bài hát tối đa 120 ký tự').nullable().optional(),
    client_id: z.string().uuid().nullable().optional(),
    rating: z.coerce.number().min(1).max(5).nullable().optional(),
    pros: z.string().nullable().optional(),
    cons: z.string().nullable().optional(),
    wish_next_time: z.string().nullable().optional(),
    checkin_image_url: z.string().nullable().optional(),
    checkin_image_urls: z.array(z.string()).max(9).optional(),
  })
  .refine(
    (d) =>
      (d.media && d.media.length > 0) ||
      (d.note && d.note.trim().length > 0) ||
      (d.checkin_image_url && d.checkin_image_url.trim().length > 0) ||
      (d.checkin_image_urls && d.checkin_image_urls.length > 0) ||
      (d.pros && d.pros.trim().length > 0) ||
      (d.location_name && d.location_name.trim().length > 0),
    {
      message: 'Cần ít nhất một ảnh/video hoặc một dòng ghi chú',
      path: ['note'],
    }
  );
export type CreateDateInput = z.infer<typeof createDateSchema>;

// Profile
export const profileFormSchema = z.object({
  display_name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
  birth_date: z.string().optional(),
});
export type ProfileFormValues = z.infer<typeof profileFormSchema>;

// Nickname
export const nicknameFormSchema = z.object({
  nickname: z.string().min(1, 'Vui lòng nhập biệt danh').max(30, 'Biệt danh tối đa 30 ký tự'),
});
export type NicknameFormValues = z.infer<typeof nicknameFormSchema>;
