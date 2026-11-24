import { t as tr } from './utils/i18n.js';
import { cubeTimeline } from '../features/landing/cubeEngine.ts';
import { featuredBrands } from './data/featured.js';
import { landingTemplate } from './landing-template.js';
export function landing(container){
 container.innerHTML=landingTemplate;
 const root=container.querySelector('#sobik-orbit'),view=window,journey=root.querySelector('.journey'),stage=root.querySelector('.stage'),cube=root.querySelector('.cube'),scene=root.querySelector('.scene'),stories=[...root.querySelectorAll('.story')],motion=root.querySelector('.motion'),media=matchMedia('(prefers-reduced-motion: reduce)');
 const mobileJourney = matchMedia('(max-width: 760px)');
 const chapterProgress = [0, .22, .38, .54, .70, .90];
 const chapterPicker = root.querySelector('.chapter-picker');
 const chapterNames = [chapterPicker.textContent, '1974', '1980–82', tr('Nam châm', 'Magnets'), 'MagLev', tr('Hoàn thành', 'Solved')];
 const frames = document.createElement('div');
 frames.className = 'journey-frames';
 frames.setAttribute('aria-hidden', 'true');
 for (const progress of chapterProgress) {
   const marker = document.createElement('span');
   marker.style.setProperty('--frame-progress', progress);
   frames.append(marker);
 }
 journey.append(frames);
 let reduced=media.matches,active=-1,current=0,target=0,raf=0;const timeline=cubeTimeline(),colors=['#ff7650','#eb4e65','#2e65eb','#25b58a','#fff9e8','#ffcf42'];
 const turnCount=timeline.turns.length;
 const normals=[[0,0,1],[0,0,-1],[1,0,0],[-1,0,0],[0,-1,0],[0,1,0]];
 const faceTransforms=['translateZ(29px)','rotateY(180deg) translateZ(29px)','rotateY(90deg) translateZ(29px)','rotateY(-90deg) translateZ(29px)','rotateX(90deg) translateZ(29px)','rotateX(-90deg) translateZ(29px)'];cube.replaceChildren();
 const elements=timeline.solved.map(c=>{const el=document.createElement('div');el.className='cubie';normals.forEach((n,i)=>{const f=document.createElement('div');f.className='face';f.style.transform=faceTransforms[i];const outside=n.some((v,k)=>v!==0&&v===c.home[k]);f.style.setProperty('--fc',outside?colors[i]:'#292339');el.append(f)});cube.append(el);return el});
 const net=document.createElement('div');net.className='net';net.setAttribute('aria-label',tr('Trạng thái sáu mặt Rubik', "Status of all six cube faces"));root.querySelector('.visual').append(net);const netCells=normals.map((_,i)=>{const f=document.createElement('div');f.className='net-face';const a=[];for(let j=0;j<9;j++){const c=document.createElement('i');f.append(c);a.push(c)}const label=document.createElement('span');label.textContent=['F','B','R','L','U','D'][i];f.append(label);net.append(f);return a});
 let lastNet=-1;function netRender(k){if(lastNet===k)return;lastNet=k;const state=timeline.states[k],values=normals.map(()=>Array(9).fill('#292339'));state.forEach(c=>normals.forEach((n,color)=>{if(!n.some((v,a)=>v!==0&&v===c.home[a]))return;const v=timeline.vec(c.m,n),face=normals.findIndex(n=>n.every((x,a)=>x===v[a]));let x,y;if(face<2){x=c.p[0];y=c.p[1]}else if(face<4){x=c.p[2];y=c.p[1]}else{x=c.p[0];y=c.p[2]}values[face][(y+1)*3+x+1]=colors[color]}));values.forEach((a,i)=>a.forEach((v,j)=>netCells[i][j].style.background=v));const solved=values.filter(a=>new Set(a).size===1).length;net.setAttribute('aria-label',`${solved}${tr("/6 mặt đã hoàn thành", "/6 faces solved")}`);root.querySelector('.era').textContent=k===turnCount?'6 / 6 · SOLVED':`${k} / ${turnCount} ${tr("VÒNG XOAY", "TURNS")}`;}
 const palettes=[['#fbf8f0','#e4d8ff'],['#fff5e6','#ffd08b'],['#fff0f2','#f7b6d3'],['#f1f8e7','#c8e89c'],['#f1edff','#bcaff0'],['#fffbea','#fff16c']];
 function choose(i){if(i===active)return;active=i;chapterPicker.textContent=chapterNames[i];stories.forEach((s,j)=>s.hidden=i!==j);root.querySelector('.chapter-count').textContent=`0${i+1} / 06`;root.style.setProperty('--page',palettes[i][0]);root.style.setProperty('--disc',palettes[i][1]);root.querySelector('.label-a').textContent=i===5?tr('✦ HOÀN THÀNH 6 MẶT ✦', "✦ ALL SIX FACES SOLVED ✦"):tr('MỖI VÒNG XOAY · MỘT BƯỚC TIẾN', "EVERY TURN COUNTS");root.querySelector('.label-b').textContent=i===5?tr('CUỘN TIẾP → CUBE CLUB', "KEEP SCROLLING → CUBE CLUB"):tr('CUỘN XUỐNG ĐỂ GIẢI', "SCROLL TO SOLVE");}
 const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));const span=()=>journey.offsetHeight-stage.offsetHeight;const top=()=>journey.getBoundingClientRect().top+window.scrollY-root.closest('body').querySelector('.site-nav').offsetHeight;
 function draw(p){const solve=clamp(p/.80)*turnCount,t=reduced?Math.floor(solve):solve;const state=timeline.sample(t);choose(Math.min(5,Math.floor(p/.80*5)));state.forEach((c,i)=>{const m=c.m;const css=[m[0],m[3],m[6],0,m[1],m[4],m[7],0,m[2],m[5],m[8],0,0,0,0,1].map(v=>Math.abs(v)<1e-9?0:v).join(',');elements[i].style.transform=`translate3d(${76+c.p[0]*60}px,${76+c.p[1]*60}px,${c.p[2]*60}px) matrix3d(${css})`});const victory=clamp((p-.80)/.12);cube.style.transform=`rotateX(${-23+(reduced?0:Math.sin(p*7)*9)}deg) rotateY(${-33+(reduced?0:p*75+victory*360)}deg)`;const exit=clamp((p-.94)/.06);scene.style.transform=`translateY(${-9-exit*110}px) scale(calc(var(--journey-cube-scale, 1) * ${1-exit*.5}))`;scene.style.opacity=String(1-exit*.7);root.querySelector('.disc').style.transform=`rotate(${p*160}deg) scale(${1-exit*.4})`;root.querySelector('.scroll-track div').style.width=`${p*100}%`;netRender(Math.min(turnCount,Math.floor(t)));}
 function frame(){current=reduced?target:current+(target-current)*.14;if(Math.abs(target-current)<.0001)current=target;draw(current);raf=current!==target?requestAnimationFrame(frame):0}
 function queueFrame() { if (!raf) raf = requestAnimationFrame(frame); }
 function update() {
   target = clamp((window.scrollY - top()) / Math.max(1, span()));
   queueFrame();
 }
 view.addEventListener('scroll', update, { passive: true });
 const stageObserver = new ResizeObserver(() => {
   stage.style.setProperty('--story-stage-height', `${stage.offsetHeight}px`);
   update();
 });
 stageObserver.observe(stage);
 function goToChapter(chapter) {
   view.scrollTo({ top: top() + span() * chapterProgress[chapter], behavior: reduced || mobileJourney.matches ? 'instant' : 'smooth' });
 }
 root.querySelectorAll('[data-chapter]').forEach(button => button.addEventListener('click', () => goToChapter(Number(button.dataset.chapter))));
 root.querySelector('[data-end]').addEventListener('click', () => {
   root.querySelector('.brand-gallery').scrollIntoView({ behavior: reduced ? 'instant' : 'smooth' });
 });
 function motionState(){root.classList.toggle('reduced',reduced);motion.setAttribute('aria-pressed',String(reduced));motion.textContent=reduced?tr('Bật chuyển động', "Enable motion"):tr('Giảm chuyển động', "Reduce motion");update()};motion.addEventListener('click',()=>{reduced=!reduced;motionState()});const mediaChange=e=>{reduced=e.matches;motionState()};media.addEventListener('change',mediaChange);
 const orbital=root.querySelector('.orbital'), orbitScene=root.querySelector('.orbit-scene');
 const picker=root.querySelector('.orbit-picker');
 const modelList=root.querySelector('.model-list'), modelLabel=root.querySelector('.model-label');
 const brandName=root.querySelector('.brand-name');
 const total=featuredBrands.length;
 let index=0, gesture=null, suppressUntil=0, popTimer=0;

 const cards=featuredBrands.map((brand, i)=>{
   picker.add(new Option(brand.name, String(i)));

   const card=document.createElement('button');
   card.className='brand-card cursor-interaction';
   card.style.setProperty('--brand-bg',brand.bg);
   card.setAttribute('aria-label',`${tr("Chọn", "Select")} ${brand.name}`);
   card.addEventListener('click',()=>select(i));

   const surface=document.createElement('span');
   surface.className='brand-surface';
   const art=document.createElement('span');
   art.className='brand-art';
   const logo=document.createElement('img');
   logo.src=import.meta.env.BASE_URL+brand.logo;
   logo.alt='';
   logo.decoding='async';
   logo.addEventListener('error',()=>art.hidden=true,{once:true});
   art.append(logo);

   const copy=document.createElement('span');
   copy.className='brand-copy';
   if(brand.tag){
     const tag=document.createElement('small');
     tag.textContent=brand.tag;
     copy.append(tag);
   }
   const name=document.createElement('strong');
   name.textContent=brand.name;
   copy.append(name);
   surface.append(art,copy);
   card.append(surface);
   orbitScene.append(card);
   return card;
 });
 picker.addEventListener('change',()=>select(Number(picker.value)));

 function renderOrbit(){
   const width = orbital.clientWidth;
   const spacing = mobileJourney.matches ? clamp(width * .35, 96, 155) : width < 600 ? 175 : 265;
   cards.forEach((card,i)=>{
     let distance=(i-index+total)%total;
     if(distance>total/2)distance-=total;
     const offset=clamp(distance,-2,2);
     const depth=Math.abs(offset), active=depth===0;
     card.classList.toggle('active',active);
     card.setAttribute('aria-pressed',String(active));
     card.inert=depth>1;
     card.style.transform=`translateX(${offset*spacing}px) translateY(${active?-2:24}px) translateZ(${active?85:-depth*145}px) rotateY(${-offset*23}deg) rotateZ(${active?-3:offset*7}deg) scale(${active?1.05:.85})`;
     card.style.opacity=active?'1':depth===1?'.57':'0';
     card.style.zIndex=String(10-depth);
   });
   const brand=featuredBrands[index];
   picker.value=String(index);
   orbital.style.backgroundColor=brand.stage;
   brandName.textContent=brand.name;
   modelLabel.hidden=!brand.models.length;
   modelList.replaceChildren();
   brand.models.forEach(([id, name],i)=>{
     const link=document.createElement('a');
     link.href='#/cube/'+id;
     const label=document.createElement('small');
     label.textContent=`${tr("MẪU 0", "MODEL 0")}${i+1}`;
     const title=document.createElement('strong');
     title.textContent=name+' ↗';
     link.append(label,title);
     modelList.append(link);
   });
   const shop=document.createElement('a');
   shop.href='#/catalog?brand='+encodeURIComponent(brand.id);
   shop.textContent=tr('Xem hãng trong Thư viện Rubik ↗', "View this brand in Cube Library ↗");
   modelList.append(shop);
 }
 function burst(){if(reduced)return;orbital.querySelectorAll('.orbit-particle').forEach(p=>p.remove());for(let i=0;i<12;i++){const p=document.createElement('i'),a=i/12*Math.PI*2;p.className='orbit-particle';p.setAttribute('aria-hidden','true');for(const[k,v]of Object.entries({sx:Math.cos(a)*110+'px',sy:Math.sin(a)*110+'px',x:Math.cos(a)*220+'px',y:Math.sin(a)*200+'px',r:i*77+'deg',color:['#fc7957','#9c7ef4','#e9f76b','#a6dba1'][i%4]}))p.style.setProperty('--'+k,v);orbital.append(p);p.addEventListener('animationend',()=>p.remove(),{once:true})}}
 function select(n){n=(n+total)%total;if(n===index)return;clearTimeout(popTimer);cards.forEach(c=>c.classList.remove('pop'));index=n;renderOrbit();burst();void cards[index].offsetWidth;cards[index].classList.add('pop');popTimer=setTimeout(()=>cards[index].classList.remove('pop'),850)}
 root.querySelector('.orbit-prev').addEventListener('click',()=>select(index-1));root.querySelector('.orbit-next').addEventListener('click',()=>select(index+1));root.querySelector('.brand-gallery').addEventListener('keydown',e=>{if(e.target!==picker&&(e.key==='ArrowLeft'||e.key==='ArrowRight')){e.preventDefault();select(index+(e.key==='ArrowRight'?1:-1));cards[index].focus({preventScroll:true})}});
 orbital.addEventListener('pointerdown', event => {
   if (event.button === 0) gesture = { x: event.clientX, y: event.clientY, id: event.pointerId };
 });
 orbital.addEventListener('pointerup', event => {
   if (gesture?.id !== event.pointerId) return;
   const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
   gesture = null;
   if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
     suppressUntil = performance.now() + 400;
     select(index + (dx < 0 ? 1 : -1));
   } else if (event.pointerType === 'touch' && Math.hypot(dx, dy) < 10) {
     const tapped = cards.indexOf(event.target.closest('.brand-card'));
     if (tapped < 0 || cards[tapped].inert || tapped === index) return;
     suppressUntil = performance.now() + 400;
     select(tapped);
   }
 });
 orbital.addEventListener('click', event => {
   if (performance.now() < suppressUntil && event.detail !== 0) {
     event.preventDefault();
     event.stopPropagation();
   }
 }, true);
 orbital.addEventListener('pointercancel', () => { gesture = null; });
 orbital.addEventListener('pointerleave', () => { gesture = null; });
 const orbitObserver=new ResizeObserver(renderOrbit);orbitObserver.observe(orbital);
 draw(0);motionState();renderOrbit();
return()=>{view.removeEventListener('scroll',update);media.removeEventListener('change',mediaChange);stageObserver.disconnect();orbitObserver.disconnect();cancelAnimationFrame(raf);clearTimeout(popTimer)};
}
