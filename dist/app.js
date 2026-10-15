import * as THREE from './vendor/three.module.js';
import {vertexShader,fragmentShader,particleVertex,particleFragment} from './shaders.js';

const icons = [
 '<path d="M25 4c2 9 12 13 12 25a13 13 0 0 1-26 0c0-6 3-11 7-16l1 10c6-5 7-11 6-19Z"/><path d="m9 43 32 8M41 43 9 51"/>',
 '<circle cx="25" cy="25" r="10"/><path d="M25 3v6m0 32v6M3 25h6m32 0h6M9.4 9.4l4.2 4.2m22.8 22.8 4.2 4.2m0-31.2-4.2 4.2M13.6 36.4l-4.2 4.2"/>',
 '<path d="M3 16h29c8 0 8-12 1-12-4 0-6 3-6 5M3 27h39c10 0 10 14 1 14-4 0-6-3-6-6M3 38h20c7 0 7 11 0 11-3 0-5-2-5-4"/>',
 '<g transform="translate(25 25)"><path id="petal" d="M0-7C-7-14-3-21 0-24c3 3 7 10 0 17Z"/><use href="#petal" transform="rotate(51.43)"/><use href="#petal" transform="rotate(102.86)"/><use href="#petal" transform="rotate(154.29)"/><use href="#petal" transform="rotate(205.71)"/><use href="#petal" transform="rotate(257.14)"/><use href="#petal" transform="rotate(308.57)"/></g>'
];
const elements = [
 {name:'Ember',subtitle:'FIRE · COURAGE'},
 {name:'Solar',subtitle:'SUN · VITALITY'},
 {name:'Breeze',subtitle:'AIR · CLARITY'},
 {name:'Bloom',subtitle:'HEART · WARMTH'}
];
const root=document.querySelector('#experience');
const container=document.querySelector('#buttons');
const pagination=document.querySelector('#pagination');
let selected=0,targetPhase=0,phase=0,hovered=-1,keyboardFocused=-1;
let width=innerWidth,height=innerHeight,scale=1,spacing=255;
let lastTime=performance.now(),time=0,suppressClick=false;
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const energies=[0,0,0,0],pulses=[0,0,0,0];
const centers=Array.from({length:4},()=>new THREE.Vector2());
const visibility=[1,1,0,1];
const buttons=elements.map((element,i)=>{
 const button=document.createElement('button');
 button.className='element';
 button.setAttribute('aria-label',`${element.name} — ${element.subtitle.toLowerCase()}`);
 button.innerHTML=`<span class="number">0${i+1}</span><svg class="icon" viewBox="0 0 50 55" aria-hidden="true">${icons[i]}</svg><span class="name">${element.name}</span><span class="subtitle">${element.subtitle}</span>`;
 button.addEventListener('pointerenter',event=>{if(event.pointerType!=='touch')hovered=i;});
 button.addEventListener('pointerleave',()=>{hovered=-1;});
 button.addEventListener('focus',()=>{keyboardFocused=i;});
 button.addEventListener('blur',()=>{keyboardFocused=-1;});
 button.addEventListener('click',()=>{if(!suppressClick)select(i);});
 container.append(button);
 const dot=document.createElement('button');
 dot.textContent=`0${i+1}`;dot.setAttribute('aria-label',element.name);
 dot.addEventListener('click',()=>select(i));pagination.append(dot);
 return button;
});
function select(index){
 const next=(index+4)%4;
 let diff=((next-selected+6)%4)-2;
 if(diff===-2)diff=2;
 targetPhase+=diff;selected=next;hovered=-1;keyboardFocused=-1;pulses[next]=1;
 buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===selected)));
 [...pagination.children].forEach((b,i)=>b.setAttribute('aria-current',String(i===selected)));
}
select(0);
document.querySelector('#previous').addEventListener('click',()=>select(selected-1));
document.querySelector('#next').addEventListener('click',()=>select(selected+1));
window.addEventListener('keydown',event=>{
 if(event.key==='ArrowRight'||event.key==='ArrowLeft'){
  event.preventDefault();select(selected+(event.key==='ArrowRight'?1:-1));
 }
});
let touchStart=null;
root.addEventListener('pointerdown',event=>{suppressClick=false;if(event.pointerType==='touch')touchStart={x:event.clientX,y:event.clientY};});
root.addEventListener('pointerup',event=>{
 if(!touchStart)return;
 const dx=event.clientX-touchStart.x,dy=event.clientY-touchStart.y;
 touchStart=null;
 if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)){suppressClick=true;select(selected+(dx<0?1:-1));}
});
root.addEventListener('pointercancel',()=>{touchStart=null;});
if(matchMedia('(pointer: coarse)').matches)document.querySelector('#instruction').textContent='TAP TO AWAKEN · SWIPE TO EXPLORE';

const uniforms={
 uResolution:{value:new THREE.Vector2(width,height)},uScale:{value:scale},uTime:{value:0},
 uCenters:{value:centers},uEnergy:{value:energies},uVisibility:{value:visibility},uPulse:{value:pulses},uDpr:{value:1}
};
let renderer;
try{
 renderer=new THREE.WebGLRenderer({canvas:document.querySelector('#webgl'),antialias:false,alpha:false,powerPreference:'high-performance'});
}catch(error){
 document.querySelector('#fallback').hidden=false;
 console.error('WebGL initialization failed:',error);
}
if(renderer){
 renderer.setClearColor(0x050505);
 const scene=new THREE.Scene();
 const camera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
 const backdrop=new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.ShaderMaterial({uniforms,vertexShader,fragmentShader,depthTest:false,depthWrite:false}));
 scene.add(backdrop);
 const count=880;
 const seeds=new Float32Array(count*4);
 for(let i=0;i<count;i++)seeds.set([Math.random(),Math.random(),Math.random(),i%4],i*4);
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(count*3),3));
 geometry.setAttribute('aSeed',new THREE.BufferAttribute(seeds,4));
 const particles=new THREE.Points(geometry,new THREE.ShaderMaterial({uniforms,vertexShader:particleVertex,fragmentShader:particleFragment,transparent:true,blending:THREE.AdditiveBlending,depthTest:false,depthWrite:false}));
 particles.frustumCulled=false;particles.renderOrder=1;scene.add(particles);
 function resize(){
  width=root.clientWidth;height=root.clientHeight;
  scale=Math.min(width/(width<650?530:800),height/640,1.55);
  spacing=width<650?190:255;
  const dpr=Math.min(devicePixelRatio,1.75);
  renderer.setPixelRatio(dpr);renderer.setSize(width,height,false);
  uniforms.uResolution.value.set(width,height);uniforms.uScale.value=scale;uniforms.uDpr.value=dpr;
 }
 window.addEventListener('resize',resize);resize();
 function animate(now){
  const dt=Math.min((now-lastTime)/1000,.05);lastTime=now;
  time+=dt*(reducedMotion?.12:1);
  uniforms.uTime.value=time;
  phase+=(targetPhase-phase)*(reducedMotion?1:1-Math.exp(-dt*7.5));
  const active=hovered>=0?hovered:keyboardFocused>=0?keyboardFocused:selected;
  const centerY=height*.48;
  for(let i=0;i<4;i++){
   const offset=THREE.MathUtils.euclideanModulo(i-phase+2,4)-2;
   const distance=Math.abs(offset);
   const visible=1-THREE.MathUtils.smoothstep(distance,1.04,1.75);
   centers[i].set(offset*spacing,(height*.5-centerY)/scale);
   visibility[i]=visible;
   energies[i]+=((i===active?1:0)-energies[i])*(1-Math.exp(-dt*(i===active?5.5:3.8)));
   pulses[i]=Math.max(0,pulses[i]-dt*1.5);
   const button=buttons[i];
   button.style.transform=`translate3d(${offset*spacing*scale-64}px,${centerY-height*.5-105}px,0) scale(${scale})`;
   // Translation uses the unscaled button center; scale is applied about that center.
   button.style.opacity=visible*(.62+energies[i]*.38);
   button.style.pointerEvents=visible>.5?'auto':'none';
   button.tabIndex=visible>.5?0:-1;
   button.style.zIndex=String(10-Math.round(distance*2));
  }
  renderer.render(scene,camera);
 }
 renderer.setAnimationLoop(animate);
 document.addEventListener('visibilitychange',()=>{lastTime=performance.now();});
}
