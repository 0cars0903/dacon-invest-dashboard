"use client";

import { useCallback, useRef } from "react";
import type { DetectionResult, CalculationResult, InsightResult } from "@/types";
import { UPLOAD_LIMITS } from "@/constants/defaults";

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

      setIsAnalyzing(true);
      try {
        // 파이프라인 동적 import (코드 스플리팅)
        const { runPipeline } = await import("@/lib/pipeline");
        const text = await file.text();
        const result = await runPipeline(text, ext as "csv" | "json");
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

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className="mx-auto max-w-xl cursor-pointer rounded-2xl border-2 border-dashed border-gray-300 bg-white p-12 text-center transition-colors hover:border-indigo-400 hover:bg-indigo-50/30"
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
          <p className="text-sm font-medium text-indigo-600">
            데이터를 분석하고 있습니다...
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100">
            <svg
              className="h-7 w-7 text-indigo-600"
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
            <p className="text-base font-medium text-gray-700">
              투자 데이터 파일을 드래그하거나 클릭하여 업로드
            </p>
            <p className="mt-1 text-xs text-gray-400">
              CSV, JSON · 최대 {UPLOAD_LIMITS.maxFileSizeMB}MB
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
