# SOBIK99 · Cube Club

Website Rubik tiếng Việt, giao diện sáng và hình học, không có giao dịch thật.

## Chạy

Node.js 22.12 trở lên.

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

## Nội dung

- Landing có 26 cubie, 20 phép xoay xáo trộn hợp lệ và chuỗi nghịch đảo điều khiển bằng scroll, hoàn thành sáu mặt. Có chế độ giảm chuyển động.
- Carousel quỹ đạo 5 thương hiệu, catalogue 14 mẫu, tìm kiếm/lọc, chi tiết, sơ đồ cơ chế, so sánh hai mẫu và đặt hàng mô phỏng.
- Hướng dẫn 8 loại puzzle, CFOP 41 F2L / 57 OLL / 21 PLL với 257 lựa chọn thuật toán và hình trạng thái được sinh từ cubing.js; player tải khi cần.
- Timer 3x3 random-state, Space/chạm, lưu thủ công, +2/DNF, Ao5/Ao12, CSV. Dữ liệu lưu trong trình duyệt; không đồng bộ giữa thiết bị.

Một số lựa chọn công thức là cùng thuật toán đổi hướng cầm (ghi rõ trong UI). Hướng dẫn ngoài 3x3 là lộ trình và công thức chọn lọc, không phải thư viện đầy đủ mọi case nâng cao. Giá VND là giá demo tự đặt; thông số chưa xác minh để trống, không tạo rating giả. Minh họa sản phẩm là hình học tự dựng, không phải ảnh sản phẩm.

## Deploy

`dist/` là website tĩnh, hash routing và đường dẫn asset tương đối hỗ trợ cả thư mục con. Vercel / Netlify: build `npm run build`, output `dist`. CI kiểm tra test và build trên mỗi push/PR. `.openai/hosting.json` chứa liên kết Sites và thư mục output, không có secret.

Nguồn và giấy phép: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Sinh lại hình công thức: `node scripts/prepare-algorithms.mjs`.
