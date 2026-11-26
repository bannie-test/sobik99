export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]
));

let ui;
export function bindUi(host) {
  ui = host;
  return () => { if (ui === host) ui = undefined; };
}
export const toast = message => ui?.toast(message);
export const copy = text => ui?.copy(text);
