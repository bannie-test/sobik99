// Gesture bridges dispatch this event on the workshop canvas with a JSON-compatible detail.
// Coordinates are normalized to the canvas, with (0, 0) at the top left.
// Send cancel when tracking is lost or the transport disconnects.
export const workshopGestureEvent = 'sobik:workshop-gesture';

export function createGestureInput(canvas, actions) {
  const pointerId = Symbol('hand gesture');

  return message => {
    if (!message || typeof message !== 'object') return;
    if (message.type === 'cancel') {
      actions.cancel(pointerId);
      actions.release(pointerId, true);
      return;
    }
    if (message.type === 'rotate') {
      actions.rotate(pointerId, message.direction === -1 ? -1 : 1);
      return;
    }
    if (message.type === 'press-start') {
      actions.press(pointerId);
      return;
    }
    if (message.type === 'press-end') {
      actions.release(pointerId);
      return;
    }
    const { type, x, y } = message;
    if (!['move', 'grab', 'drop'].includes(type) ||
        !Number.isFinite(x) || !Number.isFinite(y) || x < 0 || y < 0 || x > 1 || y > 1) return;
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const point = {
      pointerId, pointerType: 'gesture',
      clientX: bounds.left + x * bounds.width,
      clientY: bounds.top + y * bounds.height,
    };
    actions[type](point);
  };
}
