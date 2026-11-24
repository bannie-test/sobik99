export function read(key, fallback, validate=()=>true) { try { const value=JSON.parse(localStorage.getItem(key)); return value!==null&&validate(value)?value:fallback; } catch { return fallback; } }
export function write(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}}
