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
 assert.ok(sw.includes('dashboard.css?v=1.14'));assert.ok(sw.includes('dashboard.js?v=1.14'));
 assert.ok(!dashboardButtons().includes('riferimento_dashboard'));
});
