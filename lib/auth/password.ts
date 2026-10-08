import 'server-only';
import bcrypt from 'bcryptjs';

export const hashPassword = (plain: string) => bcrypt.hash(plain, 10);
export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);
// Hash giả để thời gian phản hồi không lộ email có tồn tại hay không
export const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);
