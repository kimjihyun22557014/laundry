'use strict';
const stage=document.querySelector('#stage'),deck=document.querySelector('#deck');
const items=window.ARCHIVE.items,cards=[];
let active=0;
const pad=n=>String(n).padStart(2,'0');
function node(tag,cls,text){const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;}
items.forEach((item,index)=>{
 const card=node('article','specimen');card.tabIndex=0;card.setAttribute('role','button');card.setAttribute('aria-label',`${item.day}일차 소재 표본 펼치기`);
 card.append(node('div','hole'));
 const top=node('div','card-top');top.append(node('span','','WARDROBE ARCHIVE'),node('span','',pad(item.day)+'.'));card.append(top);
 const title=node('div','card-title');title.append(node('p','','MATERIAL / DAILY RECORD'),node('h2','',`DAY ${pad(item.day)}`));card.append(title);
 const cross=node('div','crossline');cross.setAttribute('aria-hidden','true');cross.append(node('span','','+'),node('span','','+'));card.append(cross);
 const dl=node('dl');[['BRAND',item.brand],['COLOR',item.color],['MATERIAL',item.material]].forEach(([k,v])=>{const row=node('div');row.append(node('dt','',k),node('dd','',v||'—'));dl.append(row);});card.append(dl);
 const photo=node('figure','swatch'),img=node('img');img.src=item.image;img.alt=`${item.day}일차 옷 또는 패션 아이템의 표면`;img.draggable=false;photo.append(img,node('i','staple'),node('i','staple'));card.append(photo,node('p','card-note',item.note||''));
 const foot=node('div','card-foot');foot.append(node('span','',`DAILY SAMPLE / ${pad(item.day)}`),node('span','','COLLECTED, NOT FORGOTTEN.'));card.append(foot);
 deck.append(card);cards.push(card);
});
// Browsing changes only through the fixed index, wheel or keyboard.
const ring=document.querySelector('#ring');
const ringBack=document.querySelector('#ring-back');
const indexBar=node('nav','sample-index');
indexBar.setAttribute('role','tablist');indexBar.setAttribute('aria-label','날짜순 아카이브');
stage.append(indexBar);
let hoverTimer=null,dragging=false,dragPointer=null,previousAngle=null,dragTravel=0;
let play=0,dragDirection=1,renderFrame=0,geometry=null,wheelTotal=0,wheelLockUntil=0;
const tabs=items.map((item,index)=>{
 const tab=node('button','sample-tab',pad(item.day));tab.type='button';tab.id=`sample-tab-${index}`;
 tab.setAttribute('role','tab');tab.setAttribute('aria-label',`${item.day}일차 보기`);
 tab.setAttribute('aria-controls',`sample-${index}`);
 tab.addEventListener('pointerenter',e=>{if(e.pointerType==='touch'||dragging)return;clearTimeout(hoverTimer);hoverTimer=setTimeout(()=>choose(index),140);});
 tab.addEventListener('pointerleave',()=>clearTimeout(hoverTimer));
 tab.addEventListener('click',()=>choose(index));
 tab.addEventListener('focus',()=>{if(!dragging)choose(index);});
 indexBar.append(tab);return tab;
});
cards.forEach((card,index)=>{
 card.id=`sample-${index}`;card.tabIndex=-1;card.setAttribute('role','tabpanel');
 card.setAttribute('aria-labelledby',`sample-tab-${index}`);
});
ring.removeAttribute('aria-hidden');ring.setAttribute('role','button');ring.tabIndex=0;
ring.setAttribute('aria-label','링을 누른 채 원을 그리면 종이가 펼쳐집니다');
function measure(){
 geometry={w:deck.offsetWidth,h:deck.offsetHeight,vw:stage.clientWidth,vh:stage.clientHeight};
 render();
}
function choose(index){
 clearTimeout(hoverTimer);
 if(dragging)endDrag();
 active=Math.max(0,Math.min(items.length-1,index));play=0;
 render();
}
function render(){
 if(!geometry)return;
 const {w,h,vw,vh}=geometry;
 const normalY=(vh-h)/2+4;
 const pivotY=normalY;
 const fullScale=Math.min(1,Math.min(vw/2-32,normalY-32,vh-normalY-32)/Math.hypot(w/2,h-22));
 const scale=1+(fullScale-1)*play;
 deck.style.left=(vw/2-w/2)+'px';deck.style.top=(pivotY-22)+'px';
 deck.style.transform=`scale(${scale})`;deck.style.transformOrigin='50% 22px';
 ring.style.left=(vw/2-32)+'px';ring.style.top=(pivotY-80)+'px';
 ring.style.transform='none';ringBack.style.left=ring.style.left;ringBack.style.top=ring.style.top;
 indexBar.style.top=(normalY+h+1)+'px';
 cards.forEach((card,index)=>{
  const picked=index===active;
  const resting=picked?0:(index-(items.length-1)/2)*1.5;
  const fan=index*360/items.length*dragDirection;
  // Separate paper angles expand around the shared hole. No free spin.
  const angle=resting*(1-play)+fan*play;
  card.style.transform=`rotate(${angle}deg)`;
  card.style.zIndex=String(play>.01?60-index:picked?100:60-index);
  card.classList.toggle('extracted',picked&&play===0);
  card.setAttribute('aria-hidden',String(!picked));
  tabs[index].setAttribute('aria-selected',String(picked));tabs[index].tabIndex=picked?0:-1;
 });
 stage.classList.toggle('playing',dragging||play>0);
}
function queueRender(){if(!renderFrame)renderFrame=requestAnimationFrame(()=>{renderFrame=0;render();});}
function ringAngle(x,y){return Math.atan2(y-((geometry.vh-geometry.h)/2+4),x-geometry.vw/2);}
ring.addEventListener('pointerdown',e=>{
 if(e.button!==undefined&&e.button!==0)return;
 e.preventDefault();clearTimeout(hoverTimer);
 dragging=true;dragPointer=e.pointerId;dragTravel=0;play=0;previousAngle=null;
 // Capture keeps the deliberate drag active outside the small ring.
 ring.setPointerCapture?.(e.pointerId);stage.classList.add('dragging');
 render();
});
ring.addEventListener('pointermove',e=>{
 if(!dragging||e.pointerId!==dragPointer)return;
 const {vw,vh}=geometry;
 if(Math.hypot(e.clientX-vw/2,e.clientY-((vh-geometry.h)/2+4))<22)return;
 const angle=ringAngle(e.clientX,e.clientY);
 if(previousAngle!==null){
  let delta=angle-previousAngle;
  if(delta>Math.PI)delta-=2*Math.PI;if(delta<-Math.PI)delta+=2*Math.PI;
  if(Math.abs(delta)<.55){
   if(Math.abs(dragTravel)<.05&&Math.abs(delta)>.001)dragDirection=Math.sign(delta);
   dragTravel=Math.max(0,Math.min(2*Math.PI,dragTravel+delta*dragDirection));
   play=dragTravel/(2*Math.PI);queueRender();
  }
 }
 previousAngle=angle;
});
function endDrag(){
 if(!dragging&&play===0)return;
 const pointer=dragPointer;dragging=false;dragPointer=null;previousAngle=null;play=0;
 stage.classList.remove('dragging');
 if(pointer!==null&&ring.hasPointerCapture?.(pointer))ring.releasePointerCapture(pointer);
 render();
}
ring.addEventListener('pointerup',endDrag);ring.addEventListener('pointercancel',endDrag);ring.addEventListener('lostpointercapture',endDrag);
ring.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();play=play?0:1;render();}});
stage.addEventListener('wheel',e=>{
 if(dragging||e.ctrlKey||e.target?.closest?.('.card-note'))return;
 e.preventDefault();
 const now=performance.now();if(now<wheelLockUntil)return;
 wheelTotal+=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?geometry.vh:1);
 if(Math.abs(wheelTotal)<35)return;
 const next=active+Math.sign(wheelTotal);wheelTotal=0;wheelLockUntil=now+420;choose(next);
},{passive:false});
window.addEventListener('keydown',e=>{
 if(e.target===ring)return;
 let next;
 if(e.key==='ArrowRight'||e.key==='ArrowDown')next=active+1;
 else if(e.key==='ArrowLeft'||e.key==='ArrowUp')next=active-1;
 else if(e.key==='Home')next=0;else if(e.key==='End')next=items.length-1;
 else if(e.key==='Escape'){endDrag();return;}else return;
 e.preventDefault();choose(next);tabs[active].focus({preventScroll:true});
});
window.addEventListener('blur',()=>{clearTimeout(hoverTimer);endDrag();});
window.addEventListener('resize',measure);
measure();
