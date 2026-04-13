"use client";

import type { TopBanner } from "@/types";

interface Props {
  banner: TopBanner;
}

export function TopBannerBar({ banner }: Props) {
  return (
    <div
      className="rounded-xl px-5 py-3 text-sm font-medium"
      style={{
        backgroundColor: banner.backgroundColor,
        color: banner.textColor,
      }}
    >
      {banner.insight.icon} {banner.summaryText}
    </div>
  );
}
