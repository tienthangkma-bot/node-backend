// db.js
require("dotenv").config(); // Nạp lại để chắc chắn
const mongoose = require("mongoose");

// Lấy URI từ .env
const dbURI = process.env.MONGODB_URI;

// Log ra để bạn nhìn thấy trong Terminal khi chạy
console.log("🔍 Đang kết nối tới URI:", dbURI);

if (!dbURI) {
  console.error(
    "❌ LỖI: Biến MONGODB_URI trong file .env đang bị trống hoặc undefined!"
  );
  console.error(
    "👉 Hãy kiểm tra lại tên file có đúng là '.env' (có dấu chấm) không."
  );
  // Tạm thời dùng fallback để test nếu file .env lỗi
  // const fallbackURI = "mongodb://localhost:27017/PhoneAppDB";
  // mongoose.connect(fallbackURI)...
} else {
  mongoose
    .connect(dbURI)
    .then(() => console.log("✅ Kết nối MongoDB thành công (Secure Mode)"))
    .catch((err) => console.error("❌ Lỗi kết nối MongoDB:", err));
}

module.exports = mongoose;
