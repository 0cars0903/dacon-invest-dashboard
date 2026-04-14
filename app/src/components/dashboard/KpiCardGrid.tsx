"use client";

import type { KpiCard } from "@/types";
import { COLORS } from "@/types/visualization";

interface Props {
  cards: KpiCard[];
}

export function KpiCardGrid({ cards }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
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
            className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-slate-800 sm:p-4"
          >
            <p className="truncate text-[11px] font-medium text-gray-500 dark:text-gray-400 sm:text-xs">
              {card.indicator}
            </p>
            <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
              {card.value}
            </p>
            {card.change && (
              <p
                className="mt-0.5 text-[11px] font-medium sm:text-xs"
                style={{ color: dirColor }}
              >
                {card.change}
              </p>
            )}
            <p className="mt-1 truncate text-[10px] text-gray-400 dark:text-gray-500 sm:text-xs">
              {card.subtitle}
            </p>
          </div>
        );
      })}
    </div>
  );
}
