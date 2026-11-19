export const HOUR=3600000, DAY=24*HOUR;
export function analyze(data,now=Date.now()) {
 const doses=data.events.filter(e=>e.type==='dose').sort((a,b)=>a.at-b.at);
 const starts=doses.filter(e=>e.start);
 const start=starts.at(-1);
 if(!start)return {kind:'idle',remaining:0,next:null,issues:[],doses:[],sex:[]};
 const ds=doses.filter(e=>e.at>=start.at), sex=data.events.filter(e=>e.type==='sex'&&e.at>=start.at).sort((a,b)=>a.at-b.at);
 const lastSex=sex.at(-1), issues=[];
 const slots=new Map();
 for(const d of ds){const slot=Math.round((d.at-start.at)/DAY);if(slots.has(slot))issues.push('Più assunzioni nella stessa giornata di schema: verifica le registrazioni.');slots.set(slot,d);if(Math.abs(d.at-(start.at+slot*DAY))>2*HOUR)issues.push('Un’assunzione si discosta di oltre 2 ore dall’orario previsto: verifica lo schema con il centro PrEP.');}
 const last=ds.at(-1), lastSlot=Math.max(...slots.keys());
 for(let i=0;i<=lastSlot;i++)if(!slots.has(i))issues.push('Risulta una dose giornaliera non registrata.');
 for(const x of sex){if(x.at<start.at+2*HOUR)issues.push('Un rapporto è registrato prima delle 2 ore dalla dose iniziale.');if(!ds.some(d=>d.at<=x.at&&x.at-d.at<=DAY))issues.push('Un rapporto richiede verifica rispetto alle dosi precedenti.');}
 const after=lastSex?[...slots.values()].filter(d=>!d.start&&d.at>lastSex.at).length:0;
 const remaining=lastSex?Math.max(0,2-after):0;
 const next=start.at+(lastSlot+1)*DAY;
 const completed=!!lastSex&&remaining===0;
 if(lastSex&&!completed&&now>next+2*HOUR)issues.push('La prossima dose risulta in ritardo o non registrata.');
 const unique=[...new Set(issues)];
 const kind=unique.length?'review':completed?'complete':now<start.at+2*HOUR?'waiting':!lastSex&&now>last.at+DAY?'unreported':'active';
 return {kind,remaining,next:lastSex&&!completed?next:null,scheduledNext:next,canContinue:now<=last.at+DAY,start,last,lastSex,doses:ds,sex,issues:unique,coverageAt:start.at+2*HOUR,noSexRecorded:!lastSex};
}
export function validateBackup(value){
 if(!value||value.format!=='diario-prep'||value.version!==1||!Array.isArray(value.events)||value.events.length>100000)throw Error('File di backup non compatibile.');
 const ids=new Set();const events=value.events.map(e=>{
 if(!e||!['dose','sex'].includes(e.type)||typeof e.id!=='string'||ids.has(e.id)||!Number.isFinite(e.at)||e.at<Date.UTC(2000,0,1)||e.at>Date.now()+60000)throw Error('Il backup contiene eventi non validi.');
 ids.add(e.id);if(e.type==='dose'&&(![1,2].includes(e.count)||typeof e.start!=='boolean'||(e.start&&e.count!==2)||(!e.start&&e.count!==1)))throw Error('Dose non valida nel backup.');
 return e.type==='dose'?{id:e.id,type:e.type,at:e.at,count:e.count,start:e.start}:{id:e.id,type:e.type,at:e.at};});
 const s=value.settings||{};return {events,settings:{early:s.early===true,repeat:s.repeat!==false,discreet:s.discreet!==false,stock:Number.isInteger(s.stock)&&s.stock>=0&&s.stock<=10000?s.stock:30}};
}
// Derived schedule only: never writes or counts planned doses as taken.
export function futureDoses(a){
 if(!a.lastSex||!a.next||a.issues.length)return [];
 return Array.from({length:a.remaining},(_,i)=>({id:'planned-'+(a.next+i*DAY),type:'planned',at:a.next+i*DAY,number:3-a.remaining+i}));
}
export function historyTimeline(data,now=Date.now()){
 const a=analyze(data,now),events=data.events.map(e=>({...e}));
 const starts=data.events.filter(e=>e.type==='dose'&&e.start).sort((a,b)=>a.at-b.at);
 for(let i=0;i<starts.length;i++){
  const at=starts[i].at+2*HOUR;
  if(starts[i+1]&&at>=starts[i+1].at)continue;
  events.push({id:'coverage-'+starts[i].id,type:'coverage',at,pending:at>now});
 }
 events.push(...futureDoses(a));
 return events.sort((a,b)=>a.at-b.at||(a.type==='coverage'?-1:1));
}
export function reminderPlan(a,settings,now=Date.now()){
 const out=[];
 if(a.kind==='waiting'&&a.coverageAt>now)out.push({key:'start-'+a.coverageAt,at:a.coverageAt});
 if(!a.next)return out;
 const base=a.next;
 if(base+HOUR<now)out.push({key:'overdue-'+base,at:now+60000});
 if(settings.early&&base-2*HOUR>now)out.push({key:'early-'+base,at:base-2*HOUR});
 // Finite reminders; never infer that a dose was taken from silence.
 for(let i=0;i<=(settings.repeat?4:0);i++){const at=base+i*15*60000;if(at>now)out.push({key:'due-'+base+'-'+i,at});}
 return out;
}
