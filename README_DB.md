Các file DB tạo sẵn để import vào MySQL hoặc PostgreSQL

Files:
- `db_mysql.sql` - Schema và constraints cho MySQL (utf8mb4, InnoDB)
- `db_postgres.sql` - Schema tương đương cho PostgreSQL

Lưu ý về schema:
- Bảng chính: `taikhoan`, `nhomsanpham`, `sanpham`, `dathang`, `chitietdonhang`, `danhgia`
- Ảnh được lưu dưới dạng BLOB (MySQL: LONGBLOB, Postgres: BYTEA). Ứng dụng base64-encodes/decodes khi truyền qua API.
- Mật khẩu phải được hash bằng bcrypt trước khi chèn vào `taikhoan.matkhau` (ứng dụng hiện dùng bcrypt để đăng ký/đổi mật khẩu).

Import vào MySQL (bash on Windows):

```bash
# tạo database
mysql -u root -p -e "CREATE DATABASE phone_app_db CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;"
# import
mysql -u root -p phone_app_db < db_mysql.sql
```

Import vào PostgreSQL (bash on Windows):

```bash
# tạo database
createdb -U postgres phone_app_db
# import
psql -U postgres -d phone_app_db -f db_postgres.sql
```

Quick checks:
- Sau import, đảm bảo `db.js` (kết nối DB trong project) trỏ tới database và user đúng.
- Nếu dùng MySQL và bạn gặp lỗi đối với `CHECK(...)`, MySQL 8+ hỗ trợ CHECK; nếu phiên bản cũ, bạn có thể xóa các CHECK.

Gợi ý thêm:
- Không chèn mật khẩu plaintext vào `taikhoan.matkhau`. Nếu cần tạo tài khoản admin tạm bằng SQL, tạo tài khoản rồi cập nhật `matkhau` với giá trị hash do bcrypt sinh ra. Ví dụ trong Node REPL:

```js
// npm i bcrypt
const bcrypt = require('bcrypt');
bcrypt.hash('yourpassword', 10).then(hash => console.log(hash));
```

Next steps (nếu muốn):
- Thêm sample data (products, groups) tự động.
- Viết script seed (Node) dùng knex/pg/mysql2 để nhập sample data và hash password tự động.
 
Seeding (tự động)
 - Có sẵn script Node: `scripts/seed.js` — script này dùng `db.pool` (Postgres) và `bcrypt` để tạo tài khoản (admin/user), nhóm sản phẩm, sản phẩm, một đơn hàng mẫu, chi tiết đơn và một đánh giá.
 - Chạy (từ thư mục dự án):

```bash
# cài bcrypt nếu chưa có
npm install bcrypt
# chạy seeder
node scripts/seed.js
```

Notes:
 - `scripts/seed.js` dùng `ON CONFLICT` để tránh duplicate; nếu bạn chạy nhiều lần thì script cố gắng không tạo bản ghi trùng tên. Tuy nhiên nếu bạn muốn reset, xóa các bảng hoặc dùng SQL seed files trong `seeds/`.
 - Nếu bạn dùng MySQL, dùng `seeds/seed_mysql.sql` (lưu ý mật khẩu cần hash trước khi chèn) hoặc tạo một phiên bản Node seeder dùng `mysql2`.
