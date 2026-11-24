import { t as tr } from '../utils/i18n.js';
import * as THREE from 'three';
import { Alg } from 'cubing/alg';
import { escapeHTML as esc } from '../utils/ui.js';
import { read, write } from '../utils/storage.js';
import { createGanFactory } from '../core/cube-shape.js';

const KEY = 'sobik_player';
const SPEEDS = [0.5, 1, 1.5, 2];

let prefs = read(
  KEY,
  { tempo: 1 },
  v => v && typeof v === 'object' &&
    SPEEDS.includes(v.tempo)
);

const save = () => write(KEY, { tempo: prefs.tempo });
const instances = new WeakMap();

const ICON = {
  start: '⏮', back: '◀', play: '▶',
  pause: '❚❚', next: '▶|', end: '⏭'
};

const ACTION_LABEL = {
  start: tr('Về đầu', 'Go to start'),
  back: tr('Lùi một bước', 'Previous move'),
  play: tr('Phát', 'Play'),
  pause: tr('Tạm dừng', 'Pause'),
  next: tr('Tiến một bước', 'Next move'),
  end: tr('Về cuối', 'Go to end'),
};

function shell() {
  return `
    <div class="fp-stage"
      style="position:relative;touch-action:none">
    </div>
    <div class="fp-now" aria-live="polite">
      <span class="fp-count"></span>
      <b class="fp-move"></b>
    </div>
    <div class="fp-frames" role="group"
      aria-label="${tr("Các bước của công thức", "Algorithm steps")}"></div>
    <div class="fp-controls" role="group"
      aria-label="${tr("Điều khiển", "Controls")}">
      ${Object.entries(ICON)
        .filter(([k]) => k !== 'pause')
        .map(([k,v]) => `
          <button type="button"
            class="fp-btn ${k === 'play' ? 'main' : ''}"
            data-act="${k}" aria-label="${ACTION_LABEL[k]}">${v}</button>
        `).join('')}
    </div>
    <div class="fp-options">
      <label class="fp-speed">
        ${tr("Tốc độ", "Speed")}
        <select data-opt="tempo">
          ${SPEEDS.map(s =>
            `<option value="${s}">${s}×</option>`
          ).join('')}
        </select>
      </label>
    </div>
    <p class="fp-hint muted">
      ${tr('Kéo để xoay góc nhìn 3D. Phím ← → để lùi/tiến từng bước.',
        'Drag to rotate the 3D view. Use ← and → to step backward or forward.')}
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

function parseMove(raw, size, coordinates) {
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

  const isWide = Boolean(wide || (lower && layer !== null));
  const count = Number(depth) || (isWide ? 2 : 1);
  let layers;
  if (layer === null) {
    layers = coordinates;
  } else if (layer === 0) {
    if (size % 2 === 0) throw new Error(`Unsupported center slice: ${raw}`);
    layers = [0];
  } else {
    if (count > size || count < 1) throw new Error(`Unsupported layer: ${raw}`);
    const outer = (size - 1) / 2;
    layers = isWide
      ? coordinates.slice(0, count).map((_, i) => layer * (outer - i))
      : [layer * (outer - (count - 1))];
  }

  return {
    axis,
    layers,
    angle: sign * (prime ? -1 : 1) *
      (two ? Math.PI : Math.PI / 2)
  };
}

function createCube(stage, size) {
  const outer = (size - 1) / 2;
  const coordinates = Array.from({ length: size }, (_, i) => i - outer);
  const snap = coordinate => Math.round(coordinate + outer) - outer;
  const smallScreen = window.matchMedia('(max-width: 760px)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let floating = false;
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    34, 1, 0.1, 100
  );

  // Fit the entire cube, including corners, inside the tighter camera axis.
  function minDistance() {
    const halfVertical = THREE.MathUtils.degToRad(camera.fov / 2);
    const halfHorizontal = Math.atan(Math.tan(halfVertical) * camera.aspect);
    const fit = 2.65 / Math.sin(Math.min(halfVertical, halfHorizontal) * 0.9);
    return Math.max(smallScreen.matches ? 8.5 : 6, fit);
  }

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
  const display = new THREE.Group();
  display.scale.setScalar(3 / size);
  display.add(root);
  scene.add(display);

  let factory;
  try {
    factory = createGanFactory(renderer, size);
  } catch (error) {
    renderer.dispose();
    renderer.forceContextLoss();
    throw error;
  }

  const pieces = [];

  for (const x of coordinates) {
    for (const y of coordinates) {
      for (const z of coordinates) {
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

  let distance = 9.2;
  camera.position.setFromSphericalCoords(distance, 1.15, 0.5);
  camera.lookAt(0, 0, 0);

  const dragAxis = new THREE.Vector3();
  const dragRotation = new THREE.Quaternion();

  function orbitCamera() {
    camera.position.set(0, 0, distance).applyQuaternion(camera.quaternion);
  }

  function resize() {
    const r = stage.getBoundingClientRect();
    const w = Math.max(1, r.width);
    const h = Math.max(1, r.height || 350);

    camera.aspect = w / h;
    distance = Math.max(distance, minDistance());
    orbitCamera();
    renderer.setSize(w, h, false);
    camera.updateProjectionMatrix();
  }

  const observer = typeof ResizeObserver !== 'undefined'
    ? new ResizeObserver(resize)
    : null;

  observer?.observe(stage);
  resize();

  function render(now = 0) {
    if (disposed) return;
    if (!stage.isConnected || (stage.closest('dialog')?.open === false)) {
      dispose();
      return;
    }
    raf = requestAnimationFrame(render);
    if (floating && !reducedMotion.matches) {
      const seconds = now / 1000;
      display.position.y = Math.sin(seconds * 1.65) * 0.19;
      display.rotation.set(Math.sin(seconds * 0.85) * 0.12, seconds * 0.42, 0.08);
    } else {
      display.position.y = 0;
      display.rotation.set(0, 0, 0);
    }
    renderer.render(scene, camera);
  }

  render();

  let pointer = null;

  function down(e) {
    if (pointer || e.button !== 0) return;
    pointer = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY
    };
    renderer.domElement.setPointerCapture(e.pointerId);
  }

  function move(e) {
    if (!pointer || pointer.id !== e.pointerId) return;

    const dx = e.clientX - pointer.x;
    const dy = e.clientY - pointer.y;
    pointer.x = e.clientX;
    pointer.y = e.clientY;

    const movement = Math.hypot(dx, dy);
    if (!movement) return;
    // Rotate around screen-relative axes so dragging stays responsive at either pole.
    dragAxis.set(dy / movement, -dx / movement, 0);
    dragRotation.setFromAxisAngle(dragAxis, movement * 0.008);
    camera.quaternion.multiply(dragRotation).normalize();

    orbitCamera();
  }

  function up(e) {
    if (pointer?.id === e.pointerId) pointer = null;
  }

  function wheel(e) {
    e.preventDefault();
    distance = Math.max(
      minDistance(),
      Math.min(14, distance + e.deltaY * 0.006)
    );
    orbitCamera();
  }

  renderer.domElement.addEventListener('pointerdown', down);
  renderer.domElement.addEventListener('pointermove', move);
  renderer.domElement.addEventListener('pointerup', up);
  renderer.domElement.addEventListener('pointercancel', up);
  renderer.domElement.addEventListener('lostpointercapture', up);
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
    const move = parseMove(raw, size, coordinates);

    const selected = pieces.filter(p =>
      move.layers.includes(
        snap(p.position[move.axis])
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
          snap(p.position.x),
          snap(p.position.y),
          snap(p.position.z)
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
    renderer.domElement.removeEventListener('lostpointercapture', up);
    renderer.domElement.removeEventListener('wheel', wheel);

    factory.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
  }

  return {
    reset, rotate, dispose,
    setFloating(enabled) { floating = enabled; },
    maskLastLayer: enabled => pieces.forEach(piece => factory.maskLastLayer(piece, enabled)),
  };
}

async function mountFallback(el, { setup, alg, puzzle, maskLastLayer, floating, prefer3D = false }) {
  const { TwistyPlayer } = await import('cubing/twisty');
  if (!el.isConnected) return null;
  const context = prefer3D ? document.createElement('canvas').getContext('webgl2') : null;
  context?.getExtension('WEBGL_lose_context')?.loseContext();
  const native = new TwistyPlayer({
    puzzle, visualization: context ? '3D' : '2D', background: 'none', viewerLink: 'none', tempoScale: prefs.tempo,
  });
  native.className = 'twisty';
  const player = {
    destroy() { native.pause(); native.remove(); },
    setAlgorithm(next) {
      native.controlPanel = next.floating ? 'none' : 'bottom-row';
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
  player.setAlgorithm({ setup, alg, maskLastLayer, floating });
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
    maskLastLayer = false,
    floating = false
  } = {}
) {
  if (tempo !== undefined && SPEEDS.includes(tempo)) {
    prefs.tempo = tempo;
  }

  const size = { '2x2x2': 2, '3x3x3': 3, '4x4x4': 4 }[puzzle];
  if (!size) return mountFallback(el, { setup, alg, puzzle, maskLastLayer, floating, prefer3D: true });

  el.innerHTML = '';

  const box = document.createElement('div');
  box.className = 'frame-player';
  box.tabIndex = 0;
  box.innerHTML = shell();
  el.append(box);

  let cube;

  try {
    cube = createCube(box.querySelector('.fp-stage'), size);
  } catch (error) {
    console.error(error);
    try {
      return await mountFallback(el, { setup, alg, puzzle, maskLastLayer, floating });
    } catch (fallbackError) {
      console.error(fallbackError);
      box.textContent = tr('Không tải được mô hình Rubik.', "Couldn't load the cube model.");
      return null;
    }
  }

  const strip = box.querySelector('.fp-frames');
  const count = box.querySelector('.fp-count');
  const now = box.querySelector('.fp-move');
  const playButton = box.querySelector('[data-act="play"]');
  const speed = box.querySelector('[data-opt="tempo"]');

  speed.value = String(prefs.tempo);

  let moves = [];
  let setupMoves = [];
  let index = 0;
  let playing = false;
  let token = 0;
  let destroyed = false;
  let centered = -1;

  function refresh() {
    count.textContent = `${tr("Bước", "Step")} ${index} / ${moves.length}`;

    now.textContent = index
      ? `${tr("Vừa xoay", "Last move:")} ${moves[index - 1]}`
      : moves.length
        ? tr('Trạng thái đầu', "Starting state")
        : tr('Không có bước nào', "No moves");

    const playbackAction = playing ? 'pause' : 'play';
    playButton.textContent = ICON[playbackAction];
    playButton.setAttribute('aria-label', ACTION_LABEL[playbackAction]);

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
      const preview = next.floating === true;
      box.classList.toggle('is-floating', preview);
      box.tabIndex = preview ? -1 : 0;
      cube.setFloating(preview);

      setupMoves = expandMoves(next.setup || '');
      moves = expandMoves(next.alg || '');
      cube.maskLastLayer(next.maskLastLayer === true);

      centered = -1;
      strip.classList.toggle('empty', !moves.length);
      strip.innerHTML = `
        <button type="button"
          class="fp-frame start"
          data-frame="0">${tr("Đầu", "Start")}</button>
      ` + moves.map((m, i) => `
        <button type="button"
          class="fp-frame"
          data-frame="${i + 1}"
          title="${tr("Bước", "Step")} ${i + 1}: ${esc(m)}">
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
  api.setAlgorithm({ setup, alg, maskLastLayer, floating });

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
