'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { TarotCard } from '@/lib/ai/prompts/tarot';

interface TarotDrawProps {
  onComplete: (cards: number[]) => void;
  cards: TarotCard[];
}

export function TarotDraw({ onComplete, cards }: TarotDrawProps) {
  const [selectedCards, setSelectedCards] = useState<number[]>([]);

  // We shuffle just the indices to display facedown cards
  const [shuffledIndices] = useState(() => {
    const indices = cards.map((c) => c.id);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices;
  });

  const handleSelect = (id: number) => {
    if (selectedCards.includes(id)) {
      setSelectedCards((prev) => prev.filter((i) => i !== id));
    } else if (selectedCards.length < 3) {
      setSelectedCards((prev) => [...prev, id]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-text-muted">
          Hãy tập trung vào câu hỏi của bạn và chọn 3 lá bài. Đã chọn:{' '}
          <span className="font-bold text-primary">{selectedCards.length}/3</span>
        </p>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 sm:gap-4 justify-items-center">
        {shuffledIndices.map((id) => {
          const isSelected = selectedCards.includes(id);
          const selectionIndex = selectedCards.indexOf(id);
          const card = cards.find((c) => c.id === id);

          return (
            <button
              key={id}
              onClick={() => handleSelect(id)}
              disabled={selectedCards.length >= 3 && !isSelected}
              className={`relative aspect-[2/3] w-full max-w-[80px] rounded-[var(--radius-sm)] transition-all duration-500 [transform-style:preserve-3d] ${
                isSelected
                  ? '[transform:rotateY(180deg)] shadow-glow -translate-y-4'
                  : 'hover:-translate-y-2 hover:shadow-md cursor-pointer'
              } ${
                selectedCards.length >= 3 && !isSelected ? 'opacity-50 grayscale cursor-not-allowed' : ''
              }`}
            >
              {/* Card Back */}
              <div className="absolute inset-0 bg-primary/80 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/40 to-accent/80 rounded-[var(--radius-sm)] border-2 border-white/20 shadow-sm [backface-visibility:hidden] flex items-center justify-center">
                <span className="text-white/40 text-2xl">✨</span>
              </div>

              {/* Card Front */}
              <div className="absolute inset-0 bg-surface rounded-[var(--radius-sm)] border-2 border-primary/30 shadow-md [transform:rotateY(180deg)] [backface-visibility:hidden] flex flex-col items-center justify-center p-2 text-center">
                <span className="text-3xl mb-1">{card?.emoji}</span>
                <span className="text-[10px] font-bold leading-tight line-clamp-2">
                  {card?.nameVi}
                </span>
                
                {isSelected && (
                  <div className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center text-xs font-bold shadow-md z-10">
                    {selectionIndex + 1}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex justify-center pt-4">
        <Button
          variant="primary"
          onClick={() => onComplete(selectedCards)}
          disabled={selectedCards.length !== 3}
          className="w-full sm:w-auto min-w-[200px]"
        >
          {selectedCards.length === 3 ? 'Xem kết quả luận giải' : 'Vui lòng chọn 3 lá bài'}
        </Button>
      </div>
    </div>
  );
}
