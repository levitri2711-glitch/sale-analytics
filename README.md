# Sale Analytics

Web app phân tích và vận hành bán hàng cho **khối Kinh doanh AMG Việt Nam (Aurora Meridian Group)**, cùng tập đoàn giả định với HR Analytics. Toàn bộ dữ liệu là **mô phỏng**: từ 01/01/2025 đến hôm nay (đồng hồ thật, mốc 11/2026).

App gom toàn bộ kiến thức trong thư mục `SALE SYSTEM`: 65 file Excel thuộc 9 bộ tài liệu, các ebook (6M, quy trình B2B 7 bước, SPIN, Challenger, FAB, CAC/CLV, kênh phân phối, 5A, 4P, CEO Playbook, ACTMAP) và các biên bản công nợ.

- **Chi phí:** 0 đ. App chạy trên GitHub Pages + Google Apps Script + Google Sheets + Gmail của Owner, không dùng thư viện, phông chữ, phân tích hay AI trả phí.
- **Ứng dụng:** https://levitri2711-glitch.github.io/sale-analytics/
- **Chạy thử trên máy:** `npm run dev` → http://localhost:8790/?demo (bản demo), http://localhost:8790/dev (đăng nhập thử từng vai).

## 18 màn hình
| Nhóm | Màn hình |
|---|---|
| Dashboard & báo cáo | Tổng quan CEO · Doanh thu & lợi nhuận · Đội ngũ & hiệu suất · Sản phẩm & tồn kho · Khách hàng & CSKH (RFM, tier, ticket) · Kênh phân phối & đi tuyến |
| Vận hành bán hàng | Đơn hàng & hóa đơn · Pipeline & dự báo (Kanban, win rate, velocity) · Công nợ & tuổi nợ (DSO, dự phòng TT 48/2019, lãi chậm trả) · Hợp đồng & văn bản (13 mẫu) |
| Kế hoạch & KPI | Mục tiêu & KPI (OKR, hoa hồng) · Kế hoạch & ngân sách (SWOT, 30-60-90, dòng tiền) · Marketing & chuyển đổi (phễu, CAC, LTV:CAC) |
| Tri thức & hệ thống | Pháp lý & chính sách (26 tham số có lịch hiệu lực, 4 gói quy định, 20 văn bản luật VN + quốc tế) · Trung tâm tự động (12 tác vụ) · Bộ biểu mẫu Excel (16 mẫu có công thức) · Tips & tricks (17 nhóm) · Chia sẻ & phân quyền |

## Dữ liệu liên kết chặt
Khách hàng → đơn hàng/hóa đơn (VAT theo ngày: 8% đến 31/12/2026, sau đó 10%) → lịch thanh toán → công nợ/tuổi nợ → hạn mức tín dụng → khóa giao hàng → hoa hồng (tính trên tiền đã thu, trừ nợ quá 90 ngày).
Ngoài ra: Pipeline → hợp đồng → hóa đơn · Đi tuyến → đơn hàng · Đơn hàng → tồn kho → đề xuất nhập · Chỉ tiêu → KPI → hoa hồng → bảng chuyển HR.

Mọi nút đều tính lại toàn bộ chuỗi trên. Tham số pháp lý có ngày hiệu lực: sửa tham số hoặc áp gói quy định chỉ có tác dụng từ ngày hiệu lực trở đi, số liệu quá khứ giữ nguyên, và mọi thay đổi đều hoàn tác được.

## Phân quyền
Viewer → Commenter → Contributor → Editor → Owner, giống chia sẻ Google Docs/Sheets/Drive. Mời bằng email; đăng nhập bằng link gửi qua email, không dùng mật khẩu. Máy chủ kiểm tra quyền ở mọi thao tác ghi; ghi bị từ chối sẽ được hoàn tác trên trình duyệt. Xem `docs/SOP_OWNER.md`.

## Cấu trúc
- `frontend/`: trang tĩnh (GitHub Pages). `js/data.js` chứa mô hình dữ liệu + sinh dữ liệu xác định theo ngày; `views-*.js` chứa các màn; `actions.js` chứa form, tác vụ tự động, xuất Excel; `docs.js` chứa văn bản; `app.js` lo đăng nhập, đồng bộ, bình luận, phân quyền.
- `apps-script/`: máy chủ (Core.js dùng chung cho Node và Apps Script). Đưa lên bằng `clasp push`, không public trên GitHub.
- `tools/`: `dev_server.cjs` (máy chủ thử), `model_probe.cjs` (in số liệu mô hình: `npm run probe`).
- `tests/`: `npm test`.

## Chạy thử
```bash
npm test
npm run dev
```
