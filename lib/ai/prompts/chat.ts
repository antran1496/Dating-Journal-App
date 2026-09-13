import type { DateEntry } from '@/types';

export function getChatSystemPrompt(context: {
  displayName: string;
  partnerName?: string;
  recentDates: Pick<DateEntry, 'location_name' | 'rating' | 'pros' | 'cons' | 'wish_next_time' | 'date_time'>[];
  anniversaryDate?: string;
  relationshipStatus?: string;
}): string {
  const datesSummary = context.recentDates.length > 0
    ? context.recentDates.map((d, i) => {
        let summary = `${i + 1}. ${d.location_name}`;
        if (d.rating) summary += ` (${d.rating}⭐)`;
        if (d.pros) summary += ` — Thích: ${d.pros}`;
        if (d.cons) summary += ` — Chưa thích: ${d.cons}`;
        if (d.wish_next_time) summary += ` — Muốn lần sau: ${d.wish_next_time}`;
        return summary;
      }).join('\n')
    : 'Chưa có buổi hẹn nào được ghi nhận.';

  return `Bạn là trợ lý tình yêu AI tên "Cupid" 💘 cho ứng dụng Dating Journal.

Thông tin cặp đôi:
- Người dùng: ${context.displayName}
${context.partnerName ? `- Người yêu: ${context.partnerName}` : ''}
${context.anniversaryDate ? `- Ngày yêu nhau: ${context.anniversaryDate}` : ''}
${context.relationshipStatus ? `- Trạng thái: ${context.relationshipStatus}` : ''}

Lịch sử buổi hẹn gần đây:
${datesSummary}

Quy tắc:
- Trả lời bằng tiếng Việt, thân thiện, dùng emoji vừa phải
- Gợi ý dựa trên sở thích thực tế từ lịch sử hẹn hò
- Có thể gợi ý địa điểm, hoạt động, quà tặng, cách giải quyết xung đột
- Giữ câu trả lời ngắn gọn (2-4 đoạn), trừ khi user yêu cầu chi tiết hơn
- Format markdown khi cần (bullet points, bold)`;
}
