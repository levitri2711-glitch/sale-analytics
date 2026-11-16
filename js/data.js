/* Sale Analytics – dữ liệu mô phỏng khối Kinh doanh AMG Việt Nam và mô hình tính toán liên kết.
   Chuỗi liên kết: Khách hàng → Đơn hàng/Hóa đơn → Thanh toán → Công nợ & tuổi nợ → Hạn mức → Hoa hồng
                  Cơ hội (pipeline) → Hợp đồng → Hóa đơn;  Đi tuyến → Đơn hàng;  Đơn hàng → Tồn kho;  Chỉ tiêu → KPI → Hoa hồng. */
"use strict";
const CO={name:'Công ty TNHH Aurora Meridian Việt Nam',short:'AMG Việt Nam',taxId:'0319 886 420',addr:'Tầng 18, Meridian Tower, Quận 1, TP. Hồ Chí Minh',rep:'Bà Nguyễn Thị Hoàng Lan',repTitle:'Giám đốc Kinh doanh',bank:'0071 0012 34567 – Ngân hàng TMCP (mô phỏng), CN TP.HCM',invoiceSerial:'1C26TAM'};
const START=new Date(2025,0,1);
const REGIONS={BAC:'Miền Bắc',TRUNG:'Miền Trung',NAM:'Miền Nam'};
const CHANNELS={GT:'Kênh truyền thống (GT)',MT:'Kênh hiện đại (MT)',KA:'B2B & HORECA (KA)',EC:'Thương mại điện tử'};
const CH_SHORT={GT:'GT',MT:'MT',KA:'B2B/KA',EC:'TMĐT'};
const PROVINCES={BAC:['Hà Nội','Hải Phòng','Bắc Ninh','Quảng Ninh','Nam Định','Thái Nguyên','Nghệ An'],TRUNG:['Đà Nẵng','Huế','Quảng Nam','Khánh Hòa','Bình Định','Đắk Lắk'],NAM:['TP. Hồ Chí Minh','Bình Dương','Đồng Nai','Cần Thơ','Long An','Bà Rịa – Vũng Tàu','An Giang']};
const CATS={NUT:'Dinh dưỡng',BEV:'Đồ uống',HOM:'Chăm sóc gia đình',PER:'Chăm sóc cá nhân',IND:'Giải pháp B2B'};
const PRODUCTS=[
 ['NUT01','Sữa bột Meri Gold 900g','thùng 12 lon',4200000,2650000,'2019-03-01'],['NUT02','Sữa nước Meri Fresh 180ml','thùng 48',380000,255000,'2018-01-01'],
 ['NUT03','Sữa chua uống Meri Yo','thùng 48',300000,198000,'2020-06-01'],['NUT04','Ngũ cốc Oatie 500g','thùng 20',1150000,690000,'2021-09-01'],
 ['NUT05','Bột dinh dưỡng Meri Kid','thùng 24',2300000,1420000,'2026-03-01'],
 ['BEV01','Nước khoáng Aurora 500ml','thùng 24',120000,66000,'2017-05-01'],['BEV02','Trà xanh Meri Tea 450ml','thùng 24',190000,112000,'2019-04-01'],
 ['BEV03','Cà phê Aurora 3in1','thùng 24 hộp',1450000,860000,'2018-08-01'],['BEV04','Nước tăng lực Volt 250ml','thùng 24',240000,138000,'2022-02-01'],
 ['BEV05','Nước ép Fruity 1L','thùng 12',360000,215000,'2026-05-01'],
 ['HOM01','Nước giặt Clean+ 3,6kg','thùng 4',640000,365000,'2018-01-01'],['HOM02','Nước rửa chén Shine 750ml','thùng 12',330000,188000,'2018-01-01'],
 ['HOM03','Nước lau sàn Fresh 1L','thùng 12',360000,205000,'2020-02-01'],['HOM04','Bột giặt Clean+ 6kg','bao 3',520000,310000,'2017-01-01'],
 ['PER01','Dầu gội Silka 650g','thùng 12',1380000,760000,'2019-01-01'],['PER02','Sữa tắm Silka 900g','thùng 12',1560000,870000,'2019-01-01'],
 ['PER03','Kem đánh răng Bright 180g','thùng 36',1190000,650000,'2020-01-01'],['PER04','Khăn ướt Baby Soft','thùng 24',620000,360000,'2023-05-01'],
 ['IND01','Bột sữa nguyên liệu 25kg','bao',3350000,2520000,'2018-01-01'],['IND02','Sữa đặc HORECA 1,2kg','thùng 12',980000,640000,'2019-01-01'],
 ['IND03','Siro pha chế Aurora Pro 1L','thùng 6',870000,510000,'2021-01-01'],['IND04','Chất tẩy rửa công nghiệp 20L','can',1650000,980000,'2020-01-01'],
 ['IND05','Dịch vụ vệ sinh công nghiệp','gói tháng',18000000,11500000,'2022-01-01'],['IND06','Cho thuê máy pha chế','máy/tháng',2500000,900000,'2023-01-01'],
].map(([id,name,unit,price,cogs,launch])=>({id,name,unit,price,cogs,launch,cat:id.slice(0,3),service:id==='IND05'||id==='IND06'}));
const PROD=Object.fromEntries(PRODUCTS.map(p=>[p.id,p]));
const CH_CATS={GT:['NUT','BEV','HOM','PER'],MT:['NUT','BEV','HOM','PER'],KA:['IND','IND','BEV','NUT'],EC:['NUT','PER','HOM','BEV']};
const SEASON=[1.32,1.18,.84,.9,.94,.92,.9,.95,1.0,1.04,1.1,1.26];
const SCALE=0.49;

/* ---------- tham số pháp lý & chính sách (có ngày hiệu lực → tự áp dụng theo thời gian thực) ---------- */
const PARAMS=[
 // [key, nhóm, nhãn, [[hiệu lực từ, giá trị],...], đơn vị, căn cứ]
 ['vat','Thuế & hóa đơn','Thuế suất GTGT áp dụng cho hàng hóa của AMG',[['2025-01-01',8],['2027-01-01',10]],'%','Luật Thuế GTGT 48/2024/QH15 (10%); giảm 2% đến 31/12/2026 theo NQ 204/2025/QH15, NĐ 174/2025/NĐ-CP'],
 ['nonCash','Thuế & hóa đơn','Ngưỡng phải thanh toán không dùng tiền mặt để khấu trừ thuế GTGT đầu vào',[['2025-01-01',20000000],['2025-07-01',5000000]],'đ','Luật Thuế GTGT 2024, hiệu lực 01/07/2025'],
 ['penaltyCap','Hợp đồng','Mức phạt vi phạm hợp đồng thương mại tối đa',[['2006-01-01',8]],'% phần nghĩa vụ vi phạm','Điều 301 Luật Thương mại 2005'],
 ['interestCap','Hợp đồng','Lãi suất thỏa thuận tối đa',[['2017-01-01',20]],'%/năm','Điều 468 Bộ luật Dân sự 2015'],
 ['lateInterest','Hợp đồng','Lãi chậm thanh toán mặc định (khi hợp đồng không thỏa thuận)',[['2017-01-01',10]],'%/năm','Điều 357 BLDS 2015 (50% mức trần Điều 468); Điều 306 LTM: lãi nợ quá hạn bình quân thị trường'],
 ['promoCap','Khuyến mại','Mức giảm giá / giá trị quà khuyến mại tối đa',[['2018-07-01',50]],'% giá hàng','Điều 6–7 Nghị định 81/2018/NĐ-CP'],
 ['promoDays','Khuyến mại','Tổng thời gian khuyến mại giảm giá một mặt hàng',[['2018-07-01',120]],'ngày/năm','Điều 10 Nghị định 81/2018/NĐ-CP'],
 ['prov1','Công nợ','Trích lập dự phòng nợ quá hạn 6 tháng – dưới 1 năm',[['2019-10-01',30]],'%','Thông tư 48/2019/TT-BTC'],
 ['prov2','Công nợ','Trích lập dự phòng nợ quá hạn 1 – dưới 2 năm',[['2019-10-01',50]],'%','Thông tư 48/2019/TT-BTC'],
 ['prov3','Công nợ','Trích lập dự phòng nợ quá hạn 2 – dưới 3 năm',[['2019-10-01',70]],'%','Thông tư 48/2019/TT-BTC'],
 ['prov4','Công nợ','Trích lập dự phòng nợ quá hạn từ 3 năm',[['2019-10-01',100]],'%','Thông tư 48/2019/TT-BTC'],
 ['blockDays','Chính sách tín dụng','Ngừng giao hàng khi có hóa đơn quá hạn quá',[['2025-01-01',60]],'ngày','Quy chế tín dụng khách hàng AMG (nội bộ)'],
 ['overTol','Chính sách tín dụng','Dung sai vượt hạn mức trước khi khóa',[['2025-01-01',10]],'%','Quy chế tín dụng khách hàng AMG (nội bộ)'],
 ['dsoTarget','Chính sách tín dụng','DSO mục tiêu',[['2025-01-01',45]],'ngày','Kế hoạch tài chính 2026'],
 ['target2026','Kế hoạch','Doanh thu kế hoạch 2026 (chưa VAT)',[['2026-01-01',1260000000000]],'đ','Kế hoạch kinh doanh 2026 – khớp HR Analytics (105 tỷ/tháng)'],
 ['growth2027','Kế hoạch','Tăng trưởng mục tiêu 2027 so với ước thực hiện 2026',[['2026-10-01',12]],'%','Dự thảo kế hoạch 2027'],
 ['c1','Hoa hồng','Hoa hồng khi đạt 70% – dưới 100% chỉ tiêu',[['2025-01-01',0.8]],'% doanh thu đã thu tiền','Quy chế lương kinh doanh 2026: lương cứng + hoa hồng theo bậc'],
 ['c2','Hoa hồng','Hoa hồng khi đạt 100% – dưới 120%',[['2025-01-01',1.2]],'% doanh thu đã thu tiền','Quy chế lương kinh doanh 2026'],
 ['c3','Hoa hồng','Hoa hồng khi đạt từ 120%',[['2025-01-01',1.6]],'% doanh thu đã thu tiền','Quy chế lương kinh doanh 2026'],
 ['cDeduct','Hoa hồng','Trừ hoa hồng trên phần nợ quá hạn > 90 ngày của nhân viên',[['2025-01-01',50]],'%','Quy chế lương kinh doanh 2026'],
 ['routeNew','Đi tuyến','Tiếp cận điểm bán / NPP mới',[['2025-01-01',10]],'điểm/tuần','Mẫu KPIs đi tuyến'],
 ['routeCare','Đi tuyến','Chăm sóc NPP / đại lý hiện có',[['2025-01-01',5]],'điểm/tuần','Mẫu KPIs đi tuyến'],
 ['visitGap','Đi tuyến','Số ngày tối đa giữa hai lần ghé một điểm bán',[['2025-01-01',14]],'ngày','Tiêu chuẩn phục vụ kênh GT'],
 ['staleDays','Pipeline','Cơ hội không có hoạt động quá',[['2025-01-01',21]],'ngày','Quy trình bán hàng B2B 7 bước'],
 ['mktPct','Ngân sách','Ngân sách marketing / doanh thu',[['2025-01-01',4.5]],'%','Thông lệ 5–15% (ebook 6M) – AMG chọn 4,5% vì có trade marketing riêng'],
 ['sla','CSKH','Thời hạn xử lý khiếu nại',[['2025-01-01',72]],'giờ','ISO 10002:2018 & cam kết dịch vụ AMG'],
];
const PARAM=Object.fromEntries(PARAMS.map(p=>[p[0],{key:p[0],group:p[1],label:p[2],hist:p[3],unit:p[4],src:p[5]}]));
function effHist(key){const p=PARAM[key];if(!p)return [];let h=p.hist.slice();const ov=(S.col.settings.params||{})[key];if(Array.isArray(ov))for(const[f,x]of ov){h=h.filter(([g])=>g<f);h.push([f,+x])}return h}
function P(key,date){const ov=(S.col.settings.params||{})[key];if(ov!=null&&ov!==''&&!Array.isArray(ov))return +ov;const h=effHist(key);if(!h.length)return 0;const d=iso(parse(date||(M&&M.T)||realToday()));let v=h[0][1];for(const[f,x]of h)if(f<=d)v=x;return v}
function nextChange(key){const d=iso(M.T);return effHist(key).find(([f])=>f>d)}
/* Gói cập nhật quy định: áp dụng có lưu lịch sử, hoàn tác được. */
const PACKS=[
 {id:'vat2027',title:'Thuế GTGT 2027: hết giảm 2% (về 10%)',eff:'2027-01-01',set:{vat:10},why:'NQ 204/2025/QH15 chỉ giảm thuế GTGT đến 31/12/2026. Áp dụng sớm để báo giá, hợp đồng giao hàng từ 2027 dùng 10%. Nếu Quốc hội gia hạn, hoàn tác gói này.'},
 {id:'vatExt',title:'Giả định Quốc hội gia hạn giảm GTGT 8% sang 2027',eff:'2027-01-01',set:{vat:8},why:'Kịch bản để so sánh giá bán; chỉ áp dụng khi có nghị quyết chính thức.'},
 {id:'credit2027',title:'Siết tín dụng 2027: khóa giao hàng khi quá hạn 45 ngày',eff:'2027-01-01',set:{blockDays:45,overTol:5,dsoTarget:40},why:'Đề xuất của Tài chính để đưa DSO về 40 ngày.'},
 {id:'comm2027',title:'Hoa hồng 2027: tăng bậc vượt chỉ tiêu',eff:'2027-01-01',set:{c2:1.3,c3:1.9},why:'Khuyến khích vượt chỉ tiêu, giữ chân nhân sự sales (60% sales nghỉ trong năm đầu nếu đãi ngộ kém – ebook 6M).'},
];

/* ---------- dữ liệu gốc (sinh một lần, xác định theo hạt giống) ---------- */
const SURN=['Nguyễn','Trần','Lê','Phạm','Hoàng','Huỳnh','Phan','Vũ','Võ','Đặng','Bùi','Đỗ','Hồ','Ngô','Dương','Lý'];
const MID=['Văn','Thị','Minh','Hoàng','Ngọc','Thanh','Quốc','Thu','Đức','Hải','Gia','Anh','Bảo','Phương'];
const GIV=['An','Bình','Châu','Dũng','Giang','Hà','Hải','Hạnh','Hiếu','Hòa','Hùng','Khánh','Lan','Linh','Long','Mai','Minh','My','Nam','Nga','Nhung','Phong','Phúc','Quân','Quỳnh','Sơn','Tâm','Thảo','Thắng','Trang','Trung','Tú','Tuấn','Uyên','Việt','Vy','Yến','Khoa','Ngân','Đạt'];
const BIZ=['Minh Phát','Thành Đạt','Hưng Thịnh','Phú Gia','An Khang','Tân Tiến','Đại Lợi','Kim Ngân','Vạn Phúc','Hoàng Long','Sao Mai','Bình Minh','Thiên Ân','Phước Lộc','Đông Á','Trường Sơn','Nam Việt','Hồng Hà','Bảo Châu','Toàn Cầu','Quang Minh','Gia Huy','Thuận Phát','Hải Đăng','Ngọc Lan','Việt Hưng','Đức Tín','Mekong','Sông Hàn','Phương Nam','Tràng An','Kinh Bắc','Lam Sơn','Cửu Long','Tây Đô','Hòa Bình','Tân Phú','Sài Thành','Hạ Long','Ánh Dương'];
const TEAMS=[
 {id:'GTB',name:'GT Miền Bắc',region:'BAC',ch:'GT',n:6,lead:'Trưởng nhóm GT Miền Bắc'},{id:'GTT',name:'GT Miền Trung',region:'TRUNG',ch:'GT',n:4},
 {id:'GTN',name:'GT Miền Nam',region:'NAM',ch:'GT',n:7},{id:'MTX',name:'Kênh hiện đại toàn quốc',region:'NAM',ch:'MT',n:4},
 {id:'KAB',name:'B2B & HORECA Miền Bắc',region:'BAC',ch:'KA',n:5},{id:'KAN',name:'B2B & HORECA Miền Nam',region:'NAM',ch:'KA',n:6},
 {id:'ECO',name:'Thương mại điện tử',region:'NAM',ch:'EC',n:3},
];
const TEAM=Object.fromEntries(TEAMS.map(t=>[t.id,t]));
function genMaster(){
  const g=rngOf(20261116),used=new Set();
  const person=(fem)=>{let n;do{n=g.pick(SURN)+' '+(fem?g.pick(['Thị','Ngọc','Thu','Phương','Thanh','Bảo']):g.pick(MID.filter(x=>x!=='Thị')))+' '+g.pick(GIV)}while(used.has(n));used.add(n);return n};
  const reps=[];let k=1;
  const mk=(o)=>{const fem=g.chance(.45);const r=Object.assign({id:'SAL-'+String(k++).padStart(3,'0'),name:person(fem),gender:fem?'Nữ':'Nam',hire:iso(addDays(new Date(2015,0,1),g.ri(0,3800))),skill:clamp(1+g.gauss()*.17,.66,1.4),base:0},o);
    r.email=r.name.normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/gi,'d').toLowerCase().split(' ').slice(-1)[0]+'.'+r.id.slice(4)+'@amg-demo.vn';reps.push(r);return r};
  mk({title:'Giám đốc Kinh doanh',team:'',region:'',ch:'',level:'Director',base:95000000,quota:false});
  ['BAC','TRUNG','NAM'].forEach(rg=>mk({title:'Giám đốc vùng '+REGIONS[rg],team:'',region:rg,ch:'',level:'RSM',base:62000000,quota:false}));
  TEAMS.forEach(t=>{for(let i=0;i<t.n;i++)mk({title:i===0?'Trưởng nhóm':(t.ch==='KA'||t.ch==='MT'?'Key Account Executive':t.ch==='EC'?'Chuyên viên TMĐT':'Sales Executive'),team:t.id,region:t.region,ch:t.ch,level:i===0?'Lead':'Rep',base:i===0?38000000:g.ri(14,24)*1e6,quota:true})});
  // một nhân viên mới vào 2026 (để có thử việc, đường cong năng suất)
  reps[reps.length-2].hire='2026-04-06';reps[reps.length-9].hire='2026-08-03';
  const repsOf=t=>reps.filter(r=>r.team===t&&r.quota);
  const customers=[];let c=1;
  const addC=(o)=>{const id='KH'+String(c++).padStart(4,'0');const pr=g.pick(PROVINCES[o.region]);
    const pay=g.R();const profile=pay<.58?'good':pay<.84?'slow':pay<.96?'late':'bad';
    const cu=Object.assign({id,province:pr,since:iso(addDays(new Date(2019,0,1),g.ri(0,2400))),contact:person(g.chance(.5)),phone:'09'+g.ri(10,99)+' '+g.ri(100,999)+' '+g.ri(100,999),
      taxId:'0'+g.ri(100000000,399999999),profile,lateMean:profile==='good'?1:profile==='slow'?g.ri(10,30):profile==='late'?g.ri(40,85):0,badFrom:profile==='bad'?iso(addDays(new Date(2026,2,1),g.ri(0,150))):'',
      churnAt:g.chance(.06)?iso(addDays(new Date(2025,8,1),g.ri(0,300))):'',addr:'Số '+g.ri(2,388)+', '+g.pick(['đường Lê Lợi','đường Trần Hưng Đạo','đường Nguyễn Huệ','KCN '+pr.split(' ').slice(-1)[0],'đường Hùng Vương','đường Lý Thường Kiệt','đường 3/2'])+', '+pr},o);
    if(g.chance(.07))cu.since=iso(addDays(new Date(2026,0,5),g.ri(0,280)));
    customers.push(cu);return cu};
  const name=(pre)=>{let n;do{n=pre+' '+g.pick(BIZ)+(g.chance(.3)?' '+g.pick(['Group','Food','Trading','Logistics','Mart','Holdings']):'')}while(used.has(n));used.add(n);return n};
  TEAMS.filter(t=>t.ch==='GT').forEach(t=>{const rs=repsOf(t.id);const nN={GTB:14,GTT:9,GTN:16}[t.id],nD={GTB:25,GTT:15,GTN:30}[t.id];
    for(let i=0;i<nN;i++)addC({name:name('Công ty TNHH Phân phối'),type:'Nhà phân phối',ch:'GT',region:t.region,rep:rs[i%rs.length].id,size:g.between(260,820)*1e6,freq:g.ri(4,7),terms:g.pick([30,30,45,45,60]),limitX:g.between(1.55,2.6)});
    for(let i=0;i<nD;i++)addC({name:name(g.pick(['Đại lý','Cửa hàng','Tạp hóa tổng hợp'])),type:'Đại lý cấp 1',ch:'GT',region:t.region,rep:rs[i%rs.length].id,size:g.between(35,140)*1e6,freq:g.ri(7,14),terms:g.pick([0,15,15,30]),limitX:g.between(1.7,2.6)})});
  const mt=repsOf('MTX');['Chuỗi siêu thị','Hệ thống siêu thị','Chuỗi cửa hàng tiện lợi','Chuỗi mẹ & bé','Đại siêu thị'].forEach((p,j)=>{for(let i=0;i<3;i++)if(customers.filter(x=>x.ch==='MT').length<14)addC({name:name(p),type:j===2?'Cửa hàng tiện lợi':'Chuỗi bán lẻ',ch:'MT',region:g.pick(['BAC','NAM','NAM','TRUNG']),rep:mt[(i+j)%mt.length].id,size:g.between(320,1150)*1e6,freq:g.ri(4,6),terms:g.pick([45,60,60]),limitX:g.between(1.8,2.6)})});
  [['KAB',34,'BAC'],['KAN',42,'NAM']].forEach(([t,n,rg])=>{const rs=repsOf(t);for(let i=0;i<n;i++){const fac=g.chance(.38);addC({name:fac?name('Công ty CP Thực phẩm'):name(g.pick(['Khách sạn','Nhà hàng','Chuỗi cà phê','Bếp ăn công nghiệp','Trường Quốc tế','Bệnh viện'])),type:fac?'Nhà máy – khu công nghiệp':'Khách sạn – nhà hàng',ch:'KA',region:rg,rep:rs[i%rs.length].id,size:(fac?g.between(90,420):g.between(14,110))*1e6,freq:fac?g.ri(9,16):g.ri(10,18),terms:g.pick([15,30,30,45]),limitX:g.between(1.7,2.6)})}});
  const ec=repsOf('ECO');['Sàn TMĐT Sắc Cam (mô phỏng)','Sàn TMĐT Lam Hải (mô phỏng)','Sàn TMĐT Ngọc Bích (mô phỏng)','Website D2C amg-demo.vn','Social commerce (livestream)'].forEach((n,i)=>addC({name:n,type:'Sàn TMĐT',ch:'EC',region:'NAM',rep:ec[i%ec.length].id,size:[95,70,45,30,22][i]*1e6,freq:1,terms:15,limitX:3,profile:'good',lateMean:1,badFrom:'',churnAt:''}));
  customers.forEach(cu=>{const monthly=cu.size*SCALE*1.12*21/cu.freq;cu.creditLimit=Math.round(monthly*(cu.terms+20)/30*cu.limitX/1e7)*1e7;if(cu.ch==='EC'){cu.profile='good';cu.lateMean=1}});
  return{reps,customers};
}

/* ---------- sinh giao dịch theo ngày (mỗi ngày một hạt giống riêng → thêm ngày mới không đổi quá khứ) ---------- */
function genTx(master,asOf){
  const {reps,customers}=master;const R=Object.fromEntries(reps.map(r=>[r.id,r]));
  const orders=[],acts=[],visits=[];let seq=1;
  const repCust=groupBy(customers.filter(c=>c.ch==='GT'),c=>c.rep);
  for(let d=new Date(START);d<=asOf;d=addDays(d,1)){
    if(!isWorkday(d))continue;
    const ds=iso(d),g=rngOf('d'+ds),y=d.getFullYear(),m=d.getMonth();
    const trend=(y===2025?1:1.11)*(1+0.004*(y-2025)*m)*SEASON[m];
    for(const cu of customers){
      const live=ds>=cu.since&&(!cu.churnAt||ds<cu.churnAt);const p=1/cu.freq;const roll=g.R();
      if(!live||roll>p)continue;
      const rep=R[cu.rep],ramp=rep.hire>ds?0:Math.min(1,.45+days(rep.hire,ds)/200);
      const v=cu.size*SCALE*trend*rep.skill*ramp*Math.exp(g.gauss()*.28);if(v<3e6)continue;
      const cats=CH_CATS[cu.ch],n=cu.ch==='KA'?g.ri(1,3):g.ri(2,5);const lines=[];
      const disc=cu.ch==='GT'?(cu.type==='Nhà phân phối'?.12:.08):cu.ch==='MT'?.16:cu.ch==='KA'?.06:.10;
      for(let i=0;i<n;i++){const cat=g.pick(cats);const pool=PRODUCTS.filter(p=>p.cat===cat&&p.launch<=ds);if(!pool.length)continue;const pr=g.pick(pool);
        const share=v/n,qty=Math.max(1,Math.round(share/(pr.price*(1-disc))));const ex=lines.find(l=>l[0]===pr.id);if(ex)ex[1]+=qty;else lines.push([pr.id,qty,pr.price,disc])}
      if(!lines.length)continue;
      const ret=g.chance(.012)?g.between(.02,.08):0;
      orders.push({id:'SO'+ds.slice(2).replace(/-/g,'')+'-'+String(seq).padStart(5,'0'),inv:String(seq++).padStart(8,'0'),date:ds,cust:cu.id,rep:cu.rep,ch:cu.ch,region:cu.region,lines,ret,seed:g.ri(1,1e9)});
    }
    for(const rep of reps){if(!rep.quota||rep.hire>ds)continue;const k=rep.ch==='KA'||rep.ch==='MT'?1:rep.ch==='EC'?.6:.7;
      acts.push([ds,rep.id,Math.round(g.between(14,34)*k*rep.skill),Math.round(g.between(6,18)*k),g.chance(.55*k)?g.ri(1,3):0,g.ri(0,4),g.chance(.25)?1:0]);// calls, emails, meetings, leads, quotes
      if(rep.ch==='GT'&&days(ds,asOf)<=120){const mine=repCust[rep.id]||[];const nV=g.ri(4,7);
        for(let i=0;i<nV&&mine.length;i++){const cu=g.pick(mine);const purpose=g.pick(['Chốt đơn hàng mới','Chăm sóc định kỳ','Chăm sóc định kỳ','Thu hồi công nợ','Kiểm tra trưng bày','Triển khai khuyến mại']);
          visits.push({id:'VS'+ds.replace(/-/g,'')+rep.id.slice(4)+i,date:ds,rep:rep.id,cust:cu.id,purpose,display:g.chance(.78)?'Đạt':'Không đạt',status:g.chance(.93)?'Đã hoàn thành':'Không gặp được',checkin:z2(g.ri(8,16))+':'+z2(g.ri(0,59)),newOutlet:false})}
        if(g.chance(.7)){const nn=g.ri(1,3);for(let i=0;i<nn;i++)visits.push({id:'VN'+ds.replace(/-/g,'')+rep.id.slice(4)+i,date:ds,rep:rep.id,cust:'',prospect:g.pick(['Tạp hóa','Cửa hàng','Đại lý','Mini mart'])+' '+g.pick(BIZ)+' – '+g.pick(PROVINCES[rep.region]),purpose:'Mở mới điểm bán',display:'—',status:g.chance(.35)?'Đồng ý đặt hàng thử':'Đã giới thiệu',checkin:z2(g.ri(8,16))+':'+z2(g.ri(0,59)),newOutlet:true})}}
    }
  }
  return{orders,acts,visits};
}
function genOpps(master,asOf){
  const g=rngOf(9091),{reps,customers}=master;const ka=customers.filter(c=>c.ch==='KA'||c.ch==='MT');const out=[];let k=1;
  const NEEDS=['Cung cấp siro & sữa pha chế','Hợp đồng vệ sinh công nghiệp','Nguyên liệu bột sữa cho dây chuyền','Cho thuê máy pha chế + nguyên liệu','Mở rộng danh mục Silka tại chuỗi','Đưa Meri Kid lên kệ toàn chuỗi','Chương trình trưng bày Tết','Cung cấp nước uống cho văn phòng','Bếp ăn: sữa & ngũ cốc'];
  for(let d=new Date(2025,5,2);d<=asOf;d=addDays(d,1)){if(!isWorkday(d)||!g.chance(.55))continue;const ds=iso(d);
    const isNew=g.chance(.4);const cu=isNew?null:g.pick(ka);const team=cu?TEAM[(reps.find(r=>r.id===cu.rep)||{}).team]:g.pick(TEAMS.filter(t=>t.ch==='KA'||t.ch==='MT'));
    const rep=cu?cu.rep:g.pick(reps.filter(r=>r.team===team.id)).id;const repO=reps.find(r=>r.id===rep);
    const amount=Math.round(g.between(.15,2.6)*(team.ch==='MT'?3:1)*1e9*SCALE/1e6)*1e6;const L=g.ri(25,115),el=days(ds,asOf);
    const o={id:'OP'+String(k++).padStart(4,'0'),name:g.pick(NEEDS),cust:cu?cu.id:'',prospect:cu?'':g.pick(['Khách sạn','Công ty CP','Chuỗi','Tập đoàn','Bệnh viện'])+' '+g.pick(BIZ)+' (tiềm năng)',rep,amount,source:g.pick(['Marketing inbound','Marketing inbound','Cold call','Giới thiệu','Hội chợ / sự kiện','Đối tác','Khách hàng hiện hữu']),created:ds,expClose:iso(addDays(d,L+g.ri(-10,20))),cycle:L};
    if(el>=L){o.stage=g.chance(.3*repO.skill+(cu?.1:0))?'won':'lost';o.closed=iso(addDays(d,L));if(o.stage==='lost')o.lossReason=g.pick(['Giá cao hơn đối thủ','Ngân sách khách hàng bị cắt','Giữ nhà cung cấp hiện tại','Không liên lạc được người quyết định','Sản phẩm chưa phù hợp quy cách','Thời gian giao hàng không đáp ứng']);o.last=o.closed}
    else{o.stage=['lead','qualified','proposal','negotiation'][Math.min(3,Math.floor(el/L*4))];o.last=iso(addDays(d,Math.floor(el*g.between(.2,1))))}
    out.push(o)}
  return out;
}
function genMarketing(asOf){
  const g=rngOf(777),out=[];const CH=[['Google Ads',.26,.035,.045],['Facebook/Instagram',.24,.012,.03],['TikTok',.14,.009,.02],['Email marketing',.05,.18,.035],['Hội chợ & sự kiện',.13,0,.08],['Trade marketing (trưng bày)',.18,0,0]];
  for(let d=new Date(START);d<=asOf;d=addMonths(d,1)){const k=ym(d),mi=d.getMonth();const budget=105e9*SCALE/0.62*0.045*SEASON[mi]*(d.getFullYear()===2025?.9:1);
    CH.forEach(([n,sh,ctr,cvr])=>{const spend=Math.round(budget*sh*g.between(.85,1.15)/1e5)*1e5;const imp=n.startsWith('Trade')?0:Math.round(spend/g.between(40,90));const clicks=Math.round(imp*ctr*g.between(.8,1.2));const leads=n.startsWith('Hội')?g.ri(60,180):n.startsWith('Trade')?0:Math.round(clicks*cvr);
      out.push({m:k,ch:n,spend,imp,clicks,leads,sql:Math.round(leads*g.between(.18,.34)),won:Math.round(leads*g.between(.03,.07)),optin:n==='Email marketing'?g.between(.92,1):1})})}
  return out;
}

/* ---------- mô hình tính toán ---------- */
let G=null,M=null;
function base(){
  const T=realToday();
  if(G&&G.asOf===iso(T))return G;
  const master=genMaster();const tx=genTx(master,T);
  G={asOf:iso(T),T,...master,...tx,opps:genOpps(master,T),mkt:genMarketing(T)};return G;
}
function payPlan(o,cu,gross){ // lịch thu tiền mô phỏng của một hóa đơn
  const g=rngOf(o.seed),due=addDays(parse(o.date),cu.terms);
  if(cu.profile==='bad'&&o.date>=cu.badFrom)return g.chance(.15)?[[iso(addDays(due,g.ri(20,80))),gross*.3]]:[];
  if(cu.badFrom&&cu.profile==='bad')return[[iso(addDays(due,g.ri(-2,25))),gross]];
  const lag=cu.profile==='good'?Math.round(g.gauss()*3):Math.max(0,Math.round(cu.lateMean*g.between(.4,1.6)));
  if(g.chance(cu.profile==='good'?.06:.2)){return[[iso(addDays(due,lag)),gross*.5],[iso(addDays(due,lag+g.ri(15,60))),gross*.5]]}
  return[[iso(addDays(due,lag)),gross]];
}
function bucketOf(od){return od<=0?'Chưa đến hạn':od<=30?'1–30 ngày':od<=60?'31–60 ngày':od<=90?'61–90 ngày':od<=120?'91–120 ngày':'Trên 120 ngày'}
const BUCKETS=['Chưa đến hạn','1–30 ngày','31–60 ngày','61–90 ngày','91–120 ngày','Trên 120 ngày'];
const STAGES=[['lead','Tiềm năng',10],['qualified','Đánh giá nhu cầu',25],['proposal','Đề xuất / báo giá',50],['negotiation','Đàm phán',75],['won','Thắng',100],['lost','Thua',0]];
const STAGE=Object.fromEntries(STAGES.map(([k,l,p])=>[k,{l,p}]));
function tierOf(rank,n){const r=rank/n;return r<.05?'Diamond':r<.2?'Gold':r<.5?'Silver':'Bronze'}

function build(){
  if(!_dirty&&M)return M;
  const g=base(),T=g.T,Y=T.getFullYear(),TS=iso(T),col=S.col;
  const custOv=col.customers;
  const customers=g.customers.map(c=>Object.assign({},c,custOv[c.id]||{}));
  Object.entries(custOv).forEach(([id,c])=>{if(!g.customers.some(x=>x.id===id)&&c&&c.name)customers.push(Object.assign({id,ch:'KA',region:'NAM',terms:30,creditLimit:0,profile:'good',since:TS,type:'Khách hàng mới'},c))});
  const C=Object.fromEntries(customers.map(c=>[c.id,c]));
  const reps=g.reps,RP=Object.fromEntries(reps.map(r=>[r.id,r]));
  // đơn hàng: sinh + nhập tay (+ hủy/sửa)
  const manual=Object.entries(col.orders).filter(([,o])=>o&&o.lines).map(([id,o])=>Object.assign({id,manual:true,seed:hashStr(id)},o));
  const all=g.orders.concat(manual).filter(o=>!(col.orders[o.id]&&col.orders[o.id].void));
  const payByCust={};
  for(const o of all){const cu=C[o.cust]||{terms:30,profile:'good'};
    let net=0,cogs=0;for(const[sku,q,pr,ds]of o.lines){const P0=PROD[sku]||{cogs:pr*.6};net+=q*pr*(1-ds);cogs+=q*P0.cogs}
    net*=1-(o.ret||0);cogs*=1-(o.ret||0);
    o.net=net;o.cogs=cogs;o.gp=net-cogs;o.vatRate=o.vatRate!=null?o.vatRate:P('vat',o.date);o.vat=net*o.vatRate/100;o.gross=net+o.vat;
    o.due=iso(addDays(parse(o.date),o.terms!=null?o.terms:cu.terms));o.team=(RP[o.rep]||{}).team||'';o.m=o.date.slice(0,7);
    const plan=o.manual?(o.paidPlan||[]):payPlan(o,cu,o.gross);o.pays=plan.filter(p=>p[0]<=TS);o.paid=sum(o.pays,p=>p[1]);
    o.out=Math.max(0,o.gross-o.paid);o.paidAt=o.out<1&&o.pays.length?o.pays[o.pays.length-1][0]:'';
    if(o.out>0)(payByCust[o.cust]=payByCust[o.cust]||[]).push(o)}
  // phiếu thu nhập tay: trừ FIFO vào hóa đơn cũ nhất
  const receipts=Object.entries(col.payments).map(([id,p])=>Object.assign({id},p)).filter(p=>p.cust&&p.amount>0).sort((a,b)=>a.date<b.date?-1:1);
  for(const p of receipts){let left=+p.amount;const list=(payByCust[p.cust]||[]).sort((a,b)=>a.date<b.date?-1:1);for(const o of list){if(left<=0)break;const x=Math.min(o.out,left);if(x<=0)continue;o.out-=x;o.paid+=x;o.pays=o.pays.concat([[p.date,x,'PT']]);left-=x}p.unapplied=left}
  for(const o of all){o.od=o.out>0?days(o.due,TS):0;o.bucket=o.out>0?bucketOf(o.od):''}
  // bộ lọc
  const f=S.f;const per=periodRange(f.period,T);
  const pass=o=>(!f.region||o.region===f.region)&&(!f.channel||o.ch===f.channel)&&(!f.team||o.team===f.team);
  const ordF=all.filter(pass);const inP=ordF.filter(o=>o.date>=per.from&&o.date<=per.to);
  const prevFrom=iso(addMonths(parse(per.from),-12)),prevTo=iso(addMonths(parse(per.to),-12));const inPrev=ordF.filter(o=>o.date>=prevFrom&&o.date<=prevTo);
  // tháng
  const monthsAll=[];for(let d=new Date(START);d<=T;d=addMonths(d,1))monthsAll.push(ym(d));
  const byM=groupBy(ordF,o=>o.m);const mRev=k=>sum(byM[k]||[],o=>o.net),mGp=k=>sum(byM[k]||[],o=>o.gp);
  // chỉ tiêu
  const tg=targets(g,all,Y);
  const tgtFor=(from,to,filt)=>{let s=0;for(const k of monthsAll.concat(futureMonths(T,14))){const[yy,mm]=k.split('-').map(Number);if(yy!==Y&&yy!==Y-1&&yy!==Y+1)continue;const ms=k+'-01',me=iso(new Date(yy,mm,0));if(me<from||ms>to)continue;
      const frac=overlapFrac(ms,me,from,to);s+=frac*tgMonth(tg,k,filt)}return s};
  const filtT={region:f.region,channel:f.channel,team:f.team};
  const tgtP=tgtFor(per.from,per.to,filtT);
  // khách hàng
  const byCust=groupBy(all,o=>o.cust);const last12=iso(addMonths(T,-12));
  customers.forEach(c=>{const os=byCust[c.id]||[];c.orders=os.length;c.rev12=sum(os.filter(o=>o.date>last12),o=>o.net);c.revY=sum(os.filter(o=>o.date.startsWith(String(Y))),o=>o.net);
    c.first=os.length?os[0].date:'';c.last=os.length?os[os.length-1].date:'';c.ar=sum(os,o=>o.out);c.overdue=sum(os.filter(o=>o.od>0),o=>o.out);c.maxOd=Math.max(0,...os.filter(o=>o.out>0).map(o=>o.od));
    c.use=c.creditLimit?c.ar/c.creditLimit:0;c.over=c.creditLimit&&c.ar>c.creditLimit*(1+P('overTol')/100);
    c.blocked=!!c.hold||c.maxOd>P('blockDays')||c.over;c.recency=c.last?days(c.last,TS):999;c.freq12=os.filter(o=>o.date>last12).length;
    c.status=!c.orders?'Chưa mua':c.recency>90?'Rời bỏ (>90 ngày)':c.recency>45?'Có nguy cơ':'Đang hoạt động'});
  const ranked=customers.filter(c=>c.rev12>0).sort((a,b)=>b.rev12-a.rev12);ranked.forEach((c,i)=>c.tier=tierOf(i,ranked.length));customers.forEach(c=>{if(!c.tier)c.tier='Bronze'});
  // RFM
  const q=(arr,v)=>{const s=arr.slice().sort((a,b)=>a-b);return 1+Math.min(4,Math.floor(s.filter(x=>x<v).length/Math.max(1,s.length)*5))};
  const act=customers.filter(c=>c.orders);const Rv=act.map(c=>-c.recency),Fv=act.map(c=>c.freq12),Mv=act.map(c=>c.rev12);
  act.forEach(c=>{c.r=q(Rv,-c.recency);c.f=q(Fv,c.freq12);c.mm=q(Mv,c.rev12);c.seg=c.r>=4&&c.f>=4?'Khách hàng VIP':c.r>=3&&c.f>=3?'Trung thành':c.r>=4&&c.f<=2?'Mới / tiềm năng':c.r<=2&&c.f>=3?'Cần giữ chân':c.r<=2?'Ngủ đông / rời bỏ':'Cần nuôi dưỡng'});
  // nhân viên
  const repStats=reps.filter(r=>r.quota).map(r=>{const os=inP.filter(o=>o.rep===r.id),pv=inPrev.filter(o=>o.rep===r.id);const tgt=tgtFor(per.from,per.to,{rep:r.id});
    const actsP=g.acts.filter(a=>a[1]===r.id&&a[0]>=per.from&&a[0]<=per.to);const ar=all.filter(o=>o.rep===r.id&&o.out>0);
    const rev=sum(os,o=>o.net);return{r,rev,gp:sum(os,o=>o.gp),n:os.length,cust:new Set(os.map(o=>o.cust)).size,tgt,ach:tgt?rev/tgt:0,prev:sum(pv,o=>o.net),
      calls:sum(actsP,a=>a[2]),emails:sum(actsP,a=>a[3]),meet:sum(actsP,a=>a[4]),leads:sum(actsP,a=>a[5]),quotes:sum(actsP,a=>a[6]),days:actsP.length,ar:sum(ar,o=>o.out),od90:sum(ar.filter(o=>o.od>90),o=>o.out)}});
  repStats.sort((a,b)=>b.ach-a.ach).forEach((x,i)=>x.rank=i+1);
  // công nợ
  const open=all.filter(o=>o.out>0);const AR=sum(open,o=>o.out);
  const rev90=sum(all.filter(o=>days(o.date,TS)<=90),o=>o.gross);const DSO=rev90?AR/(rev90/90):0;
  const buckets=BUCKETS.map(b=>({l:b,v:sum(open.filter(o=>o.bucket===b),o=>o.out)}));
  const provOf=od=>od>=1095?P('prov4'):od>=730?P('prov3'):od>=365?P('prov2'):od>=180?P('prov1'):0;
  open.forEach(o=>{o.prov=o.out*provOf(o.od)/100;o.lateInt=o.od>0?o.out*P('lateInterest')/100*o.od/365:0});
  // pipeline
  const oppOv=col.opps;const opps=g.opps.map(o=>Object.assign({},o,oppOv[o.id]||{}));Object.entries(oppOv).forEach(([id,o])=>{if(!g.opps.some(x=>x.id===id)&&o&&o.name)opps.push(Object.assign({id},o))});
  opps.forEach(o=>{o.p=o.prob!=null?o.prob:STAGE[o.stage].p;o.w=o.amount*o.p/100;o.idle=days(o.last||o.created,TS);o.stale=!['won','lost'].includes(o.stage)&&o.idle>P('staleDays');o.overdue=!['won','lost'].includes(o.stage)&&o.expClose<TS;o.team=(RP[o.rep]||{}).team})
  const openOpps=opps.filter(o=>!['won','lost'].includes(o.stage)&&(!f.team||o.team===f.team));
  const closed12=opps.filter(o=>['won','lost'].includes(o.stage)&&o.closed>=last12);const won12=closed12.filter(o=>o.stage==='won');
  const winRate=closed12.length?won12.length/closed12.length:0;const avgDeal=avg(won12,o=>o.amount);const cycle=avg(won12,o=>days(o.created,o.closed));
  const velocity=cycle?openOpps.length*winRate*avgDeal/cycle:0;
  // hợp đồng (sinh từ khách hàng KA/MT/NPP + cơ hội thắng + nhập tay)
  const contracts=buildContracts(customers,opps,all,T);
  // tồn kho
  const stock=buildStock(g,all,T);
  // mục tiêu kỳ
  const rev=sum(inP,o=>o.net),gp=sum(inP,o=>o.gp),prev=sum(inPrev,o=>o.net);
  const newCust=customers.filter(c=>c.first>=per.from&&c.first<=per.to&&pass({region:c.region,ch:c.ch,team:(RP[c.rep]||{}).team})).length;
  M={T,TS,Y,g,customers,C,reps,RP,orders:all,ordF,inP,inPrev,per,prev,rev,gp,tgtP,ach:tgtP?rev/tgtP:0,newCust,monthsAll,mRev,mGp,byM,tg,tgtFor,tgMonth:(k,fl)=>tgMonth(tg,k,fl),
    repStats,open,AR,DSO,buckets,opps,openOpps,winRate,avgDeal,cycle,velocity,won12,closed12,contracts,stock,acts:g.acts,visits:visitsAll(g,col),mkt:mktAll(g,col)};
  M.tasks=Object.entries(col.tasks).map(([id,t])=>Object.assign({id},t)).sort((a,b)=>(a.status==='done')-(b.status==='done')||(a.due||'')<(b.due||'')?-1:1);
  M.runs=Object.entries(col.runs).map(([id,r])=>Object.assign({id},r)).sort((a,b)=>b.at-a.at);
  M.forecast=forecast(M);M.checks=runChecks(M);M.comm=commission(M,f.commMonth||ym(T));
  _dirty=false;return M;
}
function futureMonths(T,n){const o=[];for(let i=1;i<=n;i++)o.push(ym(addMonths(new Date(T.getFullYear(),T.getMonth(),1),i)));return o}
function overlapFrac(ms,me,from,to){const a=from>ms?from:ms,b=to<me?to:me;if(a>b)return 0;return(days(a,b)+1)/(days(ms,me)+1)}
function periodRange(p,T){const y=T.getFullYear(),m=T.getMonth(),TS=iso(T);
  if(p==='mtd')return{from:iso(new Date(y,m,1)),to:TS,label:'Tháng '+(m+1)+'/'+y+' (đến '+vn(T)+')'};
  if(p==='lm')return{from:iso(new Date(y,m-1,1)),to:iso(new Date(y,m,0)),label:'Tháng '+(new Date(y,m-1,1).getMonth()+1)};
  if(p==='qtd'){const q=Math.floor(m/3);return{from:iso(new Date(y,q*3,1)),to:TS,label:'Quý '+(q+1)+'/'+y}}
  if(p==='l12')return{from:iso(addDays(addMonths(T,-12),1)),to:TS,label:'12 tháng gần nhất'};
  if(p==='py')return{from:(y-1)+'-01-01',to:(y-1)+'-12-31',label:'Năm '+(y-1)};
  return{from:y+'-01-01',to:TS,label:'Lũy kế '+y+' (đến '+vn(T)+')'};
}
/* Chỉ tiêu: năm = tham số kế hoạch (khớp HR); phân bổ tháng theo mùa vụ năm trước, xuống nhóm & nhân viên theo tỷ trọng năm trước (Editor sửa được). */
function targets(g,all,Y){
  const ov=S.col.targets||{};const annual=+(ov.annual&&ov.annual.total)||P('target2026',Y+'-06-01')*(Y>2026?(1+P('growth2027')/100):1);
  const prevY=all.filter(o=>o.date.startsWith(String(Y-1)));const tot=sum(prevY,o=>o.net)||1;
  const mw=MONTHS.map((_,i)=>sum(prevY.filter(o=>+o.m.slice(5)===i+1),o=>o.net)/tot);
  const teamW={},repW={};TEAMS.forEach(t=>teamW[t.id]=(ov['team_'+t.id]&&+ov['team_'+t.id].w)||sum(prevY.filter(o=>o.team===t.id),o=>o.net)/tot);
  const tw=sum(Object.values(teamW))||1;Object.keys(teamW).forEach(k=>teamW[k]/=tw);
  TEAMS.forEach(t=>{const rs=g.reps.filter(r=>r.team===t.id&&r.quota);const base=rs.map(r=>(ov['rep_'+r.id]&&+ov['rep_'+r.id].w)||sum(prevY.filter(o=>o.rep===r.id),o=>o.net)||0);
    const avgB=avg(base.filter(x=>x>0))||1;const b2=base.map((x,i)=>x||avgB*.6);const s=sum(b2)||1;rs.forEach((r,i)=>repW[r.id]=b2[i]/s*teamW[t.id])});
  return{Y,annual,mw,teamW,repW,ov};
}
function tgMonth(tg,k,fl={}){const[yy,mm]=k.split('-').map(Number);let a=tg.annual;if(yy===tg.Y-1)a=tg.annual/1.15;else if(yy===tg.Y+1)a=tg.annual*(1+P('growth2027')/100);
  let v=a*(tg.mw[mm-1]||1/12);
  if(fl.rep)return v*(tg.repW[fl.rep]||0);
  if(fl.team)v*=tg.teamW[fl.team]||0;
  else if(fl.channel||fl.region){v*=sum(TEAMS.filter(t=>(!fl.channel||t.ch===fl.channel)&&(!fl.region||t.region===fl.region)),t=>tg.teamW[t.id])}
  return v}
function buildContracts(customers,opps,all,T){
  const TS=iso(T),out=[],ov=S.col.contracts;const byC=groupBy(all,o=>o.cust);
  customers.filter(c=>['KA','MT'].includes(c.ch)||c.type==='Nhà phân phối').forEach((c,i)=>{
    const am=hashStr(c.id)%12;let st=new Date(T.getFullYear(),am,1);if(st>T)st=addMonths(st,-12);if(c.churnAt&&iso(st)>c.churnAt)st=addMonths(st,-12*Math.ceil(days(c.churnAt,iso(st))/365));
    const start=c.since>iso(st)?c.since:iso(st);const end=iso(addDays(addMonths(parse(start),12),-1));
    const kind=c.type==='Nhà phân phối'?'Hợp đồng phân phối':c.ch==='MT'?'Hợp đồng thương mại (trading terms)':'Hợp đồng nguyên tắc mua bán';
    const os=(byC[c.id]||[]).filter(o=>o.date>=start&&o.date<=end);const pStart=iso(addMonths(parse(start),-12)),prior=sum((byC[c.id]||[]).filter(o=>o.date>=pStart&&o.date<start),o=>o.gross);
    const pFrom=[pStart,iso(START),c.since||iso(START)].sort().pop(),cov=days(pFrom,start),el=Math.max(1,days(start,TS<end?TS:end));// giá trị HĐ = doanh số năm trước quy đổi 12 tháng ×1,08; thiếu lịch sử thì quy đổi từ kỳ hiện tại
    const est=cov>=90&&prior>0?prior/cov*365*1.08:el>60?sum(os,o=>o.gross)/el*365:c.size*SCALE*12;
    out.push({id:'HD-'+start.slice(0,4)+'/'+c.ch+'/'+c.id.slice(2),kind,cust:c.id,rep:c.rep,start,end,value:Math.max(1e7,Math.round(est/1e7)*1e7),terms:c.terms,invoiced:sum(os,o=>o.gross),paid:sum(os,o=>o.paid),out:sum(os,o=>o.out),overdue:sum(os.filter(o=>o.od>0),o=>o.out),penalty:P('penaltyCap',start),gen:true})});
  opps.filter(o=>o.stage==='won'&&o.cust).forEach(o=>{const s=o.closed,e=iso(addDays(addMonths(parse(s),6),-1));const os=all.filter(x=>x.cust===o.cust&&x.date>=s&&x.date<=e);
    const value=o.amount*1.08,g=sum(os,x=>x.gross),k=g>value?value/g:1;// hợp đồng dự án: chỉ tính phần hóa đơn trong cửa sổ giao hàng, tối đa bằng giá trị HĐ
    out.push({id:'HD-'+s.slice(0,4)+'/DA/'+o.id.slice(2),kind:'Hợp đồng mua bán (từ cơ hội '+o.id+')',cust:o.cust,rep:o.rep,start:s,end:e,value,terms:30,invoiced:g*k,paid:sum(os,x=>x.paid)*k,out:sum(os,x=>x.out)*k,overdue:sum(os.filter(x=>x.od>0),x=>x.out)*k,opp:o.id,penalty:P('penaltyCap',s),gen:true})});
  Object.entries(ov).forEach(([id,c])=>{const i=out.findIndex(x=>x.id===id);if(i>=0)out[i]=Object.assign(out[i],c);else if(c&&c.cust)out.push(Object.assign({id,invoiced:0,paid:0,out:0,overdue:0},c))});
  out.forEach(c=>{c.left=days(TS,c.end);c.status=c.signed===false?'Chờ ký':c.end<TS?'Hết hiệu lực':c.left<=30?'Sắp hết hạn':'Đang hiệu lực';c.progress=c.value?c.invoiced/c.value:0});
  return out;
}
function buildStock(g,all,T){
  const TS=iso(T),since28=iso(addDays(T,-28));const sold={},sold28={},soldY={};
  for(const o of all)for(const[sku,q]of o.lines){sold[sku]=(sold[sku]||0)+q*(1-(o.ret||0));if(o.date>since28)sold28[sku]=(sold28[sku]||0)+q;if(o.date.startsWith(TS.slice(0,4)))soldY[sku]=(soldY[sku]||0)+q}
  const adj=S.col.stock||{};
  return PRODUCTS.map(p=>{const gg=rngOf('stk'+p.id),daily=(sold28[p.id]||0)/24;if(p.service)return Object.assign({},p,{sold:sold[p.id]||0,daily,qty:null,cover:null,status:'Dịch vụ'});
    const totalSold=sold[p.id]||0;const issue=p.id==='BEV04'?-.82:p.id==='NUT05'?-.5:p.id==='PER04'?1.9:p.id==='HOM04'?1.3:0;
    const target=daily*gg.between(26,40)*(1+issue);const receipts=totalSold+target;const manual=sum(Object.values(adj).filter(a=>a.sku===p.id),a=>+a.qty);
    const qty=Math.max(0,Math.round(receipts-totalSold+manual));const rop=Math.round(daily*(7+14)),safety=Math.round(daily*7);const cover=daily?qty/daily:999;
    return Object.assign({},p,{sold:totalSold,soldY:soldY[p.id]||0,daily,qty,rop,safety,cover,value:qty*p.cogs,status:qty<=safety?'Sắp hết hàng':qty<=rop?'Dưới điểm đặt hàng':cover>75?'Tồn kho cao':'Bình thường',suggest:qty<=rop?Math.max(0,Math.round(daily*35-qty)):0})});
}
function visitsAll(g,col){return g.visits.concat(Object.entries(col.visits).map(([id,v])=>Object.assign({id,manual:true},v)))}
function mktAll(g,col){const o=g.mkt.slice();Object.entries(col.campaigns).forEach(([id,c])=>{if(c&&c.m&&c.ch)o.push(Object.assign({id,manual:true},c))});return o}
function forecast(M){
  const T=M.T,ks=futureMonths(new Date(T.getFullYear(),T.getMonth()-1,1),7);// tháng hiện tại + 6
  const yoy=(()=>{const a=sum(M.monthsAll.slice(-4,-1),k=>M.mRev(k)),b=sum(M.monthsAll.slice(-16,-13),k=>M.mRev(k));return b?a/b:1.1})();
  return ks.map(k=>{const[yy,mm]=k.split('-').map(Number);const ly=(yy-1)+'-'+z2(mm);const base=M.mRev(ly)*clamp(yoy,.8,1.4);
    const pipe=sum(M.openOpps.filter(o=>o.expClose.slice(0,7)===k),o=>o.w)*.35;const act=M.mRev(k);const tgt=M.tgMonth(k,{region:S.f.region,channel:S.f.channel,team:S.f.team});
    const isCur=k===ym(T);const frac=isCur?T.getDate()/new Date(yy,mm,0).getDate():0;const run=isCur&&frac?act/frac:0;
    const fc=isCur?Math.max(act,.55*run+.45*base+pipe*(1-frac)):base+pipe;return{k,base,pipe,act,tgt,fc,lo:fc*.92,hi:fc*1.08,yoy}});
}
function commission(M,mk){
  const rows=M.reps.filter(r=>r.quota).map(r=>{const tgt=M.tgMonth(mk,{rep:r.id});const os=M.orders.filter(o=>o.rep===r.id&&o.m===mk);const rev=sum(os,o=>o.net);
    const collected=sum(M.orders.filter(o=>o.rep===r.id),o=>sum(o.pays.filter(p=>p[0].slice(0,7)===mk),p=>p[1]))/(1+P('vat')/100);
    const ach=tgt?rev/tgt:0;const rate=ach>=1.2?P('c3'):ach>=1?P('c2'):ach>=.7?P('c1'):0;const od90=sum(M.orders.filter(o=>o.rep===r.id&&o.od>90),o=>o.out);
    const gross=collected*rate/100;const deduct=Math.min(gross,od90/(1+P('vat')/100)*rate/100*P('cDeduct')/100);const saved=(S.col.commission[mk+'_'+r.id]||null);
    return{r,mk,tgt,rev,ach,collected,rate,gross,deduct,net:gross-deduct,od90,saved}});
  return rows;
}
function runChecks(M){
  const out=[],TS=M.TS;
  M.customers.forEach(c=>{if(c.maxOd>90&&c.ar>0)out.push({sev:'crit',area:'debt',ref:c.id,msg:`${c.name}: nợ quá hạn ${c.maxOd} ngày, dư nợ ${fmtM(c.ar)}`,act:'Ngừng giao hàng, gửi thư nhắc nợ lần 3, chuyển Pháp chế nếu quá 120 ngày'});
    else if(c.maxOd>P('blockDays'))out.push({sev:'warn',area:'debt',ref:c.id,msg:`${c.name}: quá hạn ${c.maxOd} ngày (ngưỡng khóa ${P('blockDays')} ngày)`,act:'Gửi thông báo công nợ, hẹn lịch thanh toán'});
    if(c.over)out.push({sev:c.use>1.4?'crit':'warn',area:'credit',ref:c.id,msg:`${c.name}: dùng ${pct(c.use,0)} hạn mức ${fmtM(c.creditLimit)}`,act:'Khóa đơn mới đến khi thu tiền hoặc được duyệt nâng hạn mức'});
    if(c.ch==='GT'&&c.status==='Có nguy cơ')out.push({sev:'info',area:'customer',ref:c.id,msg:`${c.name}: ${c.recency} ngày chưa đặt hàng`,act:'Đưa vào tuyến chăm sóc tuần này'})});
  M.stock.forEach(s=>{if(s.status==='Sắp hết hàng')out.push({sev:'crit',area:'stock',ref:s.id,msg:`${s.name}: tồn ${fmt(s.qty)} ${s.unit}, đủ bán ~${fmtD(s.cover,0)} ngày`,act:`Đặt sản xuất/nhập ${fmt(s.suggest)} ${s.unit}`});else if(s.status==='Dưới điểm đặt hàng')out.push({sev:'warn',area:'stock',ref:s.id,msg:`${s.name}: dưới điểm đặt hàng (${fmt(s.qty)}/${fmt(s.rop)})`,act:`Đề xuất nhập ${fmt(s.suggest)} ${s.unit}`});else if(s.status==='Tồn kho cao')out.push({sev:'info',area:'stock',ref:s.id,msg:`${s.name}: tồn ${fmtD(s.cover,0)} ngày bán`,act:'Đẩy khuyến mại (≤ '+P('promoCap')+'% theo NĐ 81/2018) hoặc giảm kế hoạch sản xuất'})});
  M.openOpps.filter(o=>o.stale).forEach(o=>out.push({sev:o.amount>1e9?'warn':'info',area:'pipeline',ref:o.id,msg:`Cơ hội ${o.id} (${fmtM(o.amount)}) không có hoạt động ${o.idle} ngày`,act:'Gọi lại người quyết định hoặc chuyển sang Thua'}));
  M.contracts.forEach(c=>{if(c.status==='Sắp hết hạn')out.push({sev:'warn',area:'contract',ref:c.id,msg:`${c.id} hết hạn sau ${c.left} ngày`,act:'Gửi phụ lục gia hạn / đàm phán điều khoản 2027'});if(c.status==='Hết hiệu lực'&&c.out>0)out.push({sev:'crit',area:'contract',ref:c.id,msg:`${c.id} đã hết hiệu lực nhưng còn nợ ${fmtM(c.out)}`,act:'Lập biên bản đối chiếu & thanh lý hợp đồng'});if(c.status!=='Hết hiệu lực'&&!c.opp&&c.progress>1.2)out.push({sev:'info',area:'contract',ref:c.id,msg:`${c.id} đã xuất hóa đơn ${pct(c.progress,0)} giá trị hợp đồng khung`,act:'Lập phụ lục điều chỉnh giá trị & hạn mức tín dụng'})});
  const mk=ym(M.T),frac=M.T.getDate()/new Date(M.Y,M.T.getMonth()+1,0).getDate();
  M.reps.filter(r=>r.quota&&r.hire<TS).forEach(r=>{const t=M.tgMonth(mk,{rep:r.id}),a=sum(M.orders.filter(o=>o.rep===r.id&&o.m===mk),o=>o.net);if(t&&frac>.3&&a/t<frac*.7)out.push({sev:'warn',area:'kpi',ref:r.id,msg:`${r.name}: đạt ${pct(a/t,0)} chỉ tiêu tháng, nhịp chuẩn ${pct(frac,0)}`,act:'Coaching 1-1, rà soát pipeline & tuyến'})});
  Object.entries(S.col.orders).forEach(([id,o])=>{if(o&&o.lines&&o.lines.some(l=>l[3]>P('promoCap')/100))out.push({sev:'crit',area:'legal',ref:id,msg:`Đơn ${id} giảm giá vượt ${P('promoCap')}% (NĐ 81/2018)`,act:'Điều chỉnh giá hoặc đăng ký chương trình đặc thù với Sở Công Thương'})});
  const m=M.mkt.filter(x=>x.ch==='Email marketing'&&x.optin<.95&&x.m===mk);if(m.length)out.push({sev:'warn',area:'legal',ref:'email',msg:'Danh sách email marketing tháng này có liên hệ chưa xác nhận đồng ý',act:'Loại khỏi tệp gửi theo Luật BVDLCN 2025 & NĐ 91/2020 (chống thư rác)'});
  const rank={crit:0,warn:1,info:2};return out.sort((a,b)=>rank[a.sev]-rank[b.sev]);
}
if(typeof module!=='undefined')module.exports={};
