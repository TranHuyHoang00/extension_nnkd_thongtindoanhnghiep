Thu thập danh sách ngành nghề (nganh nghe) từ `thongtindoanhnghiep.co/api/industry` ngay trong một tab đã vượt qua Cloudflare, rồi đẩy thẳng lên Kafka gateway.
Phần POST do background service worker thực hiện nên không bị dính CORS.

## Cài đặt
1. Mở `chrome://extensions/`
2. Bật **Developer mode** (Chế độ nhà phát triển, góc trên bên phải)
3. Bấm **Load unpacked** (Tải tiện ích đã giải nén) → chọn thư mục `extension_nnkd_thongtindoanhnghiep`
4. Bấm biểu tượng extension để mở **Side Panel** (bảng điều khiển bên phải)

## Cách dùng
1. Mở `https://thongtindoanhnghiep.co` và vượt qua Cloudflare.
2. Giữ nguyên tab đó và chọn Extensions, rồi mở Side Panel.
3. Kiểm tra các ô (đã điền sẵn mặc định):
   - **API URL**: `https://thongtindoanhnghiep.co/api/industry`
   - **Gateway URL**: địa chỉ gateway (không kèm apikey)
   - **API Key**: dán khóa vào đây — **bắt buộc**, để trống sẽ không chạy
   - **Topic**: điền tên Topic
   - **Limit**: `-1` = lấy tất cả
   - **Batch**: số bản ghi gửi mỗi lần POST
   - **Delay**: thời gian chờ giữa các lần POST (mili giây)
4. Bấm **Start** và theo dõi log.
   - **Stop**: dừng giữa chừng.
   - **Clear log**: xóa nội dung log đang hiển thị.

## Ghi chú
- `/api/industry` trả về toàn bộ danh sách trong **một lần gọi**, dữ liệu nằm trong trường `LtsItem`, nên **không có phân trang**.
- Dữ liệu gửi đi là **raw** nguyên từ API. Việc chống trùng do phía nhận (Elasticsearch) xử lý.
- Muốn gửi tất cả trong 1 lần POST thì đặt **Batch** lớn hơn tổng số (ví dụ 1000).

## Các file
- `manifest.json`: cấu hình extension, quyền, host.
- `background.js`: nhận batch rồi POST lên gateway (không CORS).
- `content.js`: chạy trong tab TTDN — fetch dữ liệu raw, chia batch, gửi đi.
- `sidepanel.html` / `sidepanel.css` / `sidepanel.js`: giao diện, nút Start/Stop, log.