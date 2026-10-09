export type LoveLanguage = 'words' | 'time' | 'gifts' | 'acts' | 'touch';

export interface QuizOption {
  text: string;
  language: LoveLanguage;
}

export interface QuizQuestion {
  id: number;
  optionA: QuizOption;
  optionB: QuizOption;
}

export interface QuizScores {
  words: number;
  time: number;
  gifts: number;
  acts: number;
  touch: number;
}

export const LOVE_LANGUAGES_INFO: Record<LoveLanguage, { name: string; icon: string; description: string }> = {
  words: {
    name: 'Lời nói yêu thương',
    icon: '💬',
    description: 'Bạn cảm nhận tình yêu sâu sắc qua những lời động viên, khen ngợi chân thành và câu nói ngọt ngào.',
  },
  time: {
    name: 'Thời gian chất lượng',
    icon: '⏳',
    description: 'Bạn trân trọng những phút giây trọn vẹn bên nhau mà không bị xao nhãng bởi điện thoại hay công việc.',
  },
  gifts: {
    name: 'Quà tặng ý nghĩa',
    icon: '🎁',
    description: 'Bạn cảm động vì tâm sức, sự chu đáo và kỷ niệm được gửi gắm trong từng món quà bất ngờ.',
  },
  acts: {
    name: 'Hành động giúp đỡ',
    icon: '🤝',
    description: 'Hành động thực tế, sự chăm sóc âm thầm và chia sẻ gánh nặng khiến bạn cảm thấy được che chở nhất.',
  },
  touch: {
    name: 'Cử chỉ âu yếm',
    icon: '🫂',
    description: 'Những cái nắm tay, cái ôm ấm áp hay cái tựa đầu nhẹ nhàng là nguồn năng lượng tình yêu lớn nhất với bạn.',
  },
};

/**
 * 15 questions with pairwise language comparisons.
 * Exactly 6 occurrences for each of the 5 languages across 30 options.
 */
export const LOVE_QUIZ_QUESTIONS: QuizQuestion[] = [
  // Pair 1: words vs time
  {
    id: 1,
    optionA: { text: 'Người ấy nói những lời động viên khi tôi gặp khó khăn', language: 'words' },
    optionB: { text: 'Người ấy dành trọn một buổi tối chỉ để lắng nghe tôi', language: 'time' },
  },
  // Pair 2: gifts vs acts
  {
    id: 2,
    optionA: { text: 'Người ấy tặng tôi một món quà nhỏ mà tôi từng vô tình nhắc đến', language: 'gifts' },
    optionB: { text: 'Người ấy chủ động giúp tôi sửa xe hoặc chuẩn bị đồ ăn sáng', language: 'acts' },
  },
  // Pair 3: touch vs words
  {
    id: 3,
    optionA: { text: 'Người ấy ôm chặt tôi từ phía sau khi tôi đang mệt mỏi', language: 'touch' },
    optionB: { text: 'Người ấy gửi tin nhắn khen ngợi hoặc nói lời yêu tôi mỗi ngày', language: 'words' },
  },
  // Pair 4: time vs gifts
  {
    id: 4,
    optionA: { text: 'Cùng nhau đi dạo công viên không bấm điện thoại', language: 'time' },
    optionB: { text: 'Nhận được một món quà lưu niệm sau chuyến đi xa của người ấy', language: 'gifts' },
  },
  // Pair 5: acts vs touch
  {
    id: 5,
    optionA: { text: 'Người ấy dọn dẹp phòng hoặc phụ việc nhà khi tôi bận rộn', language: 'acts' },
    optionB: { text: 'Được nắm tay người ấy khi đi qua những con phố đông đúc', language: 'touch' },
  },
  // Pair 6: words vs gifts
  {
    id: 6,
    optionA: { text: 'Một bức thư tay viết những lời cảm ơn và thương yêu chân thành', language: 'words' },
    optionB: { text: 'Một bó hoa hay món quà đặc biệt vào một ngày bình thường', language: 'gifts' },
  },
  // Pair 7: time vs acts
  {
    id: 7,
    optionA: { text: 'Có những cuộc trò chuyện sâu sắc thâu đêm cùng nhau', language: 'time' },
    optionB: { text: 'Người ấy nấu cho tôi một bữa cơm nóng hổi khi tôi ốm', language: 'acts' },
  },
  // Pair 8: touch vs gifts
  {
    id: 8,
    optionA: { text: 'Cảm giác ấm áp khi tựa đầu vào vai người ấy xem phim', language: 'touch' },
    optionB: { text: 'Người ấy tìm mua đúng món đồ tôi tìm kiếm từ lâu', language: 'gifts' },
  },
  // Pair 9: words vs acts
  {
    id: 9,
    optionA: { text: 'Lời khen rằng người ấy luôn tự hào về tôi trước mặt bạn bè', language: 'words' },
    optionB: { text: 'Người ấy đưa đón tôi đi làm trong những ngày mưa gió', language: 'acts' },
  },
  // Pair 10: time vs touch
  {
    id: 10,
    optionA: { text: 'Cùng nhau trải nghiệm một chuyến đi du lịch xa đáng nhớ', language: 'time' },
    optionB: { text: 'Một nụ hôn ấm áp chào tạm biệt trước khi đi làm', language: 'touch' },
  },
  // Pair 11: words vs time (cycle repeat)
  {
    id: 11,
    optionA: { text: 'Nhận được lời công nhận khi tôi nỗ lực đạt mục tiêu', language: 'words' },
    optionB: { text: 'Người ấy gác lại công việc bận rộn để ăn tối cùng tôi', language: 'time' },
  },
  // Pair 12: time vs gifts (cycle repeat)
  {
    id: 12,
    optionA: { text: 'Cùng nhau nấu ăn và chia sẻ niềm vui trong gian bếp nhỏ', language: 'time' },
    optionB: { text: 'Một món quà bất ngờ kẹp trong sổ tay', language: 'gifts' },
  },
  // Pair 13: gifts vs acts (cycle repeat)
  {
    id: 13,
    optionA: { text: 'Món quà được đóng gói tỉ mỉ và xinh xắn', language: 'gifts' },
    optionB: { text: 'Người ấy giúp tôi giải quyết một rắc rối kỹ thuật phức tạp', language: 'acts' },
  },
  // Pair 14: acts vs touch (cycle repeat)
  {
    id: 14,
    optionA: { text: 'Người ấy thức dậy sớm chuẩn bị ô che mưa cho tôi', language: 'acts' },
    optionB: { text: 'Cái nắm tay thật chặt khi cùng nhau băng qua đường lớn', language: 'touch' },
  },
  // Pair 15: touch vs words (cycle repeat)
  {
    id: 15,
    optionA: { text: 'Một cái xoa đầu hoặc vỗ về dịu dàng khi tôi căng thẳng', language: 'touch' },
    optionB: { text: 'Lời khẳng định: "Dù có chuyện gì, anh/em vẫn luôn ở bên bạn"', language: 'words' },
  },
];

/**
 * Pure scoring function for 15 quiz answers
 */
export function calculateQuizScores(answers: Record<number, 'A' | 'B'>): {
  scores: QuizScores;
  primaryLanguage: LoveLanguage;
} {
  const scores: QuizScores = {
    words: 0,
    time: 0,
    gifts: 0,
    acts: 0,
    touch: 0,
  };

  for (const q of LOVE_QUIZ_QUESTIONS) {
    const choice = answers[q.id];
    if (choice === 'A') {
      scores[q.optionA.language]++;
    } else if (choice === 'B') {
      scores[q.optionB.language]++;
    }
  }

  // Find language with max score
  let maxLang: LoveLanguage = 'words';
  let maxVal = -1;
  const order: LoveLanguage[] = ['words', 'time', 'gifts', 'acts', 'touch'];

  for (const lang of order) {
    if (scores[lang] > maxVal) {
      maxVal = scores[lang];
      maxLang = lang;
    }
  }

  return { scores, primaryLanguage: maxLang };
}

/**
 * Returns static compatibility advice and 3 actionable tips for any pair of love languages
 */
export function getCoupleAdvice(lang1: LoveLanguage, lang2: LoveLanguage): {
  compatibilityRate: number;
  matchDescription: string;
  tips: string[];
} {
  if (lang1 === lang2) {
    return {
      compatibilityRate: 95,
      matchDescription: 'Cùng chung ngôn ngữ tình yêu! Hai bạn rất dễ dàng thấu hiểu và đáp ứng nhu cầu cảm xúc của nhau.',
      tips: [
        'Tiếp tục duy trì thói quen yêu thương quen thuộc vì cả hai đều có cùng điểm chạm.',
        'Thỉnh thoảng thử đổi mới cách thể hiện để tình cảm thêm phong phú và tươi mới.',
        'Đừng ngần ngại nói thẳng mong muốn vì người ấy sẽ hiểu ngay điều bạn cần.',
      ],
    };
  }

  const tipsMap: Record<string, string[]> = {
    'words-time': [
      'Người yêu thời gian: Hãy dành cho người ấy sự hiện diện trọn vẹn, không lướt điện thoại khi đang hẹn hò.',
      'Người yêu lời nói: Đừng tiếc những lời khen ngợi chân thành, ghi chú dễ thương gửi đến đối phương.',
      'Lên lịch những buổi hẹn hò cà phê ấm cúng để vừa có thời gian riêng, vừa tâm sự sâu sắc.',
    ],
    'words-gifts': [
      'Gửi kèm một tấm thiệp hoặc mẩu giấy viết tay mỗi khi tặng quà cho đối phương.',
      'Khen ngợi và cảm ơn chân thành mỗi khi nhận được món quà, dù là nhỏ nhất.',
      'Lắng nghe những điều người ấy nhắc đến hàng ngày để chọn quà đúng ý nghĩa.',
    ],
    'words-acts': [
      'Vừa giúp đỡ vừa nói lời dịu dàng: Hành động sẽ càng ngọt ngào hơn khi đi kèm lời nói khích lệ.',
      'Công nhận và cảm ơn những việc nhỏ đối phương làm cho bạn hàng ngày.',
      'Thay vì chỉ nói, hãy chủ động làm một việc cụ thể để chia sẻ áp lực cùng người ấy.',
    ],
    'words-touch': [
      'Trao một cái ôm ấm áp trước khi nói những lời yêu thương hay tâm sự.',
      'Nắm tay đối phương khi đang cùng nhau trò chuyện hoặc đi dạo.',
      'Nói lời động viên kèm theo cái xoa lưng nhẹ nhàng khi đối phương có chuyện buồn.',
    ],
    'time-gifts': [
      'Tặng những món quà có thể cùng nhau trải nghiệm (vé xem phim, chuyến du lịch, workshop).',
      'Lưu giữ những món quà kỷ niệm tại một góc quen thuộc trong không gian chung.',
      'Dành thời gian cùng người ấy mở và tận hưởng món quà nhận được.',
    ],
    'time-acts': [
      'Cùng nhau làm việc nhà hoặc nấu ăn để biến việc thường ngày thành thời gian chất lượng.',
      'Chủ động giải quyết công việc giúp người ấy có thêm thời gian rảnh rỗi bên bạn.',
      'Lên kế hoạch hẹn hò chu đáo từ trước để người ấy không phải lo toan chuẩn bị.',
    ],
    'time-touch': [
      'Ngồi sát bên nhau, tựa vai hoặc nắm tay trong những buổi tối xem phim hay trò chuyện.',
      'Dành trọn 15 phút mỗi ngày chỉ để ôm nhau và lắng nghe một ngày của đối phương.',
      'Tận hưởng những chuyến đi dạo chậm rãi tay trong tay.',
    ],
    'gifts-acts': [
      'Chuẩn bị những món quà mang tính hỗ trợ công việc hoặc chăm sóc sức khỏe đối phương.',
      'Tự tay làm quà (bánh ngọt, đồ handmade) kết hợp cả sự chăm sóc lẫn quà tặng.',
      'Nhớ những sở thích nhỏ và chuẩn bị sẵn đồ ăn vặt yêu thích khi người ấy bận rộn.',
    ],
    'gifts-touch': [
      'Trao quà kèm một cái ôm thật chặt hoặc một nụ hôn bất ngờ.',
      'Tặng những món đồ êm ái, mang lại cảm giác ấm áp như khăn choàng, áo ấm, gấu bông.',
      'Dành những cái chạm nhẹ tinh tế thể hiện sự nâng niu mỗi ngày.',
    ],
    'acts-touch': [
      'Massage nhẹ vai hoặc chân cho đối phương sau một ngày dài làm việc vất vả.',
      'Chủ động làm việc nhà kèm một nụ cười ấm áp và cái ôm động viên.',
      'Nắm tay dắt người ấy khi qua đường hoặc xách đồ giúp đối phương.',
    ],
  };

  const key1 = `${lang1}-${lang2}`;
  const key2 = `${lang2}-${lang1}`;
  const tips = tipsMap[key1] || tipsMap[key2] || [
    'Thường xuyên hỏi đối phương cảm thấy được yêu thương nhất khi nào.',
    'Chủ động học cách thể hiện theo ngôn ngữ của người ấy thay vì chỉ theo thói quen của mình.',
    'Kiên nhẫn và chia sẻ thẳng thắn về mong muốn cảm xúc của bản thân.',
  ];

  return {
    compatibilityRate: 85,
    matchDescription: 'Hai ngôn ngữ tình yêu bổ trợ cho nhau rất tốt! Học cách nói ngôn ngữ của đối phương sẽ giúp tình cảm càng thêm sâu sắc.',
    tips,
  };
}
