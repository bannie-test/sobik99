# SOBIK99 · Cube Club

Website Rubik tiếng Việt: kệ Rubik theo hãng, trình giải CFOP từng bước, thư viện công thức lấy mặt vàng làm mặt cuối, và timer luyện tốc độ. Không bán hàng, không có giá.

## Chạy

Node.js 22.12 trở lên.

```sh
npm ci
npm run dev        # tự dựng danh mục Kệ Rubik trước khi chạy
npm test
npm run build
npm run preview
```

## Nội dung

- **Giải Rubik** (`#/solve`): nhập scramble (chuẩn WCA) hoặc tô màu khối theo hướng cầm vàng trên / xanh lá trước. Có kiểm tra màu hợp lệ: đếm màu, góc/cạnh không tồn tại, góc bị xoay, cạnh bị lật, hai mảnh đổi chỗ.
  - **CFOP từng bước**: Cross tối ưu → F2L 4 cặp → OLL → PLL, cầm trắng dưới. Mỗi bước có mô tả, link tới case trong thư viện và mô hình 3D xem riêng bước đó.
  - **Mục tiêu từng phần** (Cross, F2L, một cặp F2L, OLL, PLL) chỉ dừng ở giai đoạn đã chọn. Kết quả ghi rõ phần còn lại và có nút “Giải tiếp đến khi xong”.
  - **Ngắn nhất**: lời giải khoảng 20 bước bằng thuật toán hai pha của cubing.js.
- **Học cách xoay** (`#/guide`): lộ trình cho 2×2–7×7, Megaminx, Pyraminx. Thư viện CFOP có 119 case với khoảng 390 công thức, trong đó gần 180 công thức hiện đại.
  - Hình minh họa đặt vàng trên, trắng dưới. PLL có mũi tên chỉ đường đi của mảnh, F2L làm mờ tầng cuối.
  - Mọi công thức được kiểm chứng tự động và xếp đúng case nó giải.
- **Kệ Rubik** (`#/catalog`): đọc từ thư mục `public/catalog/brands/<hãng>/<loại>/<mẫu>/`, xem [public/catalog/README.md](public/catalog/README.md).
  - Lọc theo hãng (gồm cả thương hiệu con) hoặc theo loại, có tìm kiếm.
  - Danh mục và ảnh tải dần theo trang khi cuộn.
  - Mẫu thiếu ảnh hiện ảnh chờ 4:3.
- **Timer** 3×3 random-state, +2/DNF, Ao5/Ao12, CSV.

## Cấu trúc

| Đường dẫn | Vai trò |
|---|---|
| `src/core/cube.js` | Mô hình 54 sticker; mọi phép xoay (mặt, wide, slice, x/y/z) suy ra hình học |
| `src/core/cubie.js` | Góc/cạnh theo quy ước Kociemba, bộ kiểm tra màu |
| `src/core/cfop.js` | Nhận diện case, Cross tối ưu, trình giải CFOP |
| `src/core/solve-service.js` | Nối trình giải với trang web, lời giải ngắn qua cubing.js |
| `scripts/sources/*.json` → `scripts/build-algorithms.mjs` → `src/data/algorithms.js` | Nguồn công thức, kiểm chứng và gom theo case (`npm run algorithms`) |
| `public/catalog/brands/**` → `scripts/build-catalog.mjs` → `public/catalog/{index,search}.json`, `pages/` | Kệ Rubik (`npm run catalog`, file sinh ra không commit) |

Thêm công thức: ghi vào `scripts/sources/modern.json` rồi chạy `npm run algorithms`. Công thức sai bị loại và in ra; công thức đúng tự vào case nó thực sự giải.

## Deploy

`dist/` là website tĩnh; hash routing và đường dẫn asset tương đối hỗ trợ cả thư mục con. Vercel / Netlify: build `npm run build`, output `dist`. CI chạy test và build trên mỗi push/PR.

Nguồn và giấy phép: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
