const LETTERS = [
  ['U', 'UB UR UF UL', 'UBL UBR UFR UFL'],
  ['L', 'LU LF LD LB', 'LBU LFU LFD LBD'],
  ['F', 'FU FR FD FL', 'FLU FRU FRD FLD'],
  ['R', 'RU RB RD RF', 'RFU RBU RBD RFD'],
  ['B', 'BU BL BD BR', 'BRU BLU BLD BRD'],
  ['D', 'DF DR DB DL', 'DFL DFR DBR DBL'],
];

export function blindfoldPage(root) {
  root.innerHTML = `<section class="page-shell blindfold-page">
    <header class="page-heading">
      <div><small>3BLD / RUBIK 3×3</small><h1>Giải Rubik<br><em>bịt mắt.</em></h1></div>
      <p>Quan sát khối một lần để ghi nhớ toàn bộ lời giải. Khi đã bịt mắt, gọi lại từng mục tiêu và xoay theo đúng thứ tự cho đến khi xong.</p>
    </header>

    <div class="blindfold-grid">
      <article class="learning-intro">
        <h2>Đọc khối thành chuỗi chữ</h2>
        <ol>
          <li>Cầm trắng trên, xanh lá phía trước. Dùng bảng chữ Speffz để gán A–X cho 24 sticker cạnh và A–X riêng cho 24 sticker góc. Chữ đầu trong ký hiệu như <code>UR</code> chỉ mặt của sticker.</li>
          <li>Với Old Pochmann, bắt đầu ở sticker đệm <code>UR</code> cho cạnh và <code>LBU</code> cho góc. Nhìn màu của sticker tại đệm và tìm vị trí đúng của nó. Ghi nhớ chữ ở vị trí đích, rồi đọc tiếp sticker đang nằm ở đó.</li>
          <li>Khi gặp lại viên đệm, kết thúc vòng đó. Nếu còn viên sai chưa đi qua, chọn một sticker của viên đó để mở vòng mới và ghi cả chữ mở lẫn chữ khép vòng. Hai chữ này có thể thuộc cùng một viên nhưng chỉ hai hướng khác nhau.</li>
          <li>Với viên đúng chỗ nhưng sai hướng ngoài đệm, ghi một cặp gồm sticker bạn chọn và vị trí đúng của sticker đó. Giữ riêng chuỗi cạnh, chuỗi góc và kiểm tra số chữ của cả hai cùng chẵn hoặc cùng lẻ.</li>
        </ol>
        <p>Ví dụ, nếu sticker ở đệm thuộc vị trí C, sticker ở C thuộc vị trí H, và ở H là viên đệm, chuỗi của vòng này là <code>CH</code>.</p>
        <details>
          <summary>Bảng chữ Speffz</summary>
          <div class="table-wrap"><table>
            <thead><tr><th scope="col">Mặt</th><th scope="col">Cạnh</th><th scope="col">Góc</th></tr></thead>
            <tbody>${LETTERS.map(([face, edges, corners], row) => {
              const stickers = values => values.split(' ').map((sticker, column) =>
                `<code>${String.fromCharCode(65 + 4 * row + column)}=${sticker}</code>`).join(' ');
              return `<tr><th scope="row">${face}</th><td>${stickers(edges)}</td><td>${stickers(corners)}</td></tr>`;
            }).join('')}</tbody>
          </table></div>
        </details>
      </article>

      <article class="learning-intro">
        <h2>Gọi lại và xoay</h2>
        <ol>
          <li>Nhẩm lại đầy đủ từ chữ đầu đến chữ cuối trước khi bịt mắt. Giữ nguyên hướng cầm khi chuyển sang giai đoạn xoay.</li>
          <li>Giải cạnh trước. Với mỗi chữ, đặt sticker đích vào <code>UL</code> bằng setup tương ứng, chạy công thức đổi cạnh rồi đảo ngược setup.</li>
          <li>Nếu hai chuỗi đều có số chữ lẻ, chạy công thức parity sau phần cạnh. Sau đó giải góc theo chuỗi đã nhớ, đưa từng sticker đích vào <code>DFR</code>, đổi góc rồi đảo ngược setup.</li>
        </ol>
        <details><summary>Công thức Old Pochmann</summary>
          <p><b>Đổi cạnh</b><br><code>R U R' U' R' F R2 U' R' U' R U R' F'</code></p>
          <p><b>Đổi góc</b><br><code>R U' R' U' R U R' F' R U R' U' R' F R</code></p>
          <p><b>Parity</b><br><code>R U' R' U' R U R D R' U' R D' R' U2 R' U'</code></p>
        </details>
        <p><a href="https://www.jperm.net/bld" target="_blank" rel="noopener">Bảng chữ, setup và ví dụ giải đầy đủ của J Perm</a></p>
      </article>
    </div>

    <h2>Ba cách giữ chuỗi trong đầu</h2>
    <div class="blindfold-grid memory-methods">
      <article class="learning-intro lilac"><h3>Cặp chữ và hình ảnh</h3><p>Ghép hai chữ liền nhau và chọn hình ảnh cố định cho mỗi cặp. Với <code>CH TM BD</code>, hãy tưởng tượng <b>Cá Heo</b> làm đổ <b>Tách Mứt</b> lên <b>Bàn Đá</b>. Thêm chuyển động để dễ nhớ thứ tự. Nếu lẻ một chữ, nhẩm riêng chữ cuối.</p></article>
      <article class="learning-intro mint"><h3>Cung điện trí nhớ</h3><p>Đặt từng hình ảnh dọc một lộ trình quen thuộc. Ví dụ cá heo ở cửa, tách mứt trên kệ và bàn đá ở bếp. Đi lại đúng thứ tự trong đầu khi xoay. Dùng hai lộ trình riêng để phân biệt cạnh và góc.</p></article>
      <article class="learning-intro butter"><h3>Nhẩm âm và chia cụm</h3><p>Đọc từng cặp theo cùng một nhịp, ngắt nhẹ giữa các cụm. Cách này hợp với chuỗi ngắn. Có thể lưu chuỗi góc bằng hình ảnh trước, rồi nhẩm chuỗi cạnh sau cùng để gọi lại cạnh ngay khi bắt đầu xoay.</p></article>
    </div>

    <section class="learning-intro blindfold-practice">
      <h2>Thử nhớ một chuỗi</h2>
      <p>Nhớ các cặp theo thứ tự. Ẩn chuỗi, gõ lại từ trí nhớ rồi kiểm tra. Đây là bài tập nhớ chữ trước khi chuyển sang khối thật.</p>
      <p><code id="memo-sequence">CH TM BD</code></p>
      <div class="row-buttons">
        <button type="button" class="small-button" id="memo-toggle" aria-controls="memo-sequence" aria-expanded="true">Ẩn chuỗi</button>
        <button type="button" class="small-button" id="memo-new">Chuỗi mới</button>
      </div>
      <form id="memo-practice" hidden>
        <label>Chuỗi bạn nhớ <input type="text" name="memo" required autocomplete="off" spellcheck="false"></label>
        <button type="submit" class="button primary">Kiểm tra</button>
      </form>
      <p id="memo-feedback" role="status"></p>
      <p>Khi chuyển sang khối thật, tập đọc và giải cạnh với mắt mở trước. Sau đó thử một chu trình ngắn khi bịt mắt. Thêm góc và parity khi đã thực hiện đúng setup và hoàn tác một cách ổn định.</p>
    </section>
  </section>`;

  const sequence = root.querySelector('#memo-sequence');
  const toggle = root.querySelector('#memo-toggle');
  const form = root.querySelector('#memo-practice');
  const input = form.elements.memo;
  const feedback = root.querySelector('#memo-feedback');

  function showSequence(visible) {
    sequence.hidden = !visible;
    toggle.setAttribute('aria-expanded', String(visible));
    toggle.textContent = visible ? 'Ẩn chuỗi' : 'Hiện chuỗi';
    form.hidden = visible;
    feedback.textContent = '';
  }

  toggle.addEventListener('click', () => {
    showSequence(sequence.hidden);
    if (sequence.hidden) input.focus();
  });
  root.querySelector('#memo-new').addEventListener('click', () => {
    const pairs = ['CH', 'TM', 'BD', 'MX', 'SN', 'VC', 'PT', 'LG', 'HK', 'QN'];
    sequence.textContent = Array.from({ length: 3 }, () => pairs.splice(Math.floor(Math.random() * pairs.length), 1)[0]).join(' ');
    input.value = '';
    showSequence(true);
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const normalize = value => value.toUpperCase().replace(/\s+/g, '');
    feedback.textContent = normalize(input.value) === normalize(sequence.textContent)
      ? 'Đúng cả ba cặp và đúng thứ tự.'
      : 'Chuỗi chưa khớp. Thử nhẩm lại hoặc bấm Hiện chuỗi để đối chiếu.';
  });
}
