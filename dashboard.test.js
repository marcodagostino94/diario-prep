import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {DASHBOARD_ACTIONS,dashboardButtons} from './dashboard.js';
test('six independent summary buttons keep the original handlers in the approved order',()=>{
 const html=dashboardButtons();
 assert.deepEqual([...html.matchAll(/data-action="([^"]+)"/g)].map(m=>m[1]),['manual','sex','analysis','visit','screening','box']);
 assert.equal((html.match(/<button /g)||[]).length,6);
 assert.equal((html.match(/<button[^>]*aria-label=/g)||[]).length,6);
 assert.ok(html.includes('Appuntamento<br>Analisi'));
 for(const [,art,title,caption] of DASHBOARD_ACTIONS){assert.ok(html.includes(caption));assert.ok(html.includes(`aria-label="${title}: ${caption}"`));assert.ok(existsSync(new URL(`./assets/dashboard/${art}.png`,import.meta.url)));}
});
test('art and presentation files are included in offline cache; no full-card raster is used',()=>{
 const sw=readFileSync(new URL('./sw.js',import.meta.url),'utf8');
 for(const [,art] of DASHBOARD_ACTIONS)assert.ok(sw.includes(`assets/dashboard/${art}.png`));
 assert.ok(sw.includes('dashboard.css?v=1.16.3'));assert.ok(sw.includes('dashboard.js?v=1.16.3'));
 assert.ok(!dashboardButtons().includes('riferimento_dashboard'));
});

import {dashboardGeometry} from './dashboard.js';
test('phone layout fits all three rows above the actual floating bar',()=>{
 for(const [width,viewportHeight,actionsTop,navTop,navBottom] of [[375,812,390,706,772],[390,844,400,738,804],[430,932,420,826,892]]){
 const layout=dashboardGeometry({width,viewportHeight,actionsTop,navTop,navBottom,navHeight:66});
 assert.ok(actionsTop+3*layout.rowHeight+18<=navTop-16);
 assert.ok(layout.bottomPadding>=viewportHeight-navTop+20);
 }
});
test('scroll position does not inflate the calculated card height',()=>{
 const base={width:375,viewportHeight:812,actionsTop:390,navTop:706,navBottom:772,navHeight:66};
 assert.deepEqual(dashboardGeometry(base),dashboardGeometry({...base,actionsTop:290,scrollY:100}));
});
test('small windows retain readable controls and reserve navigation padding for scrolling',()=>{
 const layout=dashboardGeometry({width:320,viewportHeight:568,actionsTop:320,navTop:486,navBottom:552,navHeight:66});
 assert.ok(layout.rowHeight>=76);assert.ok(layout.bottomPadding>=102);
 assert.equal(dashboardGeometry({width:1200}),null);
});

import {bottleSummary,postSexPills,capsuleIcon} from './dashboard.js';
import {analyze,boxStatus,HOUR,DAY} from './engine.js';
import {homeState} from './status.js';
test('bottle card shows live remaining tablets and rounded-up opening life, including empty and expired bottles',()=>{
 const at=Date.UTC(2026,10,20,20),events=[{id:'b',type:'box',at},{id:'d',type:'dose',at,count:2,start:true}];
 const stock=boxStatus({events},at);
 assert.equal(bottleSummary(stock,at),'28 compresse rimaste · 90 giorni rimanenti');
 assert.ok(dashboardButtons(stock,at).includes('<span><b>28</b> compresse</span><span><b>90</b> giorni residui</span>'));
 assert.ok(bottleSummary(stock,at+89*DAY).includes('1 giorno rimanente'));
 assert.ok(bottleSummary(stock,at+90*DAY).includes('90 giorni terminati'));
 assert.ok(dashboardButtons({...stock,remaining:0},at).includes('0 compresse rimaste'));
 assert.ok(dashboardButtons().includes('Nessun flacone aperto'));
 assert.ok(!dashboardButtons().includes('30 compresse rimaste'));
});
test('closed bottle does not leave old stock on the dashboard',()=>{
 const at=Date.UTC(2026,10,20,20);
 const stock=boxStatus({events:[{id:'b',type:'box',at},{id:'c',type:'boxClose',boxId:'b',at:at+1}]},at+2);
 assert.equal(stock,null);assert.equal(bottleSummary(stock),'Nessun flacone aperto');
});
test('post-sex pair uses the exact small capsule artwork and strikes only actual registered doses',()=>{
 const at=Date.UTC(2026,10,19,20),start={id:'s',type:'dose',at,count:2,start:true},sex={id:'x',type:'sex',at:at+3*HOUR};
 const first={id:'d1',type:'dose',at:at+24*HOUR,count:1,start:false},second={...first,id:'d2',at:at+48*HOUR};
 for(const [events,h,taken] of [[[start,sex],4,0],[[start,sex,first],24,1],[[start,sex,first,second],48,2],[[start,sex,first,second],72.5,2]]){
  const a=analyze({events},at+h*HOUR),html=postSexPills(a,homeState(a,at+h*HOUR));
  assert.equal((html.match(/class="post-sex-pill[ "]/g)||[]).length,2);
  assert.equal((html.match(/class="taken-cross"/g)||[]).length,taken);
  assert.equal(html.split(capsuleIcon()).length-1,2);
  assert.ok(html.includes(`${taken} di 2 registrate`));
 }
 const e=[start,sex,first,second],a=analyze({events:e},at+73*HOUR);
 assert.equal(postSexPills(a,homeState(a,at+73*HOUR)),'');
});
test('new encounter resets post-sex pair; no-sex and daily flow show no pair',()=>{
 const at=Date.UTC(2026,10,19,20),dose=(id,h,start=false)=>({id,type:'dose',at:at+h*HOUR,count:start?2:1,start});
 const e=[dose('s',0,true),{id:'x',type:'sex',at:at+3*HOUR},dose('d1',24),dose('d2',48),{id:'y',type:'sex',at:at+49*HOUR}];
 const a=analyze({events:e},at+50*HOUR),html=postSexPills(a,homeState(a,at+50*HOUR));
 assert.ok(html.includes('0 di 2 registrate'));assert.ok(!html.includes('taken-cross'));
 const noSex=analyze({events:[e[0]]},at+4*HOUR);assert.equal(postSexPills(noSex,homeState(noSex,at+4*HOUR)),'');
 assert.equal(postSexPills({...a,mode:'daily'},homeState(a,at+50*HOUR)),'');
});
