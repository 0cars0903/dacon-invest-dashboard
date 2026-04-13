"use client";

import { useState } from "react";
import { FileUploader } from "@/components/upload/FileUploader";
import { DashboardView } from "@/components/dashboard/DashboardView";
import type { DetectionResult, CalculationResult, InsightResult } from "@/types";

/** 파이프라인 전체 결과를 묶는 타입 */
interface AnalysisResult {
  detection: DetectionResult;
  calculation: CalculationResult;
  insights: InsightResult;
  rawData: Record<string, unknown>[];
}

export default function HomePage() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* 헤더 */}
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          InvestLens
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          어떤 투자 데이터든 업로드하면, 자동으로 분석하고 대시보드를 만듭니다.
        </p>
      </header>

      {/* 업로드 영역 */}
      {!result && (
        <FileUploader
          onAnalysisComplete={setResult}
          isAnalyzing={isAnalyzing}
          setIsAnalyzing={setIsAnalyzing}
        />
      )}

      {/* 대시보드 영역 */}
      {result && (
        <DashboardView
          result={result}
          onReset={() => setResult(null)}
        />
      )}
    </main>
  );
}
