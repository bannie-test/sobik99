import { t as tr } from './utils/i18n.js';
const LETTERS = [
  ['U', 'UB UR UF UL', 'UBL UBR UFR UFL'],
  ['L', 'LU LF LD LB', 'LBU LFU LFD LBD'],
  ['F', 'FU FR FD FL', 'FLU FRU FRD FLD'],
  ['R', 'RU RB RD RF', 'RFU RBU RBD RFD'],
  ['B', 'BU BL BD BR', 'BRU BLU BLD BRD'],
  ['D', 'DF DR DB DL', 'DFL DFR DBR DBL'],
];

export function blindfoldPage(root) {
  root.innerHTML = `<section class="blindfold-page">
    <header class="page-heading">
      <div><small>3BLD / RUBIK 3×3</small><h1>${tr("Giải Rubik", "Solve")}<br><em>${tr("bịt mắt.", "blindfolded.")}</em></h1></div>
      <p>${tr("Quan sát khối một lần để ghi nhớ toàn bộ lời giải. Khi đã bịt mắt, gọi lại từng mục tiêu và xoay theo đúng thứ tự cho đến khi xong.", "Inspect the cube and memorize your targets. Put on the blindfold, then recall and execute each target in order.")}</p>
    </header>

    <div class="blindfold-grid">
      <article class="learning-intro">
        <h2>${tr("Đọc khối thành chuỗi chữ", "Read the cube as a letter sequence")}</h2>
        <ol>
          <li>${tr("Cầm trắng trên, xanh lá phía trước. Dùng bảng chữ Speffz để gán A–X cho 24 sticker cạnh và A–X riêng cho 24 sticker góc. Chữ đầu trong ký hiệu như", "Hold white on top and green in front. Use Speffz to label the 24 edge stickers A–X and the 24 corner stickers separately A–X. The first letter in a sticker name such as")} <code>UR</code> ${tr("chỉ mặt của sticker.", "indicates the sticker's face.")}</li>
          <li>${tr("Với Old Pochmann, bắt đầu ở sticker đệm", "In Old Pochmann, start at the buffer sticker")} <code>UR</code> ${tr("cho cạnh và", "for edges and")} <code>LBU</code> ${tr("cho góc. Nhìn màu của sticker tại đệm và tìm vị trí đúng của nó. Ghi nhớ chữ ở vị trí đích, rồi đọc tiếp sticker đang nằm ở đó.", "for corners. Identify the sticker in the buffer and find where it belongs. Memorize the target letter, then read the sticker currently in that target.")}</li>
          <li>${tr("Khi gặp lại viên đệm, kết thúc vòng đó. Nếu còn viên sai chưa đi qua, chọn một sticker của viên đó để mở vòng mới và ghi cả chữ mở lẫn chữ khép vòng. Hai chữ này có thể thuộc cùng một viên nhưng chỉ hai hướng khác nhau.", "End the cycle when you return to the buffer piece. If a misplaced piece remains unvisited, pick one of its stickers to start a new cycle. Record the letters that open and close it. They can refer to different orientations of the same piece.")}</li>
          <li>${tr("Với viên đúng chỗ nhưng sai hướng ngoài đệm, ghi một cặp gồm sticker bạn chọn và vị trí đúng của sticker đó. Giữ riêng chuỗi cạnh, chuỗi góc và kiểm tra số chữ của cả hai cùng chẵn hoặc cùng lẻ.", "For a misoriented piece outside the buffer that is already in the right position, record your chosen sticker and its correct sticker position as a pair. Keep edge and corner sequences separate and check that both lengths are even or both are odd.")}</li>
        </ol>
        <p>${tr("Ví dụ, nếu sticker ở đệm thuộc vị trí C, sticker ở C thuộc vị trí H, và ở H là viên đệm, chuỗi của vòng này là", "If the buffer sticker belongs at C, the sticker at C belongs at H, and H holds the buffer piece, the sequence for that cycle is")} <code>CH</code>.</p>
        <details>
          <summary>${tr("Bảng chữ Speffz", "Speffz lettering")}</summary>
          <div class="table-wrap"><table>
            <thead><tr><th scope="col">${tr("Mặt", "Face")}</th><th scope="col">${tr("Cạnh", "Edges")}</th><th scope="col">${tr("Góc", "Corners")}</th></tr></thead>
            <tbody>${LETTERS.map(([face, edges, corners], row) => {
              const stickers = values => values.split(' ').map((sticker, column) =>
                `<code>${String.fromCharCode(65 + 4 * row + column)}=${sticker}</code>`).join(' ');
              return `<tr><th scope="row">${face}</th><td>${stickers(edges)}</td><td>${stickers(corners)}</td></tr>`;
            }).join('')}</tbody>
          </table></div>
        </details>
      </article>

      <article class="learning-intro">
        <h2>${tr("Gọi lại và xoay", "Recall and execute")}</h2>
        <ol>
          <li>${tr("Nhẩm lại đầy đủ từ chữ đầu đến chữ cuối trước khi bịt mắt. Giữ nguyên hướng cầm khi chuyển sang giai đoạn xoay.", "Rehearse the full sequence before putting on the blindfold. Keep the cube in the same orientation as you start executing.")}</li>
          <li>${tr("Giải cạnh trước. Với mỗi chữ, đặt sticker đích vào", "Solve the edges first. For each letter, bring the target sticker to")} <code>UL</code> ${tr("bằng setup tương ứng, chạy công thức đổi cạnh rồi đảo ngược setup.", "with the matching setup moves, run the edge-swap algorithm, and undo the setup moves.")}</li>
          <li>${tr("Nếu hai chuỗi đều có số chữ lẻ, chạy công thức parity sau phần cạnh. Sau đó giải góc theo chuỗi đã nhớ, đưa từng sticker đích vào", "If both sequences have an odd number of letters, run the parity algorithm after the edges. Then execute your corner sequence, bringing each target sticker to")} <code>DFR</code>${tr(", đổi góc rồi đảo ngược setup.", ", swapping the corners, and undoing the setup moves.")}</li>
        </ol>
        <details><summary>${tr("Công thức Old Pochmann", "Old Pochmann algorithms")}</summary>
          <p><b>${tr("Đổi cạnh", "Edge swap")}</b><br><code>R U R' U' R' F R2 U' R' U' R U R' F'</code></p>
          <p><b>${tr("Đổi góc", "Corner swap")}</b><br><code>R U' R' U' R U R' F' R U R' U' R' F R</code></p>
          <p><b>Parity</b><br><code>R U' R' U' R U R D R' U' R D' R' U2 R' U'</code></p>
        </details>
        <p><a href="https://www.jperm.net/bld" target="_blank" rel="noopener">${tr("Bảng chữ, setup và ví dụ giải đầy đủ của J Perm", "J Perm’s lettering, setup moves, and full solve example")}</a></p>
      </article>
    </div>

    <h2>${tr("Ba cách giữ chuỗi trong đầu", "Three ways to memorize a sequence")}</h2>
    <div class="blindfold-grid memory-methods">
      <article class="learning-intro lilac"><h3>${tr("Cặp chữ và hình ảnh", "Letter pairs and images")}</h3><p>${tr("Ghép hai chữ liền nhau và chọn hình ảnh cố định cho mỗi cặp. Với", "Pair up consecutive letters and give each pair a consistent image. For")} <code>CH TM BD</code>${tr(", hãy tưởng tượng", ", picture")} <b>${tr("Cá Heo", "a CHeetah")}</b> ${tr("làm đổ", "knocking a")} <b>${tr("Tách Mứt", "Tomato")}</b> ${tr("lên", "onto a")} <b>${tr("Bàn Đá", "BDay cake")}</b>${tr(". Thêm chuyển động để dễ nhớ thứ tự. Nếu lẻ một chữ, nhẩm riêng chữ cuối.", ". Picture the action to help remember the order. Rehearse any unpaired letter separately.")}</p></article>
      <article class="learning-intro mint"><h3>${tr("Cung điện trí nhớ", "Memory palace")}</h3><p>${tr("Đặt từng hình ảnh dọc một lộ trình quen thuộc. Ví dụ cá heo ở cửa, tách mứt trên kệ và bàn đá ở bếp. Đi lại đúng thứ tự trong đầu khi xoay. Dùng hai lộ trình riêng để phân biệt cạnh và góc.", "Place the images along a familiar route. For example, put the cheetah by the door, the tomato on a shelf, and the birthday cake in the kitchen. Walk that route mentally as you solve. Use separate routes for edges and corners.")}</p></article>
      <article class="learning-intro butter"><h3>${tr("Nhẩm âm và chia cụm", "Sounds and chunks")}</h3><p>${tr("Đọc từng cặp theo cùng một nhịp, ngắt nhẹ giữa các cụm. Cách này hợp với chuỗi ngắn. Có thể lưu chuỗi góc bằng hình ảnh trước, rồi nhẩm chuỗi cạnh sau cùng để gọi lại cạnh ngay khi bắt đầu xoay.", "Say the pairs in a steady rhythm with a pause between groups. This works well for short sequences. Try storing corners as images, then repeating the edges so they are fresh when you start solving.")}</p></article>
    </div>

    <section class="learning-intro blindfold-practice">
      <h2>${tr("Thử nhớ một chuỗi", "Practice a sequence")}</h2>
      <p>${tr("Nhớ các cặp theo thứ tự. Ẩn chuỗi, gõ lại từ trí nhớ rồi kiểm tra. Đây là bài tập nhớ chữ trước khi chuyển sang khối thật.", "Memorize the pairs in order. Hide them, type the sequence from memory, and check your answer.")}</p>
      <p><code id="memo-sequence">CH TM BD</code></p>
      <div class="row-buttons">
        <button type="button" class="small-button" id="memo-toggle" aria-controls="memo-sequence" aria-expanded="true">${tr("Ẩn chuỗi", "Hide sequence")}</button>
        <button type="button" class="small-button" id="memo-new">${tr("Chuỗi mới", "New sequence")}</button>
      </div>
      <form id="memo-practice" hidden>
        <label>${tr("Chuỗi bạn nhớ", "Your remembered sequence")} <input type="text" name="memo" required autocomplete="off" spellcheck="false"></label>
        <button type="submit" class="button primary">${tr("Kiểm tra", "Check")}</button>
      </form>
      <p id="memo-feedback" role="status"></p>
      <p>${tr("Khi chuyển sang khối thật, tập đọc và giải cạnh với mắt mở trước. Sau đó thử một chu trình ngắn khi bịt mắt. Thêm góc và parity khi đã thực hiện đúng setup và hoàn tác một cách ổn định.", "On a real cube, practice reading and solving edges with your eyes open first. Then try a short cycle blindfolded. Add corners and parity once your setup moves and their inverses are reliable.")}</p>
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
    toggle.textContent = visible ? tr('Ẩn chuỗi', "Hide sequence") : tr('Hiện chuỗi', "Show sequence");
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
      ? tr('Đúng cả ba cặp và đúng thứ tự.', "All three pairs are correct and in order.")
      : tr('Chuỗi chưa khớp. Thử nhẩm lại hoặc bấm Hiện chuỗi để đối chiếu.', "The sequence doesn't match. Try again or select Show sequence to compare.");
  });
}
