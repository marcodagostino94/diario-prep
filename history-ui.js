import {dashboardIcon} from './dashboard.js?v=1.16.5';
export function coveragePresentation(at,now=Date.now()){
 const pending=now<at,minutes=Math.max(1,Math.ceil((at-now)/60000));
 const clock=new Date(at).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'});
 return {pending,src:`./assets/status/${pending?'blue':'green'}.png`,label:pending?`Inizio protezione prevista tra ${minutes} ${minutes===1?'minuto':'minuti'}`:`Protezione iniziata alle ${clock}`};
}
export function historySymbol(e,now=Date.now()){
 if(e.type==='coverage'){
  const state=coveragePresentation(e.at,now);
  return `<span class="history-shield" data-coverage-icon="${e.at}"><img src="${state.src}" alt="" aria-hidden="true"></span>`;
 }
 let symbol,tone,count=1;
 if(e.type==='dose'){symbol='capsule';tone='dose';count=e.count===2?2:1;}
 else if(e.type==='planned'){symbol='capsule';tone='planned';}
 else if(e.type==='sex'){symbol='heart';tone='sex';}
 else if(e.type==='box'||e.type==='boxClose'){symbol='bottle';tone='bottle';}
 else if(e.type==='health'){
  symbol=e.category==='analysis'||e.category==='vaccine'?'syringe':e.category==='visit'?'stethoscope':'flask';
  tone=symbol==='syringe'?'analysis':symbol==='stethoscope'?'visit':'screening';
 }else return '';
 return `<span class="history-badge history-${tone}${count===2?' history-double':''}">${Array.from({length:count},()=>dashboardIcon(symbol)).join('')}</span>`;
}
// Update an open list or calendar without requiring navigation or a page reload.
export function updateHistoryCoverage(root=document,now=Date.now()){
 for(const node of root.querySelectorAll('[data-coverage-label]'))node.textContent=coveragePresentation(Number(node.dataset.coverageLabel),now).label;
 for(const node of root.querySelectorAll('[data-coverage-icon]')){
  const state=coveragePresentation(Number(node.dataset.coverageIcon),now),img=node.querySelector('img');
  if(img&&img.getAttribute('src')!==state.src)img.setAttribute('src',state.src);
  const row=node.closest('.event.coverage');
  if(row){row.classList.toggle('future',state.pending);row.classList.toggle('coverage-started',!state.pending);}
  const calendarItem=node.closest('.calendar-symbols i');if(calendarItem)calendarItem.setAttribute('aria-label',state.label);
 }
}
