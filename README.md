# MyHoa

**MyHoa** là cách viết liền, không dấu của tên **Mỹ Hòa**, mang ý nghĩa vẻ đẹp
và sự hài hòa. Một không gian học tiếng Anh nhẹ nhàng, theo nhịp của bạn.

Ứng dụng Vue 3 sử dụng JavaScript và Vite, lấy bài học và từ vựng từ ASP.NET
Core API/PostgreSQL. Không còn dữ liệu học tĩnh trong bundle frontend.

## Chạy dự án

```sh
npm.cmd install
npm.cmd run dev
```

Mặc định Vite proxy `/api` đến backend tại `http://localhost:5262`. Hãy chạy
backend và áp dụng EF migration trước khi mở frontend. Khi deploy khác domain,
đặt `VITE_API_BASE_URL` thành URL public của backend.

## Các lệnh khác

```sh
npm.cmd run build
npm.cmd run preview
```

> Trên Command Prompt, macOS hoặc Linux có thể dùng `npm` thay cho `npm.cmd`.

## Luồng học

Trang tổng quan → chọn bài học → chọn từ loại → chọn flashcards hoặc trắc nghiệm → bắt đầu.
Từ vựng được tổ chức theo bài học. Thư viện hỗ trợ tìm theo từ,
nghĩa, phiên âm, lọc từ loại và trạng thái. Tiến độ đã thuộc vẫn dùng khóa
`medivocab_mastered` cũ trong localStorage để khách có thể học ngay; sau khi
đăng nhập, tiến độ cục bộ được gộp và đồng bộ vào PostgreSQL theo tài khoản.
Câu trả lời của buổi học chỉ giữ trong phiên như trước.

## Tài khoản

- `#login`: đăng nhập bằng email/mật khẩu.
- `#register`: tạo tài khoản và đăng nhập ngay sau khi thành công.
- Access token hết hạn được làm mới bằng refresh token hiện có của backend.
- Đăng xuất thu hồi refresh token ở server nhưng vẫn giữ tiến độ offline trên
  thiết bị, vì vậy người học không mất chức năng cũ.

**Học theo từ loại:** chọn danh từ, động từ, tính từ, trạng từ, cụm từ hoặc
tất cả ngay trong bước chuẩn bị. Mỗi nhóm hiển thị số từ của bài và cập nhật
các từ mẫu. Flashcards và trắc nghiệm đều sử dụng nhóm đã chọn; từ có nhiều
từ loại xuất hiện trong các nhóm tương ứng. Lựa chọn được giữ khi tải lại
trang hoặc đổi cách học. Số câu hỏi tự điều chỉnh theo nhóm; trắc nghiệm
cần ít nhất 4 từ, còn flashcards có thể học từ một từ.

Flashcards hỗ trợ **Anh → Việt** (xem từ, gõ nghĩa) và **Việt → Anh** (xem
nghĩa, gõ từ tiếng Anh). Chọn chiều ở bước chuẩn bị hoặc ngay trên bộ thẻ.
Đổi chiều sẽ bắt đầu lại lượt luyện tập, vẫn giữ các từ đã đánh dấu thuộc.
Cả hai chiều đều hỗ trợ lật thẻ, phát âm, xáo trộn và ôn lại câu sai.
Đáp án tiếng Anh không phân biệt hoa/thường, bỏ qua khoảng trắng thừa và
chấp nhận các dạng được ghi trong dữ liệu như `painkiller(s)` → `painkiller`
hoặc `painkillers`, `cavity / cavities` → `cavity` hoặc `cavities`.

## Thêm bài học sau này

1. Thêm lesson/word vào seed hoặc luồng quản trị ở backend; mỗi từ dùng ID mới.
2. Tạo EF Core migration mới và chạy `dotnet ef database update`.
3. API `GET /api/learning` tự trả dữ liệu mới; frontend không cần thêm file JSON.

Danh sách bài học, số từ và tiến độ sẽ tự cập nhật theo dữ liệu. Bài 1 giữ các
ID từ 1 đến 52; các bài mới dùng ID riêng để giữ đúng tiến độ đã lưu.

## Kiểm thử

```sh
npm.cmd test
```

Playwright dùng Google Chrome đã cài, tự khởi động Vite với mock API nếu cần. Bộ kiểm thử
bao gồm luồng vào bài, flashcards, bốn dạng trắc nghiệm, luyện lại câu sai,
lưu/đồng bộ tiến độ, login/register, học theo từ loại, tìm/lọc từ và giao diện
responsive.
Lời gọi phát âm được giả lập để kiểm tra mà không phát âm thanh.

Quy tắc giao diện và cấu trúc thành phần: [design-system/MASTER.md](design-system/MASTER.md).
