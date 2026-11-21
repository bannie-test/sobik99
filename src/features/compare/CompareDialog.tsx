import { findCube } from '../../data/cubes';
import type { Cube } from '../../data/types';
import { useModal } from '../../shared/ui/Modal';
import { SPEC_FIELDS } from '../catalog/specFields';
import { MAX_COMPARE } from './compareStore';
import { useCompare } from './useCompare';

/** Hộp thoại so sánh: tự cập nhật khi bỏ chọn vì đọc trực tiếp từ store. */
export function CompareDialog() {
  const { ids, toggle } = useCompare();
  const modal = useModal();
  const selected = ids.map(findCube).filter((c): c is Cube => Boolean(c));

  const removeButton = (c: Cube) => (
    <button className="small-button" onClick={() => toggle(c.id)}>
      Bỏ chọn
    </button>
  );

  if (selected.length !== MAX_COMPARE) {
    return (
      <>
        <small>SO SÁNH RUBIK</small>
        <h2>Chọn hai cá tính.</h2>
        <p>Đã chọn {selected.length}/2 mẫu. Chọn thêm từ bộ sưu tập để xem các khác biệt.</p>
        {selected.map((c) => (
          <p key={c.id}>
            {c.name} {removeButton(c)}
          </p>
        ))}
        <a href="#/catalog" className="button primary" onClick={modal.close}>
          Đến bộ sưu tập ↗
        </a>
      </>
    );
  }

  const [a, b] = selected as [Cube, Cube];
  return (
    <>
      <small>HAI KHỐI RUBIK / MỘT GÓC NHÌN</small>
      <h2>Khác nhau ở đâu?</h2>
      <p>Hàng tô màu có thông số khác nhau. Ô trống là dữ liệu chưa xác minh.</p>
      <div className="table-wrap">
        <table className="comparison">
          <thead>
            <tr>
              <th>Thông số</th>
              {selected.map((c) => (
                <th key={c.id}>
                  {c.name}
                  {removeButton(c)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SPEC_FIELDS.map(({ label, get }) => {
              const va = get(a);
              const vb = get(b);
              return (
                <tr key={label} className={String(va) !== String(vb) ? 'different' : ''}>
                  <th>{label}</th>
                  <td>{va}</td>
                  <td>{vb}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
