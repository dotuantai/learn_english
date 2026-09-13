# MyHoa

**MyHoa** là cách viết liền, không dấu của tên **Mỹ Hòa**, mang ý nghĩa vẻ đẹp
và sự hài hòa. Một không gian học tiếng Anh nhẹ nhàng, theo nhịp của bạn.

Ứng dụng Vue 3 sử dụng JavaScript và Vite.

## Chạy dự án

```sh
npm.cmd install
npm.cmd run dev
```

## Các lệnh khác

```sh
npm.cmd run build
npm.cmd run preview
```

> Trên Command Prompt, macOS hoặc Linux có thể dùng `npm` thay cho `npm.cmd`.

## Luồng học

Trang tổng quan → chọn bài học → chọn flashcards hoặc trắc nghiệm → bắt đầu.
Toàn bộ 52 từ vựng hiện tại thuộc **Bài 1 — Y tế & chăm sóc sức khỏe**, không
chia thành các bài nhỏ theo chủ đề. Thư viện hỗ trợ tìm theo từ,
nghĩa, phiên âm, lọc từ loại và trạng thái. Tiến độ đã thuộc vẫn dùng khóa
`medivocab_mastered` cũ trong localStorage; câu trả lời của buổi học chỉ giữ trong phiên.

Flashcards hỗ trợ **Anh → Việt** (xem từ, gõ nghĩa) và **Việt → Anh** (xem
nghĩa, gõ từ tiếng Anh). Chọn chiều ở bước chuẩn bị hoặc ngay trên bộ thẻ.
Đổi chiều sẽ bắt đầu lại lượt luyện tập, vẫn giữ các từ đã đánh dấu thuộc.
Cả hai chiều đều hỗ trợ lật thẻ, phát âm, xáo trộn và ôn lại câu sai.
Đáp án tiếng Anh không phân biệt hoa/thường, bỏ qua khoảng trắng thừa và
chấp nhận các dạng được ghi trong dữ liệu như `painkiller(s)` → `painkiller`
hoặc `painkillers`, `cavity / cavities` → `cavity` hoặc `cavities`.

## Thêm bài học sau này

1. Thêm các từ mới vào `src/data/words.json`, dùng ID mới (từ 53 trở đi).
2. Thêm một mục vào `lessonDefinitions` trong `src/data/lessons.js`, với `id`
   riêng (ví dụ `lesson-2`), tên bài, mô tả, biểu tượng, màu và `wordIds` chứa
   ID các từ của bài đó.

Danh sách bài học, số từ và tiến độ sẽ tự cập nhật theo dữ liệu. Bài 1 giữ các
ID từ 1 đến 52; hiện chưa tạo bài khác khi chưa có dữ liệu.

## Kiểm thử

```sh
npm.cmd test
```

Playwright dùng Google Chrome đã cài, tự khởi động Vite nếu cần. Bộ kiểm thử
bao gồm luồng vào bài, flashcards, bốn dạng trắc nghiệm, luyện lại câu sai,
lưu tiến độ, tìm/lọc từ và giao diện ở bốn kích thước màn hình.
Lời gọi phát âm được giả lập để kiểm tra mà không phát âm thanh.

Quy tắc giao diện và cấu trúc thành phần: [design-system/MASTER.md](design-system/MASTER.md).
