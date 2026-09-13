// Calculate Life Path Number from birth date
export function calculateLifePathNumber(birthDate: string): number {
  const digits = birthDate.replace(/-/g, '').split('').map(Number);
  let sum = digits.reduce((a, b) => a + b, 0);
  while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
    sum = sum.toString().split('').map(Number).reduce((a, b) => a + b, 0);
  }
  return sum;
}

export function getNumerologyPrompt(birthDate: string, displayName: string): { system: string; user: string } {
  const lifePathNumber = calculateLifePathNumber(birthDate);
  return {
    system: `Bạn là chuyên gia thần số học. Hãy viết luận giải chi tiết, ấm áp, và liên hệ đến tình yêu. Viết bằng tiếng Việt. Dùng emoji phù hợp. Format: dùng markdown với heading, bullet points.`,
    user: `Luận giải thần số học cho ${displayName}:\n- Ngày sinh: ${birthDate}\n- Số chủ đạo (Life Path): ${lifePathNumber}\n\nHãy phân tích:\n1. Ý nghĩa số chủ đạo ${lifePathNumber}\n2. Tính cách trong tình yêu\n3. Điểm mạnh và điểm cần cải thiện\n4. Lời khuyên cho mối quan hệ`,
  };
}
