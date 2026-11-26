import { t } from '../../cube-tools/utils/i18n.js';
import type { CameraError } from './handCamera';
import type { GesturePhase } from './handGesture';
import type { useHandCamera } from './useHandCamera';

const ERRORS: Record<CameraError, string> = {
  insecure: t('Camera cần trang HTTPS hoặc localhost.', 'Camera access requires HTTPS or localhost.'),
  unsupported: t('Trình duyệt này thiếu hỗ trợ theo dõi tay qua webcam.', 'This browser lacks support for webcam hand tracking.'),
  permission: t('Hãy cấp quyền camera trong trình duyệt rồi thử lại.', 'Allow camera access in your browser, then try again.'),
  unavailable: t('Không mở được camera. Kiểm tra camera đã kết nối và đang rảnh.', 'The camera could not be opened. Check that it is connected and available.'),
  tracking: t('Không khởi động được bộ theo dõi tay. Hãy thử bật lại camera.', 'Hand tracking could not start. Try turning the camera on again.'),
};

const PHASE: Record<GesturePhase, string> = {
  searching: t('Đưa một tay vào khung hình', 'Place one hand in view'),
  release: t('Mở ngón cái và ngón trỏ để bắt đầu', 'Open your thumb and index finger to start'),
  pointing: t('Chụm ngón để giữ một ô', 'Pinch to grab a tile'),
  busy: t('Đang xoay khối', 'Cube is turning'),
  drag: t('Kéo theo hướng xoay tầng', 'Drag in the direction of the turn'),
  edge: t('Thả tay và chọn ô ở viền', 'Release and grab a tile along the edge'),
  turn: t('Thả tay để xoay', 'Release to turn'),
  orbit: t('Đang đổi góc nhìn', 'Changing the view'),
};

export function CameraControls({ camera, disabled }: {
  camera: ReturnType<typeof useHandCamera>;
  disabled: boolean;
}) {
  const { state, feedback, video, start, stop } = camera;
  const active = state === 'starting' || state === 'on';
  const error = state === 'off' || active ? null : ERRORS[state];
  return <section className="simulator-camera" aria-labelledby="simulator-camera-heading">
    <h2 id="simulator-camera-heading">{t('Điều khiển bằng tay', 'Hand controls')}</h2>
    <video ref={video} muted playsInline hidden={!active}
      aria-label={t('Hình ảnh camera phản chiếu', 'Mirrored camera preview')} />
    {state === 'on' && <p className="simulator-camera-feedback" role="status">
      {feedback.preview && <kbd>{feedback.preview}</kbd>} {PHASE[feedback.phase]}
    </p>}
    {state === 'starting' && <p role="status">{t('Đang bật camera và tải bộ nhận diện…', 'Starting the camera and loading hand tracking…')}</p>}
    {error && <p role="alert">{error}</p>}
    <p>{t(
      'Đưa ngón trỏ tới ô ở viền, chụm với ngón cái rồi kéo và thả để xoay. Chụm trên nền trống rồi kéo để đổi góc nhìn.',
      'Point at a tile along the edge, pinch with your thumb, then drag and release to turn. Pinch and drag on the background to orbit.',
    )}</p>
    <button className={active ? 'small-button' : 'button primary'} type="button"
      disabled={!active && disabled} onClick={active ? stop : start}>
      {active ? t('Tắt camera', 'Turn camera off') : t('Bật camera', 'Turn camera on')}
    </button>
    <p className="simulator-camera-local">{t('Video được xử lý trực tiếp trên thiết bị.', 'Video is processed on this device.')}</p>
  </section>;
}
