"use client";

import type { KpiCard } from "@/types";
import { COLORS } from "@/types/visualization";

interface Props {
  cards: KpiCard[];
}

export function KpiCardGrid({ cards }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {cards.map((card, i) => {
        const dirColor =
          card.changeDirection === "up"
            ? COLORS.up
            : card.changeDirection === "down"
            ? COLORS.down
            : COLORS.neutral;

        return (
          <div
            key={i}
            className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
          >
            <p className="text-xs font-medium text-gray-500">
              {card.indicator}
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {card.value}
            </p>
            {card.change && (
              <p className="mt-0.5 text-xs font-medium" style={{ color: dirColor }}>
                {card.change}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-400 line-clamp-1">
              {card.subtitle}
            </p>
          </div>
        );
      })}
    </div>
  );
}
