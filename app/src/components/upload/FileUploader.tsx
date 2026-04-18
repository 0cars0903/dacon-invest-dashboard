"use client";

import { useCallback, useRef } from "react";
import type { DetectionResult, CalculationResult, InsightResult } from "@/types";
import { UPLOAD_LIMITS } from "@/constants/defaults";
import { SAMPLE_DATA_OPTIONS } from "@/lib/sampleData";

interface AnalysisResult {
  detection: DetectionResult;
  calculation: CalculationResult;
  insights: InsightResult;
  rawData: Record<string, unknown>[];
}

interface FileUploaderProps {
  onAnalysisComplete: (result: AnalysisResult) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (v: boolean) => void;
}

export function FileUploader({
  onAnalysisComplete,
  isAnalyzing,
  setIsAnalyzing,
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  /** CSV 텍스트를 파이프라인에 넣어 분석하는 공통 함수 */
  const analyzeText = useCallback(
    async (text: string, ext: "csv" | "json") => {
      setIsAnalyzing(true);
      try {
        const { runPipeline } = await import("@/lib/pipeline");
        const result = await runPipeline(text, ext);
        onAnalysisComplete(result);
      } catch (err) {
        console.error("분석 실패:", err);
        alert("데이터 분석 중 오류가 발생했습니다. 파일 형식을 확인해 주세요.");
      } finally {
        setIsAnalyzing(false);
      }
    },
    [onAnalysisComplete, setIsAnalyzing]
  );

  const handleFile = useCallback(
    async (file: File) => {
      const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
      if (
        !UPLOAD_LIMITS.supportedFormats.includes(
          ext as (typeof UPLOAD_LIMITS.supportedFormats)[number]
        )
      ) {
        alert("CSV 또는 JSON 파일만 업로드할 수 있습니다.");
        return;
      }
      if (file.size > UPLOAD_LIMITS.maxFileSizeMB * 1024 * 1024) {
        alert(`파일 크기가 ${UPLOAD_LIMITS.maxFileSizeMB}MB를 초과합니다.`);
        return;
      }
      const text = await file.text();
      analyzeText(text, ext as "csv" | "json");
    },
    [analyzeText]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleSampleClick = useCallback(
    (csv: string) => {
      analyzeText(csv.trim(), "csv");
    },
    [analyzeText]
  );

  return (
    <div className="animate-fade-in-up mx-auto max-w-xl space-y-6">
      {/* 파일 업로드 영역 */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className="group cursor-pointer rounded-2xl border-2 border-dashed border-gray-300 bg-white p-8 text-center transition-all duration-300 hover:border-indigo-400 hover:bg-indigo-50/30 hover:shadow-xl hover:shadow-indigo-500/10 dark:border-gray-600 dark:bg-slate-800/80 dark:hover:border-indigo-500 dark:hover:bg-slate-800 dark:hover:shadow-indigo-500/5 sm:p-12"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />

        {isAnalyzing ? (
          <div className="space-y-3">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
            <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
              데이터를 분석하고 있습니다...
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 transition-transform duration-300 group-hover:scale-110 dark:from-indigo-900/60 dark:to-violet-900/60">
              <svg
                className="h-7 w-7 text-indigo-600 dark:text-indigo-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
            </div>
            <div>
              <p className="text-base font-medium text-gray-700 dark:text-gray-200">
                투자 데이터 파일을 드래그하거나 클릭하여 업로드
              </p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                CSV, JSON · 최대 {UPLOAD_LIMITS.maxFileSizeMB}MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 샘플 데이터 원클릭 로드 */}
      {!isAnalyzing && (
        <div className="animate-fade-in-up delay-200">
          <p className="mb-3 text-center text-xs font-medium text-gray-400 dark:text-gray-500">
            또는 샘플 데이터로 바로 체험하기
          </p>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
            {SAMPLE_DATA_OPTIONS.map((opt, idx) => (
              <button
                key={opt.id}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSampleClick(opt.csv);
                }}
                className={`group relative overflow-hidden rounded-xl border border-gray-200 bg-white px-3 py-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/10 dark:border-gray-700 dark:bg-slate-800/80 dark:hover:border-indigo-500 dark:hover:shadow-indigo-500/5 ${
                  idx >= 3 ? "col-span-1" : ""
                }`}
              >
                {/* 호버 시 상단 그라디언트 악센트 */}
                <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-indigo-500 to-violet-500 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                <div className="text-xl">{opt.icon}</div>
                <p className="mt-1 text-sm font-medium text-gray-800 transition-colors group-hover:text-indigo-700 dark:text-gray-200 dark:group-hover:text-indigo-400">
                  {opt.label}
                </p>
                <p className="mt-0.5 text-[11px] leading-tight text-gray-400 dark:text-gray-500">
                  {opt.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
