import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {DASHBOARD_ACTIONS,dashboardButtons} from './dashboard.js';
test('six independent summary buttons keep the original handlers in the approved order',()=>{
 const html=dashboardButtons();
 assert.deepEqual([...html.matchAll(/data-action="([^"]+)"/g)].map(m=>m[1]),['sex','manual','analysis','visit','screening','box']);
 assert.equal((html.match(/<button /g)||[]).length,6);
 assert.equal((html.match(/aria-label=/g)||[]).length,7);
 assert.ok(html.includes('Appuntamento<br>Analisi'));
 for(const [,art,title,caption] of DASHBOARD_ACTIONS){assert.ok(html.includes(caption));assert.ok(html.includes(`aria-label="${title}: ${caption}"`));assert.ok(existsSync(new URL(`./assets/dashboard/${art}.png`,import.meta.url)));}
});
test('art and presentation files are included in offline cache; no full-card raster is used',()=>{
 const sw=readFileSync(new URL('./sw.js',import.meta.url),'utf8');
 for(const [,art] of DASHBOARD_ACTIONS)assert.ok(sw.includes(`assets/dashboard/${art}.png`));
 assert.ok(sw.includes('dashboard.css?v=1.15.1'));assert.ok(sw.includes('dashboard.js?v=1.15.1'));
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
