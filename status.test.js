import test from 'node:test';
import assert from 'node:assert/strict';
import {analyze,HOUR} from './engine.js';
import {homeState} from './status.js';
const at=Date.UTC(2026,10,19,20);
const dose=(h,start=false)=>({id:'dose'+h,type:'dose',at:at+h*HOUR,count:start?2:1,start});
const sex=h=>({id:'sex'+h,type:'sex',at:at+h*HOUR});
const state=(events,h)=>homeState(analyze({events},at+h*HOUR),at+h*HOUR);
test('never started is red; initial wait turns green at two hours without needing a sex record',()=>{
 assert.equal(state([],0).state,'inactive');
 assert.equal(state([dose(0,true)],1.99).state,'waiting');
 assert.equal(state([dose(0,true)],2).state,'protected');
 assert.equal(state([dose(0,true)],23.99).optional,true);
 assert.equal(state([dose(0,true)],24).state,'due');
});
test('completed course remains green until exactly 24h after last dose, even days later is inactive',()=>{
 const e=[dose(0,true),sex(3),dose(24),dose(48)];
 assert.equal(state(e,48).completed,true);
 assert.equal(state(e,71.99).state,'protected');
 assert.equal(state(e,72).state,'inactive');
 assert.equal(state(e,168).title,'Non Protetto');
});
test('required dose is yellow then red after existing two-hour margin, keeping due reminder',()=>{
 const e=[dose(0,true),sex(3)];
 assert.equal(state(e,24).state,'due');
 assert.equal(state(e,26).state,'due');
 const late=state(e,26.01);
 assert.equal(late.state,'review');assert.equal(late.due,true);assert.equal(late.reminderAt,at+24*HOUR);
});
test('early sex overrides blue; new sex after maintenance extends required doses',()=>{
 assert.equal(state([dose(0,true),sex(1)],1.5).state,'review');
 const e=[dose(0,true),sex(3),dose(24),sex(30),dose(48)];
 assert.equal(state(e,49).completed,false);
 assert.equal(state(e,72).state,'due');
});

test('no-sex optional continuation turns yellow for the existing one-hour window, then red',()=>{
 const e=[dose(0,true)];
 for(const h of [24,24.5,25]){
  const s=state(e,h);assert.equal(s.color,'yellow');assert.equal(s.title,'È il momento della PrEP');assert.equal(s.optional,true);assert.equal(s.due,true);
 }
 const expired=state(e,25.001);assert.equal(expired.state,'inactive');assert.equal(expired.reminderAt,null);
 assert.equal(state([...e,dose(24.5)],24.5).state,'protected');
 assert.equal(state([...e,dose(24.5)],48.5).color,'yellow');
});
