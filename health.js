// Catalogo verificato su fonti istituzionali il 20 novembre 2026.
export const VACCINE_SOURCES=[
 ['Ministero della Salute · Calendario vaccinale','https://www.salute.gov.it/new/it/tema/vaccinazioni/calendario-vaccinale/'],
 ['Ministero della Salute · Condizioni di rischio','https://www.salute.gov.it/new/it/tema/vaccinazioni/persone-rischio-determinati-comportamenti-o-condizioni/'],
 ['Ministero della Salute · COVID-19','https://www.salute.gov.it/new/it/tema/covid-19/campagna-di-vaccinazione-anti-covid-19/'],
 ['ISS · Mpox','https://www.epicentro.iss.it/mpox/']
];
export const VACCINES=[
 ['hav','Epatite A','Da valutare nel percorso di salute sessuale'],['hbv','Epatite B','Da valutare nel percorso di salute sessuale'],['hpv','Papillomavirus · HPV','Da valutare nel percorso di salute sessuale'],['mpox','Mpox','Solo in presenza dei criteri di rischio'],
 ['dtpa','Difterite, tetano, pertosse · dTpa','Calendario adulti / recuperi'],['polio','Polio · Poliomielite','Calendario / recuperi'],['dtpa-ipv','Difterite, tetano, pertosse e polio · dTpa-IPV','Vaccino combinato'],['mpr','Morbillo, parotite, rosolia · MPR','Recupero nei soggetti suscettibili'],['varicella','Varicella','Recupero nei soggetti suscettibili'],
 ['covid','COVID-19','Secondo indicazioni della campagna vaccinale'],['flu','Influenza','Secondo età, rischio e indicazioni stagionali'],['pneumo','Pneumococco','Secondo età e condizioni di rischio'],['zoster','Herpes zoster','Secondo età e condizioni di rischio'],['menacwy','Meningococco ACWY','Calendario / condizioni di rischio'],['menb','Meningococco B','Calendario / condizioni di rischio'],['other','Altro vaccino','Inserimento personalizzato']
];
export const ROUTINE_GROUPS=[
 ['Metabolismo e reni',[['glucose','Glicemia','mg/dL'],['creatinine','Creatinina','mg/dL'],['gfr','GFR / eGFR','mL/min'],['totalChol','Colesterolo totale','mg/dL'],['hdl','HDL','mg/dL'],['ldl','LDL misurato','mg/dL'],['ldlCalc','LDL calcolato','mg/dL'],['nonHdl','Colesterolo non-HDL','mg/dL'],['triglycerides','Trigliceridi','mg/dL']]],
 ['Fegato',[['ast','AST / GOT','U/L'],['alt','ALT / GPT','U/L']]],
 ['Emocromo',[['hemoglobin','Emoglobina','g/dL'],['rbc','Globuli rossi','milioni/µL'],['hematocrit','Ematocrito','%'],['wbc','Globuli bianchi','migliaia/µL'],['platelets','Piastrine','migliaia/µL'],['mcv','MCV','fL'],['mch','MCH','pg'],['mchc','MCHC','g/dL'],['rdw','RDW','%'],['mpv','MPV','fL']]],
 ['Formula leucocitaria', ['Neutrofili','Linfociti','Monociti','Eosinofili','Basofili','LUC'].flatMap((label,i)=>[[`leuco-${i}-pct`,label+' · percentuale','%'],[`leuco-${i}-abs`,label+' · assoluti','migliaia/µL']])],
 ['Urine',[['ur-color','Colore',''],['ur-aspect','Aspetto',''],['ur-ph','pH',''],['ur-density','Peso specifico',''],['ur-protein','Proteine','mg/dL'],['ur-glucose','Glucosio','mg/dL'],['ur-uro','Urobilinogeno','mg/dL'],['ur-bili','Bilirubina','mg/dL'],['ur-ketones','Corpi chetonici','mg/dL'],['ur-hb','Emoglobina','mg/dL'],['ur-nitrites','Nitriti',''],['ur-rbc','Eritrociti','p.c.m.'],['ur-wbc','Leucociti','p.c.m.'],['ur-casts','Cilindri',''],['ur-cells','Cellule epiteliali',''],['ur-flora','Flora batterica',''],['ur-mucus','Filamenti mucosi',''],['ur-salts','Sali amorfi',''],['ur-crystals','Cristalli','']]]
];
const clean=(s,n)=>typeof s==='string'?s.slice(0,n):'';
export function normalizeRoutine(value){return Array.isArray(value)?value.slice(0,160).filter(r=>r&&typeof r.key==='string').map(r=>({key:clean(r.key,80),label:clean(r.label,120),value:clean(r.value,200),unit:clean(r.unit,40),reference:clean(r.reference,120)})):[];}
export function nextVaccineDose(events,key,name='',excludeId){return 1+Math.max(0,...events.filter(e=>e.type==='health'&&e.category==='vaccine'&&e.id!==excludeId&&e.vaccineKey===key&&(key!=='other'||e.vaccineName===name)).map(e=>Number(e.doseNumber)||0));}
// Only IDs and times leave the device. The event timestamp is part of the key so rescheduling cancels the old plan.
export function appointmentReminderPlan(data,now=Date.now()){
 return data.events.filter(e=>e.type==='health'&&['analysis','visit'].includes(e.category)&&e.at>now).flatMap(e=>[24,1].map(hours=>({key:`appt-${e.id}-${e.at}-${hours}`,at:e.at-hours*3600000}))).filter(p=>p.at>now).sort((a,b)=>a.at-b.at);
}

export const PAST_DISEASES=[['measles','Morbillo'],['varicella','Varicella'],['mumps','Parotite'],['rubella','Rosolia'],['covid','COVID-19']];
export function normalizePastDiseases(value={}){
 const out={};for(const [key] of PAST_DISEASES){const item=value?.[key];const state=['yes','no','unknown'].includes(item?.state)?item.state:'unknown';const year=String(item?.year||'');out[key]={state,year:state==='yes'&&/^\d{4}$/.test(year)&&Number(year)>=1900&&Number(year)<=new Date().getFullYear()?year:'',notes:typeof item?.notes==='string'?item.notes.slice(0,2000):''};}return out;
}
