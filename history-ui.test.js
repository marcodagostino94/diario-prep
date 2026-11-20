import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dashboardIcon} from './dashboard.js';
import {coveragePresentation,historySymbol,updateHistoryCoverage} from './history-ui.js';
const at=Date.UTC(2026,10,20,23);
test('actual doses use one or two copies of the dashboard capsule while planned dose stays distinct',()=>{
 for(const count of [1,2]){
  const html=historySymbol({type:'dose',count});
  assert.ok(html.includes('history-dose'));assert.equal(html.split(dashboardIcon('capsule')).length-1,count);
 }
 const planned=historySymbol({type:'planned'});
 assert.ok(planned.includes('history-planned'));assert.ok(!planned.includes('history-dose'));
 const css=readFileSync(new URL('./style.css',import.meta.url),'utf8');
 assert.ok(css.includes('.history-planned,.history-analysis{--history-ink:var(--sky)'));
});
test('other history entries reuse the exact dashboard artwork',()=>{
 for(const [e,symbol] of [[{type:'sex'},'heart'],[{type:'box'},'bottle'],[{type:'boxClose'},'bottle'],[{type:'health',category:'analysis'},'syringe'],[{type:'health',category:'visit'},'stethoscope'],[{type:'health',category:'screening'},'flask']])assert.ok(historySymbol(e).includes(dashboardIcon(symbol)));
});
test('coverage countdown switches from blue to green exactly at its scheduled time',()=>{
 assert.equal(coveragePresentation(at,at-120*60000).label,'Inizio protezione prevista tra 120 minuti');
 assert.equal(coveragePresentation(at,at-1).label,'Inizio protezione prevista tra 1 minuto');
 assert.ok(historySymbol({type:'coverage',at},at-1).includes('blue.png'));
 const started=coveragePresentation(at,at);
 assert.equal(started.pending,false);assert.match(started.label,/^Protezione iniziata alle \d{2}:\d{2}$/);
 assert.ok(historySymbol({type:'coverage',at},at).includes('green.png'));
 assert.deepEqual(coveragePresentation(at,at+86400000),started);
});
test('an already-open list and calendar update their label, shield, and pending state without reload',()=>{
 const classes=new Set(['future']),row={classList:{toggle:(k,on)=>on?classes.add(k):classes.delete(k)}};
 const img={src:'./assets/status/blue.png',getAttribute(k){return this[k]},setAttribute(k,v){this[k]=v}};
 const label={dataset:{coverageLabel:String(at)},textContent:''};
 const calendarItem={setAttribute(k,v){this[k]=v}};
 const node={dataset:{coverageIcon:String(at)},querySelector:()=>img,closest:s=>s==='.event.coverage'?row:calendarItem};
 const root={querySelectorAll:s=>s==='[data-coverage-label]'?[label]:[node]};
 updateHistoryCoverage(root,at-60000);
 assert.equal(label.textContent,'Inizio protezione prevista tra 1 minuto');assert.ok(classes.has('future'));
 updateHistoryCoverage(root,at);
 assert.ok(label.textContent.startsWith('Protezione iniziata alle '));assert.ok(img.src.endsWith('green.png'));
 assert.equal(classes.has('future'),false);assert.equal(classes.has('coverage-started'),true);
 assert.equal(calendarItem['aria-label'],label.textContent);
});
