export function cubeArt(type='3x3',tone=0){
 if(type==='Pyraminx')return `<div class="puzzle-art pyramid" aria-label="Minh họa Pyraminx"><div></div><span>PYRAMINX</span></div>`;
 if(type==='Megaminx')return `<div class="puzzle-art mega" aria-label="Minh họa Megaminx"><div>✦</div><span>MEGAMINX</span></div>`;
 const n=Number(type[0])||3;return `<div class="puzzle-art" role="img" aria-label="Minh họa Rubik ${type}"><div class="mini-cube" style="--n:${n};--art-angle:${tone%2?-28:-35}deg">${['front','right','top'].map(face=>`<div class="mini-face ${face}">${'<i></i>'.repeat(n*n)}</div>`).join('')}</div></div>`;
}
