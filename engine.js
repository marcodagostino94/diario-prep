import {normalizeRoutine,VACCINES,normalizePastDiseases} from './health.js?v=1.16.3';
export const SCREENING_GROUPS=[
 ['Esami del sangue',[['hiv','HIV'],['syphilis','Sifilide'],['hcv','Epatite C'],['hbv','Epatite B']]],
 ...[['gonorrhea','Gonorrea'],['chlamydia','Clamidia'],['mycoplasma','Mycoplasma genitalium'],['lgv','LGV']].map(([key,label])=>[label,[['throat','Gola'],['anal','Anale'],['genital','Genitale']].map(([site,name])=>[key+'-'+site,name])]),
 ['Altri test',[['hav','Epatite A'],['hsv1','Herpes HSV-1'],['hsv2','Herpes HSV-2'],['trichomonas','Tricomoniasi']]]
];
export const RESULT_STATES=['untested','negative','positive'];
export function normalizeScreening(value={}){const out={};for(const [,tests] of SCREENING_GROUPS)for(const [key] of tests){const state=value?.[key];out[key]=RESULT_STATES.includes(state)?state:'untested';}return out;}
export const HOUR=3600000, DAY=24*HOUR;
// Conservative app policy for the standard 2-1-1 flow, not a biological cutoff.
export const CONTINUATION_LIMIT=25*HOUR;
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
 // A standalone tablet cannot silently bridge an interruption in the standard flow.
 // Evaluate actual timestamps even for backdated records and when no sex was logged.
 if(mode==='demand')for(let i=1;i<ds.length;i++)if(relevant(ds[i])&&ds[i].at-ds[i-1].at>=CONTINUATION_LIMIT)issues.push('Assunzione singola dopo un’interruzione di almeno 25 ore: verifica lo schema con il centro PrEP.');
 const last=ds.at(-1), lastSlot=Math.max(...slots.keys());
 for(let i=Math.max(0,Math.ceil((boundary-start.at)/DAY));i<=lastSlot;i++)if(!slots.has(i)&&(mode==='daily'||sex.some(x=>x.at<start.at+i*DAY&&x.at>=boundary)))issues.push('Risulta una dose giornaliera non registrata.');
 for(const x of sex.filter(x=>mode!=='daily'&&x.at>=boundary)){if(x.at<start.at+2*HOUR)issues.push('Un rapporto è registrato prima delle 2 ore dalla dose iniziale.');if(!ds.some(d=>d.at<=x.at&&x.at-d.at<=DAY))issues.push('Un rapporto richiede verifica rispetto alle dosi precedenti.');}
 const after=lastSex?[...slots.values()].filter(d=>!d.start&&d.at>lastSex.at).length:0;
 if(ds.some(d=>relevant(d)&&!d.start&&d.count!==1))issues.push('Quantità diversa dalla dose giornaliera prevista: verifica con il centro PrEP.');
 const remaining=mode==='daily'?1:lastSex?Math.max(0,2-after):0;
 const next=start.at+(lastSlot+1)*DAY;
 const completed=mode!=='daily'&&!!lastSex&&remaining===0;
 if((mode==='daily'||lastSex)&&!completed&&(mode==='daily'?now>next+2*HOUR:now>=last.at+CONTINUATION_LIMIT))issues.push('La prossima dose risulta in ritardo o non registrata.');
 for(const e of data.events.filter(e=>e.type==='anomaly'&&e.source?.startsWith(start.id+':')))issues.push(e.message);
 const unique=[...new Set(issues)];
 const requiredNext=!unique.length&&(mode==='daily'||lastSex&&!completed)?next:null;
 const continuationAt=mode==='demand'&&!unique.length&&!requiredNext&&now<last.at+CONTINUATION_LIMIT?last.at+DAY:null;
 const kind=unique.length?'review':completed?'complete':now<start.at+2*HOUR?'waiting':mode!=='daily'&&!lastSex&&now>last.at+DAY?'unreported':'active';
 return {kind,mode,remaining,next:requiredNext,continuationAt,scheduledNext:next,canContinue:mode==='demand'?!unique.length&&now<last.at+CONTINUATION_LIMIT:now<=last.at+DAY,due:!!(requiredNext||continuationAt)&&now>=(requiredNext||continuationAt),start,last,lastSex,doses:ds,sex,issues:unique,coverageAt:start.at+2*HOUR,noSexRecorded:!lastSex};
}
export function validateBackup(value){
 if(!value||value.format!=='diario-prep'||![1,2].includes(value.version)||!Array.isArray(value.events)||value.events.length>100000)throw Error('File di backup non compatibile.');
 const ids=new Set(),now=Date.now();
 const text=(s,max=10000)=>typeof s==='string'?s.slice(0,max):'';
 const events=value.events.map(e=>{
  if(!e||!['dose','sex','health','scheme','anomaly','box','boxClose'].includes(e.type)||typeof e.id!=='string'||ids.has(e.id)||!Number.isFinite(e.at)||e.at<Date.UTC(e.type==='health'&&e.category==='vaccine'?1900:2000,0,1)||(e.type!=='health'&&e.at>now+60000)||e.at>Date.UTC(2100,0,1))throw Error('Il backup contiene eventi non validi.');
  ids.add(e.id);const base={id:e.id,type:e.type,at:e.at};
  if(e.type==='box')return {...base,...(Number.isInteger(e.initialCount)&&e.initialCount>=1&&e.initialCount<=30?{initialCount:e.initialCount}:{})};
  if(e.type==='boxClose'){if(typeof e.boxId!=='string')throw Error('Scatola non valida.');return {...base,boxId:e.boxId};}
  if(e.type==='dose'){if(![1,2].includes(e.count)||typeof e.start!=='boolean'||e.start&&e.count!==2)throw Error('Dose non valida nel backup.');return {...base,count:e.count,start:e.start};}
  if(e.type==='sex')return {...base,notes:text(e.notes)};
  if(e.type==='scheme'){if(!['daily','demand'].includes(e.mode))throw Error('Schema non valido.');return {...base,mode:e.mode,...(e.initial===true?{initial:true}:{})};}
  if(e.type==='anomaly')return {...base,message:text(e.message),source:text(e.source,200)};
  if(!['analysis','visit','screening','vaccine'].includes(e.category)||!text(e.title,200))throw Error('Appuntamento non valido.');
  if(['screening','vaccine'].includes(e.category)&&e.at>now+60000)throw Error('Data degli esiti non valida.');
  if(e.category==='vaccine'){if(!VACCINES.some(v=>v[0]===e.vaccineKey)||!Number.isInteger(e.doseNumber)||e.doseNumber<1||e.doseNumber>999)throw Error('Dose vaccinale non valida.');return {...base,category:'vaccine',title:text(e.title,200),vaccineKey:e.vaccineKey,vaccineName:text(e.vaccineName,120),doseNumber:e.doseNumber,booster:e.booster===true,notes:text(e.notes)};}
  return {...base,category:e.category,title:text(e.title,200),results:text(e.results),notes:text(e.notes),...(e.category==='screening'?{screening:normalizeScreening(e.screening),labDetails:normalizeLabDetails(e.labDetails),...(Array.isArray(e.routine)?{routine:normalizeRoutine(e.routine)}:{})}:{})};
 });
 const s=value.settings||{};
 return {events,...(value.pastDiseases?{pastDiseases:normalizePastDiseases(value.pastDiseases)}:{}),settings:{early:s.early===true,repeat:s.repeat!==false,discreet:s.discreet!==false,stock:Number.isInteger(s.stock)&&s.stock>=0&&s.stock<=10000?s.stock:30,theme:['auto','dark','light'].includes(s.theme)?s.theme:'auto',historyView:s.historyView==='calendar'?'calendar':'list'}};
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
 return events.sort(compareEvents);
}
export function reminderPlan(a,settings,now=Date.now()){
 const out=[];
 if(a.kind==='waiting'&&a.coverageAt>now)out.push({key:'start-'+a.coverageAt,at:a.coverageAt});
 // Optional continuation is a single reminder after a real dose, never a rolling plan.
 if(!a.next){if(settings.early&&a.continuationAt-2*HOUR>now)out.push({key:'early-'+a.continuationAt,at:a.continuationAt-2*HOUR});if(a.continuationAt)for(let i=0;i<=(settings.repeat?4:0);i++){const at=a.continuationAt+i*15*60000;if(at>now)out.push({key:'continue-'+a.last.id+'-'+a.continuationAt+(i?'-'+i:''),at});}return out;}
 const base=a.next;
 if(base+HOUR<now)out.push({key:'overdue-'+base,at:now+60000});
 if(settings.early&&base-2*HOUR>now)out.push({key:'early-'+base,at:base-2*HOUR});
 // Finite reminders; never infer that a dose was taken from silence.
 for(let i=0;i<=(settings.repeat?4:0);i++){const at=base+i*15*60000;if(at>now)out.push({key:'due-'+base+'-'+i,at});}
 return out;
}

export function normalizeLabDetails(value={}){
 const out={};for(const key of ['tpha','rpr','hbsag','antiHbsState','hbcState'])out[key]=RESULT_STATES.includes(value?.[key])?value[key]:'untested';
 for(const key of ['iggIgm','igg','igm','antiHbs','hbc','creatinine']){const v=typeof value?.[key]==='string'?value[key]:typeof value?.[key]==='number'?String(value[key]):'';out[key]=/^(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(v)?v.slice(0,40):'';}
 out.syphilisNotes=typeof value?.syphilisNotes==='string'?value.syphilisNotes.slice(0,10000):'';return out;
}
export function creatinineStatus(value){if(!String(value).trim())return 'empty';const n=Number(String(value).replace(',','.'));return Number.isFinite(n)&&n>=0.70&&n<=1.20?'normal':'outside';}
export function boxStatus(data,now=Date.now()){
 const boxes=data.events.filter(e=>e.type==='box'&&e.at<=now).sort((a,b)=>a.at-b.at||a.id.localeCompare(b.id));const box=boxes.at(-1);
 if(!box||data.events.some(e=>e.type==='boxClose'&&e.boxId===box.id&&e.at<=now))return null;
 const doses=data.events.filter(e=>e.type==='dose'&&e.at>=box.at&&e.at<=now).sort((a,b)=>a.at-b.at);
 const used=doses.reduce((n,d)=>n+d.count,0),remaining=Math.max(0,(box.initialCount||30)-used),expiresAt=box.at+90*DAY;
 return {box,used,remaining,expiresAt,expired:now>=expiresAt};
}
export function stockReminderPlan(data,now=Date.now()){
 const b=boxStatus(data,now);if(!b)return [];const out=[];
 for(const threshold of [10,5])if(b.remaining<=threshold)out.push({key:`stock-${b.box.id}-${threshold}`,at:now+5000});
 if(b.remaining>0)out.push({key:'expire-'+b.box.id+'-'+b.expiresAt,at:Math.max(now+5000,b.expiresAt)});
 return out;
}

export function compareEvents(a,b){const rank={scheme:0,box:1,dose:2,sex:3,health:4,boxClose:5,coverage:6,planned:7,anomaly:8};return a.at-b.at||(rank[a.type]??9)-(rank[b.type]??9)||String(a.id||'').localeCompare(String(b.id||''));}
export function initialConfiguration(mode,dose,box,schemeId){
 if(!['daily','demand'].includes(mode)||dose?.type!=='dose'||!Number.isFinite(dose.at))throw Error('Configurazione non valida.');
 if(box&&(box.at>dose.at||!Number.isFinite(box.at)))throw Error('L’apertura della scatola deve precedere o coincidere con la dose.');
 if(box&&(box.initialCount||30)<dose.count)throw Error('La scorta iniziale è inferiore alle compresse registrate.');
 return [{id:schemeId,type:'scheme',at:Math.min(dose.at,box?.at??dose.at),mode,initial:true},...(box?[box]:[]),dose].sort(compareEvents);
}
