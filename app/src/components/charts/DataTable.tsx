"use client";

/**
 * 원본 데이터 테이블 (Fallback 모드 & 범용)
 * 시각화매핑규칙 §6 Fallback 모드 대응
 */

interface Props {
  rawData: Record<string, unknown>[];
  maxRows?: number;
}

export function DataTable({ rawData, maxRows = 50 }: Props) {
  if (rawData.length === 0) return null;

  const columns = Object.keys(rawData[0]);
  const displayRows = rawData.slice(0, maxRows);

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-gray-700">
        데이터 테이블
        <span className="ml-2 text-xs font-normal text-gray-400">
          {rawData.length > maxRows
            ? `상위 ${maxRows}행 / 전체 ${rawData.length}행`
            : `${rawData.length}행`}
        </span>
      </h3>
      <div className="max-h-96 overflow-auto">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  className="whitespace-nowrap border-b border-gray-200 px-3 py-2 text-gray-600"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, rowIdx) => (
              <tr key={rowIdx} className="border-b border-gray-50 hover:bg-gray-50/50">
                {columns.map((col) => (
                  <td
                    key={col}
                    className="whitespace-nowrap px-3 py-1.5 font-mono text-gray-800"
                  >
                    {formatCell(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatCell(val: unknown): string {
  if (val === null || val === undefined) return "-";
  if (typeof val === "number") {
    if (Number.isInteger(val)) return val.toLocaleString();
    return val.toFixed(4);
  }
  return String(val);
}
