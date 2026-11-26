import { t } from '../../cube-tools/utils/i18n.js';
import { usePlayAlgorithm } from './AlgorithmPlayer';

export function CrossWorkshop({ compact }: { compact: boolean }) {
  const play = usePlayAlgorithm();
  return (
    <div id="case-grid" className="cross-workshop">
      <div className="cross-shape" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
      <div>
        <h3>{t('Lập kế hoạch Cross', 'Plan the cross')}</h3>
        <p>{t('Giữ trắng ở dưới, tìm bốn cạnh và căn màu bên với tâm trước khi chèn.', 'Keep white down, find the four edges and match each side color to its center before inserting.')}</p>
        <div className="row-buttons">
          {compact ? <button className="button primary" onClick={async (event) => {
            const button = event.currentTarget;
            button.disabled = true;
            try {
              const [{ randomScramble3x3 }, { cfop }, { apply, solvedFacelets }] = await Promise.all([
                import('../../cube-tools/core/cubing-search.js'),
                import('../../cube-tools/core/solve-service.js'),
                import('../../cube-tools/core/cube.js'),
              ]);
              const scramble = await randomScramble3x3();
              const result = cfop().solve(apply(solvedFacelets(), scramble), 'cross');
              if (button.isConnected && result.ok && result.steps) {
                play({ alg: result.steps.map((step: { moves: string }) => step.moves).join(' '), setup: scramble, title: 'Cross' });
              }
            } catch {
              if (button.isConnected) button.textContent = t('Tạo scramble lại', 'Retry scramble');
            } finally {
              button.disabled = false;
            }
          }}>{t('Xem cách xoay · Cross ngẫu nhiên', 'Watch a random cross')}</button> : <>
            <a className="button primary" href="#/solve?random=1&goal=cross">{t('Luyện Cross với scramble mới ↗', 'Practice cross with a new scramble ↗')}</a>
            <a className="button secondary" href="#/solve?random=1">{t('Xem một lần giải trọn vẹn ↗', 'Watch a full solve ↗')}</a>
          </>}
        </div>
      </div>
    </div>
  );
}
