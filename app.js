'use strict';
const stage=document.querySelector('#stage'),deck=document.querySelector('#deck');
const items=window.ARCHIVE.items,cards=[];
let active=0,hovered=-1,near=false,lastAngle=null,travel=0,touching=false;
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
 card.addEventListener('pointerenter',e=>{if(e.pointerType==='touch')return;hovered=index;near=true;layout();});
 card.addEventListener('pointerleave',()=>{if(hovered===index){hovered=-1;layout();}});
 card.addEventListener('focus',()=>{near=true;active=index;hovered=index;layout();});
 card.addEventListener('click',()=>{active=index;hovered=index;layout();});
 deck.append(card);cards.push(card);
});
function distance(index){let d=(index-active+items.length)%items.length;if(d>items.length/2)d-=items.length;return d;}
function layout(){
 cards.forEach((card,index)=>{
  const d=distance(index),picked=near&&hovered===index;
  const angle=d*(near?11.5:1.35)+(near?0:-4);
  const shift=picked?27:near?Math.abs(d)*2:Math.abs(d)*1.1;
  card.style.transform=`rotate(${angle}deg) translateY(${shift}px) rotateX(${picked?-3:0}deg)`;
  card.style.zIndex=String(picked?100:60-Math.abs(d)*2+(d<0?0:1));
  card.classList.toggle('extracted',picked);card.setAttribute('aria-pressed',String(index===active));
 });
}
function pivot(){const r=deck.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+22,width:r.width,height:r.height};}
function pointer(x,y){
 const p=pivot(),dx=x-p.x,dy=y-p.y,r=Math.hypot(dx,dy);
 const within=r<Math.max(p.height+50,p.width*1.4)&&r>18;
 if(near!==within){near=within;if(!near)hovered=-1;layout();}
 if(!within||r<75){lastAngle=null;travel=0;return;}
 const angle=Math.atan2(dy,dx);
 if(lastAngle!==null){
  let delta=angle-lastAngle;if(delta>Math.PI)delta-=Math.PI*2;if(delta<-Math.PI)delta+=Math.PI*2;
  if(Math.abs(delta)<.8)travel+=delta;
  const step=.31;
  if(Math.abs(travel)>=step){const turns=Math.trunc(travel/step);active=(active+turns%items.length+items.length)%items.length;travel-=turns*step;hovered=-1;stage.classList.add('turning');layout();}
 }
 lastAngle=angle;
}
stage.addEventListener('pointermove',e=>{if(e.pointerType==='touch'&&!touching)return;pointer(e.clientX,e.clientY);});
stage.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'){touching=true;lastAngle=null;near=true;pointer(e.clientX,e.clientY);layout();}});
stage.addEventListener('pointerup',()=>{touching=false;lastAngle=null;});
function collapse(){near=false;hovered=-1;lastAngle=null;travel=0;stage.classList.remove('turning');layout();}
stage.addEventListener('pointerleave',collapse);window.addEventListener('blur',collapse);
window.addEventListener('keydown',e=>{
 if(!['ArrowRight','ArrowLeft','Escape','Enter',' '].includes(e.key))return;e.preventDefault();
 if(e.key==='Escape'){document.activeElement?.blur();collapse();return;}
 if(e.key==='Enter'||e.key===' '){near=!near;hovered=near?active:-1;}
 else{active=(active+(e.key==='ArrowRight'?1:-1)+items.length)%items.length;near=true;hovered=active;}
 layout();
});
layout();
