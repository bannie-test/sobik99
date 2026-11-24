# SOBIK99 · Cube Club

Website Rubik Việt/Anh dùng React, TypeScript, Vite và hash routing.

## Chạy

Cần Node.js 22.12 trở lên.

```sh
npm ci
npm run dev
npm run typecheck
npm test
npm run build
npm run preview
```

## Tính năng

- **Trang chủ** có hành trình giải Rubik theo thao tác cuộn và vòng thương hiệu.
- **Thư viện Rubik** đọc dữ liệu từ `catalog-source/brands/`, tải theo trang và lọc theo loại hoặc nhóm thương hiệu. [Cách thêm mẫu và ảnh](catalog-source/README.md)
- **Học cách xoay** gồm tám loại puzzle, thư viện CFOP 119 case, F2L tự nghiệm, học giải bịt mắt và bài luyện Cross. Các thẻ dùng sơ đồ trải 2D theo cách giải đã chọn. Trình phát 3D tải khi mở “Xem cách xoay”.
- **Giải Rubik** nhận scramble hoặc trạng thái tô màu, giải CFOP từng bước hoặc dùng thuật toán hai pha. Mục tiêu từng phần có thể giải tiếp đến khi xong.
- **Xưởng Rubik** mô phỏng lắp linh kiện 3×3, thử cơ chế tâm và xoay các tầng sau khi lắp.
- **Timer** dùng scramble random-state, giữ Space 350 ms rồi nhả hoặc chạm để bắt đầu. Lịch sử lưu trong trình duyệt, hỗ trợ +2/DNF, Ao5/Ao12 và CSV.
- **Thu gọn** mở riêng phần Học cách xoay. Lựa chọn ngôn ngữ và chế độ hiển thị được lưu trong trình duyệt.

## Mã nguồn và dữ liệu

React quản lý các route, bố cục và modal trong `src/app/` và `src/features/`. `src/cube-tools/` chứa engine, dữ liệu và các trình tương tác dùng lại từ nhánh Vanilla JS. `InteractiveView` gắn trình tương tác vào một vùng DOM riêng và dọn tài nguyên khi đổi trang.

Các lệnh dev, test và build sinh catalog vào `public/catalog/`. Thêm công thức vào `scripts/sources/`, chạy `npm run algorithms` để kiểm chứng và tạo lại bộ dữ liệu CFOP.

Bản build tĩnh nằm ở `dist/` và có Content Security Policy. `dev` và `preview` mặc định chỉ lắng nghe trên localhost. [Nguồn dữ liệu và giấy phép](THIRD_PARTY_NOTICES.md)
