(function(root){'use strict';
const JP='[\\p{Script=Han}\\p{Script=Hiragana}\\p{Script=Katakana}ー]';
const compact=s=>s.replace(/\s/g,'');
const cleanJapanese=s=>s.replace(new RegExp('('+JP+')\\s+(?='+JP+')','gu'),'$1');
function parseOCR(text){
 const lines=String(text||'').normalize('NFKC').replace(/[‐‑‒–—−ー](?=\d)/g,'-').split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
 const out=Object.fromEntries(MeishiCore.fields.map(k=>[k,''])),memo=[];
 for(const line of lines){
  const tight=compact(line),clean=cleanJapanese(line);
  const emailLine=line.replace(/([A-Z0-9._%+\-])\s*@\s*/ig,'$1@').replace(/@\s*/g,'@').replace(/\s*\.\s*/g,'.');
  const email=emailLine.match(/[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  if(email)out.email||=email[0];
  if(/株式会社|有限会社|合同会社|合資会社|一般社団法人|医療法人|Inc\b|Corporation|Co\.,?\s*Ltd|LLC\b/i.test(tight))out.company||=clean;
  if(/代表|取締役|社長|部長|課長|主任|マネージャー|manager|director|president/i.test(tight))out.title||=clean;
  if(/部|課|室|division|department/i.test(tight)&&!/株式会社|有限会社|合同会社/.test(tight)&&!/部長|課長|室長/.test(tight))out.department||=clean;
  const nums=line.match(/(?:\+\d{1,3}[- ()]*)?0\d{1,4}[- ().]*\d{1,4}[- ().]*\d{3,4}/g)||[];
  for(const raw of nums){const n=raw.trim().replace(/[ .()]+/g,'-').replace(/-+/g,'-'),digits=n.replace(/\D/g,'');if(digits.length<10||digits.length>15)continue;
   if(/FAX|ファクス|ファックス/i.test(tight)){memo.push('FAX: '+n);continue}
   if(/携帯|mob[iIl1]*[lI1]e|mobile|cell/i.test(tight)||/^0[789]0/.test(digits))out.mobile||=n;else out.phone||=n;
  }
  if(/〒|[都道府県].*[市区町村]|(?:市|区|町).*[0-9]|タワー|ビル/.test(clean))memo.push(clean);
 }
 const excluded=l=>[out.company,out.department,out.title].some(v=>v&&compact(v)===compact(l));
 for(const line of lines){if(excluded(line)||/[\d@〒]/.test(line)||/^(?:TEL|FAX|E-?mail|Mobile|住所|電話)/i.test(line))continue;
  const labelled=line.match(/^(?:氏名|名前|name)\s*[:：]\s*(.+)$/i);
  let candidate=labelled?labelled[1]:line;
  const mixed=candidate.match(new RegExp('^('+JP+'(?:'+JP+'|[ 　]){1,22})\\s+[A-Za-z]','u'));
  if(mixed)candidate=mixed[1].trim();
  if(new RegExp('^'+JP+'(?:'+JP+'|[ 　]){1,22}$','u').test(candidate)){
   const parts=candidate.split(/\s+/);out.name=parts.length>2?compact(candidate):candidate;break;
  }
  if(labelled||/^[A-Z][A-Za-z'-]+(?: +[A-Z][A-Za-z'-]+){1,3}$/.test(candidate)){out.name=candidate;break}
 }
 out.memo=[...new Set(memo)].join('\n');return out;
}
MeishiCore.parseOCR=parseOCR;
if(typeof module!=='undefined')module.exports=parseOCR;
})(globalThis);
