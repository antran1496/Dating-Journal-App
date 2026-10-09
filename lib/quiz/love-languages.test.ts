import { describe, it, expect } from 'vitest';
import { LOVE_QUIZ_QUESTIONS, calculateQuizScores, getCoupleAdvice, LoveLanguage } from './love-languages';

describe('lib/quiz/love-languages (Mathematical balance and scoring)', () => {
  it('has exactly 15 questions with 2 options each', () => {
    expect(LOVE_QUIZ_QUESTIONS).toHaveLength(15);
    for (const q of LOVE_QUIZ_QUESTIONS) {
      expect(q.optionA).toBeDefined();
      expect(q.optionB).toBeDefined();
    }
  });

  it('each of the 5 love languages appears exactly 6 times across all 30 options', () => {
    const counts: Record<LoveLanguage, number> = {
      words: 0,
      time: 0,
      gifts: 0,
      acts: 0,
      touch: 0,
    };

    for (const q of LOVE_QUIZ_QUESTIONS) {
      counts[q.optionA.language]++;
      counts[q.optionB.language]++;
    }

    expect(counts.words).toBe(6);
    expect(counts.time).toBe(6);
    expect(counts.gifts).toBe(6);
    expect(counts.acts).toBe(6);
    expect(counts.touch).toBe(6);
  });

  it('accurately calculates quiz scores and identifies primary love language', () => {
    // Select option A for questions 1-10 (words, gifts, touch, time, acts, words, time, touch, words, time)
    // Select option B for questions 11-15 (time, gifts, acts, touch, words)
    const answers: Record<number, 'A' | 'B'> = {
      1: 'A', // words
      2: 'A', // gifts
      3: 'A', // touch
      4: 'A', // time
      5: 'A', // acts
      6: 'A', // words
      7: 'A', // time
      8: 'A', // touch
      9: 'A', // words
      10: 'A', // time
      11: 'B', // time
      12: 'B', // gifts
      13: 'B', // acts
      14: 'B', // touch
      15: 'B', // words
    };

    const result = calculateQuizScores(answers);
    const sum = Object.values(result.scores).reduce((a, b) => a + b, 0);
    expect(sum).toBe(15);
    expect(result.scores.words).toBe(4);
    expect(result.scores.time).toBe(4);
    expect(result.primaryLanguage).toBe('words');
  });

  it('provides actionable static tips and compatibility for any pair without calling AI', () => {
    const advice = getCoupleAdvice('words', 'time');
    expect(advice.compatibilityRate).toBeGreaterThan(0);
    expect(advice.tips).toHaveLength(3);

    const sameAdvice = getCoupleAdvice('touch', 'touch');
    expect(sameAdvice.compatibilityRate).toBe(95);
    expect(sameAdvice.tips).toHaveLength(3);
  });
});
