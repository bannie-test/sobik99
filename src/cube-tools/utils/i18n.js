import { read, write } from './storage.js';

const isLanguage = value => value === 'vi' || value === 'en';
const requested = typeof location === 'undefined' ? null : new URL(location.href).searchParams.get('lang');

export const language = isLanguage(requested) ? requested : read('sobik_language', 'vi', isLanguage);
export const locale = language === 'en' ? 'en-US' : 'vi-VN';
export const t = (vi, en) => language === 'en' ? en : vi;

export function setLanguage(next) {
  if (!isLanguage(next) || next === language) return;
  const url = new URL(location.href);
  if (write('sobik_language', next)) url.searchParams.delete('lang');
  else url.searchParams.set('lang', next);
  if (url.href === location.href) location.reload();
  else location.assign(url);
}
