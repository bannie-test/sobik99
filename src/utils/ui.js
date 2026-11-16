export const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const money=n=>new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}).format(n);
let timeout;
export function toast(message){const el=document.getElementById('toast');el.textContent=message;el.classList.add('show');clearTimeout(timeout);timeout=setTimeout(()=>el.classList.remove('show'),3200);}
let modalCleanup=()=>{};
export function openModal(html,onMount){const modal=document.getElementById('modal');modalCleanup();document.getElementById('modal-content').innerHTML=html;if(!modal.open)modal.showModal();document.body.classList.add('modal-open');modalCleanup=onMount?.(document.getElementById('modal-content'))||(()=>{});}
export function closeModal(){document.getElementById('modal').close();}
export function initModal(){const m=document.getElementById('modal');m.querySelector('.close-modal').addEventListener('click',closeModal);m.addEventListener('click',e=>{if(e.target===m){const r=m.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeModal();}});m.addEventListener('close',()=>{modalCleanup();modalCleanup=()=>{};document.body.classList.remove('modal-open')});}
export async function copy(text){try{await navigator.clipboard.writeText(text);toast('Đã sao chép công thức.');}catch{openModal(`<h2>Sao chép công thức</h2><textarea readonly aria-label="Công thức">${escapeHTML(text)}</textarea>`,el=>{el.querySelector('textarea').select()})}}
