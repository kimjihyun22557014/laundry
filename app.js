'use strict';
const $ = selector => document.querySelector(selector);
const archive = window.ARCHIVE;
const items = archive.items;
const symbols = [
 {id:'color',label:'컬러 강조',path:'<circle cx="12" cy="12" r="8"/><path d="M12 4v16M4 12h16M6.3 6.3l11.4 11.4"/>'},
 {id:'scent',label:'향기 보유',path:'<path d="M8 9h8l2 12H6L8 9zM10 5h4v4h-4zM12 2v2M17 5l3-2M18 8h4"/>'},
 {id:'easy',label:'생각 금지',path:'<path d="M7 16c-5-7 0-14 6-13s9 8 4 12l-2 2v4H9v-4zM3 3l18 18"/>'},
 {id:'worn',label:'낡음 주의',path:'<path d="M12 3L2 21h20L12 3zM12 9v5M12 17v1"/>'},
 {id:'warm',label:'보온 강화',path:'<path d="M7 21c-5-6 4-6 0-12M12 21c-5-6 4-6 0-12M17 21c-5-6 4-6 0-12M12 2v5M9.5 4.5h5"/>'}
];
let selected = 0, filter = '', mode = 'stack';
const pad = n => String(n).padStart(2,'0');
const filtered = () => items.filter(item => !filter || (item.tags || []).includes(filter));
const current = () => filtered()[selected];
$('h1').replaceChildren(document.createTextNode(archive.title.split(',')[0]+','),document.createElement('br'),document.createTextNode(archive.title.split(',').slice(1).join(',').trim()),Object.assign(document.createElement('span'),{textContent:'.'}));
$('#subtitle').textContent=archive.subtitle;
document.title=archive.title+' — Wardrobe Archive';
function createIndex(){
 $('#index').replaceChildren();
 items.forEach(item=>{
  const b=document.createElement('button'); b.textContent='DAY '+pad(item.day); b.setAttribute('aria-label',`${item.day}일차 표본 보기`);
  b.addEventListener('click',()=>{filter='';selected=items.indexOf(item);mode='stack';render();});
  b.setAttribute('aria-current',String(current()===item)); $('#index').append(b);
 });
}
function renderCard(){
 const item=current();
 $('#stack').hidden=mode!=='stack'||!item; $('#paging').hidden=mode!=='stack'||!item;
 if(!item)return;
 $('#card-id').textContent=pad(item.day)+'. / '+pad(items.length);
 $('#card-title').textContent=`DAY ${pad(item.day)}`;
 $('#card-image').src=item.image; $('#card-image').alt=`${item.day}일차 옷 또는 패션 아이템의 소재 확대 사진`;
 $('#card-day').textContent=`DAILY SAMPLE / ${pad(item.day)}`;
 $('#metadata').replaceChildren();
 [['BRAND',item.brand],['COLOR',item.color],['MATERIAL',item.material]].forEach(([key,value])=>{
  const row=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');
  dt.textContent=key;dd.textContent=value||'—';row.append(dt,dd);$('#metadata').append(row);
 });
 $('#card-note').textContent=item.note||'';
 $('#card-tags').replaceChildren();
 symbols.filter(s=>(item.tags||[]).includes(s.id)).forEach(s=>{const tag=document.createElement('span');tag.textContent=s.label;$('#card-tags').append(tag);});
 $('#page-number').textContent=`${pad(selected+1)} / ${pad(filtered().length)}`;
 $('#prev').disabled=selected===0;$('#next').disabled=selected>=filtered().length-1;
 document.querySelectorAll('.back').forEach((back,n)=>{
  const behind=filtered()[(selected+n+1)%filtered().length];back.style.setProperty('--back-image',`url("${behind.image}")`);
 });
}
function renderGrid(){
 const grid=$('#grid');grid.hidden=mode!=='grid';grid.replaceChildren();
 if(mode!=='grid')return;
 const list=filtered();
 if(!list.length){const p=document.createElement('p');p.className='empty';p.textContent='이 기호로 분류된 표본이 아직 없습니다.';grid.append(p);return;}
 list.forEach((item,i)=>{
  const b=document.createElement('button');b.className='grid-card';
  const img=document.createElement('img');img.src=item.image;img.alt=`${item.day}일차 소재 사진`;img.loading='lazy';
  const label=document.createElement('span');label.textContent=`DAY ${pad(item.day)}`;
  b.append(img,label);b.addEventListener('click',()=>{selected=i;mode='stack';render();$('#zoom-open').focus();});grid.append(b);
 });
}
function render(){
 $('#count').textContent=`${pad(filtered().length)} COLLECTED SAMPLES`;
 $('#stack-view').setAttribute('aria-pressed',String(mode==='stack'));
 $('#grid-view').setAttribute('aria-pressed',String(mode==='grid'));
 $('#reset-filter').hidden=!filter;
 document.querySelectorAll('#filters button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===filter)));
 renderCard();renderGrid();createIndex();
 if(!filtered().length){mode='grid';$('#grid-view').setAttribute('aria-pressed','true');$('#stack-view').setAttribute('aria-pressed','false');renderGrid();}
}
function move(delta){const n=selected+delta;if(n<0||n>=filtered().length)return;selected=n;render();}
$('#prev').addEventListener('click',()=>move(-1));$('#next').addEventListener('click',()=>move(1));
$('#stack-view').addEventListener('click',()=>{mode='stack';render();});$('#grid-view').addEventListener('click',()=>{mode='grid';render();});
symbols.forEach(s=>{const b=document.createElement('button');b.dataset.filter=s.id;b.setAttribute('aria-pressed','false');b.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true">${s.path}</svg><span>${s.label}</span>`;b.addEventListener('click',()=>{filter=filter===s.id?'':s.id;selected=0;render();});$('#filters').append(b);});
$('#reset-filter').addEventListener('click',()=>{filter='';selected=0;render();});
$('#zoom-open').addEventListener('click',()=>{const item=current();$('#zoom-image').src=item.image;$('#zoom-image').alt=$('#card-image').alt;$('#zoom-caption').textContent=`DAY ${pad(item.day)} / ${item.brand||archive.owner}`;$('#zoom').showModal();});
$('#about-open').addEventListener('click',()=>$('#about').showModal());
document.querySelectorAll('dialog').forEach(dialog=>{dialog.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});});
document.addEventListener('keydown',e=>{if(document.querySelector('dialog[open]')||mode!=='stack'||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;if(e.key==='ArrowRight'){e.preventDefault();move(1);}if(e.key==='ArrowLeft'){e.preventDefault();move(-1);}});
let startX=0,startY=0;
$('#card').addEventListener('touchstart',e=>{startX=e.changedTouches[0].clientX;startY=e.changedTouches[0].clientY;},{passive:true});
$('#card').addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-startX,dy=e.changedTouches[0].clientY-startY;if(Math.abs(dx)>70&&Math.abs(dx)>Math.abs(dy)*1.5)move(dx<0?1:-1);},{passive:true});
render();
