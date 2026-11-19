import * as THREE from 'three';
import { Alg } from 'cubing/alg';
import { escapeHTML as esc } from '../utils/ui.js';
import { read, write } from '../utils/storage.js';
import { createGanFactory } from '../core/cube-shape.js';

const KEY = 'sobik_player';
const SPEEDS = [0.5, 1, 1.5, 2];

let prefs = read(
  KEY,
  { hidden: false, tempo: 1 },
  v => v && typeof v === 'object' &&
    typeof v.hidden === 'boolean' &&
    SPEEDS.includes(v.tempo)
);

const save = () => write(KEY, prefs);
const instances = new WeakMap();

const ICON = {
  start: '⏮', back: '◀', play: '▶',
  pause: '❚❚', next: '▶|', end: '⏭'
};

function shell() {
  return `
    <div class="fp-stage"
      style="position:relative;height:clamp(280px,45vw,360px);touch-action:none">
    </div>
    <div class="fp-now" aria-live="polite">
      <span class="fp-count"></span>
      <b class="fp-move"></b>
    </div>
    <div class="fp-frames" role="group"
      aria-label="Các bước của công thức"></div>
    <div class="fp-controls" role="group"
      aria-label="Điều khiển">
      ${Object.entries(ICON)
        .filter(([k]) => k !== 'pause')
        .map(([k,v]) => `
          <button type="button"
            class="fp-btn ${k === 'play' ? 'main' : ''}"
            data-act="${k}">${v}</button>
        `).join('')}
    </div>
    <div class="fp-options">
      <label class="fp-toggle">
        <input type="checkbox" data-opt="hidden">
        Hiện ô màu mặt khuất
      </label>
      <label class="fp-speed">
        Tốc độ
        <select data-opt="tempo">
          ${SPEEDS.map(s =>
            `<option value="${s}">${s}×</option>`
          ).join('')}
        </select>
      </label>
    </div>
    <p class="fp-hint muted">
      Kéo để xoay góc nhìn 3D.
      Phím ← → để lùi/tiến từng bước.
    </p>`;
}

function expandMoves(algorithm) {
  try {
    return [
      ...new Alg(algorithm)
        .expand()
        .experimentalLeafMoves()
    ].map(String);
  } catch (e) {
    console.warn('Invalid Rubik algorithm:', algorithm, e);
    return [];
  }
}

// Standard Singmaster moves.
const FACE = {
  R: ['x', 1, -1],
  L: ['x', -1, 1],
  U: ['y', 1, -1],
  D: ['y', -1, 1],
  F: ['z', 1, -1],
  B: ['z', -1, 1],
  M: ['x', 0, 1],
  E: ['y', 0, 1],
  S: ['z', 0, -1],
  x: ['x', null, -1],
  y: ['y', null, -1],
  z: ['z', null, -1]
};

function parseMove(raw) {
  const match =
    /^(\d+)?([URFDLBMESxyzurfdlb])(w)?(2)?(')?$/.exec(raw);

  if (!match) {
    throw new Error(`Unsupported move: ${raw}`);
  }

  const [, depth, letter, wide, two, prime] = match;
  const face = letter.toUpperCase();
  const lower = letter !== face;
  const key = 'xyz'.includes(letter) ? letter : face;
  const def = FACE[key];

  if (!def) {
    throw new Error(`Unsupported move: ${raw}`);
  }

  const [axis, layer, sign] = def;

  const isWide =
    (wide || lower || Number(depth) > 1) &&
    layer !== null && layer !== 0;

  const count = Number(depth) || (isWide ? 2 : 1);

  if (count > 3) {
    throw new Error(`Unsupported wide move: ${raw}`);
  }

  const layers = layer === null
    ? [-1, 0, 1]
    : layer === 0
      ? [0]
      : isWide
        ? (count === 3 ? [-1, 0, 1] : [layer, 0])
        : [layer];

  return {
    axis,
    layers,
    angle: sign * (prime ? -1 : 1) *
      (two ? Math.PI : Math.PI / 2)
  };
}

function createCube(stage) {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    34, 1, 0.1, 100
  );

  camera.position.set(5.8, 4.6, 6.6);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });

  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio || 1, 2)
  );

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.setClearColor(0x000000, 0);

  renderer.domElement.style.cssText =
    'display:block;width:100%;height:100%;' +
    'touch-action:none;cursor:grab';

  stage.append(renderer.domElement);

  scene.add(new THREE.HemisphereLight(
    0xf4f7ff, 0x747b85, 1.05
  ));

  function light(color, intensity, x, y, z) {
    const l = new THREE.DirectionalLight(color, intensity);
    l.position.set(x, y, z);
    scene.add(l);
  }

  light(0xfff8f0, 1.72, -5, 8, 10);
  light(0xcbdfff, 0.8, 5, 3, -5);
  light(0xffffff, 0.6, 5, -5, 4);

  const root = new THREE.Group();
  scene.add(root);

  let factory;
  try {
    factory = createGanFactory(renderer);
  } catch (error) {
    renderer.dispose();
    throw error;
  }

  const pieces = [];

  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        const p = factory.makePiece(x, y, z);
        if (p) {
          root.add(p);
          pieces.push(p);
        }
      }
    }
  }

  const initial = pieces.map(p => ({
    p,
    position: p.position.clone(),
    quaternion: p.quaternion.clone()
  }));

  let currentAnimation = null;
  let disposed = false;
  let raf = 0;

  let theta = -0.15;
  let phi = 0.1;
  let distance = 9.2;

  const spherical = new THREE.Spherical();

  function orbitCamera() {
    spherical.set(
      distance,
      Math.max(0.18, Math.min(Math.PI - 0.18, 1.05 + phi)),
      0.65 + theta
    );
    camera.position.setFromSpherical(spherical);
    camera.lookAt(0, 0, 0);
  }

  orbitCamera();

  function resize() {
    const r = stage.getBoundingClientRect();
    const w = Math.max(1, r.width);
    const h = Math.max(1, r.height || 350);

    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  const observer = typeof ResizeObserver !== 'undefined'
    ? new ResizeObserver(resize)
    : null;

  observer?.observe(stage);
  resize();

  function render() {
    if (disposed) return;
    if (!stage.isConnected || (stage.closest('dialog')?.open === false)) {
      dispose();
      return;
    }
    raf = requestAnimationFrame(render);
    renderer.render(scene, camera);
  }

  render();

  let pointer = null;

  function down(e) {
    pointer = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY
    };
    renderer.domElement.setPointerCapture(e.pointerId);
  }

  function move(e) {
    if (!pointer || pointer.id !== e.pointerId) return;

    theta -= (e.clientX - pointer.x) * 0.008;
    phi += (e.clientY - pointer.y) * 0.008;

    pointer.x = e.clientX;
    pointer.y = e.clientY;

    orbitCamera();
  }

  function up(e) {
    if (pointer?.id === e.pointerId) pointer = null;
  }

  function wheel(e) {
    e.preventDefault();
    distance = Math.max(
      6,
      Math.min(14, distance + e.deltaY * 0.006)
    );
    orbitCamera();
  }

  renderer.domElement.addEventListener('pointerdown', down);
  renderer.domElement.addEventListener('pointermove', move);
  renderer.domElement.addEventListener('pointerup', up);
  renderer.domElement.addEventListener('pointercancel', up);
  renderer.domElement.addEventListener(
    'wheel', wheel, { passive: false }
  );

  function reset() {
    if (currentAnimation) {
      currentAnimation.cancelled = true;
      currentAnimation = null;
    }

    for (const { p, position, quaternion } of initial) {
      root.attach(p);
      p.position.copy(position);
      p.quaternion.copy(quaternion);
    }
  }

  function rotate(raw, animate = false, duration = 250) {
    const move = parseMove(raw);

    const selected = pieces.filter(p =>
      move.layers.includes(
        Math.round(p.position[move.axis])
      )
    );

    const pivot = new THREE.Group();
    root.add(pivot);

    for (const p of selected) {
      pivot.attach(p);
    }

    function finish() {
      pivot.rotation[move.axis] = move.angle;
      pivot.updateMatrixWorld(true);

      for (const p of selected) {
        root.attach(p);

        p.position.set(
          Math.round(p.position.x),
          Math.round(p.position.y),
          Math.round(p.position.z)
        );

        const m = new THREE.Matrix4()
          .makeRotationFromQuaternion(p.quaternion);

        const e = m.elements;

        for (let i = 0; i < 16; i++) {
          if (![3,7,11,12,13,14,15].includes(i)) {
            e[i] = Math.round(e[i]);
          }
        }

        p.quaternion.setFromRotationMatrix(m);
      }

      root.remove(pivot);
    }

    if (!animate) {
      finish();
      return Promise.resolve(true);
    }

    return new Promise(resolve => {
      const state = { cancelled: false };
      currentAnimation = state;
      const start = performance.now();

      function tick(now) {
        if (state.cancelled) {
          root.remove(pivot);
          resolve(false);
          return;
        }

        const t = Math.min(
          1,
          (now - start) / Math.max(1, duration)
        );

        const smooth = t * t * (3 - 2 * t);

        pivot.rotation[move.axis] = move.angle * smooth;

        if (t < 1) {
          requestAnimationFrame(tick);
        } else {
          finish();
          currentAnimation = null;
          resolve(true);
        }
      }

      requestAnimationFrame(tick);
    });
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(raf);
    reset();
    observer?.disconnect();

    renderer.domElement.removeEventListener('pointerdown', down);
    renderer.domElement.removeEventListener('pointermove', move);
    renderer.domElement.removeEventListener('pointerup', up);
    renderer.domElement.removeEventListener('pointercancel', up);
    renderer.domElement.removeEventListener('wheel', wheel);

    factory.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  }

  return {
    reset, rotate, dispose,
    maskLastLayer: enabled => pieces.forEach(piece => factory.maskLastLayer(piece, enabled)),
    showHints: enabled => pieces.forEach(piece => factory.showHints(piece, enabled)),
  };
}

async function mountFallback(el, { setup, alg, puzzle, maskLastLayer }) {
  const { TwistyPlayer } = await import('cubing/twisty');
  if (!el.isConnected) return null;
  const native = new TwistyPlayer({
    puzzle, visualization: '2D', background: 'none', viewerLink: 'none', tempoScale: prefs.tempo,
  });
  native.className = 'twisty';
  const player = {
    setAlgorithm(next) {
      native.pause();
      native.experimentalSetupAlg = next.setup || '';
      native.alg = next.alg || '';
      native.experimentalStickeringMaskOrbits = next.maskLastLayer ? {
        orbits: {
          EDGES: { pieces: Array.from({ length: 12 }, (_, i) => i >= 4 && i < 8 ? { facelets: ['ignored', 'ignored'] } : null) },
          CORNERS: { pieces: Array.from({ length: 8 }, (_, i) => i >= 4 ? { facelets: ['ignored', 'ignored', 'ignored'] } : null) },
          CENTERS: { pieces: [null, null, null, null, null, { facelets: ['ignored'] }] },
        },
      } : null;
      native.jumpToStart({ flash: false });
    },
  };
  player.setAlgorithm({ setup, alg, maskLastLayer });
  el.replaceChildren(native);
  return player;
}

export async function mountPlayer(
  el,
  {
    setup = '',
    alg = '',
    puzzle = '3x3x3',
    tempo,
    maskLastLayer = false
  } = {}
) {
  if (tempo !== undefined && SPEEDS.includes(tempo)) {
    prefs.tempo = tempo;
  }

  if (puzzle !== '3x3x3') return mountFallback(el, { setup, alg, puzzle, maskLastLayer });

  el.innerHTML = '';

  const box = document.createElement('div');
  box.className = 'frame-player';
  box.tabIndex = 0;
  box.innerHTML = shell();
  el.append(box);

  let cube;

  try {
    cube = createCube(box.querySelector('.fp-stage'));
  } catch (error) {
    console.error(error);
    try {
      return await mountFallback(el, { setup, alg, puzzle, maskLastLayer });
    } catch (fallbackError) {
      console.error(fallbackError);
      box.textContent = 'Không tải được mô hình Rubik.';
      return null;
    }
  }

  const strip = box.querySelector('.fp-frames');
  const count = box.querySelector('.fp-count');
  const now = box.querySelector('.fp-move');
  const playButton = box.querySelector('[data-act="play"]');
  const speed = box.querySelector('[data-opt="tempo"]');
  const hidden = box.querySelector('[data-opt="hidden"]');
  hidden.checked = prefs.hidden;
  cube.showHints(prefs.hidden);
  hidden.addEventListener('change', () => {
    prefs.hidden = hidden.checked;
    cube.showHints(prefs.hidden);
    save();
  });

  speed.value = String(prefs.tempo);

  let moves = [];
  let setupMoves = [];
  let index = 0;
  let playing = false;
  let token = 0;
  let destroyed = false;
  let centered = -1;

  function refresh() {
    count.textContent = `Bước ${index} / ${moves.length}`;

    now.textContent = index
      ? `Vừa xoay ${moves[index - 1]}`
      : moves.length
        ? 'Trạng thái đầu'
        : 'Không có bước nào';

    playButton.textContent = playing ? ICON.pause : ICON.play;

    for (const btn of strip.querySelectorAll('[data-frame]')) {
      const i = Number(btn.dataset.frame);

      btn.classList.toggle('done', i > 0 && i <= index);
      btn.classList.toggle('upcoming', i === index + 1);
      btn.setAttribute('aria-current', String(i === index));
    }

    if (centered !== index) {
      const previous = strip.querySelector('[aria-current="true"]');
      const next = strip.querySelector('.upcoming') ?? previous;
      if (previous) {
        const mid = (previous.getBoundingClientRect().left + next.getBoundingClientRect().right) / 2;
        strip.scrollLeft += mid - strip.getBoundingClientRect().left - strip.clientWidth / 2;
      }
      centered = index;
    }

    for (const action of ['start', 'back']) {
      box.querySelector(`[data-act="${action}"]`).disabled =
        index === 0;
    }

    for (const action of ['next', 'end']) {
      box.querySelector(`[data-act="${action}"]`).disabled =
        index === moves.length;
    }

    playButton.disabled = moves.length === 0;
  }

  function stop() {
    playing = false;
    token++;
    refresh();
  }

  function rebuild(to) {
    cube.reset();

    for (const m of setupMoves) cube.rotate(m);
    for (let i = 0; i < to; i++) cube.rotate(moves[i]);

    index = to;
    refresh();
  }

  async function seek(to, animate = false) {
    stop();
    to = Math.max(0, Math.min(moves.length, to));

    if (animate && to === index + 1) {
      rebuild(index);
      const t = token;

      const ok = await cube.rotate(
        moves[index], true, 300 / prefs.tempo
      );

      if (ok && token === t) {
        index = to;
        refresh();
      }
    } else {
      rebuild(to);
    }
  }

  async function play() {
    if (playing) {
      stop();
      rebuild(index);
      return;
    }

    rebuild(index === moves.length ? 0 : index);

    playing = true;
    const t = ++token;
    refresh();

    while (playing && token === t && index < moves.length) {
      const ok = await cube.rotate(
        moves[index], true, 320 / prefs.tempo
      );

      if (!ok || token !== t) break;

      index++;
      refresh();
    }

    if (token === t) {
      playing = false;
      refresh();
    }
  }

  const actions = {
    start: () => seek(0),
    back: () => seek(index - 1),
    play,
    next: () => seek(index + 1, true),
    end: () => seek(moves.length)
  };

  box.querySelectorAll('[data-act]').forEach(b =>
    b.addEventListener(
      'click',
      () => actions[b.dataset.act]()
    )
  );

  strip.addEventListener('click', e => {
    const b = e.target.closest('[data-frame]');
    if (b) seek(+b.dataset.frame);
  });

  box.addEventListener('keydown', e => {
    if (e.target.closest('select,input,button')) return;

    const action = {
      ArrowRight: 'next',
      ArrowLeft: 'back',
      ' ': 'play',
      Home: 'start',
      End: 'end'
    }[e.key];

    if (action) {
      e.preventDefault();
      actions[action]();
    }
  });

  speed.addEventListener('change', () => {
    prefs.tempo = Number(speed.value);
    save();
  });

  const api = {
    pause: stop,
    togglePlay: play,
    jumpToStart: () => seek(0),

    setAlgorithm(next) {
      stop();

      setupMoves = expandMoves(next.setup || '');
      moves = expandMoves(next.alg || '');
      cube.maskLastLayer(next.maskLastLayer === true);

      centered = -1;
      strip.classList.toggle('empty', !moves.length);
      strip.innerHTML = `
        <button type="button"
          class="fp-frame start"
          data-frame="0">Đầu</button>
      ` + moves.map((m, i) => `
        <button type="button"
          class="fp-frame"
          data-frame="${i + 1}"
          title="Bước ${i + 1}: ${esc(m)}">
          <small>${i + 1}</small>${esc(m)}
        </button>
      `).join('');

      try {
        rebuild(0);
      } catch (error) {
        console.error('Invalid move:', error);
        now.textContent = error.message;
      }
    },

    destroy() {
      if (destroyed) return;
      destroyed = true;
      stop();
      cube.dispose();
      box.remove();
      instances.delete(api);
    }
  };

  instances.set(api, api);
  api.setAlgorithm({ setup, alg, maskLastLayer });

  return api;
}

export function retarget(
  player,
  {
    setup = '',
    alg = '',
    maskLastLayer = false
  } = {}
) {
  if (!player) return;

  if (typeof player.setAlgorithm !== 'function') {
    throw new Error(
      'Expected a custom GAN player from mountPlayer()'
    );
  }

  player.setAlgorithm({ setup, alg, maskLastLayer });
}
