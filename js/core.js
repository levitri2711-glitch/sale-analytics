/* Sale Analytics – lõi: tiện ích, ngẫu nhiên có hạt giống, biểu đồ SVG, khối giao diện, trạng thái và ghi dữ liệu. */
"use strict";
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Math.round(n||0).toLocaleString('vi-VN');
const fmtD=(n,d=1)=>(+n||0).toLocaleString('vi-VN',{maximumFractionDigits:d});
const fmtM=n=>((n||0)/1e6).toLocaleString('vi-VN',{maximumFractionDigits:1})+' tr';
const fmtB=n=>((n||0)/1e9).toLocaleString('vi-VN',{maximumFractionDigits:2})+' tỷ';
const fmtA=n=>Math.abs(n||0)>=1e9?fmtB(n):fmtM(n);
const pct=(x,d=1)=>(isFinite(x)?(x||0)*100:0).toLocaleString('vi-VN',{maximumFractionDigits:d})+'%';
const z2=n=>String(n).padStart(2,'0');
const iso=d=>d.getFullYear()+'-'+z2(d.getMonth()+1)+'-'+z2(d.getDate());
const parse=s=>{if(!s)return null;if(s instanceof Date)return s;const[y,m,d]=String(s).slice(0,10).split('-').map(Number);return new Date(y,m-1,d||1)};
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const addMonths=(d,n)=>{const x=new Date(d);x.setMonth(x.getMonth()+n);return x};
const days=(a,b)=>Math.round((parse(b)-parse(a))/86400000);
const vn=s=>{const d=parse(s);return d?d.toLocaleDateString('vi-VN'):'—'};
const ym=d=>{d=parse(d);return d.getFullYear()+'-'+z2(d.getMonth()+1)};
const monthName=k=>{const[y,m]=k.split('-');return 'T'+(+m)+'/'+y.slice(2)};
const sum=(a,f=x=>x)=>a.reduce((s,x)=>s+(+f(x)||0),0);
const avg=(a,f=x=>x)=>a.length?sum(a,f)/a.length:0;
const groupBy=(a,f)=>a.reduce((m,x)=>{const k=f(x);(m[k]||(m[k]=[])).push(x);return m},{});
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const safeId=s=>String(s).replace(/[^A-Za-z0-9_.-]/g,'_').slice(0,140);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const MONTHS=['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];
const isWorkday=d=>d.getDay()!==0;
function hashStr(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function rngOf(seed){const R=mulberry32(typeof seed==='number'?seed:hashStr(String(seed)));return{R,pick:a=>a[Math.floor(R()*a.length)],between:(a,b)=>a+R()*(b-a),ri:(a,b)=>a+Math.floor(R()*(b-a+1)),chance:p=>R()<p,gauss:()=>{const u=R()||1e-9,v=R();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)}}}
/* Ngày “hôm nay” thật của máy người dùng: mọi tuổi nợ, hạn hợp đồng, quy định theo hiệu lực đều tính đến ngày này. */
function realToday(){const n=new Date();const t=new Date(n.getFullYear(),n.getMonth(),n.getDate());return t<new Date(2026,0,1)?new Date(2026,10,16):t}

/* ---------- số tiền bằng chữ (biên bản, hợp đồng) ---------- */
function vnWords(n){
  n=Math.round(Math.abs(n||0));if(!n)return 'Không đồng';
  const d=['không','một','hai','ba','bốn','năm','sáu','bảy','tám','chín'];
  const three=(x,full)=>{const h=Math.floor(x/100),t=Math.floor(x%100/10),u=x%10;let s=[];
    if(full||h)s.push(d[h]+' trăm');
    if(t>1){s.push(d[t]+' mươi');if(u===1)s.push('mốt');else if(u===5)s.push('lăm');else if(u)s.push(d[u])}
    else if(t===1){s.push('mười');if(u===5)s.push('lăm');else if(u)s.push(d[u])}
    else if(u){if(full||h)s.push('linh');s.push(d[u])}
    return s.join(' ')};
  const below=(x,full)=>{const tr=Math.floor(x/1e6),ng=Math.floor(x%1e6/1e3),u=x%1e3,o=[];
    if(tr){o.push(three(tr,full)+' triệu');full=true}
    if(ng){o.push(three(ng,full)+' nghìn');full=true}
    if(u)o.push(three(u,full));return o.join(' ')};
  const ty=Math.floor(n/1e9),rest=n%1e9;let s=[ty?below(ty,false)+' tỷ':'',rest?below(rest,!!ty):''].filter(Boolean).join(' ');
  return s.charAt(0).toUpperCase()+s.slice(1)+' đồng';
}

/* ---------- biểu đồ ---------- */
const COLORS=['var(--c1)','var(--c2)','var(--c3)','var(--c4)','var(--c5)','var(--c6)'];
function niceMax(v){if(v<=0)return 1;const p=Math.pow(10,Math.floor(Math.log10(v))),n=v/p;return(n<=1?1:n<=2?2:n<=2.5?2.5:n<=5?5:10)*p}
function hbars(items,{f=fmt,color='var(--c1)',max,act}={}){
  const mx=max||Math.max(1,...items.map(i=>Math.abs(i.v)));
  return `<div class="bars">${items.map(i=>`<div class="bar"${act&&i.id?` data-act="${act}" data-id="${esc(i.id)}" role="button" tabindex="0" style="cursor:pointer"`:''}><span class="lb" title="${esc(i.l)}">${esc(i.l)}</span><span class="tr"><span class="fl" style="width:${clamp(Math.abs(i.v)/mx*100,0,100).toFixed(1)}%;background:${i.c||color}"></span>${i.mark!=null?`<span class="mk" style="left:${clamp(i.mark/mx*100,0,100).toFixed(1)}%"></span>`:''}</span><span class="vl">${f(i.v)}</span></div>`).join('')}</div>`;
}
function colChart(labels,series,{h=230,f=v=>fmtA(v),line,stack}={}){
  const W=660,H=h,pl=54,pr=10,pt=12,pb=26;
  const tops=stack?labels.map((_,i)=>sum(series,s=>s.values[i]||0)):series.flatMap(s=>s.values.filter(v=>v!=null));
  const max=niceMax(Math.max(1,...tops,...(line?line.values.filter(v=>v!=null):[])));
  let g='';for(let i=0;i<=4;i++){const y=pt+(H-pt-pb)*(1-i/4);g+=`<line class="grid" x1="${pl}" x2="${W-pr}" y1="${y}" y2="${y}"/><text class="tick" x="${pl-6}" y="${y+4}" text-anchor="end">${esc(f(max*i/4))}</text>`}
  const bw=(W-pl-pr)/labels.length,inner=stack?bw*.6:bw*.7/series.length;
  labels.forEach((l,i)=>{let acc=0;series.forEach((s,j)=>{const v=s.values[i]||0,bh=(H-pt-pb)*v/max;const x=stack?pl+i*bw+bw*.2:pl+i*bw+bw*.15+j*inner;const y=stack?H-pb-bh-acc:H-pb-bh;if(v>0)g+=`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${Math.max(1,inner-2).toFixed(1)}" height="${bh.toFixed(1)}" rx="2" style="fill:${s.c}"><title>${esc(s.n)} ${esc(l)}: ${esc(f(v))}</title></rect>`;if(stack)acc+=bh});
    if(labels.length<=16||i%2===0)g+=`<text class="tick" x="${(pl+i*bw+bw/2).toFixed(1)}" y="${H-8}" text-anchor="middle">${esc(l)}</text>`});
  if(line){const pts=line.values.map((v,i)=>v==null?null:[pl+i*bw+bw/2,H-pb-(H-pt-pb)*v/max]).filter(Boolean);
    g+=`<polyline fill="none" style="stroke:${line.c}" stroke-width="2" ${line.dash?'stroke-dasharray="5 4"':''} points="${pts.map(p=>p.map(n=>n.toFixed(1)).join(',')).join(' ')}"/>`+pts.map((p,i)=>`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${i===pts.length-1?4:2.5}" style="fill:${line.c}"><title>${esc(line.n)} ${esc(labels[i]||'')}: ${esc(f(line.values[i]))}</title></circle>`).join('')}
  const leg=[...series.map(s=>[s.n,s.c]),...(line?[[line.n,line.c]]:[])];
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(leg.map(x=>x[0]).join(', '))}">${g}</svg><div class="legend">${leg.map(([n,c])=>`<span><i style="background:${c}"></i>${esc(n)}</span>`).join('')}</div>`;
}
function donut(items,center,{f=fmt,unit='tổng'}={}){
  const tot=sum(items,i=>i.v)||1,r=56,C=2*Math.PI*r;let off=0;
  const segs=items.map((it,i)=>{const len=C*it.v/tot,s=`<circle r="${r}" cx="75" cy="75" fill="none" style="stroke:${it.c||COLORS[i%6]}" stroke-width="20" stroke-dasharray="${len.toFixed(2)} ${(C-len).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}" transform="rotate(-90 75 75)"><title>${esc(it.l)}: ${esc(f(it.v))}</title></circle>`;off+=len;return s}).join('');
  return `<div class="donut"><svg viewBox="0 0 150 150" role="img">${segs}<text x="75" y="72" text-anchor="middle" class="lbl" style="font-size:17px;font-family:var(--f-mono)">${esc(center??f(tot))}</text><text x="75" y="90" text-anchor="middle" class="tick">${esc(unit)}</text></svg><div class="legend">${items.map((it,i)=>`<span><i style="background:${it.c||COLORS[i%6]}"></i>${esc(it.l)} · <b class="num">${esc(f(it.v))}</b> (${pct(it.v/tot,0)})</span>`).join('')}</div></div>`;
}
function funnel(steps){const mx=Math.max(1,...steps.map(s=>s.v));return `<div class="funnel">${steps.map((s,i)=>`<div class="fs"><span class="lb">${esc(s.l)}</span><span class="fb" style="width:${clamp(s.v/mx*100,4,100).toFixed(1)}%;background:${s.c||COLORS[i%6]}">${fmt(s.v)}</span><span class="small muted">${i?pct(s.v/Math.max(1,steps[i-1].v),0)+' so với bước trước':''}</span></div>`).join('')}</div>`}
function gauge(v,label){const p=clamp(v,0,1.5),a=Math.PI*(1-Math.min(p,1)),x=70+56*Math.cos(a),y=70-56*Math.sin(a);const c=v>=1?'var(--ok)':v>=.85?'var(--warn)':'var(--crit)';
  return `<svg viewBox="0 0 140 84" class="gauge" role="img" aria-label="${esc(label)} ${pct(v,0)}"><path d="M14 70 A56 56 0 0 1 126 70" fill="none" stroke="var(--surface-2)" stroke-width="12" stroke-linecap="round"/><path d="M14 70 A56 56 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)}" fill="none" style="stroke:${c}" stroke-width="12" stroke-linecap="round"/><text x="70" y="66" text-anchor="middle" style="font:600 20px var(--f-mono);fill:var(--ink)">${pct(v,0)}</text><text x="70" y="82" text-anchor="middle" class="tick">${esc(label)}</text></svg>`}
function spark(vals,c='var(--c1)'){const mx=Math.max(1,...vals),W=90,H=24;return `<svg viewBox="0 0 ${W} ${H}" class="spark"><polyline fill="none" style="stroke:${c}" stroke-width="1.6" points="${vals.map((v,i)=>`${(i/(Math.max(1,vals.length-1))*W).toFixed(1)},${(H-2-(v/mx)*(H-4)).toFixed(1)}`).join(' ')}"/></svg>`}
const countBy=(a,f)=>Object.entries(groupBy(a,f)).map(([l,x])=>({l,v:x.length}));
const sumBy=(a,k,f)=>Object.entries(groupBy(a,k)).map(([l,x])=>({l,v:sum(x,f)}));

/* ---------- khối giao diện ---------- */
function panel(title,body,{sub='',act='',cls='',id=''}={}){
  return `<section class="panel ${cls}"${id?` id="${id}"`:''}><header><h3>${title}</h3>${sub?`<span class="sub">${sub}</span>`:''}<div class="act">${act}${S.canComment?`<button class="btn sm ghost" data-act="comment" title="Bình luận vào khối này">Bình luận</button>`:''}</div></header>${body}</section>`;
}
const kpi=(l,v,s='',cls='',go='')=>`<div class="kpi ${cls}"${go?` data-act="go" data-v="${go}" role="button" tabindex="0" style="cursor:pointer"`:''}><span class="l">${l}</span><span class="v">${v}</span>${s?`<span class="s">${s}</span>`:''}</div>`;
const pill=(t,c='mute')=>`<span class="pill ${c}">${esc(t)}</span>`;
const sevName={crit:'Khẩn',warn:'Cần xử lý',info:'Theo dõi'};
const lock=()=>S.canWrite?'':' disabled title="Bạn chỉ có quyền xem/bình luận"';
const lockAdmin=()=>S.canAdmin?'':' disabled title="Chỉ Editor hoặc Owner"';
function tbl(head,rows,foot,cls=''){return `<div class="tw"><table class="tbl ${cls}"><thead><tr>${head.map(h=>typeof h==='string'?`<th>${h}</th>`:`<th class="n">${h[0]}</th>`).join('')}</tr></thead><tbody>${rows.join('')||`<tr><td colspan="${head.length}" class="muted">Không có dữ liệu</td></tr>`}</tbody>${foot?`<tfoot>${foot}</tfoot>`:''}</table></div>`}
const td=(v,cls='')=>`<td class="${cls}">${v}</td>`;
const tdn=v=>`<td class="n">${v}</td>`;
const prog=(v,cls='')=>`<span class="prog ${cls||(v>=1?'ok':v>=.85?'warn':'crit')}"><i style="width:${clamp(v*100,0,100).toFixed(0)}%"></i></span>`;
const optHtml=(arr,cur)=>arr.map(o=>{const[v,l]=Array.isArray(o)?o:[o,o];return `<option value="${esc(v)}"${String(v)===String(cur)?' selected':''}>${esc(l)}</option>`}).join('');
const val=id=>{const el=document.getElementById(id);return el?el.value:''};
const num=id=>+String(val(id)).replace(/[^\d.-]/g,'')||0;
function mdLite(s){return esc(s).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/\n/g,'<br>')}

/* ---------- trạng thái ---------- */
const COLS=['customers','orders','payments','opps','visits','contracts','docs','tasks','runs','audit','stock','campaigns','forecasts','commission','tickets','targets','settings','policyHistory','pricing','bridge'];
const S={view:'overview',col:Object.fromEntries(COLS.map(c=>[c,{}])),canWrite:true,canAdmin:true,canComment:false,mode:'demo',meId:null,
  f:{period:'ytd',region:'',channel:'',team:'',q:'',page:0,debtBucket:'',debtQ:'',orderQ:'',orderSt:'',oppStage:'',custQ:'',custTier:'',docType:'contract',docRef:'',kpiMonth:'',commMonth:'',excel:'',tip:'all',legal:'all'},
  sheet:{busy:'',msg:''},busy:''};
let renderT=0;function scheduleRender(){clearTimeout(renderT);renderT=setTimeout(()=>{if(window.render)render()},30)}

/* ---------- ghi dữ liệu (app.js nối với máy chủ; bản demo chỉ giữ trong phiên) ---------- */
const WRITER={set:null,del:null};
async function put(col,id,data){
  id=safeId(id);const had=id in S.col[col],prev=S.col[col][id];S.col[col][id]=data;invalidate();scheduleRender();
  const undo=()=>{if(had)S.col[col][id]=prev;else delete S.col[col][id];invalidate();scheduleRender()};// máy chủ từ chối → hoàn tác bản ghi cục bộ
  if(WRITER.set){try{await WRITER.set(col,id,data)}catch(e){undo();toast('Không lưu được: '+(e&&e.code==='not_granted'?'bạn không có quyền với dữ liệu này':(e&&e.message)||'lỗi kết nối'));throw e}}
}
async function putMany(col,map){const ids=Object.keys(map);const bak={};ids.forEach(id=>{const k=safeId(id);bak[k]=[k in S.col[col],S.col[col][k]];S.col[col][k]=map[id]});invalidate();scheduleRender();
  if(WRITER.batch){try{await WRITER.batch(ids.map(id=>({op:'set',col,id:safeId(id),data:map[id]})))}catch(e){Object.entries(bak).forEach(([k,[h,v]])=>{if(h)S.col[col][k]=v;else delete S.col[col][k]});invalidate();scheduleRender();toast('Không lưu được: '+((e&&e.message)||'lỗi'));throw e}}}
async function remove(col,id){const prev=S.col[col][id];delete S.col[col][id];invalidate();scheduleRender();if(WRITER.del){try{await WRITER.del(col,id)}catch(e){if(prev!==undefined)S.col[col][id]=prev;invalidate();scheduleRender();toast('Không xoá được');throw e}}}
function audit(action,detail){return put('audit',uid(),{at:Date.now(),by:S.meId||'demo',action,detail:String(detail||'').slice(0,400)}).catch(()=>{})}
function logRun(type,summary){return put('runs',uid(),{at:Date.now(),by:S.meId||'demo',type,summary:String(summary).slice(0,600)}).catch(()=>{})}
function toast(t){const el=$('#toast');if(!el)return;el.textContent=t;el.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>el.hidden=true,4200)}
function openDrawer(html){$('#drawer').innerHTML=html;$('#drawerWrap').hidden=false;const f=$('#drawer button, #drawer input');if(f)f.focus()}
function closeDrawer(){$('#drawerWrap').hidden=true;$('#drawer').innerHTML=''}
let _dirty=true;function invalidate(){_dirty=true}
