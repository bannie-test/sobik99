import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { assembly, ballCoreMagnets, coloredAssembly, cubies, faces } from './core/workshop-parts.js';
import { createGestureInput, workshopGestureEvent } from './core/workshop-input.js';
import { createWorkshopHands } from './core/workshop-hands.js';
import { t } from './utils/i18n.js';
import './workshop.css';

const groups = {
  edge: t('Viên cạnh', 'Edges'),
  corner: t('Viên góc', 'Corners'),
  center: t('Viên tâm', 'Centers'),
  core: t('Lõi từ', 'Ball core'),
  build: t('Ráp khối', 'Assemble cube'),
};
const groupOrder = Object.keys(groups);
const views = [
  t('Trước bàn', 'Front'),
  t('Sát gá', 'Close-up'),
  t('Bên phải', 'Right side'),
  t('Từ trên', 'Overhead'),
];
const viewPose = [
  { eye: [.03, 2.55, 4.65], pitch: -.39, yaw: .18 },
  { eye: [-.05, 2.05, 3.55], pitch: -.46, yaw: .18 },
  { eye: [4.5, 3.25, 3.85], pitch: -.47, yaw: .89 },
  { eye: [-.65, 6, 1.45], pitch: -1.29, yaw: 0 },
];
const totalFor = kind => kind === 'core' ? 1 : kind === 'build' ? 26 : cubies.filter(part => part.kind === kind).length;
const finalCubie = cubies.find(part => part.id === '0,1,1');
const layer = (kind, y) => cubies.filter(part => part.kind === kind && part.coordinate[1] === y && part !== finalCubie);
const steps = [
  ...['edge', 'corner', 'center'].flatMap(kind => {
    const items = cubies.filter(part => part.kind === kind);
    return items.map((cubie, index) => ({ kind, cubie, name: `${groups[kind]} ${index + 1}/${items.length} · ${cubie.name}` }));
  }),
  { kind: 'core', name: groups.core },
  { kind: 'build', mountCore: true, name: t('Đặt ball core lên gá', 'Mount the ball core') },
  { kind: 'build', batch: cubies.filter(part => part.kind === 'center'), name: t('Gắn 6 viên tâm lên trục', 'Mount six centers on their axles') },
  { kind: 'build', batch: layer('edge', -1), name: t('Gài cạnh tầng dưới', 'Mount bottom edges') },
  { kind: 'build', batch: layer('corner', -1), name: t('Gài góc tầng dưới', 'Mount bottom corners') },
  { kind: 'build', batch: layer('edge', 0), name: t('Gài cạnh tầng giữa', 'Mount middle edges') },
  { kind: 'build', batch: layer('corner', 1), name: t('Gài góc tầng trên', 'Mount top corners') },
  { kind: 'build', batch: layer('edge', 1), name: t('Gài cạnh tầng trên', 'Mount top edges') },
  { kind: 'build', batch: [finalCubie], final: true, name: t('Gài cạnh cuối', 'Mount final edge'), angle: -30, force: .55 },
];

export function workshop(root) {
  const cues = {
    build: t('Kéo linh kiện từ khay vào đích phát sáng. Rê chuột để xem cấu tạo.', 'Drag a part from the tray to its glowing socket. Hover to inspect it.'),
    miss: t('Chi tiết đã về khay. Thả vào sát đích phát sáng.', 'The part returned to the tray. Drop it closer to the glowing socket.'),
    snap: t('Đã lắp khớp. Chọn linh kiện tiếp theo trong khay.', 'Seated. Choose the next part from the tray.'),
    align: t('Kéo ngang chi tiết, dùng con lăn hoặc các nút góc để căn ngàm.', 'Drag the part sideways, use the wheel or use the angle buttons to align it.'),
    ready: t('Đã thẳng ngàm. Giữ nút Ép để tăng lực, rồi nhả trong vùng xanh.', 'Aligned. Hold Press to build force, then release in the green zone.'),
    off: t('Ngàm đang lệch. Căn góc trước khi ép.', 'The tabs are misaligned. Adjust the angle before pressing.'),
    low: t('Thiếu lực. Chi tiết bật trở lại.', 'Too little force. The part sprang back.'),
    high: t('Quá lực. Thử nhả nút sớm hơn.', 'Too much force. Release the button sooner.'),
    done: t('Đã khớp! Chuyển sang cụm tiếp theo.', 'Snapped in! Move on to the next assembly.'),
    stored: t('Đã cất vào hộp bên trái. Bạn có thể đổi loại viên hoặc làm viên tiếp theo.', 'Stored in the box on the left. Switch types or make the next piece.'),
    test: t('Kéo để đổi góc nhìn. Xoay từng tầng và đổi cơ chế tâm để so sánh nhịp xoay mô phỏng.', 'Drag to look around. Turn layers and switch center mechanisms to compare simulated turn timing.'),
  };
  root.innerHTML = `<section class="workshop">
    <header class="ws-title"><div><h1>${t('Xưởng Rubik', 'Cube Workshop')}</h1><p>${t('Kéo thả linh kiện để lắp khối 3×3.', 'Drag parts into place to build a 3×3 cube.')}</p></div>
    <div class="ws-title-actions">
      <button type="button" class="ws-fullscreen" data-action="fullscreen" aria-pressed="false">
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M9 4H4v5m11-5h5v5M4 15v5h5m11-5v5h-5"/><path d="M4 9h5V4m11 5h-5V4M9 20v-5H4m11 5v-5h5"/></svg>
        <span></span>
      </button>
      <button type="button" data-action="reset">${t('Làm lại', 'Restart')}</button>
    </div></header>
    <div class="ws-layout">
      <div class="ws-stage">
        <div class="ws-view"></div>
        <div class="ws-tooltip" hidden><strong></strong><span></span></div>
        <div class="ws-overlay"><span class="ws-inventory" data-box-label></span><label class="ws-view-menu">
          <span>${t('Góc nhìn', 'View')}</span><select data-view>${views.map((view, index) => `<option value="${index}">${view}</option>`).join('')}</select>
        </label></div>
        <div class="ws-hint">
          <button type="button" data-action="hint" aria-expanded="false" aria-controls="ws-hint-guide"><b aria-hidden="true">?</b> ${t('Gợi ý', 'Hint')}</button>
          <div id="ws-hint-guide" class="ws-hint-panel" hidden><strong>${t('Cách thao tác', 'How to play')}</strong><p data-hint-text></p></div>
        </div>
      </div>
      <section class="ws-controls">
        <ol class="ws-steps" aria-label="${t('Tiến độ', 'Progress')}">${Object.entries(groups).map(([kind, name]) => `<li><button type="button" data-kind="${kind}">${name}</button></li>`).join('')}<li>${t('Xoay thử', 'Test turns')}</li></ol>
        <h2 data-task></h2>
        <p data-feedback role="status"></p>
        <div class="ws-config">
          <label>${t('Dáng vỏ', 'Shell profile')}<select data-profile><option value="round">${t('Bo tròn', 'Rounded')}</option><option value="square">${t('Bo nhẹ', 'Soft square')}</option></select></label>
          <label>${t('Cơ chế tâm', 'Center mechanism')}<select data-mechanism><option value="spring">${t('Lò xo', 'Spring')}</option><option value="maglev">MagLev</option></select></label>
        </div>
        <div class="ws-config" data-core-config hidden>
          <label>${t('Vật liệu lõi', 'Core material')}
            <select data-core-material>
              <option value="pink">${t('Nhựa hồng', 'Pink plastic')}</option>
              <option value="clear">${t('Nhựa trong suốt', 'Clear plastic')}</option>
              <option value="black">${t('Nhựa đen', 'Black plastic')}</option>
              <option value="metal">${t('Kim loại đen', 'Black metal')}</option>
            </select>
          </label>
          <label>${t('Số nam châm', 'Magnet count')}
            <select data-core-magnets><option value="8">8</option><option value="20">20</option></select>
          </label>
        </div>
        <p class="ws-count" data-count></p>
        <div class="ws-part-controls" hidden>
          <output data-part-label></output>
          <button type="button" data-action="orient"></button>
        </div>
        <details class="ws-keyboard"><summary>${t('Điều khiển bàn phím', 'Keyboard controls')}</summary>
          <label>${t('Linh kiện trong khay', 'Tray components')}<select data-part></select></label>
          <button type="button" data-action="place">${t('Thả vào đích', 'Drop into socket')}</button>
        </details>
        <div class="ws-align" hidden>
          <button type="button" data-action="left" aria-label="${t('Giảm 15 độ', 'Decrease by 15 degrees')}">−15°</button>
          <output data-angle></output>
          <button type="button" data-action="right" aria-label="${t('Tăng 15 độ', 'Increase by 15 degrees')}">+15°</button>
        </div>
        <div class="ws-force" hidden>
          <label for="ws-force">${t('Lực ép', 'Press force')}</label>
          <div class="ws-meter"><meter id="ws-force" min="0" max="1" value="0"></meter><i aria-hidden="true"></i></div>
          <button type="button" data-action="press">${t('Giữ để ép', 'Hold to press')}</button>
        </div>
        <button type="button" data-action="next" hidden></button>
        <div class="ws-turn" hidden>${['U', 'R', 'F'].flatMap(move => [move, move + '′']).map(move => `<button type="button" data-move="${move}">${move}</button>`).join('')}</div>
      </section>
    </div>
    <details class="ws-research"><summary>${t('Cấu tạo và nguồn tham khảo', 'Mechanisms and references')}</summary>
      <ul>
        <li>${t('Ngàm vỏ và thanh nam châm chân góc khóa 60°.', 'Snap-fit shells and a corner magnet rod with a 60° lock.')} <a href="https://www.gancube.com/products/gan17-magdrive-3x3-speed-cube" target="_blank" rel="noopener">GAN17 MagDrive</a></li>
        <li>${t('Lõi cầu từ và cụm chỉnh đàn hồi của Super WeiLong V2. AoLong V6 là tham chiếu cho thiết kế lõi gia cường sợi carbon.', 'Super WeiLong V2 uses a magnetic ball core and adjustable elasticity. AoLong V6 is a reference for carbon-fiber core reinforcement.')} <a href="https://rubik.bg/img/moyu-super-weiLong-v2-20m-ball-core-uv-booklet-en.pdf" target="_blank" rel="noopener">MoYu Super WeiLong V2</a> · <a href="https://www.instagram.com/p/Del45ZRk9Vb/" target="_blank" rel="noopener">AoLong V6</a></li>
        <li>${t('Các biến thể lõi từ và cơ chế chỉnh tâm trên dòng Tornado.', 'Magnetic core variants and center adjustment in the Tornado line.')} <a href="https://www.youtube.com/watch?v=YiXb8yxrY6w" target="_blank" rel="noopener">X-Man Tornado V5</a></li>
      </ul>
      <p>${t('Mô hình xưởng kết hợp các nguyên lý này với hình học và số lượng chi tiết giản lược.', 'The workshop combines these principles with simplified geometry and part counts.')}</p>
    </details>
  </section>`;

  const page = root.querySelector('.workshop');
  const get = selector => page.querySelector(selector);
  const button = action => get(`[data-action="${action}"]`);
  const viewport = get('.ws-view');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true });
  } catch {
    viewport.textContent = t('Trình duyệt cần WebGL để mở bàn lắp ráp 3D.', 'WebGL is required to open the 3D workbench.');
    get('.ws-controls').hidden = true;
    get('.ws-overlay').hidden = true;
    get('.ws-hint').hidden = true;
    button('reset').hidden = true;
    button('fullscreen').hidden = true;
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  viewport.append(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#071522');
  scene.fog = new THREE.Fog('#071522', 9, 20);
  const camera = new THREE.PerspectiveCamera(43, 1, .1, 35);
  const headAngle = new THREE.Euler(0, 0, 0, 'YXZ');
  const headRotation = new THREE.Quaternion();
  const eye = new THREE.Vector3();
  scene.add(new THREE.HemisphereLight(0xe4f6ff, 0x5b4852, 2.25));
  const light = new THREE.DirectionalLight(0xffe3bd, 3);
  light.position.set(-3, 7, 3);
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  light.shadow.normalBias = .025;
  scene.add(light);

  const material = (color, metalness = 0) => new THREE.MeshStandardMaterial({ color, metalness, roughness: .42 });
  const base = material('#222c36');
  const dark = material('#11191f');
  const mat = material('#285453');
  const silver = material('#aabacb', .6);
  const mint = material('#61f9e8');
  mint.emissive.set('#16c9bb');
  mint.emissiveIntensity = .42;
  const blue = material('#425aee', .32);
  const graphite = material('#273543', .4);
  const rail = new THREE.MeshBasicMaterial({ color: '#28e8d8' });
  // Light the clear and metallic finishes with reflected room highlights.
  const reflectionRoom = new RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const coreEnvironment = pmrem.fromScene(reflectionRoom, .04);
  reflectionRoom.dispose();
  pmrem.dispose();
  const coreMaterials = {
    pink: material('#e96a9b'),
    clear: new THREE.MeshPhysicalMaterial({
      color: '#f3fcff',
      transmission: 1,
      thickness: .085,
      ior: 1.49,
      roughness: .09,
      attenuationColor: '#cdeeff',
      attenuationDistance: 1.4,
      clearcoat: .8,
      clearcoatRoughness: .08,
      envMap: coreEnvironment.texture,
    }),
    black: material('#20252d'),
    metal: new THREE.MeshStandardMaterial({ color: '#292c33', metalness: .83, roughness: .29, envMap: coreEnvironment.texture }),
  };
  for (const surface of Object.values(coreMaterials)) surface.side = THREE.DoubleSide;
  const pickSurface = new THREE.MeshBasicMaterial({ visible: false });
  const targetSurface = new THREE.MeshBasicMaterial({ color: '#46f9e1', wireframe: true, transparent: true, opacity: .48, depthTest: false });
  const colors = ['#ff573f', '#ff9636', '#f7f7ed', '#ffdc44', '#31b77a', '#478cfc'].map(color => material(color));
  const bench = new THREE.Group();
  const work = new THREE.Group();
  const storage = new THREE.Group();
  const hands = createWorkshopHands();
  scene.add(bench, work, storage, camera);

  function mesh(parent, geometry, surface, x = 0, y = 0, z = 0) {
    const object = new THREE.Mesh(geometry, surface);
    object.position.set(x, y, z);
    object.castShadow = surface !== coreMaterials.clear;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  }

  function box(parent, w, h, d, surface, x, y, z, radius = .035) {
    return mesh(parent, new RoundedBoxGeometry(w, h, d, 2, radius), surface, x, y, z);
  }

  box(bench, 20, .32, 12, base, 0, -.35, -1.8);
  box(bench, 6.1, .06, 3.7, mat, .1, -.16, -.05);
  const grid = new THREE.GridHelper(3.4, 17, 0x41efdf, 0x215363);
  grid.scale.x = 1.65;
  grid.position.set(.1, -.125, -.05);
  bench.add(grid);
  box(bench, 2.82, .12, 2.5, dark, -1.85, -.02, 0);
  for (const x of [-3.25, -.44]) box(bench, .025, .026, 2.5, rail, x, .056, 0);
  for (const z of [-1.25, 1.25]) box(bench, 2.82, .026, .025, rail, -1.85, .056, z);
  for (const x of [-2.77, -1.85, -.93]) for (const z of [-.81, 0, .81]) {
    box(bench, .83, .015, .74, base, x, .05, z);
  }
  for (const x of [-.51, 1.56]) box(bench, .022, .018, 1.77, rail, x, .055, -.05);
  box(bench, 2.1, .16, 1.8, dark, .52, -.035, -.05);
  for (const x of [-.47, 1.51]) for (const z of [-.88, .78]) {
    mesh(bench, new THREE.CylinderGeometry(.04, .04, .035, 12), silver, x, .065, z);
  }

  const firstMountStage = steps.findIndex(step => step.kind === 'build');
  const drafts = new Map();
  const jobs = new Map();
  for (let index = 0; index < firstMountStage; index++) {
    const kind = steps[index].kind;
    if (!jobs.has(kind)) jobs.set(kind, []);
    jobs.get(kind).push(index);
  }
  let stage = 0;
  const made = new Set();
  const mounted = new Set();
  let phase = 'build';
  let components = [];
  let selected;
  let marker;
  let angle = 0;
  let force = 0;
  let pressStart = null;
  let pressOwner;
  const localPress = Symbol('local press');
  let picked;
  let pieces = [];
  let turn;
  let view = 0;
  let yaw = 0;
  let pitch = 0;
  const handPointer = new THREE.Vector2();
  let pointing = false;
  let storedAnimation;
  let drag;
  let frame;
  const labels = [...page.querySelectorAll('.ws-steps li')];
  const jobId = job => job.cubie?.id ?? 'core';
  const remaining = kind => jobs.get(kind)?.find(index => !made.has(jobId(steps[index])));
  const canMount = () => made.size === firstMountStage;
  const inventoryCount = () => made.size - mounted.size;
  const forceMeter = get('meter');
  const targetBand = get('.ws-meter i');
  const profile = get('[data-profile]');
  const mechanism = get('[data-mechanism]');
  const coreMaterial = get('[data-core-material]');
  const coreMagnets = get('[data-core-magnets]');
  const magnetCount = () => Number(coreMagnets.value);
  const controller = new AbortController();
  const listen = (element, event, callback, options = {}) => element.addEventListener(event, callback, { ...options, signal: controller.signal });
  const step = () => steps[stage];
  const finalEdge = () => step()?.final;
  const aligned = () => Math.abs(angle - step().angle) <= 7;
  const rounded = () => profile.value === 'round';
  const mount = new THREE.Vector3(.53, .14, .02);
  const lastEdge = new THREE.Vector3(.53, 1.325, .42);
  const tooltip = get('.ws-tooltip');
  const partSelect = get('[data-part]');
  // Keep the two shells on the wide front row and use tighter rows for the loose magnets.
  const coreTrayPosition = index => index < 3
    ? trayPosition(index)
    : magnetCount() === 20
      ? new THREE.Vector3(-2.92 + ((index - 3) % 5) * .52, .105, .34 - Math.floor((index - 3) / 5) * .47)
      : new THREE.Vector3(-2.88 + ((index - 3) % 4) * .675, .105, -Math.floor((index - 3) / 4) * .81);
  const trayPosition = index => new THREE.Vector3(-2.77 + (index % 3) * .92, .14, .81 - Math.floor(index / 3) * .81);

  function clear(group) {
    group.traverse(object => object.geometry?.dispose());
    group.clear();
  }

  function springPart(parent) {
    const points = Array.from({ length: 81 }, (_, i) => {
      const a = i / 80 * Math.PI * 10;
      return new THREE.Vector3(.16 * Math.cos(a), .035 + i * .003, .16 * Math.sin(a));
    });
    mesh(parent, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 80, .024, 8, false), silver);
  }

  function modelPart(part, parent) {
    const cylinder = (radius, height, surface, y = 0) =>
      mesh(parent, new THREE.CylinderGeometry(radius, radius, height, 20), surface, 0, y, 0);
    switch (part.model) {
      case 'edge':
      case 'corner': {
        const corner = part.model === 'corner';
        const foot = mesh(parent, new THREE.SphereGeometry(.28, 20, 12), blue, 0, .09);
        foot.scale.set(corner ? .85 : 1.26, .35, .72);
        box(parent, .25, .26, .26, base, 0, .21, 0, .06);
        box(parent, .53, .12, .45, base, 0, .34, 0, .06);
        for (const x of [-.24, .24]) {
          box(parent, .1, .18, .12, blue, x, .42, -.13);
          mesh(parent, new THREE.TorusGeometry(.093, .019, 8, 20), mint, x, .4, .01);
        }
        break;
      }
      case 'center':
        box(parent, .61, .12, .61, blue, 0, .13, 0, .08);
        cylinder(.112, .39, silver, .26);
        break;
      case 'core': {
        const surface = coreMaterials[coreMaterial.value];
        mesh(parent, new THREE.SphereGeometry(.23, 24, 16), surface, 0, .23);
        for (const axis of ['x', 'y', 'z']) {
          const shaft = cylinder(.058, .84, surface, .23);
          if (axis === 'x') shaft.rotation.z = Math.PI / 2;
          if (axis === 'z') shaft.rotation.x = Math.PI / 2;
        }
        break;
      }
      case 'hemisphere': {
        const lower = part.axis === 'down';
        const half = mesh(parent, new THREE.SphereGeometry(.32, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2), coreMaterials[coreMaterial.value]);
        if (lower) half.rotation.x = Math.PI;
        const lip = mesh(parent, new THREE.TorusGeometry(.318, .014, 8, 32), graphite);
        lip.rotation.x = Math.PI / 2;
        for (const magnet of ballCoreMagnets(lower ? 'south' : 'north', magnetCount())) {
          const normal = new THREE.Vector3(...magnet.normal).normalize();
          const pocket = mesh(parent, new THREE.TorusGeometry(.053, .01, 8, 20), graphite);
          pocket.position.copy(normal).multiplyScalar(.327);
          pocket.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
        }
        break;
      }
      case 'core-magnet':
        cylinder(.046, .055, silver);
        cylinder(.042, .012, mint, .031);
        break;
      case 'panel': {
        const radius = rounded() ? .09 : .039;
        box(parent, .62, .086, .58, colors[part.color], 0, 0, 0, radius);
        for (const x of [-.22, .22]) box(parent, .075, .095, .08, mint, x, -.065, .12);
        break;
      }
      case 'magnet':
        cylinder(.082, .12, silver);
        cylinder(.078, .019, mint, .067);
        cylinder(.078, .019, colors[0], -.067);
        break;
      case 'rod':
        cylinder(.095, .29, silver);
        cylinder(.11, .045, blue, -.135);
        box(parent, .19, .045, .07, mint, 0, .14, 0);
        break;
      case 'ring':
      case 'collar': {
        const ring = mesh(parent, new THREE.TorusGeometry(.155, .047, 10, 28), part.model === 'ring' ? silver : blue);
        ring.rotation.x = Math.PI / 2;
        for (let i = 0; i < 8; i++) {
          const a = i * Math.PI / 4;
          const x = .157 * Math.cos(a);
          const z = .157 * Math.sin(a);
          box(parent, .052, .025, .052, mint, x, .038, z);
          if (part.model === 'ring') box(parent, .052, .025, .052, colors[0], x, -.038, z);
        }
        break;
      }
      case 'spring':
        springPart(parent);
        break;
      case 'axle':
        cylinder(.038, .27, silver, -.08);
        cylinder(.093, .055, silver, .06);
        box(parent, .112, .013, .02, dark, 0, .091, 0);
        break;
      case 'cubie':
        modelCubie(part.cubie, parent, true);
        break;
      case 'ball':
        modelBallCore(parent);
        break;
    }
  }

  function orient(part, inSocket = false) {
    const { rotation } = part.object;
    rotation.set(0, 0, 0);
    if (inSocket && part.normal) {
      part.object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...part.normal).normalize());
    }
    if (part.axis === 'z') rotation.x = Math.PI / 2;
    if (part.axis === 'x') rotation.z = -Math.PI / 2;
    if (part.flip) part.object.rotateX(Math.PI);
    if (part.lock) part.object.rotateY(THREE.MathUtils.degToRad(part.twist));
    if (!inSocket && part.model === 'panel') rotation.set(0, 0, 0);
  }

  const cubeOrigin = new THREE.Vector3(.53, .865, -.04);
  const held = lastEdge.clone().add(new THREE.Vector3(0, .46, 0));
  const cubiePosition = cubie => new THREE.Vector3(...cubie.coordinate).multiplyScalar(.46).add(cubeOrigin);
  const destination = part => part.cubie ? cubiePosition(part.cubie)
    : part.model === 'ball' ? cubeOrigin.clone() : new THREE.Vector3(...part.at).add(mount);

  function modelCubie(cubie, parent, showFoot = false) {
    const radius = rounded() ? .071 : .034;
    box(parent, .438, .438, .438, dark, 0, 0, 0, radius);
    for (const index of cubie.colors) {
      const [a, b, c] = faces[index];
      box(parent, a ? .038 : .397, b ? .038 : .397, c ? .038 : .397, colors[index], a * .211, b * .211, c * .211, radius);
    }
    if (showFoot) {
      const [x, y, z] = cubie.coordinate;
      mesh(parent, new THREE.SphereGeometry(.125, 12, 8), blue, -x * .2, -y * .2, -z * .2);
    }
  }

  function modelBallCore(parent) {
    const inner = new THREE.Group();
    inner.position.y = -.23;
    parent.add(inner);
    modelPart({ model: 'core' }, inner);
    modelPart({ model: 'hemisphere' }, parent);
    modelPart({ model: 'hemisphere', axis: 'down' }, parent);
    for (const half of ['north', 'south']) for (const magnet of ballCoreMagnets(half, magnetCount())) {
      const object = new THREE.Group();
      object.position.copy(new THREE.Vector3(...magnet.normal).normalize()).multiplyScalar(.32);
      modelPart(magnet, object);
      orient({ ...magnet, object }, true);
      parent.add(object);
    }
    parent.scale.setScalar(.87);
  }

  function cube() {
    pieces = [];
    if (mounted.has('core')) {
      const core = new THREE.Group();
      modelBallCore(core);
      core.position.copy(cubeOrigin);
      work.add(core);
    }
    for (const cubie of cubies) {
      if (!mounted.has(cubie.id)) continue;
      const piece = new THREE.Group();
      modelCubie(cubie, piece);
      piece.position.copy(cubiePosition(cubie));
      work.add(piece);
      pieces.push({ piece, coordinate: new THREE.Vector3(...cubie.coordinate) });
    }
  }

  function trayParts() {
    const current = step();
    if (current.kind !== 'build') return current.cubie
      ? coloredAssembly(current.cubie, mechanism.value) : assembly(current.kind, mechanism.value, magnetCount());
    if (current.mountCore) return made.has('core') ? [{
      id: 'core', model: 'ball', name: groups.core,
      note: t('Kéo ball core đã lắp lên gá giữa bàn.', 'Drag your assembled ball core onto the bench fixture.'),
    }] : [];
    return current.batch.filter(cubie => made.has(cubie.id)).map(cubie => ({
      id: cubie.id, model: 'cubie', cubie, name: cubie.name,
      note: t('Kéo viên đã lắp vào ô phát sáng đúng bộ màu.', 'Drag your finished piece into its glowing color-matched slot.'),
    }));
  }

  const boxPosition = new THREE.Vector3(-2.3, .12, -1.87);
  box(bench, 1.54, .14, .89, dark, boxPosition.x, -.015, boxPosition.z);
  for (const x of [-.77, .77]) box(bench, .055, .28, .91, blue, boxPosition.x + x, .15, boxPosition.z);
  for (const z of [-.44, .44]) box(bench, 1.58, .28, .055, blue, boxPosition.x, .15, boxPosition.z + z);
  box(bench, 1.52, .018, .022, rail, boxPosition.x, .29, boxPosition.z + .44);

  function drawStorage() {
    clear(storage);
    storedAnimation = undefined;
    const ids = [...made].filter(id => !mounted.has(id));
    ids.forEach((id, index) => {
      const stored = new THREE.Group();
      const cubie = cubies.find(item => item.id === id);
      if (cubie) modelCubie(cubie, stored);
      else modelBallCore(stored);
      stored.scale.setScalar(.35);
      stored.position.copy(boxPosition).add(new THREE.Vector3(-.61 + index % 6 * .24, .075, -.32 + Math.floor(index / 6) * .16));
      storage.add(stored);
    });
    get('[data-box-label]').textContent = t('Hộp bên trái', 'Left storage box') + ` · ${inventoryCount()}`;
  }

  function saveDraft() {
    if (stage >= firstMountStage || phase !== 'build') return;
    const parts = components.filter(part => part.seated || part.docked || part.twist || part.flip !== (part.initialFlip ?? 0));
    if (parts.length) {
      drafts.set(stage, new Map(parts.map(({ id, seated, docked, flip, twist }) => [id, { seated, docked, flip, twist }])));
    } else {
      drafts.delete(stage);
    }
  }

  function goTo(next) {
    if (next === stage) return;
    saveDraft();
    stage = next;
    phase = stage === steps.length ? 'test' : 'build';
    angle = 0;
    update();
    if (phase === 'test') get('[data-move]').focus({ preventScroll: true });
  }

  function drawWork() {
    if (drag) cancelDrag(drag.id);
    clear(work);
    page.removeAttribute('data-over-socket');
    picked = undefined;
    selected = undefined;
    marker = undefined;
    tooltip.hidden = true;
    if (step()?.kind === 'build' || phase === 'test') cube();
    components = phase === 'build' ? trayParts().map((part, index) => {
      const object = new THREE.Group();
      const home = step().kind === 'core' ? coreTrayPosition(index) : trayPosition(index);
      if (part.model === 'hemisphere' && part.axis === 'down') home.y = .395;
      if (['ball', 'cubie'].includes(part.model)) home.y = .32;
      const component = { ...part, home, object, flip: part.initialFlip ?? 0, twist: 0, seated: false, ...drafts.get(stage)?.get(part.id) };
      modelPart(component, object);
      if (component.model === 'ring' || component.model === 'collar') {
        // Raycast the whole disc, including the empty hole in the ring.
        mesh(object, new THREE.CylinderGeometry(.218, .218, .115, 16), pickSurface);
      }
      const installed = component.seated || component.docked;
      object.position.copy(installed ? destination(component) : home);
      orient(component, installed);
      work.add(object);
      return component;
    }) : [];
    drawStorage();
    updateParts();
  }

  function available(part) {
    return (part.requires ?? []).every(id => components.find(item => item.id === id)?.seated);
  }

  function updateParts() {
    const loose = components.filter(part => !part.seated);
    const report = get('[data-count]');
    const mounting = step()?.kind === 'build' || phase === 'test';
    report.hidden = !mounting && phase !== 'build';
    report.textContent = mounting
      ? t('Viên trên khối', 'Pieces on cube') + ` ${mounted.size - Number(mounted.has('core'))} / 26`
      : t('Linh kiện đã lắp', 'Components installed') + ` ${components.length - loose.length} / ${components.length}`;
    const keyboard = get('.ws-keyboard');
    keyboard.hidden = phase !== 'build';
    partSelect.replaceChildren(...loose.map(part => new Option(part.name, part.id)));
    if (selected) partSelect.value = selected.id;
    get('.ws-part-controls').hidden = phase !== 'build' || !selected;
    get('[data-part-label]').textContent = selected?.name ?? '';
    button('orient').hidden = selected?.polar === undefined && !selected?.lock;
    if (selected?.lock) button('orient').textContent = `${t('Xoay chốt', 'Rotate lock')} · ${selected.twist}° / ${selected.lock}°`;
    else if (selected?.polar !== undefined) button('orient').textContent = `${t('Đảo cực', 'Flip polarity')} · ${selected.flip ? 'S' : 'N'} / ${selected.polar ? 'S' : 'N'}`;
  }

  function showTarget(part) {
    if (marker) {
      marker.removeFromParent();
      clear(marker);
    }
    marker = undefined;
    if (!part) return;
    marker = new THREE.Group();
    const outline = new THREE.Group();
    const guide = { ...part, object: outline, flip: part.polar ?? 0, twist: part.lock ?? 0 };
    modelPart(guide, outline);
    orient(guide, true);
    outline.traverse(object => {
      if (object.isMesh) {
        object.material = targetSurface;
        object.castShadow = false;
        object.renderOrder = 2;
      }
    });
    marker.add(outline);
    mesh(marker, new THREE.TorusGeometry(part.model === 'core-magnet' ? .08 : part.model === 'magnet' ? .15 : .38, .012, 6, 32), rail).rotation.x = Math.PI / 2;
    marker.position.copy(destination(part));
    work.add(marker);
  }

  function selectPart(part) {
    selected = part;
    showTarget(part);
    updateParts();
  }

  function rotatePart(part) {
    if (!part || part.seated) return;
    if (part.polar !== undefined) part.flip = 1 - part.flip;
    if (part.lock && !part.docked) {
      get('[data-feedback]').textContent = t('Đưa thanh vào chân góc trước khi xoay khóa.', 'Insert the rod into the corner foot before rotating the lock.');
      return;
    }
    if (part.lock) part.twist += 30;
    orient(part, true);
    if (part.lock && part.twist === part.lock) seat(part);
    else updateParts();
  }

  function place(part) {
    part.object.position.copy(part.home);
    if (!available(part)) {
      const names = part.requires.map(id => components.find(item => item.id === id)).filter(item => !item.seated).map(item => item.name);
      get('[data-feedback]').textContent = t('Cần lắp trước', 'Install first') + ` · ${names.join(', ')}`;
      return;
    }
    if (part.polar !== undefined && part.flip !== part.polar) {
      get('[data-feedback]').textContent = t('Sai cực. Bấm R, cuộn hoặc chọn Đảo cực, rồi kéo thả lại.', 'Wrong polarity. Press R, scroll or choose Flip polarity, then drag it again.');
      return;
    }
    if (part.lock) {
      part.docked = true;
      part.object.position.copy(destination(part));
      get('[data-feedback]').textContent = t('Thanh đã vào chân góc. Bấm R hoặc Xoay chốt đến 60° để khóa.', 'The rod is inserted. Press R or use Rotate lock to turn it to 60°.');
      return;
    }
    if (finalEdge()) {
      phase = 'align';
      picked = part.object;
      picked.position.copy(held);
      showTarget(part);
      update(false);
      button('press').focus({ preventScroll: true });
      return;
    }
    seat(part);
  }

  function seat(part) {
    part.object.position.copy(destination(part));
    orient(part, true);
    part.seated = true;
    if (step().kind === 'build') {
      mounted.add(part.id);
      drawStorage();
    }
    selectPart(undefined);
    if (components.every(item => item.seated)) {
      if (step().kind !== 'build') {
        made.add(jobId(step()));
        drafts.delete(stage);
        drawStorage();
        const object = storage.children.at(-1);
        const target = object.position.clone();
        object.position.copy(mount).add(new THREE.Vector3(0, .73, 0));
        object.scale.setScalar(.75);
        storedAnimation = { object, from: object.position.clone(), target, started: performance.now() };
        clear(work);
        components = [];
      }
      phase = 'done';
      update(false);
      button('next').focus({ preventScroll: true });
    } else {
      update(false);
      feedback('snap');
    }
  }

  function feedback(key) {
    get('[data-feedback]').textContent = cues[key];
  }

  function updateHint() {
    const text = get('[data-hint-text]');
    if (phase === 'align') {
      text.textContent = t('Kéo ngang để căn −30°. Giữ nút Ép rồi nhả khi lực nằm trong vùng xanh.', 'Drag sideways to reach −30°. Hold Press and release in the green zone.');
    } else if (phase === 'done' || phase === 'test') {
      text.textContent = cues[phase === 'test' ? 'test' : step().kind === 'build' ? 'done' : 'stored'];
    } else if (step()?.kind === 'core') {
      text.textContent = t(`Đặt lõi sáu trục lên gá. Lắp hai bán cầu, rồi kéo từng nam châm vào hốc phát sáng. Mỗi nửa có ${magnetCount() / 2} nam châm. Chọn góc Từ trên để thấy rõ các dãy linh kiện trong khay.`, `Mount the six-axis hub, attach both hemispheres and drag each magnet into its glowing pocket. Each half takes ${magnetCount() / 2} magnets. Use Overhead to inspect the rows in the tray.`);
    } else if (step()?.kind === 'center' && mechanism.value === 'maglev') {
      const next = components.find(part => !part.seated);
      text.textContent = t('Lắp theo thứ tự đế tâm, vòng dưới, vòng trên, vòng chỉnh lực, chốt và nắp. Kéo từ giữa vòng vào ngay tâm viền sáng. Hai vòng có sẵn đúng chiều.', 'Install the housing, lower ring, upper ring, dial, pin and cap in order. Grab the middle of each ring and drop it into the glowing socket. Both rings are pre-oriented.')
        + (next ? ` ${t('Tiếp theo', 'Next')} · ${next.name}` : '');
    } else {
      text.textContent = t('Kéo linh kiện vào viền sáng. Nếu báo sai cực, bấm R hoặc dùng nút Đảo cực. Kéo vùng trống để đổi hướng nhìn.', 'Drag a part into the glowing outline. If polarity is wrong, press R or use Flip polarity. Drag an empty area to look around.');
    }
  }

  function updateAngle() {
    if (phase !== 'align') return;
    get('[data-angle]').textContent = `${angle}° / ${step().angle}°`;
    feedback(aligned() ? 'ready' : 'align');
  }

  function update(redraw = true) {
    if (redraw) drawWork();
    else updateParts();
    const current = step();
    const groupIndex = current ? groupOrder.indexOf(current.kind) : groupOrder.length;
    labels.forEach((label, index) => {
      const kind = groupOrder[index];
      const job = label.querySelector('button');
      if (job) {
        const count = kind === 'build' ? mounted.size - Number(mounted.has('core'))
          : jobs.get(kind).filter(jobIndex => made.has(jobId(steps[jobIndex]))).length;
        const total = totalFor(kind);
        job.textContent = `${groups[kind]} ${count}/${total}`;
        job.disabled = kind === 'build' ? !canMount() || phase === 'test' : stage >= firstMountStage || count === total;
        label.toggleAttribute('data-complete', count === total);
      }
      if (index === groupIndex) label.setAttribute('aria-current', 'step');
      else label.removeAttribute('aria-current');
    });
    get('[data-task]').textContent = current?.name ?? t('Kiểm tra thành phẩm', 'Test your build');
    get('.ws-align').hidden = phase !== 'align';
    get('.ws-force').hidden = phase !== 'align';
    button('next').hidden = phase !== 'done';
    button('next').textContent = finalEdge() ? t('Xoay thử khối', 'Test the cube')
      : current?.kind !== 'build' && canMount() ? t('Bắt đầu ráp khối', 'Start assembling the cube')
      : t('Lắp cụm tiếp theo', 'Next assembly');
    get('.ws-turn').hidden = phase !== 'test';
    profile.disabled = made.size > 0 || drafts.size > 0 || phase !== 'build' || components.some(part => part.seated);
    mechanism.disabled = phase !== 'test' && (cubies.some(part => part.kind === 'center' && made.has(part.id))
      || jobs.get('center').some(index => drafts.has(index))
      || (current?.kind === 'center' && components.some(part => part.seated)));
    get('[data-core-config]').hidden = current?.kind !== 'core';
    const coreStarted = made.has('core') || (current?.kind === 'core' && components.some(part => part.seated));
    coreMaterial.disabled = coreStarted;
    coreMagnets.disabled = coreStarted;
    if (current?.force) {
      targetBand.style.left = `${current.force * 100}%`;
      targetBand.style.width = '26%';
    }
    feedback(phase === 'done' && current?.kind !== 'build' ? 'stored' : phase);
    updateAngle();
    updateHint();
  }

  function adjust(delta) {
    if (phase !== 'align' || pressStart !== null) return;
    angle = Math.max(-90, Math.min(90, angle + delta));
    updateAngle();
  }

  function startPress(owner = localPress) {
    if (phase !== 'align' || pressStart !== null) return false;
    if (!aligned()) {
      feedback('off');
      return false;
    }
    pressOwner = owner;
    pressStart = performance.now();
    force = 0;
    return true;
  }

  function releasePress(cancelled = false, owner = localPress) {
    if (pressStart === null || pressOwner !== owner) return;
    force = Math.min(1, (performance.now() - pressStart) / 1350);
    pressStart = null;
    pressOwner = undefined;
    if (!cancelled && force >= step().force && force <= step().force + .26) {
      mounted.add(finalCubie.id);
      phase = 'done';
      update();
      button('next').focus({ preventScroll: true });
    } else if (!cancelled) feedback(force < step().force ? 'low' : 'high');
    force = 0;
    forceMeter.value = 0;
  }

  function startTurn(move) {
    if (turn || phase !== 'test') return;
    const axis = { U: 'y', R: 'x', F: 'z' }[move[0]];
    const pivot = new THREE.Group();
    pivot.position.copy(cubeOrigin);
    work.add(pivot);
    const layer = pieces.filter(({ coordinate }) => coordinate[axis] === 1);
    for (const { piece } of layer) pivot.attach(piece);
    turn = { pivot, axis, layer, target: (move.length === 1 ? -1 : 1) * Math.PI / 2, start: performance.now(), maglev: mechanism.value === 'maglev' };
  }

  function animate(now) {
    const pose = viewPose[view];
    eye.set(...pose.eye);
    headAngle.set(THREE.MathUtils.clamp(pitch + pose.pitch, -1.49, -.14), yaw + pose.yaw, 0);
    if (!drag?.part) {
      camera.position.lerp(eye, .14);
      camera.quaternion.slerp(headRotation.setFromEuler(headAngle), .14);
    }
    if (pressStart !== null) forceMeter.value = force = Math.min(1, (now - pressStart) / 1350);
    if (phase === 'align') {
      picked.rotation.y = THREE.MathUtils.degToRad(angle);
      picked.position.y = held.y - force * .55;
    }
    if (turn) {
      const maglev = turn.maglev;
      const progress = Math.min((now - turn.start) / (maglev ? 255 : 420), 1);
      const eased = maglev ? 1 - (1 - progress) ** 3 : progress * progress * (3 - 2 * progress);
      turn.pivot.rotation[turn.axis] = turn.target * eased;
      if (progress === 1) {
        for (const { piece, coordinate } of turn.layer) {
          work.attach(piece);
          coordinate.copy(piece.position).sub(cubeOrigin).divideScalar(.46).round();
          piece.position.copy(coordinate).multiplyScalar(.46).add(cubeOrigin);
        }
        turn.pivot.removeFromParent();
        turn = undefined;
      }
    }
    if (storedAnimation) {
      const { object, from, target, started } = storedAnimation;
      const progress = Math.min(1, (now - started) / 520);
      object.position.lerpVectors(from, target, progress);
      object.position.y += Math.sin(Math.PI * progress) * .32;
      object.scale.setScalar(THREE.MathUtils.lerp(.75, .35, progress));
      if (progress === 1) storedAnimation = undefined;
    }
    renderer.render(scene, camera);
    if (view < 2) {
      const holding = Boolean(drag?.part) || pressStart !== null;
      const reaching = holding || (pointing && canvas.dataset.hoverPart === 'loose' && !drag);
      hands.render(renderer, camera, handPointer, reaching, holding, now);
    }
    frame = requestAnimationFrame(animate);
  }

  const canvas = renderer.domElement;
  const ray = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const cursorWorld = new THREE.Vector3();
  const normal = new THREE.Vector3();
  function point(event) {
    const bounds = canvas.getBoundingClientRect();
    pointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1,
      1 - (event.clientY - bounds.top) / bounds.height * 2);
    ray.setFromCamera(pointer, camera);
    return bounds;
  }

  function partAt(event) {
    point(event);
    const hit = ray.intersectObjects(components.map(part => part.object), true)[0];
    let object = hit?.object;
    while (object && object.parent !== work) object = object.parent;
    return components.find(part => part.object === object);
  }

  function showTooltip(event, part) {
    tooltip.hidden = !part;
    canvas.dataset.hoverPart = part && !part.seated && !part.docked ? 'loose' : '';
    if (!part) return;
    const bounds = canvas.getBoundingClientRect();
    tooltip.querySelector('strong').textContent = part.name;
    tooltip.querySelector('span').textContent = part.note;
    tooltip.style.left = `${Math.max(8, Math.min(event.clientX - bounds.left + 12, bounds.width - tooltip.offsetWidth - 8))}px`;
    tooltip.style.top = `${Math.max(8, Math.min(event.clientY - bounds.top + 14, bounds.height - tooltip.offsetHeight - 8))}px`;
  }

  function nearTarget(event, part) {
    const bounds = point(event);
    const projected = destination(part).project(camera);
    const dx = (projected.x - pointer.x) * bounds.width / 2;
    const dy = (projected.y - pointer.y) * bounds.height / 2;
    return Math.hypot(dx, dy) < (['magnet', 'core-magnet'].includes(part.model) ? 34 : part.model === 'ring' ? 46 : part.cubie ? 29 : 43);
  }

  function grab(event) {
    if (drag) return false;
    trackHand(event);
    const hit = partAt(event);
    if (phase === 'build' && hit?.docked && !hit.seated) {
      selectPart(hit);
      showTooltip(event, hit);
      return false;
    }
    const part = phase === 'build' && hit && !hit.seated ? hit : undefined;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false, part };
    if (part) {
      selectPart(part);
      camera.getWorldDirection(normal);
      drag.plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, destination(part));
      showTooltip(event, event.pointerType === 'touch' ? part : undefined);
    }
    canvas.toggleAttribute('data-grabbing', Boolean(part));
    return true;
  }

  function trackHand(event) {
    point(event);
    handPointer.set(THREE.MathUtils.clamp(pointer.x, -1, 1), THREE.MathUtils.clamp(pointer.y, -1, 1));
    pointing = true;
  }

  function move(event) {
    if (!drag || drag.id === event.pointerId) trackHand(event);
    if (!drag) {
      showTooltip(event, partAt(event));
      return;
    }
    if (drag.id !== event.pointerId) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 3) return;
    drag.moved = true;
    if (drag.part) {
      point(event);
      if (ray.ray.intersectPlane(drag.plane, cursorWorld)) drag.part.object.position.copy(cursorWorld);
      page.toggleAttribute('data-over-socket', nearTarget(event, drag.part));
      tooltip.hidden = true;
    } else if (phase === 'align') adjust(Math.round(dx * .65));
    else {
      yaw = THREE.MathUtils.clamp(yaw + dx * .0035, -.43, .43);
      pitch = THREE.MathUtils.clamp(pitch + dy * .003, -.44, .34);
    }
    drag.x = event.clientX;
    drag.y = event.clientY;
  }

  function drop(event) {
    if (drag?.id !== event.pointerId) return;
    const { part, moved } = drag;
    drag = undefined;
    canvas.removeAttribute('data-grabbing');
    page.removeAttribute('data-over-socket');
    if (!part || !moved) return;
    if (nearTarget(event, part)) place(part);
    else {
      part.object.position.copy(part.home);
      feedback('miss');
    }
  }

  function cancelDrag(pointerId) {
    if (drag?.id !== pointerId) return;
    if (drag.part) drag.part.object.position.copy(drag.part.home);
    drag = undefined;
    canvas.removeAttribute('data-grabbing');
    page.removeAttribute('data-over-socket');
  }

  listen(canvas, 'pointerdown', event => {
    if (event.button === 0 && grab(event)) canvas.setPointerCapture(event.pointerId);
  });
  listen(canvas, 'pointermove', move);
  listen(canvas, 'pointerup', drop);
  listen(canvas, 'lostpointercapture', event => cancelDrag(event.pointerId));

  const gesture = createGestureInput(canvas, {
    grab, move, drop, cancel: cancelDrag,
    rotate: (pointerId, direction) => {
      if (drag && drag.id !== pointerId) return;
      if (phase === 'align') adjust(direction * 15);
      else if (phase === 'build') rotatePart(drag?.part ?? selected);
    },
    press: startPress, release: (owner, cancelled) => releasePress(cancelled, owner),
  });
  listen(canvas, workshopGestureEvent, event => gesture(event.detail));
  listen(window, 'blur', () => gesture({ type: 'cancel' }));
  listen(canvas, 'pointerleave', () => { tooltip.hidden = true; pointing = false; });
  listen(canvas, 'wheel', event => {
    if (phase !== 'align' && !drag?.part && !(selected?.docked && !selected.seated) && !(selected?.polar !== undefined && partAt(event) === selected)) return;
    if (!event.deltaY) return;
    event.preventDefault();
    if (phase !== 'align') rotatePart(drag?.part ?? selected);
    else adjust(Math.sign(event.deltaY) * 15);
  }, { passive: false });
  listen(window, 'keydown', event => {
    if (event.key.toLowerCase() === 'r' && !event.repeat && phase === 'build' && selected && !event.target.matches?.('input, select, textarea')) {
      rotatePart(selected);
    }
  });
  listen(partSelect, 'change', () => selectPart(components.find(part => part.id === partSelect.value)));
  listen(button('place'), 'click', () => {
    const part = components.find(item => item.id === partSelect.value);
    if (part && !part.seated) {
      selectPart(part);
      if (!part.docked) place(part);
    }
  });
  listen(button('orient'), 'click', () => rotatePart(selected));
  listen(button('left'), 'click', () => adjust(-15));
  listen(button('right'), 'click', () => adjust(15));
  listen(button('press'), 'pointerdown', event => {
    if (event.button !== 0 || !event.isPrimary) return;
    button('press').setPointerCapture(event.pointerId);
    startPress();
  });
  listen(button('press'), 'pointerup', () => releasePress());
  listen(button('press'), 'lostpointercapture', () => releasePress(true));
  listen(button('press'), 'keydown', event => {
    if (![' ', 'Enter'].includes(event.key)) return;
    event.preventDefault();
    if (!event.repeat) startPress();
  });
  listen(button('press'), 'keyup', event => {
    if (![' ', 'Enter'].includes(event.key)) return;
    event.preventDefault();
    releasePress();
  });
  listen(button('press'), 'blur', () => releasePress(true));
  listen(window, 'blur', () => releasePress(true));
  for (const control of page.querySelectorAll('[data-kind]')) {
    listen(control, 'click', () => {
      const kind = control.dataset.kind;
      if (kind === 'build') {
        if (canMount() && stage < firstMountStage) goTo(firstMountStage);
      } else if (stage < firstMountStage) {
        const next = remaining(kind);
        if (next !== undefined) goTo(next);
      }
    });
  }
  listen(button('next'), 'click', () => {
    if (phase !== 'done') return;
    if (stage >= firstMountStage) goTo(stage + 1);
    else if (canMount()) goTo(firstMountStage);
    else goTo(remaining(step().kind) ?? [...jobs.keys()].map(remaining).find(index => index !== undefined));
  });
  const viewControl = get('[data-view]');
  listen(viewControl, 'change', () => {
    if (drag) cancelDrag(drag.id);
    view = Number(viewControl.value);
    pointing = false;
    tooltip.hidden = true;
    yaw = 0;
    pitch = 0;
  });
  const hint = get('.ws-hint');
  const hintButton = button('hint');
  const hintPanel = get('#ws-hint-guide');
  let hintPinned = false;
  function showHint(open) {
    hintPanel.hidden = !open;
    hintButton.setAttribute('aria-expanded', String(open));
  }
  listen(hint, 'pointerenter', event => { if (event.pointerType === 'mouse') showHint(true); });
  listen(hint, 'pointerleave', () => { if (!hintPinned) showHint(false); });
  listen(hintButton, 'focus', () => showHint(true));
  listen(hintButton, 'blur', () => { if (!hintPinned) showHint(false); });
  listen(hintButton, 'click', () => { hintPinned = !hintPinned; showHint(hintPinned); });
  listen(hintButton, 'keydown', event => {
    if (event.key === 'Escape') { hintPinned = false; showHint(false); }
  });
  const fullscreen = button('fullscreen');
  function updateFullscreen() {
    const active = document.fullscreenElement === page || page.hasAttribute('data-expanded');
    fullscreen.setAttribute('aria-pressed', String(active));
    fullscreen.querySelector('span').textContent = active
      ? t('Thoát toàn màn hình', 'Exit fullscreen') : t('Toàn màn hình', 'Fullscreen');
  }

  listen(fullscreen, 'click', async () => {
    if (document.fullscreenElement === page) {
      await document.exitFullscreen();
    } else if (page.hasAttribute('data-expanded')) {
      page.removeAttribute('data-expanded');
    } else {
      try {
        if (typeof page.requestFullscreen !== 'function') throw new Error('Fullscreen unavailable');
        await page.requestFullscreen();
      } catch {
        if (page.isConnected) page.setAttribute('data-expanded', '');
      }
    }
    updateFullscreen();
  });
  listen(document, 'fullscreenchange', updateFullscreen);
  listen(window, 'keydown', event => {
    if (event.key === 'Escape' && page.hasAttribute('data-expanded')) {
      page.removeAttribute('data-expanded');
      updateFullscreen();
      fullscreen.focus();
    }
  });
  updateFullscreen();

  listen(button('reset'), 'click', () => {
    gesture({ type: 'cancel' });
    releasePress(true);
    turn = undefined;
    stage = 0;
    made.clear();
    drafts.clear();
    mounted.clear();
    phase = 'build';
    angle = 0;
    view = 0;
    viewControl.value = '0';
    yaw = 0;
    pitch = 0;
    pointing = false;
    update();
  });
  for (const option of [coreMaterial, coreMagnets]) {
    listen(option, 'change', () => {
      if (phase === 'build' && step().kind === 'core') update();
    });
  }
  listen(profile, 'change', () => { if (phase === 'build') drawWork(); });
  listen(mechanism, 'change', () => {
    if (phase === 'build' && step().kind === 'center') update();
  });
  for (const control of page.querySelectorAll('[data-move]')) {
    listen(control, 'click', () => startTurn(control.dataset.move));
  }

  const resize = new ResizeObserver(() => {
    const { clientWidth: width, clientHeight: height } = viewport;
    if (!width || !height) return;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.fov = THREE.MathUtils.clamp(THREE.MathUtils.radToDeg(2 * Math.atan(.73 / camera.aspect)), 36, 88);
    camera.updateProjectionMatrix();
  });
  resize.observe(viewport);
  camera.position.set(.03, 2.55, 4.65);
  camera.rotation.set(viewPose[0].pitch, viewPose[0].yaw, 0, 'YXZ');
  update();
  frame = requestAnimationFrame(animate);

  return () => {
    controller.abort();
    if (document.fullscreenElement === page) document.exitFullscreen().catch(() => {});
    resize.disconnect();
    cancelAnimationFrame(frame);
    clear(work);
    clear(bench);
    clear(storage);
    hands.dispose();
    for (const surface of [base, dark, mat, silver, mint, blue, graphite, rail, ...Object.values(coreMaterials), pickSurface, targetSurface, grid.material, ...colors]) surface.dispose();
    coreEnvironment.dispose();
    light.shadow.dispose();
    renderer.dispose();
  };
}
