const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

/** Định dạng giá VND (giá demo). */
export const money = (n: number): string => vnd.format(n);

/** "01" … "09" — dùng cho số thứ tự chương/mẫu. */
export const pad2 = (n: number): string => `0${n}`;
