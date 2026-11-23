'use strict';
const stage=document.querySelector('#stage'),deck=document.querySelector('#deck');
const items=window.ARCHIVE.items.slice().sort((a,b)=>a.day-b.day),cards=[];
let active=0;
const pad=n=>String(n).padStart(2,'0');
function node(tag,cls,text){const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;}
items.forEach((item,index)=>{
 const card=node('article','specimen');card.tabIndex=0;card.setAttribute('role','button');card.setAttribute('aria-label',`${item.day}일차 소재 표본 펼치기`);
 card.append(node('div','hole'));
 const top=node('div','card-top');top.append(node('span','','Stories Left with Us'));card.append(top);
 const title=node('div','card-title');const heading=node('div','day-heading');heading.append(node('h2','',`DAY ${pad(item.day)}`),node('span','card-date',item.date||''));title.append(heading);card.append(title);
 const dl=node('dl');[['BRAND',item.brand],['COLOR',item.color],['MATERIAL',item.material]].forEach(([k,v])=>{const row=node('div');row.append(node('dt','',k),node('dd','',v||'—'));dl.append(row);});const content=node('div','card-content');content.setAttribute('role','region');content.setAttribute('aria-label',`${item.day}일차 상세 기록`);content.append(dl);card.append(content);
 const photo=node('figure','swatch'),img=node('img');img.src=item.image;img.alt=`${item.day}일차 옷 또는 패션 아이템의 표면`;img.draggable=false;img.decoding="async";img.loading=index<3?"eager":"lazy";photo.append(img,node('i','staple'),node('i','staple'));content.append(photo,node('p','card-note',item.note||''));
 deck.append(card);cards.push(card);
});
// Quiet browsing: hover opens the stack; wheel, keys and swipe turn one page.
const ring=document.querySelector('#ring'),ringBack=document.querySelector('#ring-back');
const counter=node('button','archive-counter');counter.type='button';counter.id='archive-counter';
counter.setAttribute('aria-haspopup','dialog');counter.setAttribute('aria-controls','archive-menu');
counter.title='날짜 목록 열기 · 종이 아래 모서리를 눌러 넘기기';
stage.append(counter);
const menu=node('dialog','archive-menu');menu.id='archive-menu';menu.setAttribute('aria-label','날짜별 아카이브');
const closeButton=node('button','archive-close','×');closeButton.type='button';closeButton.setAttribute('aria-label','날짜 목록 닫기');
const grid=node('div','archive-grid');menu.append(closeButton,grid);document.body.append(menu);
const choices=items.map((item,index)=>{
 const button=node('button','archive-choice');button.type='button';button.setAttribute('aria-label',`${item.day}일차 보기`);
 const img=node('img');img.src=item.image;img.alt='';img.loading='lazy';img.decoding='async';
 button.append(img,node('span','',`${pad(item.day)} · ${item.date||''}`));button.addEventListener('click',()=>{choose(index);menu.close();counter.focus({preventScroll:true});});
 grid.append(button);return button;
});
let expanded=false,closeTimer=null,geometry=null,wheelSum=0,wheelConsumed=false,wheelTimer=null,touchStart=null;
let turnTimer=null,turning=false;
const corners=[];
cards.forEach((card,index)=>{
 const face=node('div','paper-face');face.append(...Array.from(card.children));card.append(face);
 const previous=node('button','page-corner page-corner--previous');previous.type='button';previous.setAttribute('aria-label','이전 카드로 넘기기');
 const next=node('button','page-corner page-corner--next');next.type='button';next.setAttribute('aria-label','다음 카드로 넘기기');
 const curlPrevious=node('span','page-curl page-curl--previous'),curlNext=node('span','page-curl page-curl--next');
 curlPrevious.setAttribute('aria-hidden','true');curlNext.setAttribute('aria-hidden','true');
 for(const [button,direction,cls] of [[previous,-1,'curl-previous'],[next,1,'curl-next']]){
  button.addEventListener('pointerenter',()=>{if(!button.disabled&&!turning)card.classList.add(cls);});
  button.addEventListener('pointerleave',()=>card.classList.remove(cls));
  button.addEventListener('focus',()=>{if(!button.disabled)card.classList.add(cls);});
  button.addEventListener('blur',()=>card.classList.remove(cls));
  button.addEventListener('click',e=>{e.stopPropagation();turnPage(direction);});
 }
 card.append(curlPrevious,curlNext,previous,next);corners.push({previous,next});
 card.tabIndex=index===active?0:-1;card.setAttribute('role','group');
 card.setAttribute('aria-label',`${items[index].day}일차 아카이브`);
 card.addEventListener('click',()=>{if(index!==active)choose(index);});
});
function choose(index){
 const next=Math.max(0,Math.min(items.length-1,index));if(next===active)return;
 clearTimeout(turnTimer);turnTimer=null;turning=false;
 cards.forEach(card=>card.classList.remove('page-leaving-next','page-leaving-previous','curl-next','curl-previous'));
 active=next;render();
}
function turnPage(direction){
 const next=active+direction;
 if(turning||next<0||next>=items.length)return;
 if(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches){choose(next);return;}
 turning=true;cards[active].classList.add(direction>0?'page-leaving-next':'page-leaving-previous');
 turnTimer=setTimeout(()=>{
  const focusedCorner=document.activeElement?.classList.contains('page-corner');
  choose(next);
  if(focusedCorner)cards[active].focus({preventScroll:true});
 },280);
}
function setExpanded(value){clearTimeout(closeTimer);if(expanded!==value){expanded=value;render();}}
function closeSoon(){clearTimeout(closeTimer);closeTimer=setTimeout(()=>{if(!menu.open)setExpanded(false);},240);}
function measure(){
 // Reserve enough space for every record at the existing text sizes.
 deck.style.height='';stage.style.minHeight='';
 let required=0;
 cards.forEach(card=>{
  card.hidden=false;
  const face=card.querySelector('.paper-face'),title=card.querySelector('.card-title');
  const content=card.querySelector('.card-content'),dl=content.querySelector('dl'),note=content.querySelector('.card-note');
  const faceStyle=getComputedStyle(face),titleStyle=getComputedStyle(title);
  const height=parseFloat(faceStyle.paddingTop)+parseFloat(faceStyle.paddingBottom)+
   card.querySelector('.card-top').offsetHeight+title.offsetHeight+
   parseFloat(titleStyle.marginTop)+parseFloat(titleStyle.marginBottom)+
   dl.offsetHeight+note.offsetHeight+120+28+2;
  required=Math.max(required,Math.ceil(height));
 });
 deck.style.height=Math.max(deck.offsetHeight,required)+'px';
 // Very short screens can show the complete sheet through ordinary page scrolling.
 document.body.classList.toggle('page-overflow',deck.offsetHeight+150>stage.clientHeight);
 stage.style.minHeight=(deck.offsetHeight+150)+'px';
 geometry={w:deck.offsetWidth,h:deck.offsetHeight,vw:stage.clientWidth,vh:stage.clientHeight};render();
}
function render(){
 if(!geometry)return;
 const {w,h,vw,vh}=geometry;
 const holeY=(vh-h)/2+3;
 deck.style.left=(vw/2-w/2)+'px';deck.style.top=(holeY-22)+'px';
 ring.style.left=(vw/2-32)+'px';ring.style.top=(holeY-80)+'px';
 ringBack.style.left=ring.style.left;ringBack.style.top=ring.style.top;
 counter.style.top=(holeY+h+2)+'px';
 counter.textContent=`${pad(items[active].day)} / ${pad(items.length)}`;
 counter.setAttribute('aria-label',`${items[active].day}일차, 전체 ${items.length}개. 날짜 목록 열기`);
 const count=Math.min(9,items.length),start=Math.min(Math.max(0,active-4),items.length-count);
 cards.forEach((card,index)=>{
  const shown=index>=start&&index<start+count,selected=index===active;
  const slot=index-start,offset=count===1?0:slot/(count-1)-.5;
  card.hidden=!shown;
  card.style.transform=`rotate(${selected?0:offset*(expanded?25:4)}deg)`;
  card.style.zIndex=String(selected?100:60-slot);
  card.classList.toggle('extracted',selected);card.tabIndex=selected?0:-1;
  card.setAttribute('aria-hidden',String(!selected));
  corners[index].previous.disabled=!selected||active===0;
  corners[index].next.disabled=!selected||active===items.length-1;
  corners[index].previous.tabIndex=selected&&active>0?0:-1;
  corners[index].next.tabIndex=selected&&active<items.length-1?0:-1;
  if(selected)choices[index].setAttribute('aria-current','true');else choices[index].removeAttribute('aria-current');
 });
}
function openMenu(){
 clearTimeout(closeTimer);menu.showModal();setExpanded(true);
 choices[active].focus({preventScroll:true});choices[active].scrollIntoView({block:'nearest'});
}
counter.addEventListener('click',openMenu);closeButton.addEventListener('click',()=>menu.close());
menu.addEventListener('click',e=>{if(e.target===menu){const r=menu.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)menu.close();}});
menu.addEventListener('close',()=>{counter.focus({preventScroll:true});closeSoon();});
for(const surface of [deck,ring,counter]){
 surface.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch')setExpanded(true);});
 surface.addEventListener('pointerleave',closeSoon);
 surface.addEventListener('focusin',()=>setExpanded(true));
 surface.addEventListener('focusout',closeSoon);
}
// A trackpad gesture advances once, regardless of momentum events.
stage.addEventListener('wheel',e=>{
 if(turning||menu.open||e.ctrlKey||document.body.classList.contains('page-overflow'))return;
 e.preventDefault();clearTimeout(wheelTimer);
 wheelTimer=setTimeout(()=>{wheelSum=0;wheelConsumed=false;},170);
 if(wheelConsumed)return;
 wheelSum+=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?geometry.vh:1);
 if(Math.abs(wheelSum)<30)return;
 choose(active+Math.sign(wheelSum));wheelConsumed=true;wheelSum=0;
},{passive:false});
window.addEventListener('keydown',e=>{
 if(menu.open||e.altKey||e.ctrlKey||e.metaKey||e.target?.closest?.('.card-content'))return;
 let next;
 if(e.key==='ArrowRight'||e.key==='ArrowDown'||e.key==='PageDown')next=active+1;
 else if(e.key==='ArrowLeft'||e.key==='ArrowUp'||e.key==='PageUp')next=active-1;
 else if(e.key==='Home')next=0;else if(e.key==='End')next=items.length-1;
 else if(e.key==='Escape'){setExpanded(false);return;}else return;
 e.preventDefault();choose(next);
});
deck.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'&&!document.body.classList.contains('page-overflow')&&!e.target?.closest?.('.page-corner')){touchStart={x:e.clientX,y:e.clientY};setExpanded(true);deck.setPointerCapture?.(e.pointerId);}});
deck.addEventListener('pointerup',e=>{
 if(!touchStart)return;
 const dx=e.clientX-touchStart.x,dy=e.clientY-touchStart.y;touchStart=null;
 if(Math.max(Math.abs(dx),Math.abs(dy))>45)choose(active+(Math.abs(dx)>Math.abs(dy)?-Math.sign(dx):-Math.sign(dy)));
 closeSoon();
});
deck.addEventListener('pointercancel',()=>{touchStart=null;closeSoon();});
window.addEventListener('resize',measure);
window.addEventListener('blur',()=>{clearTimeout(wheelTimer);wheelConsumed=false;wheelSum=0;setExpanded(false);});
measure();
document.fonts?.ready.then(measure);
