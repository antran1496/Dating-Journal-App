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
export const dateFormSchema = z.object({
  location_name: z.string().min(1, 'Vui lòng nhập địa điểm'),
  date_time: z.string().optional(),
  end_date: z.string().optional(),
  pros: z.string().optional(),
  cons: z.string().optional(),
  wish_next_time: z.string().optional(),
  rating: z.coerce.number().min(1, 'Vui lòng chọn điểm đánh giá').max(5).optional(),
});
export type DateFormValues = z.infer<typeof dateFormSchema>;

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
