# SOBIK99 · Cube Club

Website Rubik tiếng Việt, giao diện sáng và hình học, không có giao dịch thật.
React 19 + TypeScript + Vite, website tĩnh dùng hash routing.

## Chạy

Node.js 22.12 trở lên.

```sh
npm ci
npm run dev        # dev server
npm run typecheck  # tsc --noEmit
npm test           # Vitest + React Testing Library
npm run build      # → dist/
npm run preview
```

## Cấu trúc

```
src/
  main.tsx                 Entry: ToastProvider → ModalProvider → App
  app/
    App.tsx                Layout + điều hướng (đóng modal, cuộn lên đầu, đặt title)
    routes.tsx             Bảng route — thêm trang = thêm một dòng
    router/                Hash router tự viết (useHashLocation, matchPath)
    RouteErrorBoundary.tsx
  features/                Mỗi thư mục là một tính năng độc lập
    landing/               Hành trình cuộn giải Rubik, carousel thương hiệu
      cubeEngine.ts          Mô phỏng 3×3 thuần logic (test được)
      useScrollJourney.ts    Hoạt cảnh theo cuộn (ghi DOM trực tiếp mỗi frame)
    catalog/               Bộ sưu tập, chi tiết, cơ chế, checkout mô phỏng
    compare/               So sánh 2 mẫu (store + hook + dialog)
    guide/                 Bài học, thư viện CFOP 119 case, TwistyPlayer
    timer/                 Timer, scramble, lịch sử, xuất CSV
    sources/, layout/
  shared/
    lib/                   Hàm thuần: stats, storage, csv, safeUrl, format
    store/createStore.ts   External store tối giản (useSyncExternalStore)
    ui/                    Toast, Modal, ExternalLink, CubeArt
    hooks/
  data/                    cubes, lessons, algorithms.json + types.ts
  styles/                  CSS gốc (class name giữ nguyên)
tests/                     Vitest
```

**Các pattern dùng trong dự án**

- **Feature folder**: code của một tính năng nằm cùng một chỗ, chỉ import từ `shared/` và `data/`.
- **Logic thuần tách khỏi UI**: lọc, phân trang, thống kê, cube engine, CSV đều là hàm thuần và có test riêng.
- **External store + hook** (`createStore` → `useStore`): dùng cho state phải còn khi chuyển trang và lưu localStorage (so sánh, đã học, timer). Action là hàm thường; hook bọc thêm thông báo lỗi.
- **UI service qua Context**: `useToast()` và `useModal().open(<Component/>)`. Nội dung modal là component React, cleanup chạy khi đóng hoặc thay nội dung.
- **Imperative ở chỗ cần hiệu năng**: transform 3D theo scroll và TwistyPlayer thao tác DOM qua ref; React chỉ nhận các thay đổi thưa (chương, bước giải).

## Bảo mật

- Không còn `innerHTML`: toàn bộ nội dung render qua JSX, React tự escape.
- Link ngoài qua `ExternalLink`: chỉ nhận `https:` và luôn có `rel="noopener noreferrer"`.
- Dữ liệu localStorage được validate trước khi dùng; tham số URL (`type`, `brand`, `puzzle`) chỉ nhận giá trị trong danh sách cho phép.
- CSV xuất ra chống formula injection.
- Bản build có Content-Security-Policy (`vite.config.ts`). Với hosting hỗ trợ header, nên đặt thêm CSP/`frame-ancestors` ở header HTTP.

## Nội dung

- Landing có 26 cubie, 20 phép xoay xáo trộn hợp lệ và chuỗi nghịch đảo điều khiển bằng scroll, hoàn thành sáu mặt. Có chế độ giảm chuyển động.
- Carousel quỹ đạo 5 thương hiệu, catalogue 14 mẫu, tìm kiếm/lọc, chi tiết, sơ đồ cơ chế, so sánh hai mẫu và đặt hàng mô phỏng.
- Hướng dẫn 8 loại puzzle, CFOP 41 F2L / 57 OLL / 21 PLL với 257 lựa chọn thuật toán và hình trạng thái được sinh từ cubing.js; player tải khi cần.
- Timer 3x3 random-state, Space/chạm, lưu thủ công, +2/DNF, Ao5/Ao12, CSV. Dữ liệu lưu trong trình duyệt; không đồng bộ giữa thiết bị.

Một số lựa chọn công thức là cùng thuật toán đổi hướng cầm (ghi rõ trong UI). Hướng dẫn ngoài 3x3 là lộ trình và công thức chọn lọc, không phải thư viện đầy đủ mọi case nâng cao. Giá VND là giá demo tự đặt; thông số chưa xác minh để trống, không tạo rating giả. Minh họa sản phẩm là hình học tự dựng, không phải ảnh sản phẩm.

## Deploy

`dist/` là website tĩnh, hash routing và đường dẫn asset tương đối hỗ trợ cả thư mục con. Vercel / Netlify: build `npm run build`, output `dist`. CI chạy typecheck, test và build trên mỗi push/PR. `.openai/hosting.json` chứa liên kết Sites và thư mục output, không có secret.

Nguồn và giấy phép: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Sinh lại hình công thức: `node scripts/prepare-algorithms.mjs`.
