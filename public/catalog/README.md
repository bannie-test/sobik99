# Kệ Rubik — thêm mẫu, ảnh và thông tin

Trang **Kệ Rubik** đọc thư mục này. Không cần sửa code khi thêm hoặc đổi mẫu.

```
public/catalog/brands/<hãng>/<loại>/<mẫu>/info.json     (tuỳ chọn)
public/catalog/brands/<hãng>/<loại>/<mẫu>/image.webp    (hoặc .avif / .png / .jpg, tuỳ chọn)
```

- `<hãng>`: id trong `src/data/brands.js` (ví dụ `moyu`, `gan`, `x-man-design`). Lọc theo một hãng sẽ lấy mọi mẫu trong thư mục hãng đó **và các thương hiệu con** (ví dụ `moyu` gồm cả `pbcube`, `cubing-classroom`, `guoguan`).
- `<loại>`: `2x2`, `3x3`, `4x4`, `5x5`, `6x6`, `7x7`, `pyraminx`, `megaminx`, `skewb`, `square-1`, `clock`.
- `<mẫu>`: chữ thường nối gạch ngang, ví dụ `moyu-wrm-v11`. Không có `info.json` thì tên hiển thị lấy từ tên thư mục.
- Ảnh: tỉ lệ **4:3**, khuyến nghị **800×600**, WebP, nền trắng hoặc trong suốt (khoảng 30–80 KB/ảnh). Thiếu ảnh hoặc ảnh lỗi thì trang hiện ảnh chờ xám kiểu placehold.co (vẽ tại chỗ, không gọi dịch vụ ngoài).

`info.json` — mọi trường đều tuỳ chọn:

```json
{
  "name": "MoYu WeiLong WRM V11",
  "tags": ["Flagship", "MagLev"],
  "description": "Một câu giới thiệu.",
  "features": ["Đặc điểm nổi bật 1", "Đặc điểm 2"],
  "reviews": ["Nhận xét phổ biến 1"],
  "audience": "Người chơi thi đấu",
  "image": "image.webp",
  "imageCredit": { "name": "Tên nguồn ảnh", "url": "https://..." },
  "sources": [{ "name": "Trang hãng", "url": "https://..." }]
}
```

`image` có thể là tên file trong thư mục mẫu hoặc một URL `https://` (chỉ dùng ảnh bạn có quyền sử dụng). `imageCredit` hiện dưới ảnh và trong trang Nguồn.

Sau khi thêm/sửa, chạy `npm run catalog` (tự chạy cùng `npm run dev`, `npm run build`, `npm test`). Lệnh in cảnh báo nếu có thư mục hãng/loại sai, JSON lỗi hoặc ảnh không tồn tại.
