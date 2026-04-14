"use client";

import { useState, useCallback, useMemo } from "react";

interface Props {
  rawData: Record<string, unknown>[];
  onDataChange: (newData: Record<string, unknown>[]) => void;
}

/**
 * EditableTable — 편집 가능한 데이터 테이블
 * 셀 클릭 시 inline 편집 → Enter/blur로 확정 → onDataChange 호출
 * 수치 컬럼만 편집 가능 (날짜·문자열은 읽기 전용)
 */
export function EditableTable({ rawData, onDataChange }: Props) {
  const [editCell, setEditCell] = useState<{
    row: number;
    col: string;
  } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [page, setPage] = useState(0);
  const rowsPerPage = 50;

  const columns = useMemo(() => {
    if (rawData.length === 0) return [];
    return Object.keys(rawData[0]);
  }, [rawData]);

  /** 수치 컬럼인지 판별 */
  const isNumericColumn = useCallback(
    (col: string) => {
      const sample = rawData.slice(0, 10);
      return sample.some((row) => {
        const v = row[col];
        return typeof v === "number" || (typeof v === "string" && !isNaN(Number(v)) && v.trim() !== "");
      });
    },
    [rawData]
  );

  const numericColumns = useMemo(
    () => new Set(columns.filter(isNumericColumn)),
    [columns, isNumericColumn]
  );

  const pagedData = useMemo(
    () => rawData.slice(page * rowsPerPage, (page + 1) * rowsPerPage),
    [rawData, page]
  );
  const totalPages = Math.ceil(rawData.length / rowsPerPage);

  const handleStartEdit = (rowIdx: number, col: string) => {
    if (!numericColumns.has(col)) return;
    const globalIdx = page * rowsPerPage + rowIdx;
    setEditCell({ row: globalIdx, col });
    setEditValue(String(rawData[globalIdx][col] ?? ""));
  };

  const handleCommit = () => {
    if (!editCell) return;
    const { row, col } = editCell;
    const numVal = Number(editValue);
    if (isNaN(numVal)) {
      setEditCell(null);
      return;
    }
    const updated = [...rawData];
    updated[row] = { ...updated[row], [col]: numVal };
    onDataChange(updated);
    setEditCell(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleCommit();
    if (e.key === "Escape") setEditCell(null);
  };

  if (rawData.length === 0) {
    return <p className="text-sm text-gray-400 dark:text-gray-500">데이터가 없습니다.</p>;
  }

  return (
    <div className="space-y-3">
      {/* 안내 */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          수치 셀을 클릭하면 편집할 수 있습니다. 변경 사항은 대시보드 탭에 즉시 반영됩니다.
        </p>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500 dark:bg-slate-700 dark:text-gray-400">
          {rawData.length.toLocaleString()}행 × {columns.length}열
        </span>
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-600 dark:bg-slate-700">
              <th className="px-3 py-2 text-[10px] font-semibold text-gray-400 dark:text-gray-500">
                #
              </th>
              {columns.map((col) => (
                <th
                  key={col}
                  className={`px-3 py-2 font-semibold ${
                    numericColumns.has(col)
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {col}
                  {numericColumns.has(col) && (
                    <span className="ml-1 text-[9px] text-indigo-300 dark:text-indigo-500">
                      편집
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagedData.map((row, i) => {
              const globalIdx = page * rowsPerPage + i;
              return (
                <tr
                  key={globalIdx}
                  className="border-b border-gray-50 hover:bg-indigo-50/30 dark:border-gray-700 dark:hover:bg-slate-700/30"
                >
                  <td className="px-3 py-1.5 text-[10px] text-gray-300 dark:text-gray-600">
                    {globalIdx + 1}
                  </td>
                  {columns.map((col) => {
                    const isEditing =
                      editCell?.row === globalIdx && editCell?.col === col;
                    const isEditable = numericColumns.has(col);

                    return (
                      <td
                        key={col}
                        className={`px-3 py-1.5 ${
                          isEditable
                            ? "cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                            : ""
                        }`}
                        onClick={() => handleStartEdit(i, col)}
                      >
                        {isEditing ? (
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleCommit}
                            onKeyDown={handleKeyDown}
                            className="w-full rounded border border-indigo-300 bg-white px-1 py-0.5 text-xs outline-none focus:ring-1 focus:ring-indigo-400 dark:border-indigo-600 dark:bg-slate-700 dark:text-white"
                            autoFocus
                          />
                        ) : (
                          <span
                            className={
                              isEditable
                                ? "text-gray-800 dark:text-gray-200"
                                : "text-gray-500 dark:text-gray-400"
                            }
                          >
                            {row[col] != null ? String(row[col]) : "—"}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-500 hover:bg-gray-50 disabled:opacity-30 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-slate-700"
          >
            이전
          </button>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-500 hover:bg-gray-50 disabled:opacity-30 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-slate-700"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
