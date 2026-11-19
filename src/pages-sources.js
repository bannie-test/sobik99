import { brandSources, brandNotes } from './data/brands.js';
import { escapeHTML as esc } from './utils/ui.js';
import { getJSON } from './pages-catalog.js';

export async function sourcesPage(root) {
  root.innerHTML = `<section class="page-shell source-page"><small>CUBE CLUB / MINH BẠCH DỮ LIỆU</small><h1>Nguồn rõ ràng.<br><em>Khám phá an tâm.</em></h1>
  <h2>Một website cá nhân, phi thương mại.</h2><p>SOBIK99 không bán hàng, không có giá, không thu thập địa chỉ và không xử lý thanh toán. Kệ Rubik là kệ trưng bày tham khảo.</p>
  <h2>Kệ Rubik</h2><p>Danh mục được dựng từ thư mục <code>public/catalog/brands/&lt;hãng&gt;/&lt;loại&gt;/&lt;mẫu&gt;/</code>. Tên mẫu là thông tin sản phẩm công khai; thông số chưa xác minh để trống, không có điểm đánh giá giả. Logo hãng hiện là ô chờ cho đến khi có ảnh logo. Mọi thương hiệu thuộc chủ sở hữu tương ứng.</p>
  <h3>Ghi công ảnh</h3><div id="credits"><p class="muted">Đang tải…</p></div>
  <h3>Nguồn thông tin hãng</h3><ul>${brandSources.map(s => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)} ↗</a></li>`).join('')}</ul>
  <details><summary>Ghi chú quan hệ thương hiệu</summary><ul>${brandNotes.map(n => `<li>${esc(n)}</li>`).join('')}</ul></details>
  <h2>Công thức và trình giải</h2><p>Thư viện CFOP gồm 41 F2L, 57 OLL, 21 PLL. Mỗi công thức được kiểm chứng tự động bằng mô hình cube của SOBIK99 và được xếp vào đúng case nó giải. Nguồn: công thức phổ biến trong cộng đồng speedcubing (nhãn “Hiện đại”), <a href="https://github.com/lukejacksonn/cube" target="_blank" rel="noopener">Cube Coach của Luke Jackson (MIT)</a> và thư viện của ứng dụng SOBIK Android. Công thức là dữ kiện; phần giải thích tiếng Việt, hình minh họa và trình giải do SOBIK99 biên soạn.</p>
  <p>Trình giải CFOP chạy hoàn toàn trên trình duyệt: Cross tối ưu bằng bảng khoảng cách, F2L/OLL/PLL tra theo thư viện. Lời giải ngắn, scramble ngẫu nhiên và mô hình 3D dùng <a href="https://github.com/cubing/cubing.js" target="_blank" rel="noopener">cubing.js (MPL-2.0)</a>.</p>
  <h2>Lịch sử</h2><ul><li><a href="https://rubiks.com/history" target="_blank" rel="noopener">Rubik’s — lịch sử 1974, 1980, 1982</a></li><li><a href="https://www.moma.org/collection/works/2908" target="_blank" rel="noopener">MoMA — Ernő Rubik</a></li></ul>
  <h2>Dữ liệu của bạn</h2><p>Lịch sử timer và đánh dấu đã học chỉ lưu trong localStorage của trình duyệt. Không có tài khoản hay máy chủ. Dùng nút xuất CSV ở Timer để giữ bản sao.</p>
  <a href="#/" class="button primary">Quay lại hành trình ↗</a></section>`;
  try {
    const rows = await getJSON('catalog/search.json');
    const credited = rows.filter(r => r.imageCredit);
    const el = root.querySelector('#credits');
    if (!el) return;
    el.innerHTML = credited.length
      ? `<ul>${credited.map(r => `<li>${esc(r.name)} — ${r.imageCredit.url ? `<a href="${esc(r.imageCredit.url)}" target="_blank" rel="noopener">${esc(r.imageCredit.name || r.imageCredit.url)} ↗</a>` : esc(r.imageCredit.name || '')}</li>`).join('')}</ul>`
      : '<p class="muted">Chưa có ảnh sản phẩm nào được thêm. Khi thêm ảnh, ghi nguồn bằng trường <code>imageCredit</code> trong info.json — danh sách sẽ tự hiện ở đây.</p>';
  } catch { /* catalog not built */ }
}
