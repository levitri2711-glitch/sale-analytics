// Văn bản pháp lý (tự soạn, áp dụng cho ứng dụng học tập/mô phỏng) – nên nhờ luật sư rà soát trước khi dùng với dữ liệu thật.
(function () {
  const OWNER = 'Quản trị viên Sale Analytics (cá nhân vận hành, phi thương mại)';
  const CONTACT = 'email của Owner ghi trong thư mời';
  const UPDATED = '16/11/2026';
  const PAGES = {
    privacy: ['Chính sách bảo mật', `
      <h2>1. Phạm vi</h2><p>Sale Analytics là ứng dụng mô phỏng phân tích và quản trị bán hàng phục vụ học tập, đào tạo. Toàn bộ khách hàng, nhân viên kinh doanh, đơn hàng, số liệu trong ứng dụng là <b>dữ liệu giả lập</b>, không phải người thật.</p>
      <h2>2. Dữ liệu cá nhân chúng tôi xử lý</h2><ul>
      <li><b>Email người dùng</b>: để gửi link đăng nhập, lời mời, thông báo phân quyền. Không thu thập mật khẩu.</li>
      <li><b>Nhật ký hoạt động</b>: thời điểm đăng nhập, thay đổi dữ liệu, thay đổi quyền – để bảo mật và giải quyết khiếu nại.</li>
      <li><b>Nội dung bạn nhập</b>: bình luận, chỉnh sửa trên dữ liệu mô phỏng. Không nhập dữ liệu cá nhân thật của người khác (CCCD, sức khoẻ, tôn giáo, tài khoản ngân hàng…).</li></ul>
      <h2>3. Mục đích và căn cứ</h2><p>Chỉ để vận hành ứng dụng theo yêu cầu của bạn (đăng nhập, phân quyền, lưu dữ liệu cộng tác). Căn cứ: sự đồng ý của bạn khi đăng nhập, theo Luật Bảo vệ dữ liệu cá nhân 2025; với người dùng tại EU: GDPR Điều 6(1)(a),(b). Không bán, không cho thuê, không dùng cho quảng cáo, không lập hồ sơ tự động.</p>
      <h2>4. Nơi lưu trữ và bên thứ ba</h2><ul>
      <li>Giao diện được phục vụ bởi <b>GitHub Pages</b> (GitHub, Inc.) – có thể ghi địa chỉ IP trong nhật ký máy chủ của họ.</li>
      <li>Dữ liệu lưu trong <b>Google Sheets</b> của Owner, xử lý qua <b>Google Apps Script</b>; email gửi qua dịch vụ Gmail của Owner. Dữ liệu có thể được lưu trên máy chủ của Google ngoài lãnh thổ Việt Nam.</li>
      <li>Ứng dụng không dùng cookie theo dõi, không dùng công cụ phân tích, không tải phông chữ hay thư viện từ bên thứ ba. Trình duyệt lưu phiên đăng nhập trong localStorage của chính bạn.</li>
      <li>Nút “Prompt AI (0 đ)” chỉ sao chép văn bản vào bộ nhớ tạm; ứng dụng không gửi dữ liệu tới dịch vụ AI nào.</li></ul>
      <h2>5. Thời gian lưu</h2><p>Dữ liệu tài khoản lưu khi tài khoản còn hoạt động; khi bị thu hồi hoặc bạn yêu cầu xoá, dữ liệu được xoá trong 30 ngày. Nhật ký bảo mật lưu tối đa 12 tháng. Link đăng nhập tự xoá sau khi hết hạn.</p>
      <h2>6. Quyền của bạn</h2><p>Bạn có quyền được biết, đồng ý, truy cập, chỉnh sửa, xoá, hạn chế xử lý, rút lại đồng ý, phản đối, khiếu nại. Thực hiện tại mục <b>Hệ thống → Quyền dữ liệu của bạn</b> (tải dữ liệu JSON, gửi yêu cầu) hoặc liên hệ ${CONTACT}. Phản hồi trong 72 giờ, hoàn tất tối đa 30 ngày.</p>
      <h2>7. Bảo mật</h2><ul><li>Link đăng nhập dùng một lần, hết hạn sau 15 phút; phiên ký HMAC-SHA256, hết hạn sau 30 ngày.</li><li>Quyền truy cập (Viewer, Commenter, Contributor, Editor, Owner) được kiểm tra ở máy chủ cho mọi thao tác; chỉ người được mời mới đăng nhập.</li><li>Chống chèn công thức khi ghi vào Google Sheets; giới hạn số email gửi mỗi ngày.</li><li>Khi phát hiện sự cố lộ lọt, Owner thông báo cho người dùng bị ảnh hưởng và cơ quan có thẩm quyền theo quy định.</li></ul>
      <h2>8. Trẻ em</h2><p>Ứng dụng không dành cho người dưới 16 tuổi.</p>`],
    terms: ['Điều khoản sử dụng', `
      <h2>1. Tài khoản và quyền truy cập</h2><p>Ứng dụng do ${OWNER} vận hành, miễn phí, không thu phí người dùng hiện tại hay tương lai. Quyền truy cập do Owner/Editor cấp và có thể thu hồi bất kỳ lúc nào. Không chia sẻ link đăng nhập.</p>
      <h2>2. Dữ liệu mô phỏng</h2><p>Tên công ty “Aurora Meridian Group Việt Nam (AMG)”, khách hàng, nhà phân phối, sản phẩm và nhân viên là hư cấu; mọi trùng hợp với tổ chức, cá nhân thật là ngẫu nhiên. Không dùng ứng dụng để lưu dữ liệu khách hàng, công nợ thật nếu chưa có đánh giá tác động xử lý dữ liệu cá nhân và thoả thuận phù hợp.</p>
      <h2>3. Nội dung và sở hữu trí tuệ</h2><ul><li>Khung năng lực, câu hỏi trắc nghiệm, biểu mẫu do đơn vị vận hành tự biên soạn để học tập; khái niệm học thuật (ASK, KSAO, Great Eight, STAR, Kirkpatrick) được trích dẫn ở mức khái niệm.</li><li>Bạn chịu trách nhiệm với nội dung mình nhập; không đăng nội dung trái pháp luật, phân biệt đối xử, xâm phạm quyền riêng tư.</li><li>Ứng dụng không kết nối hay tự đăng bài lên mạng xã hội thật; “kênh mạng xã hội” chỉ là mô phỏng.</li></ul>
      <h2>4. Hành vi bị cấm</h2><p>Truy cập trái phép, dò quét, gửi yêu cầu tự động hàng loạt, giả mạo người khác, dùng ứng dụng để thu thập dữ liệu cá nhân trái phép.</p>
      <h2>5. Thay đổi dịch vụ</h2><p>Tính năng có thể thay đổi, tạm dừng để bảo trì. Điều khoản cập nhật sẽ hiển thị ngày hiệu lực mới tại trang này.</p>
      <h2>6. Luật áp dụng</h2><p>Pháp luật Việt Nam. Tranh chấp ưu tiên giải quyết bằng thương lượng theo quy trình khiếu nại.</p>`],
    disclaimer: ['Miễn trừ trách nhiệm', `<ul>
      <li>Tham số pháp lý (lương tối thiểu, bảo hiểm, thuế, thời gian thử việc…) và trích dẫn văn bản là thông tin tham khảo cho mục đích học tập, có thể chưa phản ánh thay đổi mới nhất. Luôn đối chiếu văn bản gốc trên vbpl.vn, chinhphu.vn trước khi áp dụng.</li>
      <li>Kết quả trắc nghiệm, điểm phỏng vấn, đề xuất tuyển chọn chỉ minh hoạ phương pháp; không thay thế đánh giá chuyên môn và không được dùng làm căn cứ duy nhất để ra quyết định về con người.</li>
      <li>Các tên nền tảng (LinkedIn, Facebook, TikTok, Zalo, TopCV, VietnamWorks, ITviec) thuộc chủ sở hữu tương ứng; ứng dụng không liên kết hay được bảo trợ bởi các nền tảng này.</li>
      <li>Dịch vụ của bên thứ ba (GitHub, Google) có chính sách riêng; chúng tôi không chịu trách nhiệm về gián đoạn của các dịch vụ đó.</li></ul>`],
    complaints: ['Quy trình tiếp nhận và xử lý khiếu nại', `
      <h2>Bước 1 — Gửi khiếu nại</h2><p>Dùng mục “Quyền dữ liệu của bạn” trong ứng dụng hoặc email cho Owner, nêu email tài khoản và mô tả vấn đề.</p>
      <h2>Bước 2 — Xác nhận</h2><p>Trong 2 ngày làm việc.</p>
      <h2>Bước 3 — Xử lý</h2><p>Lỗi kỹ thuật 2–5 ngày làm việc; quyền truy cập, dữ liệu cá nhân tối đa 30 ngày.</p>
      <h2>Bước 4 — Phản hồi</h2><p>Kết quả và cách khắc phục được gửi qua email. Bạn có quyền khiếu nại tới cơ quan chuyên trách bảo vệ dữ liệu cá nhân (Bộ Công an) nếu chưa đồng ý với kết quả.</p>`],
  };
  function html(key) {
    const p = PAGES[key] || PAGES.privacy;
    return `<div class="legal"><h1>${p[0]}</h1><p class="small muted">Cập nhật: ${UPDATED} · Đơn vị vận hành: ${OWNER}</p>${p[1]}
      <p class="small"><a href="#/legal/privacy">Bảo mật</a> · <a href="#/legal/terms">Điều khoản</a> · <a href="#/legal/disclaimer">Miễn trừ</a> · <a href="#/legal/complaints">Khiếu nại</a></p></div>`;
  }
  window.HTSLegal = { html };
})();
