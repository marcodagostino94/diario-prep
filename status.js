// Presentation policy: 24h is a conservative UI boundary, not a biological cutoff.
export function homeState(a, now=Date.now()) {
 const inactive=!a.start || (a.mode!=='daily'&&!a.issues.length&&((!a.lastSex&&now>a.last.at+90000000)||(!!a.lastSex&&a.remaining===0&&now>=a.last.at+86400000)));
 const review=a.issues.length>0;
 const reminderAt=review?a.scheduledNext:inactive?null:a.next||a.continuationAt;
 const optional=!review&&!a.next&&!!reminderAt;
 const due=!!reminderAt&&now>=reminderAt;
 const completed=!inactive&&!review&&a.kind==='complete';
 const state=review?'review':inactive?'inactive':a.kind==='waiting'?'waiting':due?'due':'protected';
 const colors={review:'red',inactive:'red',waiting:'sky',due:'yellow',protected:'green'};
 const titles={review:'Schema da verificare',inactive:'Non Protetto',waiting:'Protezione prevista tra',due:'È il momento della PrEP',protected:'Protetto'};
 return {state,color:colors[state],title:titles[state],reminderAt,optional,due,completed};
}
