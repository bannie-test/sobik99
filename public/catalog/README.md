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

## Logo hãng

Mặc định mỗi hãng hiện **ô chờ xám** có tên hãng. Để dùng ảnh logo:

1. Đặt file vào `public/catalog/logos/`, ví dụ `public/catalog/logos/gan.svg` (SVG/PNG/WebP, nền trong suốt, cao ~40 px trở lên).
2. Trong `src/data/brands.js`, đổi `"logo": ""` của hãng đó thành `"logo": "catalog/logos/gan.svg"` (đường dẫn tính từ `public/`, hoặc một URL `https://`).

Ảnh lỗi hoặc không tồn tại sẽ tự quay về ô chờ.

## Nhập mẫu từ SpeedCubeShop và The Cubicle

```
npm run import:cubicle                              # mọi trang của các collection mặc định
npm run import:cubicle -- <url collection>          # collection khác (tự đi hết các trang)
npm run import:cubicle -- --refresh                 # bỏ cache, tải lại từ shop
```

Script đọc `products.json` (Shopify) theo từng trang `?limit=250&page=N` cho đến trang rỗng. Các trang tải về được lưu cache 1 ngày trong `node_modules/.cache/shop-import/`. Khi shop trả về 429, script tự chờ rồi thử lại.

1. **Mẫu 3x3 từ collection 3x3** → `brands/<hãng>/3x3/<handle>/info.json`, gồm tên, tag, mô tả tiếng Anh, ảnh trên CDN của shop kèm ghi công và link nguồn. **Không lấy giá.** Cùng một khối có ở cả hai shop (tên giống nhau sau khi bỏ phần trong ngoặc) thì gộp làm một mẫu.
2. **Mẫu bạn tự viết mà chưa có ảnh** (mọi loại) được ghép theo tên với toàn bộ sản phẩm của hai shop (collection `all`) để bổ sung ảnh, mô tả và nguồn. Phần bổ sung được ghi trong khóa `imported`; lần chạy sau sẽ gỡ ra rồi ghép lại, nên không bao giờ ghi đè chữ bạn viết.
3. Thư mục do script tạo (có `importedFrom` và chỉ chứa `info.json`) được dựng lại mỗi lần chạy. Muốn sửa tay một mẫu đã nhập: xóa khóa `importedFrom`, hoặc thêm `image.webp` vào thư mục đó.

Cuối mỗi lần chạy, script in danh sách mẫu vẫn chưa có ảnh.
