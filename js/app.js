/* Sale Analytics – khởi động: đăng nhập không mật khẩu, phân quyền, đồng bộ dữ liệu dùng chung với máy chủ Apps Script (miễn phí). */
"use strict";
const CFG=window.APP_CONFIG||{API_URL:'/api'};
const LS={get(k,d){try{const v=localStorage.getItem(k);return v===null?d:JSON.parse(v)}catch(_){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(_){}},del(k){try{localStorage.removeItem(k)}catch(_){}}};
const API={
  session:LS.get('sa.session',null),
  async call(action,payload){
    let res;
    try{res=await fetch(CFG.API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action,payload:payload||{},session:API.session})})}
    catch(_){throw Object.assign(new Error('Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.'),{code:'network'})}
    if(res.status===402){API.call('reportCost',{source:'api',status:402}).catch(()=>{});throw Object.assign(new Error('Máy chủ báo yêu cầu thanh toán – đã dừng để tránh phát sinh chi phí.'),{code:'payment'})}
    const data=await res.json().catch(()=>({ok:false,error:{code:'server',message:'Máy chủ trả về dữ liệu lỗi'}}));
    if(!data.ok){if(data.error&&data.error.code==='auth'&&API.session&&action!=='verifyLogin'){API.logout();location.reload()}throw Object.assign(new Error(data.error.message),{code:data.error.code})}
    return data.data;
  },
  setSession(s){API.session=s;LS.set('sa.session',s)},
  logout(){API.session=null;LS.del('sa.session');LS.del('sa.demo')},
};
const RANK=['viewer','commenter','contributor','editor','owner'];
const ROLE_VI={viewer:'Viewer – chỉ xem',commenter:'Commenter – xem & bình luận',contributor:'Contributor – nhập & sửa dữ liệu bán hàng',editor:'Editor – toàn quyền, gồm chỉ tiêu, chính sách & mời người',owner:'Owner – chủ sở hữu'};
let ME=null,DEMO=false;
const can=r=>!!ME&&RANK.indexOf(ME.user.role)>=RANK.indexOf(r);

/* ---------- kho dữ liệu dùng chung ---------- */
const STORE={since:0,timer:0,queue:[],flushT:0,started:false};
function applyDocs(list){const touched=new Set();for(const d of list){const c=S.col[d.col];if(!c)continue;if(d.data==null)delete c[d.id];else c[d.id]=d.data;touched.add(d.col);if(d.at>STORE.since)STORE.since=d.at}return touched}
function setSync(st,t){const el=$('#sync');if(el){el.title=t;el.innerHTML=`<span class="dot ${st}"></span><span class="st-t">${esc(t)}</span>`}}
async function pull(full){
  try{const r=await API.call('pull',{since:full?0:Math.max(0,STORE.since-60000)});const t=applyDocs(r.docs);if(full)STORE.since=Math.max(STORE.since,r.now-60000);if(t.size||full){invalidate();scheduleRender()}setSync('on','Đồng bộ · '+new Date().toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'}))}
  catch(e){setSync('off',e.code==='network'?'Mất kết nối – thử lại sau':'Lỗi đồng bộ')}
}
function startStore(){if(STORE.started)return;STORE.started=true;STORE.timer=setInterval(()=>{if(!document.hidden)pull(false)},20000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)pull(false)})}
function enqueue(op){return new Promise((res,rej)=>{STORE.queue.push({op,res,rej});clearTimeout(STORE.flushT);STORE.flushT=setTimeout(flush,60)})}
async function flush(){
  const q=STORE.queue.splice(0,200);if(!q.length)return;
  try{await API.call('writeDocs',{ops:q.map(x=>x.op)});q.forEach(x=>x.res())}
  catch(e){const er=Object.assign(new Error(e.message),{code:e.code==='forbidden'?'not_granted':e.code});q.forEach(x=>x.rej(er));pull(false)}
  if(STORE.queue.length)flush();
}
function connectServer(){
  WRITER.set=(col,id,data)=>enqueue({op:'set',col,id,data});
  WRITER.del=(col,id)=>enqueue({op:'del',col,id});
  WRITER.batch=ops=>Promise.all(ops.map(o=>enqueue(o)));
  window.STORE_PULL=()=>pull(true);
  window.SHEETS=async(tool,input)=>API.call('sheets',{tool,input});
}

/* ---------- bình luận ---------- */
async function openComments(target){
  openDrawer(`<div class="dh"><div><h2 style="font-size:20px">Bình luận</h2><div class="small muted">${esc(target.split('|')[1]||target)}</div></div><button class="btn sm" data-act="close">Đóng</button></div><div class="panel" id="cmList"><span class="spin"></span></div>
   ${can('commenter')?`<div class="panel"><div class="form"><label class="full">Bình luận mới<textarea id="cm_text" rows="3" maxlength="2000" placeholder="Không nhập thông tin cá nhân nhạy cảm"></textarea></label></div><button class="btn pri" data-act="cmAdd" data-t="${esc(target)}" style="margin-top:8px">Gửi</button></div>`:''}`);
  try{const l=await API.call('listComments',{target});const box=document.getElementById('cmList');if(box)box.innerHTML=l.length?l.map(c=>`<div class="cm${c.resolved==='true'?' done':''}"><b>${esc(c.email)}</b> <span class="small muted">${new Date(c.at).toLocaleString('vi-VN')}</span><p>${esc(c.text)}</p>${c.resolved!=='true'&&(c.email===ME.user.email||can('editor'))?`<button class="btn sm ghost" data-act="cmResolve" data-id="${c.comment_id}" data-t="${esc(target)}">Đánh dấu đã xử lý</button>`:''}</div>`).join(''):'<p class="small muted">Chưa có bình luận.</p>'}catch(e){toast(e.message)}
}

/* ---------- màn hình đăng nhập & pháp lý ---------- */
const BRAND=`<div class="brand"><div class="mark">SA</div><div><b>Sale Analytics</b><small>AMG Việt Nam · khối Kinh doanh · dữ liệu mô phỏng</small></div></div>`;
function loginView(msg){
  document.getElementById('gate').innerHTML=`<div class="gate"><div class="gcard">${BRAND}
   <h1>Đăng nhập không cần mật khẩu</h1><p class="muted">Nhập email đã được mời. Hệ thống gửi link đăng nhập dùng một lần (hiệu lực 15 phút).</p>
   ${msg?`<div class="banner warn">${esc(msg)}</div>`:''}
   <form id="loginForm"><input type="email" id="lg_email" required autocomplete="email" placeholder="ten@congty.com" value="${esc(LS.get('sa.email',''))}">
   <label class="chk"><input type="checkbox" id="lg_ok" required> Tôi đồng ý <a href="#/legal/terms">Điều khoản sử dụng</a> và <a href="#/legal/privacy">Chính sách bảo mật</a></label>
   <button class="btn pri" type="submit">Gửi link đăng nhập</button></form>
   <div class="or">hoặc</div><button class="btn" id="lg_demo">Xem bản demo (không lưu dữ liệu)</button>
   <p class="small muted" style="margin-top:16px">Chỉ dùng dịch vụ miễn phí (GitHub Pages, Google Apps Script, Google Sheets). Khách hàng, nhân viên, số liệu là dữ liệu mô phỏng.<br><a href="#/legal/privacy">Bảo mật</a> · <a href="#/legal/terms">Điều khoản</a> · <a href="#/legal/disclaimer">Miễn trừ</a> · <a href="#/legal/complaints">Khiếu nại</a></p></div></div>`;
  document.getElementById('gate').hidden=false;
  document.getElementById('loginForm').onsubmit=async ev=>{ev.preventDefault();const email=document.getElementById('lg_email').value.trim();LS.set('sa.email',email);const b=ev.target.querySelector('button');b.disabled=true;
    try{const r=await API.call('requestLogin',{email,accept:document.getElementById('lg_ok').checked});
      const M2={sent:'Đã gửi link đăng nhập tới '+email+'. Kiểm tra hộp thư (cả mục Spam).',invite_only:'Email này chưa được mời. Liên hệ người quản trị để được cấp quyền.',revoked:'Quyền truy cập của email này đã bị thu hồi.',pending:'Yêu cầu truy cập đang chờ duyệt.',requested:'Đã gửi yêu cầu truy cập tới người quản trị.'};
      loginView(M2[r.status]||r.status)}catch(e){loginView(e.message)}};
  document.getElementById('lg_demo').onclick=()=>{DEMO=true;LS.set('sa.demo',true);startApp()};
}
function legalView(key){const g=document.getElementById('legal');g.innerHTML=`<div class="gate"><div class="gcard wide">${window.HTSLegal.html(key)}<p><button class="btn" id="lgBack">Quay lại</button></p></div></div>`;g.hidden=false;document.getElementById('lgBack').onclick=()=>{g.hidden=true;history.replaceState(null,'',location.pathname+'#'+(S.view||''))}}
window.addEventListener('hashchange',()=>{const h=location.hash;if(h.startsWith('#/legal/'))legalView(h.slice(8));else document.getElementById('legal').hidden=true});

function banner(){const b=$('#banner');if(!b)return;
  let x=false;try{x=!!sessionStorage.getItem('sa.bx')}catch(_){}const X='<button class="bx" data-act="bannerX" aria-label="Ẩn thông báo">×</button>';
  if(x)b.innerHTML='';
  else if(DEMO)b.innerHTML=`<div class="banner warn"><span>Bản demo · thay đổi không được lưu. <a href="#" data-act="logout">Đăng nhập</a> để lưu và cộng tác.</span>${X}</div>`;
  else if(!S.canWrite)b.innerHTML=`<div class="banner"><span>Bạn đang ${can('commenter')?'xem và bình luận':'chỉ xem'}. Cần thêm quyền? Liên hệ Editor/Owner.</span>${X}</div>`;else b.innerHTML=''}

V.access=()=>{
  const role=ME?ME.user.role:'demo';
  const mx=[['Xem dashboard, báo cáo, khách hàng, công nợ','yes','yes','yes','yes'],['Bình luận vào từng khối','no','yes','yes','yes'],['Tạo đơn, phiếu thu, cơ hội, check-in, hợp đồng, văn bản','no','no','yes','yes'],['Chạy tự động hóa, đồng bộ Google Sheets, chốt hoa hồng','no','no','yes','yes'],['Sửa chỉ tiêu, tham số pháp lý, gói quy định, giá kênh','no','no','no','yes'],['Mời người dùng, đổi quyền','no','no','no','yes*']];
  return `<div class="kpis">${kpi('Bạn đang dùng với vai trò',DEMO?'Demo (không lưu)':esc((ROLE_VI[role]||role).split(' – ')[0]),ME?esc(ME.user.email):'')}${kpi('Lưu trữ',DEMO?'Chỉ phiên này':'Google Sheets của Owner','Đồng bộ mỗi 20 giây')}${kpi('Liên kết',`<a href="${(window.APP_CONFIG&&APP_CONFIG.PEER_HR)||'https://levitri2711-glitch.github.io/hr-talent-studio/'}" target="_blank" rel="noopener noreferrer" style="font-size:16px">HR Analytics ↗</a>`,'Cùng tập đoàn AMG: lương 3P + hoa hồng')}</div>
  ${!DEMO&&can('editor')?panel('Mời người dùng theo email',`<div class="form"><label class="full">Email (cách nhau bằng dấu phẩy hoặc xuống dòng)<textarea id="iv_emails" rows="3" placeholder="a@congty.com, b@congty.com"></textarea></label><label>Quyền<select id="iv_role">${['viewer','commenter','contributor',...(ME.user.role==='owner'?['editor']:[])].map(r=>`<option value="${r}">${ROLE_VI[r]}</option>`).join('')}</select></label><label>Lời nhắn (tuỳ chọn)<input id="iv_msg" maxlength="300"></label><label class="full chk"><input type="checkbox" id="iv_mail" checked> Gửi email mời kèm link đăng nhập</label></div><button class="btn pri" data-act="ivSend" style="margin-top:10px">Mời</button><div id="ivOut" class="small" style="margin-top:8px"></div>`,{sub:'Giống chia sẻ Google Docs: người được mời đăng nhập bằng đúng email đó'})+panel('Người dùng & yêu cầu truy cập','<div id="usrBox"><span class="spin"></span></div>',{cls:'mt',act:'<button class="btn sm" data-act="usrLoad">Tải lại</button>'}):''}
  ${panel('Ma trận phân quyền',`<div class="tw"><table class="tbl matrix"><thead><tr><th>Thao tác</th><th>Viewer</th><th>Commenter</th><th>Contributor</th><th>Editor/Owner</th></tr></thead><tbody>${mx.map(r=>`<tr><td>${esc(r[0])}</td>${r.slice(1).map(c=>`<td class="${c.startsWith('yes')?'yes':'no'}">${c.startsWith('yes')?'Có'+(c.endsWith('*')?'*':''):'—'}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="small muted">* Editor mời được Viewer, Commenter, Contributor; chỉ Owner cấp/thu hồi Editor. Mọi quyền được kiểm tra lại ở máy chủ.</p>`,{cls:'mt'})}
  ${!DEMO&&ME&&ME.user.role==='owner'?panel('Cấu hình hệ thống (Owner)',`<div class="form"><label class="chk full"><input type="checkbox" id="cf_inv"${ME.config.invite_only==='true'?' checked':''}> Chỉ người được mời mới đăng nhập (khuyến nghị)</label><label class="chk full"><input type="checkbox" id="cf_mt"${ME.config.maintenance==='true'?' checked':''}> Chế độ bảo trì (chỉ Owner truy cập)</label><label class="chk full"><input type="checkbox" id="cf_demo"${ME.config.demo_mode!=='off'?' checked':''}> Cho phép xem bản demo không đăng nhập</label></div><button class="btn" data-act="cfSave" style="margin-top:8px">Lưu cấu hình</button>`,{cls:'mt'}):''}
  ${!DEMO?panel('Quyền dữ liệu của bạn',`<p class="small">Theo Luật Bảo vệ dữ liệu cá nhân 2025 và GDPR, bạn có quyền xem, tải về, sửa, xoá dữ liệu cá nhân và rút lại đồng ý.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" data-act="myData">Tải dữ liệu của tôi (JSON)</button><select id="pr_kind"><option value="access">Yêu cầu truy cập</option><option value="correct">Yêu cầu chỉnh sửa</option><option value="delete">Yêu cầu xoá tài khoản & dữ liệu</option><option value="withdraw">Rút lại đồng ý</option><option value="object">Phản đối xử lý</option></select><input id="pr_note" placeholder="Ghi chú" maxlength="500"><button class="btn" data-act="prSend">Gửi yêu cầu</button></div>`,{cls:'mt'})+(can('editor')?panel('Nhật ký bảo mật máy chủ','<div id="audBox"><button class="btn sm" data-act="audLoad">Xem 200 sự kiện gần nhất</button></div>',{cls:'mt'}):''):''}
  <p class="small muted mt">Phiên đăng nhập hết hạn sau 30 ngày. <a href="#" data-act="logout">${DEMO?'Đăng nhập':'Đăng xuất'}</a> · <a href="#/legal/privacy">Chính sách bảo mật</a> · <a href="#/legal/terms">Điều khoản</a></p>`;
};
async function loadUsers(){const box=document.getElementById('usrBox');if(!box)return;try{const r=await API.call('listUsers');const opt=(u)=>['viewer','commenter','contributor','editor'].map(x=>`<option value="${x}"${u.role===x?' selected':''}>${ROLE_VI[x].split(' – ')[0]}</option>`).join('');
  box.innerHTML=(r.requests.length?`<h4>Chờ duyệt</h4>${tbl(['Email','Lời nhắn',''],r.requests.map(q=>`<tr><td>${esc(q.requester)}</td><td class="small">${esc(q.note)}</td><td><button class="btn sm" data-act="arOk" data-id="${q.id}" data-r="viewer">Cấp Viewer</button> <button class="btn sm" data-act="arOk" data-id="${q.id}" data-r="contributor">Contributor</button> <button class="btn sm ghost" data-act="arOk" data-id="${q.id}" data-r="deny">Từ chối</button></td></tr>`))}`:'')+
  tbl(['Email','Quyền','Trạng thái','Người duyệt',''],r.users.map(u=>`<tr><td>${esc(u.email)}</td><td>${u.role==='owner'?'Owner':`<select data-email="${esc(u.email)}" class="roleSel">${opt(u)}</select>`}</td><td>${u.status==='active'?pill('Hoạt động','ok'):pill('Đã thu hồi','mute')}</td><td class="small">${esc(u.approved_by||'')}</td><td>${u.role!=='owner'&&u.status==='active'?`<button class="btn sm ghost" data-act="usrRevoke" data-email="${esc(u.email)}">Thu hồi</button>`:''}</td></tr>`))}catch(e){box.textContent=e.message}}
document.addEventListener('change',async ev=>{const el=ev.target;if(!el.classList||!el.classList.contains('roleSel'))return;try{await API.call('setRole',{email:el.dataset.email,role:el.value});toast('Đã đổi quyền')}catch(e){toast(e.message)}loadUsers()});
Object.assign(ACT,{
 logout:()=>{API.logout();location.hash='';location.reload()},
 cmAdd:async b=>{const t=val('cm_text').trim();if(!t)return;try{await API.call('addComment',{target:b.dataset.t,text:t});openComments(b.dataset.t)}catch(e){toast(e.message)}},
 cmResolve:async b=>{try{await API.call('resolveComment',{comment_id:b.dataset.id});openComments(b.dataset.t)}catch(e){toast(e.message)}},
 ivSend:async()=>{try{const r=await API.call('inviteUsers',{emails:val('iv_emails'),role:val('iv_role'),message:val('iv_msg'),send_mail:document.getElementById('iv_mail').checked});const L={invited:'đã mời',granted:'đã cấp quyền',granted_no_mail:'đã cấp quyền (chưa gửi được email)',exists:'đã có quyền này',invalid:'email không hợp lệ',forbidden:'không đủ quyền'};document.getElementById('ivOut').innerHTML=r.results.map(x=>`${esc(x.email)}: ${L[x.status]||x.status}`).join('<br>');loadUsers()}catch(e){toast(e.message)}},
 usrLoad:loadUsers,
 usrRevoke:async b=>{if(!confirm('Thu hồi quyền của '+b.dataset.email+'?'))return;try{await API.call('setRole',{email:b.dataset.email,role:'revoked'});toast('Đã thu hồi')}catch(e){toast(e.message)}loadUsers()},
 arOk:async b=>{try{await API.call('decideRequest',{id:b.dataset.id,role:b.dataset.r});toast('Đã xử lý')}catch(e){toast(e.message)}loadUsers()},
 cfSave:async()=>{try{ME.config=await API.call('updateConfig',{values:{invite_only:document.getElementById('cf_inv').checked,maintenance:document.getElementById('cf_mt').checked,demo_mode:document.getElementById('cf_demo').checked?'on':'off'}});toast('Đã lưu cấu hình')}catch(e){toast(e.message)}},
 myData:async()=>{try{const d=await API.call('myData');DL.save({filename:'du-lieu-cua-toi.json',data:JSON.stringify(d,null,1),mimeType:'application/json'})}catch(e){toast(e.message)}},
 prSend:async()=>{try{await API.call('privacyRequest',{kind:val('pr_kind'),note:val('pr_note')});toast('Đã gửi yêu cầu tới Owner. Phản hồi trong tối đa 30 ngày.')}catch(e){toast(e.message)}},
 audLoad:async()=>{try{const l=await API.call('auditLog',{limit:200});document.getElementById('audBox').innerHTML=tbl(['Thời điểm','Người','Hành động','Đối tượng'],l.map(a=>`<tr><td>${new Date(a.at).toLocaleString('vi-VN')}</td><td>${esc(a.actor)}</td><td>${esc(a.action)}</td><td class="small">${esc(a.target)}</td></tr>`))}catch(e){toast(e.message)}},
});
window.onGo=v=>{if(v==='access'&&!DEMO&&can('editor'))setTimeout(loadUsers,0)};

/* ---------- khởi động ---------- */
function startApp(){
  document.getElementById('gate').hidden=true;
  if(DEMO){S.mode='demo';S.canWrite=true;S.canAdmin=true;S.canComment=false;S.meId='demo'}
  else{S.mode='live';window.ME=ME;S.meId=ME.user.email;S.canWrite=can('contributor');S.canAdmin=can('editor');S.canComment=can('commenter');connectServer();startStore()}
  const h0=location.hash.slice(1);if(V[h0])S.view=h0;
  const w=$('#who');if(w){const em=DEMO?'':ME.user.email,ini=DEMO?'D':(em[0]||'?').toUpperCase();w.innerHTML=`<details class="acct"><summary aria-label="Tài khoản"><span class="av">${esc(ini)}</span><span class="hide-m">${DEMO?'Demo':esc(ME.user.role_label)}</span></summary><div class="menu" role="menu"><div class="mh">${DEMO?'<b>Bản demo</b><span>Dữ liệu chỉ tồn tại trong phiên này</span>':`<b>${esc(em)}</b><span>${esc(ME.user.role_label)}</span>`}</div><button data-act="go" data-v="access">Chia sẻ & phân quyền</button><a href="${(window.APP_CONFIG&&APP_CONFIG.PEER_HR)||'#'}" target="_blank" rel="noopener">HR Analytics <span>↗</span></a><button data-act="focus">Chế độ tập trung <kbd>F</kbd></button><a href="#/legal/privacy">Chính sách bảo mật</a><button data-act="logout" class="mx">${DEMO?'Đăng nhập':'Đăng xuất'}</button></div></details>`;
    document.addEventListener('click',ev=>{const d=w.querySelector('details');if(d&&d.open&&(!d.contains(ev.target)||ev.target.closest('.menu [data-act],.menu a')))d.open=false})}
  setSync(DEMO?'off':'on',DEMO?'Bản demo':'Đang tải dữ liệu chung…');
  render();tick();setInterval(tick,30000);
  if(!DEMO)pull(true).then(()=>{if(S.view==='access')loadUsers()});
}
(async function boot(){
  const h=location.hash;
  if(h.startsWith('#/legal/'))legalView(h.slice(8));
  if(h.startsWith('#/login/')){history.replaceState(null,'',location.pathname);try{const r=await API.call('verifyLogin',{token:h.slice(8)});API.setSession(r.session)}catch(e){API.logout();return loginView(e.message)}}
  if(!API.session){if(LS.get('sa.demo',false)||new URLSearchParams(location.search).has('demo')){DEMO=true;return startApp()}return loginView()}
  try{ME=await API.call('me')}catch(e){return loginView(e.message)}
  startApp();
})();
if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('sw.js').catch(()=>{});
