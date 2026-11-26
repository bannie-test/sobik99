/**
 * Chống CSV/formula injection: ô bắt đầu bằng = + - @ hoặc ký tự điều khiển
 * sẽ được Excel/Sheets hiểu là công thức → thêm dấu ' phía trước.
 */
export function neutralizeFormula(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

const quote = (value: string): string => `"${value.replaceAll('"', '""')}"`;

/** CSV có BOM (Excel đọc đúng UTF-8), phân cách CRLF, mọi ô đều đặt trong ngoặc kép. */
export function toCsv(rows: readonly (readonly (string | number)[])[]): string {
  return '﻿' + rows.map((row) => row.map((x) => quote(String(x))).join(',')).join('\r\n');
}

export function downloadText(content: string, filename: string, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
