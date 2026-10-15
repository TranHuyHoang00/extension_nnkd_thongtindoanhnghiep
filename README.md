Thu thập danh sách ngành nghề (nganh nghe) từ `thongtindoanhnghiep.co/api/industry`
ngay trong một tab đã vượt qua Cloudflare, rồi đẩy thẳng lên Kafka gateway.
Phần POST do background service worker thực hiện nên không bị dính CORS.

## Cài đặt

1. Mở `chrome://extensions/`
2. Bật **Developer mode** (Chế độ nhà phát triển, góc trên bên phải)
3. Bấm **Load unpacked** (Tải tiện ích đã giải nén) → chọn thư mục `extension_industry`
4. Bấm biểu tượng extension để mở **Side Panel** (bảng điều khiển bên phải)

## Cách dùng

1. Mở `https://thongtindoanhnghiep.co` và vượt qua Cloudflare (mở thử `/api/city`, thấy JSON là đã qua).
2. Giữ nguyên tab đó ở trạng thái **đang chọn (active)**, rồi mở Side Panel.
3. Kiểm tra các ô (đã điền sẵn mặc định):
   - **API URL**: `https://thongtindoanhnghiep.co/api/industry`
   - **Gateway URL**: địa chỉ gateway (không kèm apikey)
   - **API Key**: dán khóa vào đây — **bắt buộc**, để trống sẽ không chạy
   - **Topic**: ``
   - **Limit**: `-1` = lấy tất cả
4. Bấm **Start** và theo dõi log.
   - **Stop**: dừng giữa chừng.
   - **Clear log**: xóa nội dung log đang hiển thị.

## Bảo mật

- Extension **không lưu cấu hình** vào máy. API Key chỉ nằm trong ô nhập khi panel đang mở;
  đóng panel hoặc tải lại là mất, **không ghi xuống đĩa**.
- Vì vậy mỗi lần mở lại phải dán API Key lần nữa (đây là chủ ý để tránh lộ khóa).

## Ghi chú

- `/api/industry` trả về toàn bộ danh sách trong **một lần gọi**, dữ liệu nằm trong trường `LtsItem`
  (hiện khoảng 933 ngành nghề), nên **không có phân trang**.
- Chỉ gửi lên Kafka **một lần duy nhất**: một message chứa một envelope, trong đó
  `business_lines` = **toàn bộ** mảng ngành nghề raw từ API.
- Envelope gồm: `owner_id`, `owner_name`, `profile_type`, `channel_name`,
  `created_time`, `crawled_time` (ms), và `business_lines`.
- Các giá trị cố định (`owner_id`, `owner_name`, `profile_type`...) nằm trong khối `META` ở đầu `content.js`.

## Các file

- `manifest.json`: cấu hình extension, quyền, host.
- `background.js`: nhận batch rồi POST lên gateway (không CORS).
- `content.js`: chạy trong tab TTDN — fetch dữ liệu raw, chia batch, gửi đi.
- `sidepanel.html` / `sidepanel.css` / `sidepanel.js`: giao diện, nút Start/Stop, log.
