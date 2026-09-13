export interface TarotCard {
  id: number;
  name: string;
  nameVi: string;
  emoji: string;
}

export const MAJOR_ARCANA: TarotCard[] = [
  { id: 0, name: 'The Fool', nameVi: 'Kẻ Khờ', emoji: '🃏' },
  { id: 1, name: 'The Magician', nameVi: 'Nhà Ảo Thuật', emoji: '🎩' },
  { id: 2, name: 'The High Priestess', nameVi: 'Nữ Tu Sĩ', emoji: '🌙' },
  { id: 3, name: 'The Empress', nameVi: 'Nữ Hoàng', emoji: '👑' },
  { id: 4, name: 'The Emperor', nameVi: 'Hoàng Đế', emoji: '🏰' },
  { id: 5, name: 'The Hierophant', nameVi: 'Giáo Hoàng', emoji: '📿' },
  { id: 6, name: 'The Lovers', nameVi: 'Đôi Tình Nhân', emoji: '💕' },
  { id: 7, name: 'The Chariot', nameVi: 'Cỗ Xe', emoji: '🏇' },
  { id: 8, name: 'Strength', nameVi: 'Sức Mạnh', emoji: '🦁' },
  { id: 9, name: 'The Hermit', nameVi: 'Ẩn Sĩ', emoji: '🏔️' },
  { id: 10, name: 'Wheel of Fortune', nameVi: 'Vòng Quay Vận Mệnh', emoji: '🎡' },
  { id: 11, name: 'Justice', nameVi: 'Công Lý', emoji: '⚖️' },
  { id: 12, name: 'The Hanged Man', nameVi: 'Kẻ Bị Treo', emoji: '🙃' },
  { id: 13, name: 'Death', nameVi: 'Tử Thần', emoji: '🦋' },
  { id: 14, name: 'Temperance', nameVi: 'Tiết Chế', emoji: '⏳' },
  { id: 15, name: 'The Devil', nameVi: 'Ác Quỷ', emoji: '😈' },
  { id: 16, name: 'The Tower', nameVi: 'Tòa Tháp', emoji: '🗼' },
  { id: 17, name: 'The Star', nameVi: 'Ngôi Sao', emoji: '⭐' },
  { id: 18, name: 'The Moon', nameVi: 'Mặt Trăng', emoji: '🌕' },
  { id: 19, name: 'The Sun', nameVi: 'Mặt Trời', emoji: '☀️' },
  { id: 20, name: 'Judgement', nameVi: 'Phán Xét', emoji: '📯' },
  { id: 21, name: 'The World', nameVi: 'Thế Giới', emoji: '🌍' },
];

export function getTarotReadingPrompt(cards: TarotCard[]): { system: string; user: string } {
  const [past, present, future] = cards;
  return {
    system: 'Bạn là chuyên gia đọc bài Tarot. Hãy diễn giải trải bài 3 lá (quá khứ - hiện tại - tương lai) về tình yêu. Viết bằng tiếng Việt, ấm áp, sâu sắc. Dùng emoji và format markdown.',
    user: `Diễn giải trải bài Tarot 3 lá cho chuyện tình yêu:\n\n🔮 Quá khứ: ${past.emoji} ${past.nameVi} (${past.name})\n🔮 Hiện tại: ${present.emoji} ${present.nameVi} (${present.name})\n🔮 Tương lai: ${future.emoji} ${future.nameVi} (${future.name})\n\nHãy diễn giải:\n1. Ý nghĩa từng lá bài trong vị trí của nó\n2. Mối liên kết giữa 3 lá\n3. Thông điệp tổng thể cho mối quan hệ\n4. Lời khuyên`,
  };
}
