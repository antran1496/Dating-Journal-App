const ZODIAC_SIGNS = [
  { name: 'Bạch Dương', emoji: '♈', startMonth: 3, startDay: 21, endMonth: 4, endDay: 19 },
  { name: 'Kim Ngưu', emoji: '♉', startMonth: 4, startDay: 20, endMonth: 5, endDay: 20 },
  { name: 'Song Tử', emoji: '♊', startMonth: 5, startDay: 21, endMonth: 6, endDay: 21 },
  { name: 'Cự Giải', emoji: '♋', startMonth: 6, startDay: 22, endMonth: 7, endDay: 22 },
  { name: 'Sư Tử', emoji: '♌', startMonth: 7, startDay: 23, endMonth: 8, endDay: 22 },
  { name: 'Xử Nữ', emoji: '♍', startMonth: 8, startDay: 23, endMonth: 9, endDay: 22 },
  { name: 'Thiên Bình', emoji: '♎', startMonth: 9, startDay: 23, endMonth: 10, endDay: 23 },
  { name: 'Bọ Cạp', emoji: '♏', startMonth: 10, startDay: 24, endMonth: 11, endDay: 21 },
  { name: 'Nhân Mã', emoji: '♐', startMonth: 11, startDay: 22, endMonth: 12, endDay: 21 },
  { name: 'Ma Kết', emoji: '♑', startMonth: 12, startDay: 22, endMonth: 1, endDay: 19 },
  { name: 'Bảo Bình', emoji: '♒', startMonth: 1, startDay: 20, endMonth: 2, endDay: 18 },
  { name: 'Song Ngư', emoji: '♓', startMonth: 2, startDay: 19, endMonth: 3, endDay: 20 },
] as const;

export type ZodiacSign = typeof ZODIAC_SIGNS[number];

export function getZodiacSign(birthDate: string): ZodiacSign {
  const date = new Date(birthDate);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const sign = ZODIAC_SIGNS.find((z) => {
    if (z.startMonth === z.endMonth) return month === z.startMonth && day >= z.startDay && day <= z.endDay;
    if (z.startMonth > z.endMonth) return (month === z.startMonth && day >= z.startDay) || (month === z.endMonth && day <= z.endDay);
    return (month === z.startMonth && day >= z.startDay) || (month === z.endMonth && day <= z.endDay);
  });
  return sign ?? ZODIAC_SIGNS[0];
}

export { ZODIAC_SIGNS };

export function getZodiacCompatibilityPrompt(sign1Name: string, person1: string, sign2Name: string, person2: string): { system: string; user: string } {
  return {
    system: 'Bạn là chuyên gia chiêm tinh học. Hãy phân tích tương hợp cặp đôi chi tiết, ấm áp, tích cực nhưng thực tế. Viết bằng tiếng Việt, dùng emoji. Format markdown.',
    user: `Phân tích tương hợp cung hoàng đạo:\n- ${person1}: ${sign1Name}\n- ${person2}: ${sign2Name}\n\nHãy phân tích:\n1. Điểm tương hợp (cho % tương hợp ước lượng)\n2. Điểm mạnh của cặp đôi\n3. Thử thách có thể gặp\n4. Lời khuyên để mối quan hệ bền vững\n5. Hoạt động hẹn hò phù hợp cho 2 cung này`,
  };
}
