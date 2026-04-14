"use client";

import type { TopBanner } from "@/types";

interface Props {
  banner: TopBanner;
}

export function TopBannerBar({ banner }: Props) {
  return (
    <div
      className="rounded-xl px-4 py-3 text-sm font-medium sm:px-5"
      style={{
        backgroundColor: banner.backgroundColor,
        color: banner.textColor,
      }}
    >
      {banner.insight.icon} {banner.summaryText}
    </div>
  );
}
