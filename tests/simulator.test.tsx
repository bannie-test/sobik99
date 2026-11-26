import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { Quaternion, Vector3 } from 'three';
import { beforeEach, expect, test, vi } from 'vitest';
import SimulatorPage from '../src/features/simulator/SimulatorPage';
import type { trackHand } from '../src/features/simulator/handCamera';
import type { HandSample } from '../src/features/simulator/handGesture';
import type { CompletedSolve } from '../src/features/simulator/solveHistory';
import { renderWithProviders } from './render';

const mocks = vi.hoisted(() => ({
  viewChanged: vi.fn<(orientation: Quaternion) => void>(),
  scene: {
    rotate: vi.fn(async (..._args: unknown[]) => true),
    orbit: vi.fn(),
    resetView: vi.fn(),
    reset: vi.fn(),
    dispose: vi.fn(),
    gesture: {
      pick: vi.fn(() => [{ move: 'U', dx: 1, dy: 0 }]),
      preview: vi.fn(),
    },
  },
  scramble: vi.fn(async () => 'R U2'),
  load: vi.fn(async (): Promise<CompletedSolve[]> => []),
  save: vi.fn(async (_solve: CompletedSolve) => {}),
  track: vi.fn<typeof trackHand>(),
  mountPlayer: vi.fn(async (..._args: unknown[]) => ({ destroy: vi.fn() })),
}));

vi.mock('../src/cube-tools/components/player.js', () => ({
  createCube: (_stage: HTMLElement, _size: number, options: { onViewChange: (orientation: Quaternion) => void }) => {
    mocks.viewChanged.mockImplementation(options.onViewChange);
    return mocks.scene;
  },
  mountPlayer: mocks.mountPlayer,
}));
vi.mock('../src/cube-tools/core/cubing-search.js', () => ({ randomScramble3x3: mocks.scramble }));
vi.mock('../src/features/simulator/solveHistory', () => ({
  loadSolveHistory: mocks.load,
  saveCompletedSolve: mocks.save,
}));
vi.mock('../src/features/simulator/handCamera', () => ({ trackHand: mocks.track }));

beforeEach(() => vi.clearAllMocks());

async function openSimulator() {
  const page = renderWithProviders(<SimulatorPage />);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Bật camera' })).toBeEnabled());
  return { page, stage: screen.getByRole('group', { name: 'Khối Rubik 3D' }) };
}

function pitchView(angle: number) {
  act(() => mocks.viewChanged(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), angle)));
}

function submitFormula(value: string) {
  const formula = screen.getByLabelText('Công thức', { selector: 'input' });
  fireEvent.change(formula, { target: { value } });
  fireEvent.click(screen.getByRole('button', { name: 'Chạy công thức' }));
}

test('queues keyboard and typed turns in order and leaves browser shortcuts alone', async () => {
  const { stage } = await openSimulator();
  stage.focus();
  expect(fireEvent.keyDown(stage, { key: 'r', ctrlKey: true })).toBe(true);
  expect(fireEvent.keyDown(stage, { key: 'R', ctrlKey: true, shiftKey: true })).toBe(true);
  expect(fireEvent.keyDown(stage, { key: 'r' })).toBe(false);
  fireEvent.keyDown(stage, { key: 'R', shiftKey: true });
  fireEvent.keyDown(stage, { key: 't' });
  fireEvent.keyDown(stage, { key: 'T', shiftKey: true });
  fireEvent.keyDown(stage, { key: 'i' });
  fireEvent.keyDown(stage, { key: 'y' });
  fireEvent.keyDown(stage, { key: 't', repeat: true });

  const formula = screen.getByLabelText('Công thức');
  formula.focus();
  fireEvent.keyDown(formula, { key: 'r' });
  submitFormula("wR2 U' y2");
  await waitFor(() => expect(mocks.scene.rotate.mock.calls.map(([move]) => move))
    .toEqual(['R', "R'", 'r', "r'", 'u', 'y', 'r2', "U'", 'y2']));
});

test('blocks duplicate assignments and applies the saved mapping after remount', async () => {
  const { page } = await openSimulator();
  fireEvent.click(screen.getByText('Cấu hình phím xoay'));
  const field = screen.getByLabelText('Phím cho wR', { exact: true });
  const save = screen.getByRole('button', { name: 'Lưu cấu hình' });

  fireEvent.keyDown(field, { key: 'r' });
  expect(field).toHaveAttribute('aria-invalid', 'true');
  expect(save).toBeDisabled();

  fireEvent.keyDown(field, { key: 'G', shiftKey: true });
  expect(save).toBeEnabled();
  fireEvent.click(save);
  page.unmount();

  const { stage } = await openSimulator();
  stage.focus();
  expect(fireEvent.keyDown(stage, { key: 't' })).toBe(true);
  fireEvent.keyDown(stage, { key: 'G', shiftKey: true });
  await waitFor(() => expect(mocks.scene.rotate).toHaveBeenCalledExactlyOnceWith('r', true, 150));
});

test('one solve captures camera, keyboard and formula moves for review in chronological order', async () => {
  const { stage } = await openSimulator();
  fireEvent.click(screen.getByRole('button', { name: 'Tạo scramble' }));
  expect(await screen.findByLabelText('Scramble')).toHaveTextContent('R U2');

  let observe: ((sample: HandSample | null) => void) | undefined;
  let cameraSignal: AbortSignal | undefined;
  mocks.track.mockImplementationOnce((_video, signal, callbacks) => {
    cameraSignal = signal;
    observe = callbacks.sample;
    callbacks.ready();
  });
  Object.defineProperties(stage, {
    clientWidth: { value: 400 },
    clientHeight: { value: 350 },
  });
  pitchView(-Math.PI / 2);
  fireEvent.click(screen.getByRole('button', { name: 'Bật camera' }));
  const aim = { x: 0.35, y: 0.35, pinch: 0.70 };
  const grip = { ...aim, pinch: 0.2 };
  const drag = { ...grip, x: 0.59 };
  act(() => {
    observe!(aim);
    observe!(aim);
    observe!(grip);
    observe!(grip);
    observe!(drag);
  });
  expect(mocks.scene.gesture.preview).toHaveBeenLastCalledWith('U');
  expect(stage.querySelector('.simulator-turn-preview')).toHaveTextContent('F');
  expect(mocks.scene.rotate.mock.calls.map(([move]) => move)).toEqual(['R', 'U2']);

  act(() => {
    observe!({ ...drag, pinch: 0.75 });
    observe!({ ...drag, pinch: 0.75 });
  });
  pitchView(0);
  fireEvent.keyDown(stage, { key: 'u' });
  submitFormula("R'");
  expect(await screen.findByText(/Đã giải xong/)).toBeInTheDocument();
  expect(mocks.save).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
    scramble: ['R', 'U2'],
    turns: [
      { move: 'U', viewMove: 'F', source: 'camera', atMs: 0 },
      { move: 'U', source: 'keyboard', atMs: expect.any(Number) },
      { move: "R'", source: 'formula', atMs: expect.any(Number) },
    ],
  }));
  fireEvent.click(screen.getByRole('button', { name: 'Phát lại và nhận xét' }));
  expect(cameraSignal?.aborted).toBe(true);
  await waitFor(() => expect(mocks.mountPlayer).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
    setup: 'R U2',
    alg: "U U R'",
    turnTimes: [0, expect.any(Number), expect.any(Number)],
  })));
  expect(screen.getByText(/Có thể bớt 1 thao tác/)).toBeInTheDocument();
  fireEvent.click(screen.getByText('Thời điểm và nguồn từng nước'));
  expect(screen.getByText('F → U')).toBeInTheDocument();
  fireEvent.click(screen.getByLabelText('Hiện các mốc CFOP với Cross trắng'));
  expect(screen.getByText('Cross', { exact: true })).toBeInTheDocument();
  expect(screen.getByText('PLL', { exact: true })).toBeInTheDocument();
});

test('a formula must finish in a solved state to save the attempt', async () => {
  mocks.scramble.mockResolvedValueOnce('R');
  await openSimulator();
  fireEvent.click(screen.getByRole('button', { name: 'Tạo scramble' }));
  await screen.findByLabelText('Scramble');
  submitFormula("R' U");
  await waitFor(() => expect(screen.getByText(/Các nước đã xoay.*2/)).toBeInTheDocument());
  expect(mocks.save).not.toHaveBeenCalled();

  submitFormula("U' y");
  await screen.findByText(/Đã giải xong/);
  expect(mocks.save).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
    turns: expect.arrayContaining([{ move: 'y', source: 'formula', atMs: expect.any(Number) }]),
  }));
});

test('reset while generating a scramble discards the stale result', async () => {
  let finish: (scramble: string) => void = () => {};
  mocks.scramble.mockImplementationOnce(() => new Promise<string>((resolve) => { finish = resolve; }));
  await openSimulator();
  fireEvent.click(screen.getByRole('button', { name: 'Tạo scramble' }));
  fireEvent.click(screen.getByRole('button', { name: 'Đặt lại khối' }));
  await act(async () => finish('R'));
  expect(screen.queryByLabelText('Scramble')).toBeNull();
  expect(mocks.scene.rotate).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Tạo scramble' })).toBeEnabled();
});

test('keeps L and B separate in the reference view', async () => {
  const { stage } = await openSimulator();
  stage.focus();
  expect(fireEvent.keyDown(stage, { key: 'ArrowLeft' })).toBe(false);
  expect(await screen.findByRole('img', { name: 'F · mặt trước · đỏ' })).toBeInTheDocument();
  for (const key of ['ArrowRight', 'ArrowUp', 'ArrowDown']) {
    expect(fireEvent.keyDown(stage, { key })).toBe(false);
  }
  expect(mocks.scene.orbit).not.toHaveBeenCalled();
  fireEvent.keyDown(stage, { key: 'l' });
  fireEvent.keyDown(stage, { key: 'b' });
  fireEvent.click(screen.getByRole('button', { name: 'Nhìn từ mặt trước' }));
  expect(mocks.scene.resetView).toHaveBeenCalledOnce();
  await waitFor(() => expect(mocks.scene.rotate.mock.calls.map(([move]) => move)).toEqual(['y', "y'", 'x', "x'", 'L', 'B']));
});

test('F follows the white or yellow center and queued moves keep their input frame', async () => {
  const { stage } = await openSimulator();
  expect(screen.getByRole('img', { name: 'F · mặt trước · xanh lá' })).toBeInTheDocument();

  pitchView(-Math.PI / 2);
  expect(screen.getByRole('img', { name: 'F · mặt trước · trắng' })).toBeInTheDocument();
  fireEvent.keyDown(stage, { key: 'f' });

  pitchView(Math.PI / 2);
  expect(screen.getByRole('img', { name: 'F · mặt trước · vàng' })).toBeInTheDocument();
  submitFormula("F2 x2 F'");
  await waitFor(() => expect(mocks.scene.rotate.mock.calls.map(([move]) => move))
    .toEqual(['U', 'D2', 'x2', "D'"]));
  expect(await screen.findByRole('img', { name: 'F · mặt trước · trắng' })).toBeInTheDocument();
});

test('expanded workspace keeps the same cube, controls and legend and exits with Escape', async () => {
  const { stage } = await openSimulator();
  fireEvent.click(screen.getByRole('button', { name: 'Toàn màn hình' }));
  const expanded = screen.getByRole('dialog', { name: 'Không gian xoay Rubik' });
  expect(expanded).toContainElement(stage);
  expect(expanded).toContainElement(screen.getByRole('img', { name: 'F · mặt trước · xanh lá' }));
  expect(stage).toHaveFocus();
  expect(expanded.querySelector('.simulator-fullscreen-clock')).toHaveTextContent('00:00.00');

  fireEvent.keyDown(stage, { key: 'f' });
  await waitFor(() => expect(mocks.scene.rotate).toHaveBeenCalledExactlyOnceWith('F', true, 150));
  fireEvent.keyDown(stage, { key: 'Escape' });
  expect(screen.queryByRole('dialog', { name: 'Không gian xoay Rubik' })).toBeNull();
  expect(screen.getByRole('button', { name: 'Toàn màn hình' })).toHaveFocus();
  expect(screen.getByRole('group', { name: 'Khối Rubik 3D' })).toBe(stage);
  expect(mocks.scene.reset).not.toHaveBeenCalled();
});

test('fullscreen hides session details and reveals the saved result when the cube is solved', async () => {
  mocks.scramble.mockResolvedValueOnce('R');
  const { stage } = await openSimulator();
  fireEvent.click(screen.getByRole('button', { name: 'Tạo scramble' }));
  await screen.findByLabelText('Scramble');
  fireEvent.click(screen.getByRole('button', { name: 'Toàn màn hình' }));
  expect(screen.queryByRole('button', { name: 'Tạo scramble' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Bật camera' })).toBeNull();
  expect(screen.queryByRole('heading', { name: 'Lịch sử giải' })).toBeNull();
  fireEvent.keyDown(stage, { key: 'R', shiftKey: true });
  expect(await screen.findByText(/Đã giải xong/)).toBeVisible();
  expect(screen.getByRole('button', { name: 'Phát lại và nhận xét' })).toBeVisible();
  expect(screen.queryByRole('dialog', { name: 'Không gian xoay Rubik' })).toBeNull();
});
