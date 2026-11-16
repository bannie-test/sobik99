export function cubeTimeline(){
 const I=[1,0,0,0,1,0,0,0,1];
 const mul=(a,b)=>Array.from({length:9},(_,i)=>{const r=Math.floor(i/3),c=i%3;return a[r*3]*b[c]+a[r*3+1]*b[c+3]+a[r*3+2]*b[c+6]});
 const vec=(m,p)=>[0,1,2].map(r=>m[r*3]*p[0]+m[r*3+1]*p[1]+m[r*3+2]*p[2]);
 const rot=(axis,t)=>{const c=Math.cos(t),s=Math.sin(t);return axis===0?[1,0,0,0,c,-s,0,s,c]:axis===1?[c,0,s,0,1,0,-s,0,c]:[c,-s,0,s,c,0,0,0,1]};
 const solved=[];for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)for(let z=-1;z<=1;z++){if(x||y||z)solved.push({p:[x,y,z],m:[...I],home:[x,y,z]})}
 const definition={R:[0,1,-1],L:[0,-1,1],U:[1,-1,-1],D:[1,1,1],F:[2,1,1],B:[2,-1,-1]};
 const scramble="R U2 F' L D B2 R' U F2 D' L2 B U' R2 F D2 L' U B' R".split(' ');
 const parse=s=>{const[a,l,d]=definition[s[0]];return{a,l,q:d*(s.endsWith('2')?2:s.endsWith("'")?-1:1),notation:s}};
 const apply=(state,move)=>{const r=rot(move.a,move.q*Math.PI/2).map(Math.round);return state.map(c=>c.p[move.a]===move.l?{...c,p:vec(r,c.p).map(Math.round),m:mul(r,c.m).map(Math.round)}:{...c,p:[...c.p],m:[...c.m]})};
 let state=solved;for(const s of scramble)state=apply(state,parse(s));
 const turns=scramble.map(parse).reverse().map(m=>({...m,q:-m.q}));const states=[state];for(const m of turns){state=apply(state,m);states.push(state)}
 const sample=t=>{const k=Math.min(turns.length,Math.floor(t)),f=t-k,state=states[k],move=turns[k];if(!move||!f)return state;const r=rot(move.a,move.q*Math.PI/2*f);return state.map(c=>c.p[move.a]===move.l?{...c,p:vec(r,c.p),m:mul(r,c.m)}:c)};
 return{solved,states,turns,scramble,sample,vec};
}
