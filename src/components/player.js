// Lazy-loaded cubing.js TwistyPlayer with Play / Pause / step controls. The setup is applied
// instantly (not animated); `alg` is what the controls step through.
let webgl;
function hasWebGL() {
  if (webgl === undefined) {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    webgl = !!gl;
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
  }
  return webgl;
}

/** Mounts a player into `el` and returns it (or null if cubing.js could not load). */
export async function mountPlayer(el, { setup = '', alg = '', tempo = 1 } = {}) {
  el.innerHTML = '<p class="muted">Đang tải mô hình 3D…</p>';
  try {
    const { TwistyPlayer } = await import('cubing/twisty');
    if (!el.isConnected) return null;
    const player = new TwistyPlayer({
      puzzle: '3x3x3', experimentalSetupAlg: setup, alg, background: 'none', controlPanel: 'bottom-row',
      visualization: hasWebGL() ? '3D' : '2D', hintFacelets: 'floating', viewerLink: 'none', tempoScale: tempo,
    });
    player.className = 'twisty';
    el.replaceChildren(player);
    if (!hasWebGL()) {
      const note = document.createElement('p');
      note.className = 'muted';
      note.textContent = 'Thiết bị không hỗ trợ WebGL: đang dùng sơ đồ 2D với cùng các bước xoay.';
      el.append(note);
    }
    return player;
  } catch (e) {
    console.error(e);
    el.innerHTML = '<p>Không tải được mô hình 3D. Bạn vẫn có thể đọc công thức và luyện trên khối thật.</p>';
    return null;
  }
}

/** Points an existing player at a new setup/alg and rewinds it. */
export function retarget(player, { setup = '', alg = '' }) {
  if (!player) return;
  player.experimentalSetupAlg = setup;
  player.alg = alg;
  player.jumpToStart?.({ flash: false });
}
