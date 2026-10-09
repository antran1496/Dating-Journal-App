'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Heart, Sparkles, CheckCircle2, RotateCcw, ArrowRight, Loader2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import {
  LOVE_QUIZ_QUESTIONS,
  LOVE_LANGUAGES_INFO,
  LoveLanguage,
  QuizScores,
} from '@/lib/quiz/love-languages';

interface QuizResultItem {
  id: string;
  profile_id: string;
  scores: QuizScores;
  primary_language: LoveLanguage;
  created_at: string;
}

interface QuizComparison {
  myLanguage: LoveLanguage;
  partnerLanguage: LoveLanguage;
  compatibilityRate: number;
  matchDescription: string;
  tips: string[];
}

export default function QuizPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isTakingQuiz, setIsTakingQuiz] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, 'A' | 'B'>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [myResult, setMyResult] = useState<QuizResultItem | null>(null);
  const [partnerResult, setPartnerResult] = useState<QuizResultItem | null>(null);
  const [partnerName, setPartnerName] = useState<string>('Người ấy');
  const [comparison, setComparison] = useState<QuizComparison | null>(null);

  const loadResults = useCallback(async () => {
    try {
      const res = await fetch('/api/quiz');
      if (res.ok) {
        const json = await res.json();
        setMyResult(json.data.myResult);
        setPartnerResult(json.data.partnerResult);
        setPartnerName(json.data.partnerName || 'Người ấy');
        setComparison(json.data.comparison);
      }
    } catch (err) {
      console.error('Failed to load quiz results:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  const handleSelectOption = (choice: 'A' | 'B') => {
    const qId = LOVE_QUIZ_QUESTIONS[currentQuestionIndex].id;
    const nextAnswers = { ...answers, [qId]: choice };
    setAnswers(nextAnswers);

    if (currentQuestionIndex < LOVE_QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      // Finished all 15 questions, submit
      submitQuiz(nextAnswers);
    }
  };

  const submitQuiz = async (finalAnswers: Record<number, 'A' | 'B'>) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: finalAnswers }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Không thể lưu kết quả');
      }

      toast({ type: 'success', title: 'Đã hoàn thành quiz thành công! 🎉' });
      setIsTakingQuiz(false);
      loadResults();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra';
      toast({ type: 'error', title: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const startQuiz = () => {
    setAnswers({});
    setCurrentQuestionIndex(0);
    setIsTakingQuiz(true);
  };

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  // 1. ACTIVE QUIZ WIZARD (15 questions)
  if (isTakingQuiz) {
    const currentQuestion = LOVE_QUIZ_QUESTIONS[currentQuestionIndex];
    const progress = Math.round(((currentQuestionIndex + 1) / LOVE_QUIZ_QUESTIONS.length) * 100);

    return (
      <div className="max-w-xl mx-auto space-y-6 pb-12 animate-[fadeIn_0.3s_ease-out]">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-text-muted">
            <span>
              Câu {currentQuestionIndex + 1} / {LOVE_QUIZ_QUESTIONS.length}
            </span>
            <span>{progress}% hoàn thành</span>
          </div>
          <div className="w-full h-2 rounded-full bg-border overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <Card className="p-6 sm:p-8 space-y-6 border border-border bg-surface">
          <div className="text-center space-y-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-primary">
              Bạn cảm thấy được yêu thương hơn khi...
            </span>
            <h2 className="text-lg sm:text-xl font-heading font-bold text-text">
              Hãy chọn 1 trong 2 điều khiến trái tim bạn rung động nhất:
            </h2>
          </div>

          <div className="space-y-4 pt-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSelectOption('A')}
              className="w-full text-left p-5 rounded-2xl border-2 border-border bg-surface-hover/60 hover:bg-surface-hover hover:border-primary/50 transition-all cursor-pointer flex items-center justify-between gap-4 group active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                  A
                </span>
                <span className="text-sm sm:text-base font-medium text-text">
                  {currentQuestion.optionA.text}
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSelectOption('B')}
              className="w-full text-left p-5 rounded-2xl border-2 border-border bg-surface-hover/60 hover:bg-surface-hover hover:border-primary/50 transition-all cursor-pointer flex items-center justify-between gap-4 group active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                  B
                </span>
                <span className="text-sm sm:text-base font-medium text-text">
                  {currentQuestion.optionB.text}
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </button>
          </div>

          {currentQuestionIndex > 0 && (
            <div className="flex justify-start pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
              >
                ← Quay lại câu trước
              </Button>
            </div>
          )}
        </Card>
      </div>
    );
  }

  // 2. HAS NOT TAKEN QUIZ YET
  if (!myResult) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 pb-12 animate-[fadeIn_0.3s_ease-out]">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text flex items-center gap-2">
            <Heart className="w-6 h-6 text-primary" />
            Quiz ngôn ngữ tình yêu
          </h1>
          <p className="text-text-muted text-sm mt-1">
            Mỗi người làm riêng, kết quả so sánh khi cả hai xong.
          </p>
        </div>

        <Card className="p-8 sm:p-12 text-center space-y-6 border border-border bg-surface shadow-sm">
          <div className="w-20 h-20 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
            <Sparkles className="w-10 h-10" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="font-heading font-bold text-xl text-text">
              Khám phá cách đối phương cảm nhận tình yêu
            </h2>
            <p className="text-sm text-text-muted leading-relaxed">
              Bài trắc nghiệm gồm 15 câu đối chiếu 5 ngôn ngữ tình yêu: Lời khen ngợi, Thời gian, Quà tặng, Hành động và Cử chỉ âu yếm.
            </p>
          </div>

          <Button variant="primary" size="lg" onClick={startQuiz} className="px-8 shadow-glow gap-2 text-base">
            <Heart className="w-5 h-5" />
            Bắt đầu làm Quiz (15 câu)
          </Button>
        </Card>
      </div>
    );
  }

  // 3. COMPLETED VIEW (Own result + Comparison when partner finishes)
  const myInfo = LOVE_LANGUAGES_INFO[myResult.primary_language];
  const partnerInfo = partnerResult ? LOVE_LANGUAGES_INFO[partnerResult.primary_language] : null;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-[fadeIn_0.3s_ease-out]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text flex items-center gap-2">
            <Heart className="w-6 h-6 text-primary" />
            Kết quả Quiz ngôn ngữ tình yêu
          </h1>
          <p className="text-text-muted text-sm mt-1">
            Mỗi người làm riêng, kết quả so sánh khi cả hai xong.
          </p>
        </div>

        <Button variant="secondary" size="sm" onClick={startQuiz} className="gap-2">
          <RotateCcw className="w-3.5 h-3.5" />
          Làm lại bài test
        </Button>
      </div>

      {/* Comparison or Waiting Notice */}
      {partnerResult && comparison ? (
        <Card className="p-6 sm:p-8 space-y-6 border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent bg-surface shadow-md">
          <div className="text-center space-y-2">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
              Mức độ tương thích: {comparison.compatibilityRate}% ✨
            </span>
            <h2 className="text-xl sm:text-2xl font-heading font-bold text-text pt-2">
              {myInfo.name} &amp; {partnerInfo?.name}
            </h2>
            <p className="text-sm text-text-muted max-w-lg mx-auto">
              {comparison.matchDescription}
            </p>
          </div>

          {/* 3 Static Pair Tips */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-primary" />
              3 Gợi ý gắn kết dành riêng cho hai bạn
            </h3>
            <div className="grid grid-cols-1 gap-2.5">
              {comparison.tips.map((tip, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-surface border border-border/80 flex items-start gap-3 text-sm text-text"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-6 border border-dashed border-amber-500/40 bg-amber-500/5 text-center space-y-3">
          <Users className="w-8 h-8 text-amber-500 mx-auto" />
          <h3 className="font-heading font-semibold text-base text-text">
            Đang chờ {partnerName} hoàn thành bài test ⏳
          </h3>
          <p className="text-xs text-text-muted max-w-md mx-auto">
            Khi cả hai đều đã làm xong, bảng so sánh chi tiết và mức độ tương thích giữa hai bạn sẽ tự động hiển thị tại đây!
          </p>
        </Card>
      )}

      {/* Two Column Score Boards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Column 1: My Scores */}
        <Card className="p-6 space-y-4 border border-border bg-surface">
          <div className="border-b border-border pb-3">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              Kết quả của bạn
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl">{myInfo.icon}</span>
              <h3 className="font-heading font-bold text-lg text-text">{myInfo.name}</h3>
            </div>
            <p className="text-xs text-text-muted mt-1">{myInfo.description}</p>
          </div>

          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold text-text-muted uppercase">Phân bố điểm số (tổng 15)</h4>
            {(Object.keys(LOVE_LANGUAGES_INFO) as LoveLanguage[]).map((lang) => {
              const langInfo = LOVE_LANGUAGES_INFO[lang];
              const score = myResult.scores[lang] || 0;
              const pct = Math.round((score / 15) * 100);

              return (
                <div key={lang} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-text font-medium flex items-center gap-1.5">
                      <span>{langInfo.icon}</span> {langInfo.name}
                    </span>
                    <span className="text-text-muted font-semibold">{score} / 15</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Column 2: Partner's Scores */}
        <Card className="p-6 space-y-4 border border-border bg-surface">
          {partnerResult ? (
            <>
              <div className="border-b border-border pb-3">
                <span className="text-xs font-semibold text-accent uppercase tracking-wider">
                  Kết quả của {partnerName}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl">{partnerInfo?.icon}</span>
                  <h3 className="font-heading font-bold text-lg text-text">{partnerInfo?.name}</h3>
                </div>
                <p className="text-xs text-text-muted mt-1">{partnerInfo?.description}</p>
              </div>

              <div className="space-y-2.5">
                <h4 className="text-xs font-semibold text-text-muted uppercase">Phân bố điểm số (tổng 15)</h4>
                {(Object.keys(LOVE_LANGUAGES_INFO) as LoveLanguage[]).map((lang) => {
                  const langInfo = LOVE_LANGUAGES_INFO[lang];
                  const score = partnerResult.scores[lang] || 0;
                  const pct = Math.round((score / 15) * 100);

                  return (
                    <div key={lang} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-text font-medium flex items-center gap-1.5">
                          <span>{langInfo.icon}</span> {langInfo.name}
                        </span>
                        <span className="text-text-muted font-semibold">{score} / 15</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-border overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-border/40 flex items-center justify-center text-text-muted">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="font-heading font-semibold text-base text-text">
                {partnerName} chưa làm quiz
              </h4>
              <p className="text-xs text-text-muted max-w-xs">
                Khi {partnerName} làm xong, kết quả và cột điểm chi tiết sẽ được tự động cập nhật ngay tại đây!
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
