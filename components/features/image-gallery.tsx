"use client";

import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export function ImageGallery({ urls }: { urls: string[] }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (!urls || urls.length === 0) return null;

  return (
    <>
      <div
        className={`grid gap-2 mb-6 ${
          urls.length === 1
            ? "grid-cols-1"
            : urls.length === 2
            ? "grid-cols-2"
            : "grid-cols-3"
        }`}
      >
        {urls.map((url, idx) => (
          <div
            key={idx}
            className={`relative cursor-pointer overflow-hidden rounded-[var(--radius-md)] ${
              urls.length === 1 ? "w-full max-h-80 aspect-auto" : "aspect-square"
            }`}
            onClick={() => setSelectedIndex(idx)}
          >
            <img
              src={url}
              alt={`Image ${idx + 1}`}
              className={`w-full h-full object-cover transition-transform hover:scale-105 ${
                urls.length === 1 ? "max-h-80" : ""
              }`}
            />
          </div>
        ))}
      </div>

      {selectedIndex !== null && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setSelectedIndex(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-50 p-2"
            onClick={() => setSelectedIndex(null)}
          >
            <X size={28} />
          </button>

          {urls.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 z-50 p-2 bg-black/50 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedIndex(
                    selectedIndex === 0 ? urls.length - 1 : selectedIndex - 1
                  );
                }}
              >
                <ChevronLeft size={28} />
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 z-50 p-2 bg-black/50 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedIndex(
                    selectedIndex === urls.length - 1 ? 0 : selectedIndex + 1
                  );
                }}
              >
                <ChevronRight size={28} />
              </button>
            </>
          )}

          <img
            src={urls[selectedIndex]}
            className="max-w-full max-h-[90vh] object-contain"
            alt="Preview"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
