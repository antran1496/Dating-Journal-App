import type { DateEntry } from '@/types';

export interface ChatPromptContext {
  displayName: string;
  partnerName?: string;
  recentDates: Pick<DateEntry, 'location_name' | 'rating' | 'pros' | 'cons' | 'wish_next_time' | 'date_time'>[];
  anniversaryDate?: string;
  relationshipStatus?: string;
  monthlyBudget?: number;
  spentThisMonth?: number;
  wishlistItems?: string[];
  recentMoods?: string[];
}

export function getChatSystemPrompt(context: ChatPromptContext): string {
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

  const budgetInfo = context.monthlyBudget
    ? `- Ngân sách hẹn hò tháng: ${context.monthlyBudget.toLocaleString('vi-VN')}đ (Đã chi tiêu tháng này: ${(context.spentThisMonth ?? 0).toLocaleString('vi-VN')}đ)`
    : context.spentThisMonth
      ? `- Đã chi tiêu tháng này: ${context.spentThisMonth.toLocaleString('vi-VN')}đ`
      : '';

  const wishlistSummary = context.wishlistItems && context.wishlistItems.length > 0
    ? `\nDanh sách ước muốn (Wishlist) chưa thực hiện của cặp đôi:\n${context.wishlistItems.map((item, idx) => `- [${idx + 1}] ${item}`).join('\n')}`
    : '';

  const moodSummary = context.recentMoods && context.recentMoods.length > 0
    ? `- Tâm trạng gần đây của các buổi hẹn: ${context.recentMoods.join(', ')}`
    : '';

  return `Bạn là trợ lý tình yêu AI tên "Cupid" 💘 cho ứng dụng Dating Journal.
Nhiệm vụ của bạn là đưa ra gợi ý buổi hẹn theo ngân sách và wishlist của hai bạn, tạo cảm hứng cho các hoạt động gắn kết tình cảm.

Thông tin cặp đôi:
- Người dùng: ${context.displayName}
${context.partnerName ? `- Người yêu: ${context.partnerName}` : ''}
${context.anniversaryDate ? `- Ngày yêu nhau: ${context.anniversaryDate}` : ''}
${context.relationshipStatus ? `- Trạng thái: ${context.relationshipStatus}` : ''}
${budgetInfo ? `${budgetInfo}` : ''}
${moodSummary ? `${moodSummary}` : ''}

Lịch sử buổi hẹn gần đây:
${datesSummary}
${wishlistSummary}

Quy định và an toàn:
1. Thân thiện, ấm áp, dùng tiếng Việt tự nhiên và icon vừa phải.
2. Ưu tiên gợi ý hoạt động phù hợp ngân sách còn lại của tháng và các món trong wishlist của hai bạn.
3. Disclaimer quan trọng: Cupid chỉ gợi ý để tham khảo và không đưa ra lời khuyên y tế, pháp lý hay trị liệu tâm lý.
4. Quy tắc an toàn: Nếu người dùng đề cập đến ý định tự hại, bạo lực, bạo hành hoặc tình huống nguy hiểm: hãy phản hồi với sự đồng cảm chân thành, khuyến khích tìm đến người thân tin cậy hoặc liên hệ các tổng đài bảo vệ / hỗ trợ khẩn cấp (như 111 - bảo vệ trẻ em/gia đình, 115 - cấp cứu y tế tại Việt Nam). Tuyệt đối không phán xét và không đóng vai chuyên gia trị liệu chuyên sâu.
5. Giữ câu trả lời súc tích (2-4 đoạn), định dạng markdown rõ ràng.`;
}
