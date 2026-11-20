import test from 'node:test';
import assert from 'node:assert/strict';
import {appointmentReminderPlan,nextVaccineDose,normalizeRoutine} from './health.js';
import {validateBackup} from './engine.js';
const H=3600000, now=Date.UTC(2026,10,20,10);
const visit={id:'visit-1',type:'health',category:'visit',title:'Titolo privato',notes:'Nota privata',at:now+40*24*H};
test('appointments schedule both notices even beyond seven days, with no health text',()=>{
 const plan=appointmentReminderPlan({events:[visit]},now);
 assert.deepEqual(plan.map(p=>p.at),[visit.at-24*H,visit.at-H]);
 assert.ok(!JSON.stringify(plan).includes('privat'));
 assert.equal(plan.length,2);
});
test('rescheduling and deletion replace appointment keys; past notices are not recovered',()=>{
 const plan=appointmentReminderPlan({events:[visit]},visit.at-2*H);
 assert.equal(plan.length,1);assert.equal(plan[0].at,visit.at-H);
 assert.notEqual(plan[0].key,appointmentReminderPlan({events:[{...visit,at:visit.at+H}]},now)[1].key);
 assert.deepEqual(appointmentReminderPlan({events:[]},now),[]);
 assert.deepEqual(appointmentReminderPlan({events:[visit]},visit.at),[]);
 assert.deepEqual(appointmentReminderPlan({events:[{...visit,category:'screening'},{...visit,category:'vaccine'}]},now),[]);
});
test('vaccine sequence uses highest saved dose, preserves separate vaccines, and supports childhood dates',()=>{
 const e={id:'v1',type:'health',category:'vaccine',title:'Epatite B',vaccineName:'Epatite B',vaccineKey:'hbv',doseNumber:3,at:Date.UTC(1994,6,1),booster:false,notes:'infanzia'};
 assert.equal(nextVaccineDose([e],'hbv'),4);assert.equal(nextVaccineDose([e],'hav'),1);
 assert.equal(nextVaccineDose([e],'hbv','',e.id),1);
 assert.deepEqual(validateBackup({format:'diario-prep',version:2,events:[e]}).events,[e]);
 assert.throws(()=>validateBackup({format:'diario-prep',version:2,events:[{...e,doseNumber:0}]}));
});
test('routine backup keeps textual urine results, numeric strings, units and laboratory reference',()=>{
 const routine=[{key:'ur-nitrites',label:'Nitriti',value:'assenti',unit:'',reference:'assenti'},{key:'ldl',label:'LDL misurato',value:'175',unit:'mg/dL',reference:'30–129'}];
 const e={id:'s',type:'health',category:'screening',title:'Esiti',at:now,routine};
 assert.deepEqual(validateBackup({format:'diario-prep',version:2,events:[e]}).events[0].routine,routine);
 assert.deepEqual(normalizeRoutine(null),[]);
});

import {VACCINES,normalizePastDiseases} from './health.js';
test('polio standalone, combined polio and covid are separately selectable',()=>{
 for(const key of ['polio','dtpa-ipv','covid'])assert.ok(VACCINES.some(v=>v[0]===key));
});
test('reported past diseases survive backup, unknown remains distinct from no, invalid years are cleared',()=>{
 const pastDiseases=normalizePastDiseases({measles:{state:'yes',year:'1998',notes:'infanzia'},varicella:{state:'no'},rubella:{state:'yes',year:'9999'}});
 assert.equal(pastDiseases.measles.year,'1998');assert.equal(pastDiseases.varicella.state,'no');assert.equal(pastDiseases.mumps.state,'unknown');assert.equal(pastDiseases.rubella.year,'');
 assert.deepEqual(validateBackup({format:'diario-prep',version:2,events:[],pastDiseases}).pastDiseases,pastDiseases);
});
