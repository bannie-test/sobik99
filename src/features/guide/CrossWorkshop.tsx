import { usePlayAlgorithm } from './AlgorithmPlayer';

const CROSS_EXAMPLE = "F2 D R2 D' L2";

/** Cross không có danh sách công thức cố định → hướng dẫn cách lập kế hoạch. */
export function CrossWorkshop() {
  const play = usePlayAlgorithm();
  return (
    <div id="case-grid" className="cross-workshop">
      <div className="cross-shape">
        <i></i>
        <i></i>
        <i></i>
        <i></i>
        <i></i>
      </div>
      <div>
        <h3>Luyện chậm, nhìn ít hơn.</h3>
        <ol>
          <li>Chọn màu đáy và tìm cả bốn cạnh.</li>
          <li>Định trước thứ tự chèn, tính cả việc căn màu bên.</li>
          <li>Thực hiện kế hoạch mà không dừng để tìm cạnh.</li>
          <li>So lại số bước và cách chọn thứ tự.</li>
        </ol>
        <button
          className="button primary"
          id="cross-demo"
          onClick={() => play({ alg: CROSS_EXAMPLE, puzzle: '3x3', title: 'Ví dụ Cross' })}
        >
          Xem ví dụ phục hồi Cross ↗
        </button>
      </div>
    </div>
  );
}
