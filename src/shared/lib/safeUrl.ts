/**
 * Chỉ cho phép link ngoài dùng https: — chặn `javascript:`, `data:`… nếu dữ
 * liệu nguồn bị sửa sai. Trả undefined khi URL không hợp lệ.
 */
export function safeExternalUrl(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' ? parsed.href : undefined;
  } catch {
    return undefined;
  }
}
