export function read(key, fallback, validate=()=>true) { try { const value=JSON.parse(localStorage.getItem(key)); return value!==null&&validate(value)?value:fallback; } catch { return fallback; } }
export function write(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}}
export const validHistory=v=>Array.isArray(v)&&v.every(x=>x&&typeof x.id==='string'&&Number.isFinite(x.ms)&&x.ms>=0&&typeof x.scramble==='string'&&typeof x.date==='string'&&['none','+2','DNF'].includes(x.penalty));
