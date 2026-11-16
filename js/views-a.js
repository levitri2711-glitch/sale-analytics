/* Sale Analytics – màn hình Dashboard & báo cáo */
"use strict";
const VIEWS=[
 ['overview','Tổng quan CEO','d'],['revenue','Doanh thu & lợi nhuận','d'],['team','Đội ngũ & hiệu suất','d'],['product','Sản phẩm & tồn kho','d'],['customer','Khách hàng & CSKH','d'],['channel','Kênh phân phối & đi tuyến','d'],
 ['orders','Đơn hàng & hóa đơn','o'],['pipeline','Pipeline & dự báo','o'],['debt','Công nợ & tuổi nợ','o'],['contracts','Hợp đồng & văn bản','o'],
 ['kpi','Mục tiêu & KPI','p'],['plan','Kế hoạch & ngân sách','p'],['marketing','Marketing & chuyển đổi','p'],
 ['legal','Pháp lý & chính sách','s'],['automation','Trung tâm tự động','s'],['excel','Bộ biểu mẫu Excel','s'],['tips','Tips & tricks','s'],['access','Chia sẻ & phân quyền','s']];
const GROUPS=[['d','Dashboard & báo cáo'],['o','Vận hành bán hàng'],['p','Kế hoạch & KPI'],['s','Tri thức & hệ thống']];
const V={};
const custName=id=>(M.C[id]||{}).name||id||'—';
const repName=id=>(M.RP[id]||{}).name||id||'—';
const cLink=id=>`<a href="#" data-act="cust" data-id="${esc(id)}">${esc(custName(id))}</a>`;
const rLink=id=>`<a href="#" data-act="rep" data-id="${esc(id)}">${esc(repName(id))}</a>`;
const achCls=a=>a>=1?'ok':a>=.85?'warn':'crit';
const tierPill=t=>pill(t,t==='Diamond'?'info':t==='Gold'?'warn':t==='Silver'?'mute':'mute');
function filterBar(extra=''){const f=S.f;return `<div class="filters">
 <label>Kỳ<select data-f="period">${optHtml([['mtd','Tháng này'],['lm','Tháng trước'],['qtd','Quý này'],['ytd','Lũy kế năm'],['l12','12 tháng gần nhất'],['py','Năm trước']],f.period)}</select></label>
 <label>Vùng<select data-f="region"><option value="">Toàn quốc</option>${optHtml(Object.entries(REGIONS),f.region)}</select></label>
 <label>Kênh<select data-f="channel"><option value="">Tất cả kênh</option>${optHtml(Object.entries(CHANNELS),f.channel)}</select></label>
 <label>Nhóm<select data-f="team"><option value="">Tất cả nhóm</option>${optHtml(TEAMS.map(t=>[t.id,t.name]),f.team)}</select></label>${extra}
 <span class="small muted">${esc(M.per.label)} · số liệu đến ${vn(M.T)}</span></div>`}
function last24(){return M.monthsAll.slice(-24)}

V.overview=()=>{
  const m=M,crit=m.checks.filter(c=>c.sev==='crit').length,warn=m.checks.filter(c=>c.sev==='warn').length;
  const yoy=m.prev?m.rev/m.prev-1:0,gm=m.rev?m.gp/m.rev:0,nOrd=m.inP.length,aov=nOrd?m.rev/nOrd:0,buyers=new Set(m.inP.map(o=>o.cust)).size;
  const od=sum(m.open.filter(o=>o.od>0),o=>o.out),pipeW=sum(m.openOpps,o=>o.w),fcM=m.forecast[0];
  const yK=M.monthsAll.filter(k=>k.startsWith(String(m.Y))),pK=MONTHS.map((_,i)=>(m.Y-1)+'-'+z2(i+1));
  const cur=MONTHS.map((_,i)=>m.mRev(m.Y+'-'+z2(i+1))||null),prev=pK.map(k=>m.mRev(k)),tg=MONTHS.map((_,i)=>m.tgMonth(m.Y+'-'+z2(i+1),{region:S.f.region,channel:S.f.channel,team:S.f.team}));
  const byCh=Object.keys(CHANNELS).map((k,i)=>({l:CH_SHORT[k],v:sum(m.inP.filter(o=>o.ch===k),o=>o.net),c:COLORS[i]})).filter(x=>x.v);
  const byRg=Object.keys(REGIONS).map(k=>({l:REGIONS[k],v:sum(m.inP.filter(o=>o.region===k),o=>o.net)}));
  const byCat=Object.keys(CATS).map(k=>({l:CATS[k],v:sum(m.inP,o=>sum(o.lines.filter(l=>l[0].startsWith(k)),l=>l[1]*l[2]*(1-l[3])))}));
  const topC=Object.entries(groupBy(m.inP,o=>o.cust)).map(([id,os])=>({id,l:custName(id),v:sum(os,o=>o.net)})).sort((a,b)=>b.v-a.v).slice(0,8);
  const mkts=m.mkt.filter(x=>x.m>=m.per.from.slice(0,7)&&x.m<=m.per.to.slice(0,7));const leads=sum(mkts,x=>x.leads);
  const flow=[['marketing','Lead marketing',fmt(leads),'trong kỳ'],['pipeline','Pipeline',fmtB(sum(m.openOpps,o=>o.amount)),m.openOpps.length+' cơ hội mở'],['orders','Đơn hàng',fmt(nOrd),'AOV '+fmtM(aov)],['revenue','Doanh thu thuần',fmtB(m.rev),pct(m.ach,0)+' chỉ tiêu'],['debt','Thu tiền',fmtB(sum(m.inP,o=>o.paid)),pct(sum(m.inP,o=>o.paid)/Math.max(1,sum(m.inP,o=>o.gross)),0)+' đã thu'],['debt','Công nợ',fmtB(m.AR),'DSO '+fmtD(m.DSO,0)+' ngày'],['kpi','Hoa hồng',fmtM(sum(m.comm,c=>c.net)),'tháng '+(m.T.getMonth()+1)]];
  return `${filterBar()}
  <div class="kpis">
   ${kpi('Doanh thu thuần',fmtB(m.rev),`Chỉ tiêu ${fmtB(m.tgtP)} · đạt <b>${pct(m.ach,0)}</b>`,m.ach<.9?'crit':m.ach<1?'warn':'','revenue')}
   ${kpi('Tăng trưởng cùng kỳ',(yoy>=0?'+':'')+pct(yoy),`Cùng kỳ ${fmtB(m.prev)}`,yoy<0?'crit':'','revenue')}
   ${kpi('Lợi nhuận gộp',fmtB(m.gp),'Biên '+pct(gm),'','product')}
   ${kpi('Đơn hàng · AOV',fmt(nOrd),`${fmt(buyers)} khách mua · ${m.newCust} khách mới`,'','orders')}
   ${kpi('Công nợ phải thu',fmtB(m.AR),`Quá hạn ${fmtB(od)} (${pct(od/Math.max(1,m.AR),0)}) · DSO ${fmtD(m.DSO,0)}/${P('dsoTarget')} ngày`,m.DSO>P('dsoTarget')*1.2?'crit':'','debt')}
   ${kpi('Dự báo tháng '+(m.T.getMonth()+1),fmtB(fcM.fc),`Chỉ tiêu ${fmtB(fcM.tgt)} · ${pct(fcM.fc/Math.max(1,fcM.tgt),0)}`,fcM.fc<fcM.tgt?'warn':'','pipeline')}
   ${kpi('Pipeline có trọng số',fmtB(pipeW),`Tỷ lệ thắng ${pct(m.winRate,0)} · chu kỳ ${fmtD(m.cycle,0)} ngày`,'','pipeline')}
   ${kpi('Cảnh báo',fmt(crit),`${warn} cần xử lý · ${m.checks.length-crit-warn} theo dõi`,crit?'crit':'','automation')}
  </div>
  ${panel('Bản đồ doanh số – dòng chảy từ lead đến tiền về',`<div class="life">${flow.map(([v,t,n,s])=>`<div class="st" data-act="go" data-v="${v}" role="button" tabindex="0"><em>${t}</em><b>${n}</b><span>${s}</span></div>`).join('')}</div>`,{sub:'Mỗi ô lấy số trực tiếp từ mô-đun tương ứng; bấm để mở'})}
  <div class="grid g12 mt">
   ${panel('Doanh thu theo tháng '+m.Y+' so với '+(m.Y-1)+' và chỉ tiêu',colChart(MONTHS,[{n:String(m.Y-1),c:'var(--c6)',values:prev},{n:String(m.Y),c:'var(--c1)',values:cur}],{line:{n:'Chỉ tiêu '+m.Y,c:'var(--c3)',values:tg,dash:true}}),{sub:'Doanh thu thuần chưa VAT'})}
   ${panel('Tiến độ',`<div class="gauges">${gauge(m.ach,'Kỳ đã chọn')}${gauge(sum(yK,k=>m.mRev(k))/Math.max(1,m.tg.annual*(S.f.team||S.f.region||S.f.channel?m.tgtFor(m.Y+'-01-01',m.Y+'-12-31',{region:S.f.region,channel:S.f.channel,team:S.f.team})/m.tg.annual:1)),'So với kế hoạch năm')}</div><div class="kv small"><span>Kế hoạch năm ${m.Y}</span><b>${fmtB(m.tg.annual)}</b><span>Còn phải bán đến 31/12</span><b>${fmtB(Math.max(0,m.tg.annual-sum(yK,k=>m.mRev(k))))}</b><span>Nhịp cần/ngày làm việc</span><b>${fmtM(Math.max(0,m.tg.annual-sum(yK,k=>m.mRev(k)))/Math.max(1,workdaysLeft()))}</b></div>`)}
  </div>
  <div class="grid g3 mt">
   ${panel('Cơ cấu theo kênh',donut(byCh,fmtB(m.rev),{f:fmtB,unit:'doanh thu'}))}
   ${panel('Theo vùng',hbars(byRg,{f:fmtB,color:'var(--c2)'}))}
   ${panel('Theo ngành hàng',hbars(byCat,{f:fmtB,color:'var(--c5)'}))}
  </div>
  <div class="grid g2 mt">
   ${panel('Top khách hàng',hbars(topC,{f:fmtB,color:'var(--c4)',act:'cust'}),{act:`<button class="btn sm" data-act="go" data-v="customer">Tất cả</button>`})}
   ${panel('Xếp hạng nhân viên (% chỉ tiêu)',hbars(m.repStats.slice(0,8).map(x=>({id:x.r.id,l:x.r.name+' · '+TEAM[x.r.team].name,v:x.ach,c:x.ach>=1?'var(--ok)':x.ach>=.85?'var(--warn)':'var(--crit)'})),{f:v=>pct(v,0),max:1.5,act:'rep'}),{act:`<button class="btn sm" data-act="go" data-v="team">Bảng xếp hạng</button>`})}
  </div>
  <div class="grid g2 mt">
   ${panel('Cảnh báo ưu tiên',checkList(m.checks.filter(c=>c.sev!=='info').slice(0,8)),{act:`<button class="btn sm" data-act="go" data-v="automation">Trung tâm tự động</button>`})}
   ${panel('Việc cần làm',taskList(7),{sub:'Tạo từ Trung tâm tự động, đồng bộ cho mọi người có quyền'})}
  </div>`;
};
function workdaysLeft(){let n=0;for(let d=addDays(M.T,1);d.getFullYear()===M.Y;d=addDays(d,1))if(isWorkday(d))n++;return n}
function checkList(list){return `<div class="list">${list.map(c=>`<div class="sev ${c.sev}"><div><b>${esc(c.msg)}</b><div class="small muted">${esc(c.act)}</div></div>${pill(sevName[c.sev],c.sev)}</div>`).join('')||'<p class="muted">Không có cảnh báo.</p>'}</div>`}
function taskList(limit){const t=M.tasks.filter(x=>x.status!=='done').slice(0,limit||999);
  if(!t.length)return '<p class="muted">Chưa có việc mở. Chạy “Rà soát công nợ” hoặc “Rà soát toàn bộ” trong Trung tâm tự động.</p>';
  return `<div class="list">${t.map(x=>`<div class="sev ${x.sev||'info'}"><div><b>${esc(x.title)}</b><div class="small muted">${esc(repName(x.owner))} · hạn ${vn(x.due)}${x.ref?' · '+esc(x.ref):''}</div></div><button class="btn sm" data-act="taskDone" data-id="${x.id}"${lock()}>Xong</button></div>`).join('')}</div>`}

V.revenue=()=>{
  const m=M,os=m.inP;const list=sum(os,o=>sum(o.lines,l=>l[1]*l[2])),disc=list-sum(os,o=>sum(o.lines,l=>l[1]*l[2]*(1-l[3]))),ret=sum(os,o=>sum(o.lines,l=>l[1]*l[2]*(1-l[3]))*(o.ret||0));
  const mk=sum(m.mkt.filter(x=>x.m>=m.per.from.slice(0,7)&&x.m<=m.per.to.slice(0,7)),x=>x.spend)*(S.f.channel||S.f.team||S.f.region?.0:1);
  const sell=m.rev*.08,contrib=m.gp-sell-mk;
  const pl=[['Doanh thu theo giá niêm yết',list],['(−) Chiết khấu thương mại',-disc],['(−) Hàng bán bị trả lại',-ret],['Doanh thu thuần',m.rev,'b'],['(−) Giá vốn hàng bán',-(m.rev-m.gp)],['Lợi nhuận gộp',m.gp,'b'],['(−) Chi phí bán hàng ước 8% (lương, hoa hồng, logistics)',-sell],['(−) Chi phí marketing thực chi',-mk],['Lợi nhuận đóng góp',contrib,'b']];
  const ks=last24();const chs=Object.keys(CHANNELS);
  const stack=chs.map((c,i)=>({n:CH_SHORT[c],c:COLORS[i],values:ks.map(k=>sum((m.byM[k]||[]).filter(o=>o.ch===c),o=>o.net))}));
  const heat=Object.keys(REGIONS).map(rg=>{const cells=chs.map(c=>{const a=sum(m.inP.filter(o=>o.region===rg&&o.ch===c),o=>o.net),b=sum(m.inPrev.filter(o=>o.region===rg&&o.ch===c),o=>o.net);return b?a/b-1:null});return `<tr><td>${REGIONS[rg]}</td>${cells.map(v=>v==null?'<td class="muted">—</td>':`<td><span class="heat" style="--h:${clamp(Math.abs(v)*2,0,1)};${v<0?'background:color-mix(in srgb,var(--crit) '+clamp(Math.abs(v)*170,10,85)+'%,transparent)':''}">${(v>=0?'+':'')+pct(v,0)}</span></td>`).join('')}</tr>`});
  const byCust=Object.entries(groupBy(os,o=>o.cust)).map(([id,x])=>({id,v:sum(x,o=>o.net)})).sort((a,b)=>b.v-a.v);let acc=0;const tot=sum(byCust,x=>x.v)||1;byCust.forEach(x=>{acc+=x.v;x.cum=acc/tot});
  const pareto=[.5,.8,.95].map(t=>byCust.findIndex(x=>x.cum>=t)+1);
  return `${filterBar()}
  <div class="kpis">${kpi('Doanh thu thuần',fmtB(m.rev),'Chưa VAT')}${kpi('Thuế GTGT đầu ra',fmtB(sum(os,o=>o.vat)),'Thuế suất hiện hành '+P('vat')+'%')}${kpi('Tổng tiền thanh toán',fmtB(sum(os,o=>o.gross)),'Đã gồm VAT')}${kpi('Biên lợi nhuận gộp',pct(m.rev?m.gp/m.rev:0),fmtB(m.gp))}${kpi('Chiết khấu / giá niêm yết',pct(disc/Math.max(1,list)),fmtB(disc))}${kpi('Lợi nhuận đóng góp',fmtB(contrib),pct(contrib/Math.max(1,m.rev))+' doanh thu',contrib<0?'crit':'')}</div>
  <div class="grid g12 mt">${panel('Doanh thu 24 tháng theo kênh',colChart(ks.map(monthName),stack,{stack:true,f:fmtB}),{sub:'Cột chồng; di chuột để xem từng kênh'})}
  ${panel('Báo cáo kết quả bán hàng (P&L kỳ)',tbl(['Khoản mục',['Giá trị']],pl.map(([l,v,b])=>`<tr${b?' class="tot"':''}><td>${b?'<b>'+l+'</b>':l}</td><td class="n">${b?'<b>'+fmtB(v)+'</b>':fmtB(v)}</td></tr>`)),{sub:'Chi phí MKT chỉ trừ khi xem toàn công ty'})}</div>
  <div class="grid g2 mt">${panel('Tăng trưởng cùng kỳ theo vùng × kênh',`<div class="tw"><table class="tbl heatmap"><thead><tr><th>Vùng</th>${chs.map(c=>`<th>${CH_SHORT[c]}</th>`).join('')}</tr></thead><tbody>${heat.join('')}</tbody></table></div>`,{sub:'So với cùng kỳ năm trước'})}
  ${panel('Phân tích Pareto khách hàng',`<div class="kv"><span>Số khách tạo 50% doanh thu</span><b>${pareto[0]}</b><span>Số khách tạo 80% doanh thu</span><b>${pareto[1]} / ${byCust.length} (${pct(pareto[1]/Math.max(1,byCust.length),0)})</b><span>Số khách tạo 95% doanh thu</span><b>${pareto[2]}</b></div><p class="small muted">Quy tắc 80/20: tập trung đội Key Account vào nhóm tạo 80% doanh thu; nhóm đuôi dài chuyển sang kênh NPP/TMĐT để giảm chi phí phục vụ.</p>${hbars(byCust.slice(0,6).map(x=>({id:x.id,l:custName(x.id),v:x.cum})),{f:v=>pct(v,0),max:1,act:'cust',color:'var(--c2)'})}`)}</div>
  ${panel('Doanh thu, lợi nhuận theo tháng',tbl(['Tháng',['Doanh thu'],['Chỉ tiêu'],['% đạt'],['LN gộp'],['Biên'],['Số đơn'],['Cùng kỳ'],['Tăng trưởng']],ks.slice(-13).reverse().map(k=>{const r=m.mRev(k),t=m.tgMonth(k,{region:S.f.region,channel:S.f.channel,team:S.f.team}),[yy,mm]=k.split('-'),p=m.mRev((yy-1)+'-'+mm);return `<tr><td>${monthName(k)}</td>${tdn(fmtB(r))}${tdn(fmtB(t))}<td class="n">${pill(pct(r/Math.max(1,t),0),achCls(r/Math.max(1,t)))}</td>${tdn(fmtB(m.mGp(k)))}${tdn(pct(m.mGp(k)/Math.max(1,r)))}${tdn(fmt((m.byM[k]||[]).length))}${tdn(p?fmtB(p):'—')}${tdn(p?pct(r/p-1):'—')}</tr>`})),{cls:'mt',act:`<button class="btn sm" data-act="xlsx" data-k="revenue">Xuất Excel</button>`})}`;
};

V.team=()=>{
  const m=M;const teams=TEAMS.filter(t=>!S.f.team||t.id===S.f.team).map(t=>{const rs=m.repStats.filter(x=>x.r.team===t.id);const rev=sum(rs,x=>x.rev),tgt=sum(rs,x=>x.tgt);return{t,rev,tgt,ach:tgt?rev/tgt:0,gp:sum(rs,x=>x.gp),n:sum(rs,x=>x.n),ar:sum(rs,x=>x.ar),od90:sum(rs,x=>x.od90),head:rs.length}});
  const score=a=>a>=1?10:a>=.9?9:a>=.8?8:a>=.7?7:a>=.6?6:a>=.5?5:a>=.4?4:a>=.3?3:a>=.2?2:1;
  const rs=m.repStats.filter(x=>(!S.f.team||x.r.team===S.f.team)&&(!S.f.region||x.r.region===S.f.region)&&(!S.f.channel||x.r.ch===S.f.channel));
  const SK=['Tìm kiếm KH','Khai thác nhu cầu (SPIN)','Trình bày giải pháp','Xử lý từ chối','Đàm phán & chốt','Chăm sóc sau bán','Quản lý tuyến/thời gian','Dùng CRM & báo cáo','Kiến thức sản phẩm','Thu hồi công nợ'];
  return `${filterBar()}
  <div class="kpis">${kpi('Nhân sự có chỉ tiêu',fmt(rs.length),`${m.reps.length} người khối Kinh doanh`)}${kpi('Đạt ≥100% chỉ tiêu',fmt(rs.filter(x=>x.ach>=1).length),pct(rs.filter(x=>x.ach>=1).length/Math.max(1,rs.length),0)+' nhân viên')}${kpi('Dưới 70%',fmt(rs.filter(x=>x.ach<.7).length),'Cần coaching / PIP',rs.some(x=>x.ach<.7)?'warn':'')}${kpi('Doanh thu bình quân/người',fmtB(avg(rs,x=>x.rev)),'Kỳ đã chọn')}${kpi('Cuộc gọi / đơn hàng',fmtD(sum(rs,x=>x.calls)/Math.max(1,sum(rs,x=>x.n)),1),'Hiệu quả hoạt động')}${kpi('Nợ quá hạn >90 ngày',fmtB(sum(rs,x=>x.od90)),'Trừ hoa hồng '+P('cDeduct')+'%',sum(rs,x=>x.od90)>0?'warn':'')}</div>
  ${panel('Doanh thu theo nhóm',tbl(['Nhóm','Kênh · vùng',['Nhân sự'],['Chỉ tiêu'],['Thực hiện'],['% đạt'],['LN gộp'],['Đơn'],['Công nợ'],['Quá hạn >90']],teams.map(x=>`<tr><td><b>${esc(x.t.name)}</b></td><td>${CH_SHORT[x.t.ch]} · ${REGIONS[x.t.region]}</td>${tdn(x.head)}${tdn(fmtB(x.tgt))}${tdn(fmtB(x.rev))}<td class="n">${prog(x.ach)} ${pct(x.ach,0)}</td>${tdn(fmtB(x.gp))}${tdn(fmt(x.n))}${tdn(fmtB(x.ar))}${tdn(fmtM(x.od90))}</tr>`),`<tr class="tot"><td colspan="3"><b>Tổng</b></td>${tdn(fmtB(sum(teams,x=>x.tgt)))}${tdn('<b>'+fmtB(sum(teams,x=>x.rev))+'</b>')}${tdn(pct(sum(teams,x=>x.rev)/Math.max(1,sum(teams,x=>x.tgt)),0))}${tdn(fmtB(sum(teams,x=>x.gp)))}${tdn(fmt(sum(teams,x=>x.n)))}${tdn(fmtB(sum(teams,x=>x.ar)))}${tdn(fmtM(sum(teams,x=>x.od90)))}</tr>`),{act:`<button class="btn sm" data-act="xlsx" data-k="team">Xuất Excel</button>`})}
  ${panel('Bảng xếp hạng & hiệu suất nhân viên',tbl(['#','Nhân viên','Nhóm',['Chỉ tiêu'],['Thực hiện'],['% đạt'],['Điểm (10)'],['DS/giờ'],['Đơn'],['KH'],['Cuộc gọi'],['Email'],['Gặp KH'],['Gọi/đơn'],['Cùng kỳ']],rs.map(x=>`<tr><td>${x.rank}</td><td>${rLink(x.r.id)}${x.r.hire>iso(addMonths(M.T,-6))?' '+pill('Mới','info'):''}</td><td class="small">${esc(TEAM[x.r.team].name)}</td>${tdn(fmtM(x.tgt))}${tdn(fmtM(x.rev))}<td class="n">${pill(pct(x.ach,0),achCls(x.ach))}</td>${tdn(score(x.ach))}${tdn(fmtD(x.rev/Math.max(1,x.days*8)/1e6,1)+' tr')}${tdn(x.n)}${tdn(x.cust)}${tdn(fmt(x.calls))}${tdn(fmt(x.emails))}${tdn(x.meet)}${tdn(fmtD(x.calls/Math.max(1,x.n),1))}${tdn(x.prev?pct(x.rev/x.prev-1,0):'—')}</tr>`)),{cls:'mt',sub:'Điểm = IF(%đạt≥100%;10;IF(≥90%;9;…)) như mẫu “Báo cáo hiệu suất nhân viên kinh doanh”; DS/giờ = doanh số ÷ (ngày làm × 8 giờ)'})}
  <div class="grid g2 mt">
   ${panel('Ma trận đánh giá kỹ năng bán hàng (1–5)',`<div class="tw"><table class="tbl heatmap"><thead><tr><th>Nhân viên</th>${SK.map(s=>`<th title="${esc(s)}">${esc(s.split(' ')[0])}</th>`).join('')}<th>TB</th></tr></thead><tbody>${rs.slice(0,12).map(x=>{const g=rngOf('sk'+x.r.id);const v=SK.map(()=>clamp(Math.round((2.6+x.r.skill*1.4+g.gauss()*.7)*2)/2,1,5));return `<tr><td>${esc(x.r.name)}</td>${v.map(n=>`<td><span class="heat" style="--h:${(n-1)/4}">${fmtD(n,1)}</span></td>`).join('')}<td><b>${fmtD(avg(v),1)}</b></td></tr>`}).join('')}</tbody></table></div><p class="small muted">${SK.map((s,i)=>(i+1)+'. '+s).join(' · ')}</p>`,{sub:'Đánh giá quý của Trưởng nhóm; điểm thấp → kế hoạch đào tạo'})}
   ${panel('Báo cáo hoạt động hằng ngày (Sales Activity)',activityTable(),{sub:'5 ngày làm việc gần nhất, toàn đội'})}
  </div>`;
};
function activityTable(){const ds=[...new Set(M.acts.map(a=>a[0]))].slice(-5);const ordBy=groupBy(M.orders.filter(o=>ds.includes(o.date)),o=>o.date);
  return tbl(['Ngày',['Cuộc gọi'],['Email'],['Cuộc hẹn'],['Lead mới'],['Báo giá'],['Đơn đã chốt'],['Doanh thu']],ds.map(d=>{const a=M.acts.filter(x=>x[0]===d&&(!S.f.team||(M.RP[x[1]]||{}).team===S.f.team));const os=ordBy[d]||[];return `<tr><td>${vn(d)}</td>${tdn(fmt(sum(a,x=>x[2])))}${tdn(fmt(sum(a,x=>x[3])))}${tdn(sum(a,x=>x[4]))}${tdn(sum(a,x=>x[5]))}${tdn(sum(a,x=>x[6]))}${tdn(os.length)}${tdn(fmtM(sum(os,o=>o.net)))}</tr>`}))}

V.product=()=>{
  const m=M,os=m.inP,pv=m.inPrev;const rows=PRODUCTS.map(p=>{let q=0,rev=0,cogs=0,q0=0,r0=0;for(const o of os)for(const l of o.lines)if(l[0]===p.id){q+=l[1];rev+=l[1]*l[2]*(1-l[3]);cogs+=l[1]*p.cogs}for(const o of pv)for(const l of o.lines)if(l[0]===p.id){q0+=l[1];r0+=l[1]*l[2]*(1-l[3])}
    const st=m.stock.find(s=>s.id===p.id);return{p,q,rev,cogs,gp:rev-cogs,mkt:rev*.03,sell:rev*.08,pl:rev-cogs-rev*.11,r0,st}}).sort((a,b)=>b.rev-a.rev);
  const tot=sum(rows,r=>r.rev)||1;let acc=0;rows.forEach(r=>{acc+=r.rev;r.abc=acc/tot<=.8?'A':acc/tot<=.95?'B':'C'});
  const launch=PRODUCTS.filter(p=>p.launch>=(M.Y-1)+'-01-01');
  const stk=m.stock.filter(s=>!s.service);
  return `${filterBar()}
  <div class="kpis">${kpi('Số SKU đang bán',fmt(rows.filter(r=>r.q).length),PRODUCTS.length+' SKU trong danh mục')}${kpi('Nhóm A (80% doanh thu)',fmt(rows.filter(r=>r.abc==='A').length)+' SKU','Ưu tiên tồn kho & trưng bày')}${kpi('Giá trị tồn kho',fmtB(sum(stk,s=>s.value)),'Theo giá vốn')}${kpi('SKU dưới điểm đặt hàng',fmt(stk.filter(s=>s.suggest>0).length),stk.filter(s=>s.status==='Sắp hết hàng').length+' sắp hết hàng',stk.some(s=>s.status==='Sắp hết hàng')?'crit':'')}${kpi('Số ngày tồn kho bình quân',fmtD(avg(stk,s=>Math.min(s.cover,200)),0),'Mục tiêu 25–40 ngày')}</div>
  ${panel('Báo cáo doanh thu theo sản phẩm',tbl(['SKU','Sản phẩm','ABC',['SL bán'],['Doanh thu'],['Giá vốn'],['LN đóng góp'],['CP marketing 3%'],['CP bán hàng 8%'],['Lãi/lỗ'],['Biên LN gộp'],['Tăng trưởng']],rows.map(r=>`<tr><td class="mono">${r.p.id}</td><td>${esc(r.p.name)} <span class="small muted">${esc(r.p.unit)}</span></td><td>${pill(r.abc,r.abc==='A'?'ok':r.abc==='B'?'info':'mute')}</td>${tdn(fmt(r.q))}${tdn(fmtM(r.rev))}${tdn(fmtM(r.cogs))}${tdn(fmtM(r.gp))}${tdn(fmtM(r.mkt))}${tdn(fmtM(r.sell))}${tdn(fmtM(r.pl))}${tdn(pct(r.rev?r.gp/r.rev:0))}${tdn(r.r0?pct(r.rev/r.r0-1,0):'mới')}</tr>`)),{sub:'Theo mẫu “Báo cáo doanh thu theo sản phẩm”: CP marketing = DT×3%, CP bán hàng = DT×8%, Lãi/lỗ = LN đóng góp − CP',act:`<button class="btn sm" data-act="xlsx" data-k="product">Xuất Excel</button>`})}
  <div class="grid g2 mt">
   ${panel('Tồn kho & đề xuất nhập',tbl(['Sản phẩm',['Tồn'],['Bán/ngày'],['Số ngày'],['Điểm đặt hàng'],['Đề xuất nhập'],'Trạng thái'],stk.sort((a,b)=>a.cover-b.cover).map(s=>`<tr><td>${esc(s.name)}</td>${tdn(fmt(s.qty))}${tdn(fmtD(s.daily,1))}${tdn(fmtD(s.cover,0))}${tdn(fmt(s.rop))}${tdn(s.suggest?'<b>'+fmt(s.suggest)+'</b>':'—')}<td>${pill(s.status,s.status==='Sắp hết hàng'?'crit':s.status==='Dưới điểm đặt hàng'?'warn':s.status==='Tồn kho cao'?'info':'ok')}</td></tr>`)),{sub:'Điểm đặt hàng = bán/ngày × (7 ngày an toàn + 14 ngày sản xuất); tồn kho = nhập − xuất theo đơn hàng',act:`<button class="btn sm" data-act="stockIn"${lock()}>Nhập kho</button>`})}
   ${panel('Cấu trúc giá kênh (5 bước định giá)',priceTable(),{sub:'COGS → giá NSX → giá NPP → giá bán lẻ đề xuất; sửa chiết khấu ở “Kế hoạch & ngân sách”'})}
  </div>
  ${launch.length?panel('Theo dõi sản phẩm mới ra thị trường',tbl(['Sản phẩm','Ngày ra mắt',['Số tháng'],['Doanh thu lũy kế'],['Doanh thu tháng gần nhất'],'Xu hướng 6 tháng'],launch.map(p=>{const ks=M.monthsAll.filter(k=>k>=p.launch.slice(0,7));const v=ks.map(k=>sum(M.byM[k]||[],o=>sum(o.lines.filter(l=>l[0]===p.id),l=>l[1]*l[2]*(1-l[3]))));return `<tr><td>${esc(p.name)}</td><td>${vn(p.launch)}</td>${tdn(ks.length)}${tdn(fmtM(sum(v)))}${tdn(fmtM(v[v.length-1]||0))}<td>${spark(v.slice(-6))}</td></tr>`})),{cls:'mt',sub:'Mẫu “Thời gian ra thị trường”'}):''}`;
};
function priceTable(){const pr=S.col.pricing||{};const npp=+(pr.cfg&&pr.cfg.npp)||12,ret=+(pr.cfg&&pr.cfg.retail)||18;
  return tbl(['Sản phẩm',['Giá vốn'],['Markup NSX'],['Giá NSX'],['Giá NPP (−'+npp+'%)'],['Giá bán lẻ (+'+ret+'%)'],['Biên NSX']],PRODUCTS.filter(p=>!p.service).slice(0,12).map(p=>{const nppP=p.price*(1-npp/100),rl=nppP*(1+ret/100);return `<tr><td>${esc(p.name)}</td>${tdn(fmt(p.cogs))}${tdn(pct(p.price/p.cogs-1,0))}${tdn(fmt(p.price))}${tdn(fmt(nppP))}${tdn(fmt(Math.round(rl/1000)*1000))}${tdn(pct((nppP-p.cogs)/nppP,0))}</tr>`}))}

V.customer=()=>{
  const m=M,f=S.f;const cs=m.customers.filter(c=>(!f.region||c.region===f.region)&&(!f.channel||c.ch===f.channel)&&(!f.team||(m.RP[c.rep]||{}).team===f.team));
  const act=cs.filter(c=>c.status==='Đang hoạt động').length,risk=cs.filter(c=>c.status==='Có nguy cơ').length,churn=cs.filter(c=>c.status==='Rời bỏ (>90 ngày)').length;
  const arpu=avg(cs.filter(c=>c.rev12),c=>c.rev12),gm=m.rev?m.gp/m.rev:.32,life=3;const clv=arpu*gm*life;
  const segs=countBy(cs.filter(c=>c.seg),c=>c.seg).sort((a,b)=>b.v-a.v);
  const q=f.custQ.trim().toLowerCase();let list=cs.filter(c=>(!q||(c.name+c.id+c.province).toLowerCase().includes(q))&&(!f.custTier||c.tier===f.custTier)).sort((a,b)=>b.rev12-a.rev12);
  const tk=tickets();const csat=avg(tk.month.slice(-3),x=>x.csat),nps=avg(tk.month.slice(-3),x=>x.nps);
  const newT=cs.filter(c=>c.first>=M.Y+'-01-01').length;
  return `${filterBar()}
  <div class="kpis">${kpi('Khách đang hoạt động',fmt(act),`${fmt(cs.length)} khách trong danh mục`)}${kpi('Khách mới '+m.Y,fmt(newT),'Đơn đầu tiên trong năm')}${kpi('Có nguy cơ rời bỏ',fmt(risk),'45–90 ngày chưa mua',risk?'warn':'')}${kpi('Đã rời bỏ',fmt(churn),'Churn rate '+pct(churn/Math.max(1,cs.filter(c=>c.orders).length)),churn?'crit':'')}${kpi('Doanh thu TB/khách (12 tháng)',fmtM(arpu),'CLV ước tính '+fmtB(clv))}${kpi('CSAT · NPS (3 tháng)',fmtD(csat,2)+' / 5',`NPS ${fmtD(nps,0)} · SLA ${pct(avg(tk.month.slice(-3),x=>x.sla),0)}`)}</div>
  <div class="grid g3 mt">${panel('Phân hạng khách hàng',donut(['Diamond','Gold','Silver','Bronze'].map((t,i)=>({l:t,v:cs.filter(c=>c.tier===t).length,c:COLORS[i]})),null,{unit:'khách'}),{sub:'Theo doanh thu 12 tháng: top 5% / 15% / 30% / còn lại'})}
   ${panel('Phân khúc RFM',hbars(segs,{color:'var(--c2)'}),{sub:'Recency – Frequency – Monetary, thang 1–5'})}
   ${panel('KPI chăm sóc khách hàng',colChart(tk.month.slice(-6).map(x=>monthName(x.m)),[{n:'Yêu cầu/khiếu nại',c:'var(--c4)',values:tk.month.slice(-6).map(x=>x.n)}],{h:190,f:fmt,line:{n:'Đúng SLA (%)',c:'var(--c1)',values:tk.month.slice(-6).map(x=>x.sla*100)}}),{sub:'SLA '+P('sla')+' giờ theo ISO 10002',act:`<button class="btn sm" data-act="ticketNew"${lock()}>Ghi nhận khiếu nại</button>`})}</div>
  ${panel('Danh sách khách hàng',`<div class="filters"><input placeholder="Tìm tên, mã, tỉnh…" data-f="custQ" value="${esc(f.custQ)}"><select data-f="custTier"><option value="">Mọi hạng</option>${optHtml(['Diamond','Gold','Silver','Bronze'],f.custTier)}</select><button class="btn sm" data-act="custNew"${lock()}>+ Khách hàng</button></div>`+tbl(['Mã','Khách hàng','Loại','Hạng','Phân khúc',['DT 12 tháng'],['Công nợ'],['Hạn mức'],'Trạng thái','Phụ trách'],list.slice(0,60).map(c=>`<tr><td class="mono">${c.id}</td><td>${cLink(c.id)}<div class="small muted">${esc(c.province)}</div></td><td class="small">${esc(c.type)}</td><td>${tierPill(c.tier)}</td><td class="small">${esc(c.seg||'—')}</td>${tdn(fmtM(c.rev12))}${tdn(c.ar?fmtM(c.ar):'—')}<td class="n">${c.creditLimit?prog(c.use,c.use>1?'crit':c.use>.8?'warn':'ok')+' '+pct(c.use,0):'—'}</td><td>${c.blocked?pill('Khóa giao hàng','crit'):pill(c.status,c.status==='Đang hoạt động'?'ok':c.status==='Có nguy cơ'?'warn':'mute')}</td><td class="small">${esc(repName(c.rep))}</td></tr>`)),{cls:'mt',sub:list.length>60?'Hiển thị 60/'+list.length+' – dùng ô tìm kiếm':''})}
  ${panel('Nhật ký yêu cầu & khiếu nại',tbl(['Mã','Ngày','Khách hàng','Nội dung','Kênh','Hạn xử lý','Trạng thái',''],tk.list.slice(0,10).map(t=>`<tr><td class="mono">${t.id}</td><td>${vn(t.date)}</td><td>${cLink(t.cust)}</td><td class="small">${esc(t.text)}</td><td>${esc(t.via)}</td><td>${vn(t.due)}</td><td>${pill(t.status,t.status==='Đã xử lý'?'ok':t.due<M.TS?'crit':'warn')}</td><td>${t.status!=='Đã xử lý'?`<button class="btn sm" data-act="ticketDone" data-id="${t.id}"${lock()}>Đóng</button>`:''}</td></tr>`)),{cls:'mt'})}`;
};
function tickets(){const out=[],g=rngOf(4242);for(const k of M.monthsAll){const n=g.ri(38,72);out.push({m:k,n,sla:g.between(.82,.97),csat:g.between(4.05,4.6),nps:g.between(28,52)})}
  const TX=['Giao thiếu hàng so với đơn','Hàng cận date','Sai giá trên hóa đơn','Chậm giao hàng','Yêu cầu xuất lại hóa đơn','Hỏi chính sách chiết khấu quý','Bao bì móp méo','Đề nghị đối chiếu công nợ'];
  const gen=[];const cs=M.customers.filter(c=>c.orders);for(let i=0;i<14;i++){const d=iso(addDays(M.T,-g.ri(0,20)));gen.push({id:'CS'+d.replace(/-/g,'').slice(2)+i,date:d,cust:g.pick(cs).id,text:g.pick(TX),via:g.pick(['Hotline','Zalo OA','Email','Sales báo']),due:iso(addDays(parse(d),3)),status:days(d,M.TS)>4||g.chance(.5)?'Đã xử lý':'Đang xử lý'})}
  Object.entries(S.col.tickets).forEach(([id,t])=>{const i=gen.findIndex(x=>x.id===id);if(i>=0)Object.assign(gen[i],t);else gen.push(Object.assign({id},t))});
  return{month:out,list:gen.sort((a,b)=>a.date<b.date?1:-1)}}

V.channel=()=>{
  const m=M,f=S.f;const gt=m.customers.filter(c=>c.ch==='GT'&&(!f.region||c.region===f.region));const npp=gt.filter(c=>c.type==='Nhà phân phối');
  const weekStart=iso(addDays(m.T,-((m.T.getDay()+6)%7)));const vis=m.visits.filter(v=>v.date>=weekStart);
  const gtReps=m.reps.filter(r=>r.ch==='GT'&&r.quota&&(!f.region||r.region===f.region)&&(!f.team||r.team===f.team));
  const lastV={};m.visits.forEach(v=>{if(v.cust&&(!lastV[v.cust]||v.date>lastV[v.cust]))lastV[v.cust]=v.date});
  const gap=gt.filter(c=>c.status!=='Rời bỏ (>90 ngày)'&&(!lastV[c.id]||days(lastV[c.id],m.TS)>P('visitGap')));
  const stage=c=>c.blocked?'Tạm dừng (công nợ)':c.recency<=7?'Đã đặt hàng':c.recency<=30?'Chăm sóc sau bán':c.recency<=60?'Đã tư vấn':'Cần kích hoạt lại';
  const prov=Object.entries(groupBy(m.inP.filter(o=>o.ch==='GT'),o=>(m.C[o.cust]||{}).province)).map(([l,x])=>({l,v:sum(x,o=>o.net)})).sort((a,b)=>b.v-a.v).slice(0,10);
  const today=m.visits.filter(v=>v.date===m.TS||v.date===iso(addDays(m.T,-1))).slice(0,14);
  return `${filterBar()}
  <div class="kpis">${kpi('Nhà phân phối',fmt(npp.length),`${fmt(gt.length-npp.length)} đại lý cấp 1`)}${kpi('Sell-in kênh GT',fmtB(sum(m.inP.filter(o=>o.ch==='GT'),o=>o.net)),'Kỳ đã chọn')}${kpi('Lượt ghé tuần này',fmt(vis.filter(v=>!v.newOutlet).length),fmt(vis.filter(v=>v.newOutlet).length)+' lượt mở mới')}${kpi('Trưng bày đạt chuẩn',pct(vis.filter(v=>v.display==='Đạt').length/Math.max(1,vis.filter(v=>v.display!=='—').length),0),'Tuần này')}${kpi('Điểm bán quá '+P('visitGap')+' ngày chưa ghé',fmt(gap.length),'Cần đưa vào tuyến',gap.length?'warn':'')}</div>
  <div class="grid g12 mt">${panel('Sơ đồ kênh phân phối AMG',channelMap(),{sub:'Push qua NPP/đại lý (GT), pull qua thương hiệu & MT/TMĐT'})}${panel('Bản đồ thị trường GT (top tỉnh)',hbars(prov,{f:fmtB,color:'var(--c5)'}))}</div>
  ${panel('KPIs đi tuyến tuần này',tbl(['Sales','Nhóm',['Mở mới (KH '+P('routeNew')+')'],['Chăm sóc (KH '+P('routeCare')+')'],['% hoàn thành'],['Thu nợ đúng hạn'],['Đơn từ tuyến'],'Đánh giá'],gtReps.map(r=>{const v=vis.filter(x=>x.rep===r.id);const nw=v.filter(x=>x.newOutlet).length,care=v.filter(x=>!x.newOutlet&&x.status==='Đã hoàn thành').length;const pc=(Math.min(1,nw/P('routeNew'))+Math.min(1,care/P('routeCare')))/2;
    const due=m.orders.filter(o=>o.rep===r.id&&o.due>=weekStart&&o.due<=m.TS);const onTime=due.length?due.filter(o=>o.paidAt&&o.paidAt<=o.due).length/due.length:1;const ord=m.orders.filter(o=>o.rep===r.id&&o.date>=weekStart).length;
    return `<tr><td>${rLink(r.id)}</td><td class="small">${esc(TEAM[r.team].name)}</td>${tdn(nw)}${tdn(care)}<td class="n">${prog(pc)} ${pct(pc,0)}</td>${tdn(pct(onTime,0))}${tdn(ord)}<td>${pill(pc>=1?'Đạt':pc>=.7?'Gần đạt':'Chưa đạt',pc>=1?'ok':pc>=.7?'warn':'crit')}</td></tr>`})),{cls:'mt',sub:'Theo mẫu “KPIs đi tuyến chi tiết”: tiếp cận NPP mới 10/tuần, chăm sóc NPP cũ 5/tuần',act:`<button class="btn sm pri" data-act="visitNew"${lock()}>+ Check-in viếng thăm</button>`})}
  <div class="grid g2 mt">
   ${panel('Quản lý thông tin nhà phân phối',tbl(['NPP','Khu vực','Người đại diện','Giai đoạn',['Đơn 30 ngày'],'Ưu tiên','Sale'],npp.sort((a,b)=>b.rev12-a.rev12).slice(0,16).map(c=>{const v30=sum(m.orders.filter(o=>o.cust===c.id&&days(o.date,m.TS)<=30),o=>o.net);return `<tr><td>${cLink(c.id)}</td><td class="small">${esc(c.province)}</td><td class="small">${esc(c.contact)}<div class="muted">${esc(c.phone)}</div></td><td>${pill(stage(c),c.blocked?'crit':c.recency<=30?'ok':'warn')}</td>${tdn(fmtM(v30))}<td>${pill(c.tier==='Diamond'||c.tier==='Gold'?'Cao':c.tier==='Silver'?'Trung bình':'Thấp',c.tier==='Diamond'||c.tier==='Gold'?'info':'mute')}</td><td class="small">${esc(repName(c.rep))}</td></tr>`})),{sub:'Mẫu quản lý thông tin NPP'})}
   ${panel('Checklist công việc đi tuyến (2 ngày gần nhất)',tbl(['Ngày','Sale','Điểm bán','Mục đích','Check-in','Trưng bày','Tình trạng'],today.map(v=>`<tr><td>${vn(v.date)}</td><td class="small">${esc(repName(v.rep))}</td><td class="small">${v.cust?cLink(v.cust):esc(v.prospect)}</td><td class="small">${esc(v.purpose)}</td><td class="mono">${esc(v.checkin)}</td><td>${v.display==='—'?'—':pill(v.display,v.display==='Đạt'?'ok':'warn')}</td><td class="small">${esc(v.status)}</td></tr>`)))}
  </div>
  ${gap.length?panel('Điểm bán cần ghé trong tuần',tbl(['Điểm bán','Loại','Lần ghé cuối',['Số ngày'],'Sale',''],gap.slice(0,15).map(c=>`<tr><td>${cLink(c.id)}</td><td class="small">${esc(c.type)}</td><td>${lastV[c.id]?vn(lastV[c.id]):'Chưa ghé (120 ngày)'}</td>${tdn(lastV[c.id]?days(lastV[c.id],m.TS):'—')}<td class="small">${esc(repName(c.rep))}</td><td><button class="btn sm" data-act="visitNew" data-c="${c.id}"${lock()}>Check-in</button></td></tr>`)),{cls:'mt'}):''}`;
};
function channelMap(){const box=(x,y,w,t,s,c)=>`<g><rect x="${x}" y="${y}" width="${w}" height="44" rx="8" style="fill:var(--surface-2);stroke:${c||'var(--line)'}"/><text x="${x+w/2}" y="${y+19}" text-anchor="middle" class="lbl" style="font-size:12px;font-weight:600">${t}</text><text x="${x+w/2}" y="${y+34}" text-anchor="middle" class="tick">${s}</text></g>`;
  const ar=(x1,y1,x2,y2)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:var(--muted)" stroke-width="1.4" marker-end="url(#ah)"/>`;
  const v=k=>fmtB(sum(M.inP.filter(o=>o.ch===k),o=>o.net));
  return `<svg viewBox="0 0 660 230" class="chart" role="img" aria-label="Sơ đồ kênh phân phối"><defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0L10,5L0,10z" style="fill:var(--muted)"/></marker></defs>
  ${box(10,93,120,'Nhà máy Đồng Nai','AMG Việt Nam','var(--c1)')}${box(180,8,130,'Nhà phân phối','GT · '+v('GT'))}${box(350,8,120,'Đại lý cấp 1 / bán sỉ','')}${box(510,8,140,'Tạp hóa, chợ','Người tiêu dùng')}
  ${box(180,70,130,'Chuỗi bán lẻ MT','MT · '+v('MT'))}${box(180,132,130,'B2B & HORECA','KA · '+v('KA'))}${box(180,186,130,'Sàn TMĐT / D2C','TMĐT · '+v('EC'))}${box(510,110,140,'Người tiêu dùng','& khách doanh nghiệp','var(--c3)')}
  ${ar(130,108,180,30)}${ar(130,112,180,92)}${ar(130,118,180,152)}${ar(130,124,180,206)}${ar(310,30,350,30)}${ar(470,30,510,30)}${ar(310,92,510,125)}${ar(310,154,510,132)}${ar(310,206,510,140)}</svg>`}
