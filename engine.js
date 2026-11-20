export const SCREENING_GROUPS=[
 ['Esami del sangue',[['hiv','HIV'],['syphilis','Sifilide'],['hcv','Epatite C']]],
 ...[['gonorrhea','Gonorrea'],['chlamydia','Clamidia'],['mycoplasma','Mycoplasma genitalium'],['lgv','LGV']].map(([key,label])=>[label,[['throat','Gola'],['anal','Anale'],['genital','Genitale']].map(([site,name])=>[key+'-'+site,name])]),
 ['Altri test',[['hav','Epatite A'],['hbv','Epatite B'],['hsv1','Herpes HSV-1'],['hsv2','Herpes HSV-2'],['trichomonas','Tricomoniasi']]]
];
export const RESULT_STATES=['untested','negative','positive'];
export function normalizeScreening(value={}){const out={};for(const [,tests] of SCREENING_GROUPS)for(const [key] of tests){const state=value?.[key];out[key]=RESULT_STATES.includes(state)?state:'untested';}return out;}
export const HOUR=3600000, DAY=24*HOUR;
export function analyze(data,now=Date.now()) {
 const doses=data.events.filter(e=>e.type==='dose').sort((a,b)=>a.at-b.at);
 const changes=data.events.filter(e=>e.type==='scheme'&&e.at<=now).sort((a,b)=>a.at-b.at);
 const change=changes.at(-1),mode=change?.mode||'demand';
 const starts=doses.filter(e=>e.start&&e.at<=now);
 const start=starts.at(-1);
 if(!start)return {kind:'idle',mode,remaining:0,next:null,issues:[],doses:[],sex:[]};
 const ds=doses.filter(e=>e.at>=start.at), sex=data.events.filter(e=>e.type==='sex'&&e.at>=start.at).sort((a,b)=>a.at-b.at);
 const lastSex=sex.at(-1), issues=[];
 const boundary=Math.max(start.at,change?.at||start.at);
 const relevant=d=>d.at>=boundary;
 const slots=new Map();
 for(const d of ds){const slot=Math.round((d.at-start.at)/DAY);if(slots.has(slot)&&relevant(d))issues.push('Più assunzioni nella stessa giornata di schema: verifica le registrazioni.');slots.set(slot,d);if(relevant(d)&&Math.abs(d.at-(start.at+slot*DAY))>2*HOUR)issues.push('Un’assunzione si discosta di oltre 2 ore dall’orario previsto: verifica lo schema con il centro PrEP.');}
 const last=ds.at(-1), lastSlot=Math.max(...slots.keys());
 for(let i=Math.max(0,Math.ceil((boundary-start.at)/DAY));i<=lastSlot;i++)if(!slots.has(i)&&(mode==='daily'||sex.some(x=>x.at<start.at+i*DAY&&x.at>=boundary)))issues.push('Risulta una dose giornaliera non registrata.');
 for(const x of sex.filter(x=>mode!=='daily'&&x.at>=boundary)){if(x.at<start.at+2*HOUR)issues.push('Un rapporto è registrato prima delle 2 ore dalla dose iniziale.');if(!ds.some(d=>d.at<=x.at&&x.at-d.at<=DAY))issues.push('Un rapporto richiede verifica rispetto alle dosi precedenti.');}
 const after=lastSex?[...slots.values()].filter(d=>!d.start&&d.at>lastSex.at).length:0;
 if(ds.some(d=>relevant(d)&&!d.start&&d.count!==1))issues.push('Quantità diversa dalla dose giornaliera prevista: verifica con il centro PrEP.');
 const remaining=mode==='daily'?1:lastSex?Math.max(0,2-after):0;
 const next=start.at+(lastSlot+1)*DAY;
 const completed=mode!=='daily'&&!!lastSex&&remaining===0;
 if((mode==='daily'||lastSex)&&!completed&&now>next+2*HOUR)issues.push('La prossima dose risulta in ritardo o non registrata.');
 for(const e of data.events.filter(e=>e.type==='anomaly'&&e.source?.startsWith(start.id+':')))issues.push(e.message);
 const unique=[...new Set(issues)];
 const requiredNext=!unique.length&&(mode==='daily'||lastSex&&!completed)?next:null;
 const continuationAt=mode==='demand'&&!unique.length&&!requiredNext&&now<=last.at+DAY?last.at+DAY:null;
 const kind=unique.length?'review':completed?'complete':now<start.at+2*HOUR?'waiting':mode!=='daily'&&!lastSex&&now>last.at+DAY?'unreported':'active';
 return {kind,mode,remaining,next:requiredNext,continuationAt,scheduledNext:next,canContinue:now<=last.at+DAY,start,last,lastSex,doses:ds,sex,issues:unique,coverageAt:start.at+2*HOUR,noSexRecorded:!lastSex};
}
export function validateBackup(value){
 if(!value||value.format!=='diario-prep'||![1,2].includes(value.version)||!Array.isArray(value.events)||value.events.length>100000)throw Error('File di backup non compatibile.');
 const ids=new Set(),now=Date.now();
 const text=(s,max=10000)=>typeof s==='string'?s.slice(0,max):'';
 const events=value.events.map(e=>{
  if(!e||!['dose','sex','health','scheme','anomaly'].includes(e.type)||typeof e.id!=='string'||ids.has(e.id)||!Number.isFinite(e.at)||e.at<Date.UTC(2000,0,1)||(e.type!=='health'&&e.at>now+60000)||e.at>Date.UTC(2100,0,1))throw Error('Il backup contiene eventi non validi.');
  ids.add(e.id);const base={id:e.id,type:e.type,at:e.at};
  if(e.type==='dose'){if(![1,2].includes(e.count)||typeof e.start!=='boolean'||e.start&&e.count!==2)throw Error('Dose non valida nel backup.');return {...base,count:e.count,start:e.start};}
  if(e.type==='sex')return {...base,notes:text(e.notes)};
  if(e.type==='scheme'){if(!['daily','demand'].includes(e.mode))throw Error('Schema non valido.');return {...base,mode:e.mode};}
  if(e.type==='anomaly')return {...base,message:text(e.message),source:text(e.source,200)};
  if(!['analysis','visit','screening'].includes(e.category)||!text(e.title,200))throw Error('Appuntamento non valido.');
  if(e.category==='screening'&&e.at>now+60000)throw Error('Data degli esiti non valida.');
  return {...base,category:e.category,title:text(e.title,200),results:text(e.results),notes:text(e.notes),...(e.category==='screening'?{screening:normalizeScreening(e.screening)}:{})};
 });
 const s=value.settings||{};
 return {events,settings:{early:s.early===true,repeat:s.repeat!==false,discreet:s.discreet!==false,stock:Number.isInteger(s.stock)&&s.stock>=0&&s.stock<=10000?s.stock:30,theme:['auto','dark','light'].includes(s.theme)?s.theme:'auto',historyView:s.historyView==='calendar'?'calendar':'list'}};
}
// Re-evaluate the source records, including closed cycles and earlier scheme periods.
// A new cycle alone cannot hide a genuine historical issue; corrected records can resolve it.
export function captureIssues(data,now=Date.now()){
 const records=data.events.filter(e=>e.type!=='anomaly');
 const boundaries=[...new Set(records.filter(e=>e.at<=now&&(e.type==='scheme'||e.type==='dose'&&e.start)).map(e=>e.at))].sort((a,b)=>a-b);
 const required=new Map();
 for(let i=0;i<boundaries.length;i++){
  const cutoff=i+1<boundaries.length?boundaries[i+1]-1:now;
  const a=analyze({events:records.filter(e=>e.at<=cutoff)},cutoff);
  for(const message of a.issues){const source=`${a.start.id}:${message}`;required.set(source,{message,source,at:cutoff});}
 }
 const previous=data.events.filter(e=>e.type==='anomaly');
 const anomalies=[...required.values()].map(issue=>previous.find(e=>e.source===issue.source)||{id:'anomaly-'+crypto.randomUUID(),type:'anomaly',...issue});
 if(previous.length===anomalies.length&&anomalies.every(e=>previous.includes(e)))return data;
 return {...data,events:[...records,...anomalies]};
}
export function themeAt(setting,now=new Date()){return setting==='light'||setting==='dark'?setting:now.getHours()>=7&&now.getHours()<19?'light':'dark';}
// Derived schedule only: never writes or counts planned doses as taken.
export function futureDoses(a){
 if((a.mode!=='daily'&&!a.lastSex)||!a.next||a.issues.length)return [];
 return Array.from({length:a.mode==='daily'?7:a.remaining},(_,i)=>({id:'planned-'+(a.next+i*DAY),type:'planned',at:a.next+i*DAY,number:3-a.remaining+i,daily:a.mode==='daily'}));
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
 // Optional continuation is a single reminder after a real dose, never a rolling plan.
 if(!a.next){if(a.continuationAt&&a.continuationAt>=now)out.push({key:'continue-'+a.last.id+'-'+a.continuationAt,at:a.continuationAt});return out;}
 const base=a.next;
 if(base+HOUR<now)out.push({key:'overdue-'+base,at:now+60000});
 if(settings.early&&base-2*HOUR>now)out.push({key:'early-'+base,at:base-2*HOUR});
 // Finite reminders; never infer that a dose was taken from silence.
 for(let i=0;i<=(settings.repeat?4:0);i++){const at=base+i*15*60000;if(at>now)out.push({key:'due-'+base+'-'+i,at});}
 return out;
}
