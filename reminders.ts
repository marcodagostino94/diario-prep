import { createClient } from 'npm:@supabase/supabase-js@2.49.1';
import webpush from 'npm:web-push@3.6.7';
const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const allowed=(Deno.env.get('ALLOWED_ORIGINS')||'https://marcodagostino94.github.io').split(',');
const digest=async(s:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(x=>x.toString(16).padStart(2,'0')).join('');
const equal=async(a:string,b:string)=>(await digest(a))===(await digest(b));
Deno.serve(async req=>{
 const origin=req.headers.get('origin')||'';
 const cors={'Access-Control-Allow-Origin':allowed.includes(origin)?origin:allowed[0],'Access-Control-Allow-Headers':'authorization,content-type,apikey,x-client-info,x-device-token','Access-Control-Allow-Methods':'POST,OPTIONS','Vary':'Origin'};
 const response=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}});
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 if(req.method!=='POST'||(origin&&!allowed.includes(origin)))return response({error:'Forbidden'},403);
 try{
 if(Number(req.headers.get('content-length')||0)>16000)return response({error:'Too large'},413);
 const raw=await req.text();if(raw.length>16000)return response({error:'Too large'},413);
 const b=JSON.parse(raw),token=(req.headers.get('x-device-token')||'');
 if(b.action==='public-key')return response({publicKey:Deno.env.get('VAPID_PUBLIC_KEY')});
 if(b.action==='dispatch'){
 const secret=Deno.env.get('CRON_SECRET');if(!secret||!await equal(token,secret))return response({error:'Unauthorized'},401);
 webpush.setVapidDetails('https://marcodagostino94.github.io/diario-prep/',Deno.env.get('VAPID_PUBLIC_KEY')!,Deno.env.get('VAPID_PRIVATE_KEY')!);
 const {data:due,error}=await db.rpc('prep_claim_due');if(error)throw error;
 let sent=0;
 for(const r of due||[]){try{
 const title=r.discreet?'Il tuo promemoria':'Diario PrEP';
 const body=r.discreet?'Apri il diario per controllare il tuo promemoria.':r.key.startsWith('expire-')?'Sono trascorsi 90 giorni dall’apertura. Dismetti il flacone e verifica la tua scorta.':r.key.startsWith('stock-')?'Scorta in esaurimento: soglia di '+r.key.split('-').at(-1)+' compresse raggiunta.':r.key.startsWith('start-')?'Controlla lo stato del ciclo e le prossime dosi.':'È il momento di controllare la prossima assunzione.';
 await webpush.sendNotification(r.subscription,JSON.stringify({title,body,tag:r.key,discreet:r.discreet}),{TTL:900,urgency:'high'});
 const {error:err}=await db.rpc('prep_finish_reminder',{p_device:r.device_id,p_key:r.key});if(err)throw err;sent++;
 }catch(e){if(e.statusCode===404||e.statusCode===410)await db.from('prep_devices').delete().eq('id',r.device_id);}}
 // Purge old scheduling metadata, retaining sent keys briefly for idempotency.
 await db.from('prep_reminders').delete().not('key','like','stock-%').lt('due_at',new Date(Date.now()-7*86400000).toISOString());
 return response({sent});
 }
 if(b.action==='register'){
 const s=b.subscription;const url=new URL(s?.endpoint||'');
 if(url.protocol!=='https:'||!(url.hostname.endsWith('.push.apple.com')||url.hostname==='fcm.googleapis.com'||url.hostname.endsWith('.notify.windows.com')||url.hostname.endsWith('.push.services.mozilla.com'))||url.port||url.username||url.password||url.search||typeof s?.keys?.p256dh!=='string'||s.keys.p256dh.length>200||typeof s?.keys?.auth!=='string'||s.keys.auth.length>100)return response({error:'Invalid subscription'},400);
 const newToken=crypto.randomUUID()+crypto.randomUUID(),proof=crypto.randomUUID()+crypto.randomUUID();
 const ip=req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';
 const {error}=await db.rpc('prep_begin_enrollment',{p_token:await digest(newToken),p_proof:await digest(proof),p_ip:await digest(ip+(Deno.env.get('CRON_SECRET')||'')),p_subscription:s});
 if(error)return response({error:'Activation temporarily limited'},429);
 webpush.setVapidDetails('https://marcodagostino94.github.io/diario-prep/',Deno.env.get('VAPID_PUBLIC_KEY')!,Deno.env.get('VAPID_PRIVATE_KEY')!);
 await webpush.sendNotification(s,JSON.stringify({kind:'activation',token:newToken,proof}),{TTL:600,urgency:'high'});
 return response({token:newToken,pending:true});
 }
 if(b.action==='confirm'){
 if(token.length!==72||typeof b.proof!=='string'||b.proof.length!==72)return response({error:'Unauthorized'},401);
 const {error}=await db.rpc('prep_confirm_enrollment',{p_token:await digest(token),p_proof:await digest(b.proof)});
 if(error)return response({error:'Activation expired'},401);
 return response({ok:true});
 }
 if(!token||token.length<64)return response({error:'Unauthorized'},401);
 const {data:device,error}=await db.from('prep_devices').select('id').eq('token_hash',await digest(token)).maybeSingle();if(error||!device)return response({error:'Unauthorized'},401);
 if(b.action==='remove'){const {error}=await db.from('prep_devices').delete().eq('id',device.id);if(error)throw error;return response({ok:true});}
 if(b.action==='sync'){
 if(!Array.isArray(b.plan)||b.plan.length>16||b.plan.some((p:any)=>typeof p.key!=='string'||p.key.length>100||!Number.isFinite(p.at)||p.at<Date.now()-60000||p.at>Date.now()+(p.key.startsWith('expire-')?91:7)*86400000)||new Set(b.plan.map((p:any)=>p.key)).size!==b.plan.length)return response({error:'Invalid plan'},400);
 const {error}=await db.rpc('prep_replace_plan',{p_device:device.id,p_plan:b.plan,p_discreet:b.discreet!==false});if(error)throw error;return response({ok:true});
 }
 return response({error:'Unknown action'},400);
 }catch{return response({error:'Request failed'},500);}
});
