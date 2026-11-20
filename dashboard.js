// Presentation only: the existing delegated handlers consume these unchanged actions.
export const DASHBOARD_ACTIONS=[
 ['manual','prep','PrEP','Registra assunzione','capsule'],
 ['sex','rapporto','Rapporto','Registra rapporto','heart'],
 ['analysis','analysis','Appuntamento Analisi','Registra appuntamento','syringe'],
 ['visit','visit','Appuntamento Visita','Registra appuntamento','stethoscope'],
 ['screening','screening','Analisi','Registra esiti analisi','flask'],
 ['box','bottle','Flacone','Registra apertura flacone','bottle']
];
const paths={heart:'<path d="M20.5 4.6a5.5 5.5 0 0 0-7.8 0L12 5.3l-.7-.7a5.5 5.5 0 0 0-7.8 7.8L12 21l8.5-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',capsule:'<path d="m14 3-11 11a5 5 0 0 0 7 7L21 10a5 5 0 0 0-7-7ZM8.5 8.5l7 7"/>',syringe:'<path d="m16 2 6 6m-8-4 6 6M4 14l6 6M2 22l5-5m0-5 8-8 5 5-8 8H7v-5Zm6-5 2 2m-5 1 2 2"/>',stethoscope:'<path d="M5 3H3v5a6 6 0 0 0 12 0V3h-2M9 14v3a5 5 0 0 0 10 0v-3"/><circle cx="19" cy="11" r="3"/><circle cx="5" cy="3" r="1"/><circle cx="13" cy="3" r="1"/>',flask:'<path d="M8 2h8M10 2v7l-6 11q-1 2 2 2h12q3 0 2-2L14 9V2M7 15h10"/><circle cx="10" cy="18" r=".7"/>',bottle:'<path d="M7 2h10v4H7ZM8 6v3l-4 4v9h16v-9l-4-4V6M9 16h6m-3-3v6"/>'};
export function dashboardButtons(){return `<div class="actions dashboard-actions" aria-label="Registrazioni rapide">${DASHBOARD_ACTIONS.map(([action,art,title,caption,symbol])=>`<button type="button" class="dashboard-action dashboard-${art}" data-action="${action}" aria-label="${title}: ${caption}"><span class="dashboard-title">${title.startsWith('Appuntamento')?'Appuntamento<br>'+title.split(' ')[1]:title}</span><img class="dashboard-art" src="assets/dashboard/${art}.png" alt="" aria-hidden="true" width="250" height="250" decoding="async" draggable="false"><span class="dashboard-caption"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[symbol]}</svg><span>${action==='manual'?'Registra<br>assunzione':action==='screening'?'Registra<br>esiti analisi':caption}</span></span></button>`).join('')}</div>`;}

// Fit rows using the actual floating navigation position, never an assumed iPhone height.
export function dashboardGeometry({width,viewportHeight,actionsTop,navTop,navHeight,navBottom,scrollY=0}){
 if(width>650)return null;
 const available=navTop-(actionsTop+scrollY)-16;
 return {rowHeight:Math.max(76,Math.min(116,Math.floor((available-18)/3))),bottomPadding:Math.ceil(navHeight+Math.max(0,viewportHeight-navBottom)+20)};
}
export function fitDashboard(){
 const actions=document.querySelector('body[data-view="home"] .dashboard-actions'),nav=document.querySelector('#mobile-nav'),main=document.querySelector('main');if(!main)return;if(!actions||!nav){main.style.removeProperty('padding-bottom');return;}
 const box=actions.getBoundingClientRect(),bar=nav.getBoundingClientRect(),viewport=window.visualViewport;
 const fit=dashboardGeometry({width:window.innerWidth,viewportHeight:viewport?.height||window.innerHeight,actionsTop:box.top,navTop:bar.top,navBottom:bar.bottom,navHeight:bar.height,scrollY:window.scrollY});
 if(!fit){actions.style.removeProperty('--dashboard-row-height');main.style.removeProperty('padding-bottom');return;}
 actions.style.setProperty('--dashboard-row-height',fit.rowHeight+'px');main.style.paddingBottom=fit.bottomPadding+'px';
}
