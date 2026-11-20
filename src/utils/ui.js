import { t as tr } from './i18n.js';
export const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let timeout;
export function toast(message){const el=document.getElementById('toast');el.textContent=message;el.classList.add('show');clearTimeout(timeout);timeout=setTimeout(()=>el.classList.remove('show'),3200);}
let modalCleanup=()=>{};
export function openModal(html,onMount){const modal=document.getElementById('modal');modalCleanup();document.getElementById('modal-content').innerHTML=html;if(!modal.open)modal.showModal();document.body.classList.add('modal-open');modalCleanup=onMount?.(document.getElementById('modal-content'))||(()=>{});}
export function closeModal(){document.getElementById('modal').close();}
export function initModal(){const m=document.getElementById('modal');m.querySelector('.close-modal').addEventListener('click',closeModal);m.addEventListener('click',e=>{if(e.target===m){const r=m.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeModal();}});m.addEventListener('close',()=>{if(m.open)return;modalCleanup();modalCleanup=()=>{};document.body.classList.remove('modal-open')});}
export async function copy(text){try{await navigator.clipboard.writeText(text);toast(tr('Đã sao chép công thức.', "Algorithm copied."));}catch{openModal(`<h2>${tr("Sao chép công thức", "Copy algorithm")}</h2><textarea readonly aria-label="${tr("Công thức", "Algorithm")}">${escapeHTML(text)}</textarea>`,el=>{el.querySelector('textarea').select()})}}
