"use client";

import { useState, useCallback } from "react";
import { FileUploader } from "@/components/upload/FileUploader";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { EditableTable } from "@/components/dashboard/EditableTable";
import type { DetectionResult, CalculationResult, InsightResult } from "@/types";
import { DEFAULT_INSIGHT_CONFIG } from "@/constants/defaults";

/** 파이프라인 전체 결과를 묶는 타입 */
interface AnalysisResult {
  detection: DetectionResult;
  calculation: CalculationResult;
  insights: InsightResult;
  rawData: Record<string, unknown>[];
}

type TabId = "dashboard" | "table";

export default function HomePage() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");

  /**
   * 데이터 편집 시 파이프라인 재실행 (detect 스킵, calculate + insights만)
   * H5: 원본 보존 원칙 — 편집본은 별도 state로 관리
   */
  const handleDataChange = useCallback(
    async (newData: Record<string, unknown>[]) => {
      if (!result) return;
      try {
        const { calculate, generateInsights } = await import("@/lib/pipeline");
        const newCalc = calculate(result.detection, newData);
        const newInsights = generateInsights(
          result.detection,
          newCalc,
          DEFAULT_INSIGHT_CONFIG,
          newData
        );
        setResult({
          detection: result.detection,
          calculation: newCalc,
          insights: newInsights,
          rawData: newData,
        });
      } catch (err) {
        console.error("재분석 실패:", err);
      }
    },
    [result]
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* 헤더 */}
      <header className="mb-6 text-center sm:mb-8">
        <div className="inline-flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white text-sm font-bold">
            IL
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
            InvestLens
          </h1>
        </div>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          어떤 투자 데이터든 업로드하면, 자동으로 분석하고 대시보드를 만듭니다.
        </p>
      </header>

      {/* 업로드 영역 */}
      {!result && (
        <FileUploader
          onAnalysisComplete={(r) => {
            setResult(r);
            setActiveTab("dashboard");
          }}
          isAnalyzing={isAnalyzing}
          setIsAnalyzing={setIsAnalyzing}
        />
      )}

      {/* 2탭 구조 */}
      {result && (
        <div className="space-y-4">
          {/* 탭 헤더 + 리셋 */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-slate-800">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors sm:px-4 ${
                  activeTab === "dashboard"
                    ? "bg-white text-gray-900 shadow-sm dark:bg-slate-700 dark:text-white"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                대시보드
              </button>
              <button
                onClick={() => setActiveTab("table")}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors sm:px-4 ${
                  activeTab === "table"
                    ? "bg-white text-gray-900 shadow-sm dark:bg-slate-700 dark:text-white"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                데이터 편집
              </button>
            </div>
            <button
              onClick={() => {
                setResult(null);
                setActiveTab("dashboard");
              }}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-slate-700"
            >
              새 파일 분석
            </button>
          </div>

          {/* 탭 내용 */}
          {activeTab === "dashboard" && (
            <DashboardView result={result} onReset={() => setResult(null)} />
          )}
          {activeTab === "table" && (
            <EditableTable
              rawData={result.rawData}
              onDataChange={handleDataChange}
            />
          )}
        </div>
      )}

      {/* 푸터 */}
      <footer className="mt-12 border-t border-gray-100 pt-6 text-center dark:border-gray-700">
        <p className="text-xs text-gray-400 dark:text-gray-500">
          InvestLens · Skills.md 기반 투자 데이터 자동 분석 대시보드 · DACON 해커톤 2026
        </p>
      </footer>
    </main>
  );
}
