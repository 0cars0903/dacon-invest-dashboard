import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InvestLens — 투자 데이터 자동 분석 대시보드",
  description:
    "어떤 투자 데이터든 업로드하면, Skills.md가 자동으로 분석하고 대시보드를 만듭니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-gray-50 antialiased">{children}</body>
    </html>
  );
}
