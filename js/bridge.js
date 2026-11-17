/* Liên thông AMG: Sale Analytics ⇄ HR Analytics.
   Sale gửi: sale.perf (hiệu suất & hoa hồng tháng đã chốt), sale.hiring (nhu cầu tuyển sales).
   Sale nhận: hr.roster (nhân sự khối Kinh doanh: người mới, thử việc, nghỉ việc) → tạo việc hội nhập/bàn giao.
   Dữ liệu đi qua máy chủ của chính Owner (tab AMG_Bridge trong file CSDL riêng tư); không dùng dịch vụ bên ngoài. */
const PEER_HR=(window.APP_CONFIG&&APP_CONFIG.PEER_HR)||'https://levitri2711-glitch.github.io/hr-talent-studio/';
const BR={status:null,loading:false};
const brLive=()=>typeof API!=='undefined'&&!!API.session&&!(typeof DEMO!=='undefined'&&DEMO);
const hrLink=(view,label)=>`<a href="${PEER_HR}${view?'#'+view:''}" target="_blank" rel="noopener">${label||'HR Analytics'} ↗</a>`;
const brMonth=()=>ym(new Date(M.T.getFullYear(),M.T.getMonth()-1,1));// tháng gần nhất đã đóng sổ
const HR_REGION={HN:'BAC',DNG:'TRUNG',HCM:'NAM'};
const brRoster=()=>(S.col.bridge||{})['hr.roster']||null;

// Ghép nhân viên Sale ↔ mã nhân sự HR theo cấp bậc rồi theo mã (quy tắc cố định, có thể đối soát ở màn Đội ngũ).
function brMap(){const ro=brRoster();if(!ro||!ro.rows)return{};
  const tierS=r=>({Director:0,RSM:1,Lead:2}[r.level]??3);
  const tierH=t=>/Giám đốc/.test(t)?0:/Trưởng phòng/.test(t)?1:/Trưởng nhóm/.test(t)?2:3;
  const hs=ro.rows.filter(e=>!e.exit).slice().sort((a,b)=>tierH(a.title)-tierH(b.title)||a.id.localeCompare(b.id));
  const ss=M.reps.slice().sort((a,b)=>tierS(a)-tierS(b)||a.id.localeCompare(b.id));
  const used=new Set(),map={};
  for(const t of [0,1,2,3])ss.filter(r=>tierS(r)===t).forEach(r=>{const h=hs.find(e=>!used.has(e.id)&&tierH(e.title)===t)||hs.find(e=>!used.has(e.id)&&tierH(e.title)>=t);if(h){used.add(h.id);map[r.id]=h}});
  return map}

function salePerf(){const mk=brMonth(),cm=commission(M,mk),map=brMap();
  const rows=cm.map(c=>({id:c.r.id,name:c.r.name,title:c.r.title,team:c.r.team,region:c.r.region,hrId:(map[c.r.id]||{}).id||'',hrName:(map[c.r.id]||{}).name||'',
    tgt:Math.round(c.tgt),rev:Math.round(c.rev),ach:+(c.ach||0).toFixed(4),collected:Math.round(c.collected),rate:c.rate,commission:Math.round(c.net),od90:Math.round(c.od90)}));
  return{month:mk,asOf:M.TS,rows,total:sum(rows,r=>r.commission),rule:`Bậc ${P('c1')}%/${P('c2')}%/${P('c3')}% trên tiền đã thu theo mức đạt chỉ tiêu; trừ phần nợ quá hạn >90 ngày`}}

function saleHiring(){const mk=ym(M.T),out=[];const avgCust=M.customers.length/Math.max(1,M.reps.filter(r=>r.quota).length);
  for(const t of TEAMS){const rs=M.repStats.filter(r=>r.team===t.id);if(!rs.length)continue;const ach=sum(rs,r=>r.rev)/Math.max(1,sum(rs,r=>r.tgt)),load=sum(rs,r=>r.cust)/rs.length;
    const why=[];if(ach>=1.05)why.push('vượt chỉ tiêu '+pct(ach,0));if(load>avgCust*1.3)why.push('tải '+Math.round(load)+' khách/người');
    if(why.length)out.push({key:`SA-${mk}-${t.id}`,team:t.id,teamName:t.name,region:t.region,title:t.ch==='KA'||t.ch==='MT'?'Key Account Executive':t.ch==='EC'?'Chuyên viên TMĐT':'Sales Executive',qty:1,grade:5,prio:ach>=1.15?'Cao':'Trung bình',reason:'Mở rộng: '+why.join(', '),budget:15e6})}
  const ro=brRoster();if(ro&&ro.rows){const since=iso(addDays(M.T,-120));const ex=ro.rows.filter(e=>e.exit&&e.exit>=since&&e.exit<=M.TS);
    Object.entries(groupBy(ex,e=>HR_REGION[e.site]||'NAM')).forEach(([rg,l])=>out.push({key:`SA-${mk}-RP-${rg}`,team:'',teamName:'Thay thế '+REGIONS[rg],region:rg,title:'Sales Executive',qty:l.length,grade:5,prio:'Cao',reason:'Thay thế '+l.length+' người nghỉ việc: '+l.map(e=>e.name).join(', '),budget:15e6*l.length}))}
  return{month:mk,asOf:M.TS,rows:out}}

async function brPush(topic,data){if(!brLive())throw new Error('Cần đăng nhập (không chạy ở bản demo) để liên thông với HR Analytics');return API.call('bridgePush',{topic,data})}
async function brPull(topic){if(!brLive())throw new Error('Cần đăng nhập (không chạy ở bản demo) để liên thông với HR Analytics');return API.call('bridgePull',{topic})}
async function brLoadStatus(force){if(!brLive()||BR.loading||(BR.status&&!force))return;BR.loading=true;try{BR.status=await API.call('bridgeStatus',{})}catch(e){BR.status=[]}finally{BR.loading=false;scheduleRender()}}

// ---- Tác vụ tự động (xuất hiện trong Trung tâm tự động; nhật ký chung) ----
AUTOS.push(
 ['hrPerf','Liên thông HR: gửi hiệu suất & hoa hồng','Gửi bảng đạt chỉ tiêu và hoa hồng tháng đã đóng sổ (đã ghép mã nhân sự HR) để HR đưa vào lương P3, đánh giá KPI.'],
 ['hrHiring','Liên thông HR: gửi nhu cầu tuyển sales','Nhóm vượt chỉ tiêu hoặc quá tải khách, vị trí trống do nghỉ việc → HR tạo yêu cầu tuyển dụng chờ duyệt.'],
 ['hrSync','Liên thông HR: nhận biến động nhân sự','Nhận danh sách nhân sự kinh doanh từ HR; người mới → việc giao tuyến & chỉ tiêu tăng dần; người nghỉ → việc bàn giao khách & đối chiếu công nợ.']);
Object.assign(RUN,{
 async hrPerf(){const d=salePerf();if(!d.rows.length)return 'Không có dữ liệu hoa hồng tháng '+d.month;await brPush('sale.perf',d);await put('bridge','sale.perf',{at:Date.now(),by:S.meId,month:d.month,n:d.rows.length,total:d.total});BR.status=null;
   return `Đã gửi HR: ${d.rows.length} nhân viên, hoa hồng ${monthName(d.month)} ${fmtM(d.total)}${brRoster()?'':' (chưa nhận danh sách HR nên chưa ghép mã nhân sự)'}`},
 async hrHiring(){const d=saleHiring();await brPush('sale.hiring',d);await put('bridge','sale.hiring',{at:Date.now(),by:S.meId,n:d.rows.length,qty:sum(d.rows,r=>r.qty)});BR.status=null;
   return d.rows.length?`Đã gửi HR ${d.rows.length} nhu cầu, tổng ${sum(d.rows,r=>r.qty)} vị trí`:'Chưa có nhu cầu tuyển mới (đã gửi danh sách rỗng để HR biết)'},
 async hrSync(){const r=await brPull('hr.roster');if(!r||!r.data)return 'HR chưa gửi danh sách nhân sự – bên HR chạy “Liên thông Sale: gửi nhân sự kinh doanh”';
   const ro=Object.assign({},r.data,{pulledAt:Date.now(),from:r.by,sentAt:r.at});await put('bridge','hr.roster',ro);
   const rsm=rg=>(M.reps.find(x=>x.level==='RSM'&&x.region===rg)||M.reps[0]).id,since=iso(addDays(M.T,-60));
   const list=[];
   ro.rows.filter(e=>!e.exit&&e.hire>=since).forEach(e=>list.push(task('hr_new_'+e.id,{title:`Hội nhập nhân sự kinh doanh mới ${e.name} (${e.title}): giao tuyến/khách hàng, chỉ tiêu tăng dần 50% → 75% → 100% trong 3 tháng`,type:'Liên thông HR',owner:rsm(HR_REGION[e.site]||'NAM'),sev:'info',ref:e.id,due:iso(addDays(M.T,7))})));
   ro.rows.filter(e=>e.exit&&e.exit>=since).forEach(e=>list.push(task('hr_exit_'+e.id,{title:`Bàn giao khách hàng & đối chiếu công nợ phụ trách của ${e.name} (nghỉ việc ${vn(e.exit)})`,type:'Liên thông HR',owner:rsm(HR_REGION[e.site]||'NAM'),sev:'warn',ref:e.id,due:iso(addDays(M.T,3))})));
   const n=await saveTasks(list);BR.status=null;
   return `Nhận ${ro.rows.filter(e=>!e.exit).length} nhân sự kinh doanh từ HR (gửi ${new Date(r.at).toLocaleString('vi-VN')}); tạo ${n} việc mới`},
});
// Chuỗi buổi sáng: khi đăng nhập thì nhận luôn biến động nhân sự từ HR
{const o=ACT.runAll;ACT.runAll=async(...a)=>{await o(...a);if(brLive()){S.busy='';await runAuto('hrSync')}}}

// ---- Giao diện ----
function bridgePanel(){if(brLive()&&!BR.status)brLoadStatus();
  const T={'sale.perf':'Hiệu suất & hoa hồng → HR','sale.hiring':'Nhu cầu tuyển sales → HR','hr.roster':'Nhân sự kinh doanh ← HR'};
  const st=BR.status||[],row=k=>{const s=st.find(x=>x.topic===k);return `<tr><td>${T[k]}</td><td class="small">${s?esc(s.app):'—'}</td><td class="small">${s?new Date(s.at).toLocaleString('vi-VN'):'<span class="muted">Chưa có</span>'}</td><td class="small">${s?esc(s.by):''}</td></tr>`};
  return panel('Liên thông với HR Analytics',`<p class="small muted" style="margin:0 0 10px">Hai app cùng tập đoàn AMG trao đổi dữ liệu qua máy chủ riêng của Owner – không qua dịch vụ bên ngoài, không tốn phí. Đăng nhập HR Analytics bằng cùng email để xem phía bên kia.</p>
   ${brLive()?tbl(['Luồng dữ liệu','Gửi từ','Lần gần nhất','Người gửi'],Object.keys(T).map(row)):'<p class="banner">Bản demo không liên thông. Đăng nhập để gửi/nhận dữ liệu với HR Analytics.</p>'}`,
   {act:`${brLive()?'<button class="btn sm ghost" data-act="brRefresh">Làm mới</button>':''}${hrLink('automation','Mở HR Analytics')}`,cls:'mt'})}
function bridgeTeamPanel(){const ro=brRoster(),map=brMap();
  if(!ro)return panel('Nhân sự kinh doanh theo HR Analytics',`<p class="muted small">Chưa nhận dữ liệu từ HR. Vào <a href="#automation" data-act="go" data-v="automation">Trung tâm tự động</a> → “Liên thông HR: nhận biến động nhân sự”.</p>`,{act:hrLink('people'),cls:'mt'});
  const act=ro.rows.filter(e=>!e.exit),since=iso(addDays(M.T,-90)),nw=act.filter(e=>e.hire>=since),ex=ro.rows.filter(e=>e.exit&&e.exit>=since),prob=act.filter(e=>e.probEnd&&e.probEnd>=M.TS);
  const linked=M.reps.filter(r=>map[r.id]);
  return `<div class="kpis mt">${kpi('Nhân sự kinh doanh (HR)',fmt(act.length),`${fmt(M.reps.length)} người có chỉ tiêu/quản lý trên Sale`)}${kpi('Mới vào 90 ngày',fmt(nw.length),prob.length+' đang thử việc')}${kpi('Nghỉ việc 90 ngày',fmt(ex.length),ex.length?'Cần bàn giao khách hàng':'Ổn định',ex.length?'warn':'')}${kpi('Đã ghép mã HR',fmt(linked.length)+'/'+fmt(M.reps.length),'Theo cấp bậc, rồi theo mã')}</div>
  ${panel('Nhân sự kinh doanh theo HR Analytics',tbl(['Nhân viên Sale','Chức danh','Mã HR','Tên trên HR','Ngày vào'],linked.slice(0,60).map(r=>{const h=map[r.id];return `<tr><td>${rLink?rLink(r.id):esc(r.name)}</td><td class="small">${esc(r.title)}</td><td class="mono small">${esc(h.id)}</td><td>${esc(h.name)}</td><td class="small">${vn(h.hire)}</td></tr>`})),{sub:`Nhận từ HR lúc ${new Date(ro.sentAt||ro.pulledAt).toLocaleString('vi-VN')}${ro.from?' · '+esc(ro.from):''}`,act:hrLink('people','Hồ sơ trên HR'),cls:'mt'})}
  ${ex.length||nw.length?panel('Biến động 90 ngày',tbl(['Nhân sự','Chức danh','Khu vực','Biến động'],[...nw.map(e=>`<tr><td>${esc(e.name)}</td><td class="small">${esc(e.title)}</td><td class="small">${esc(REGIONS[HR_REGION[e.site]]||e.site)}</td><td>${pill('Vào '+vn(e.hire),'ok')}</td></tr>`),...ex.map(e=>`<tr><td>${esc(e.name)}</td><td class="small">${esc(e.title)}</td><td class="small">${esc(REGIONS[HR_REGION[e.site]]||e.site)}</td><td>${pill('Nghỉ '+vn(e.exit),'warn')}</td></tr>`)]),{cls:'mt'}):''}`}
{const a=V.automation;V.automation=()=>a()+bridgePanel()}
{const t=V.team;V.team=()=>t()+bridgeTeamPanel()}
Object.assign(ACT,{brRefresh:()=>brLoadStatus(true)});
{const a=document.getElementById('peerHr');if(a)a.href=PEER_HR}
