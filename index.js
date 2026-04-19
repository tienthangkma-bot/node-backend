// 1. Nạp biến môi trường
require("dotenv").config();

// 2. Import thư viện lõi
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const helmet = require("helmet");
const db = require("./db.js");

// 3. Import thư viện bảo mật (Mục 3)
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");

// 4. Import thư viện HTTPS (Mục 4)
const https = require("https");
const fs = require("fs");
const path = require("path");

const app = express();

// ============================================================
// 🛡️ CẤU HÌNH MIDDLEWARE BẢO MẬT
// ============================================================

// a. Helmet: Bảo mật HTTP Headers
app.use(helmet());

// b. Rate Limiting: Chống Spam & Brute Force
// Giới hạn: 150 request / 10 phút
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 150,
  message: "⛔ Quá nhiều yêu cầu, vui lòng thử lại sau 10 phút!",
});
app.use(limiter);

// c. Body Parser (Giới hạn 10mb để tránh treo server khi upload ảnh)
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));

// 🔴 1. FIX LỖI NoSQL Injection (Manual Middleware)
// Thay thế express-mongo-sanitize để tránh lỗi version Node 22
app.use((req, res, next) => {
  function cleanMongo(obj) {
    for (const key in obj) {
      if (key.startsWith("$") || key.startsWith(".")) {
        delete obj[key]; // Xóa ký tự $ và .
      } else if (typeof obj[key] === "object" && obj[key] !== null) {
        cleanMongo(obj[key]); // Đệ quy vào object con
      }
    }
  }
  if (req.body) cleanMongo(req.body);
  if (req.query) cleanMongo(req.query);
  if (req.params) cleanMongo(req.params);
  next();
});

// 🔴 2. FIX LỖI XSS (Manual Middleware)
// Thay thế xss-clean để biến đổi ký tự nguy hiểm
app.use((req, res, next) => {
  function cleanXSS(data) {
    if (typeof data === "string") {
      // Thay thế < và > bằng HTML Entities
      return data.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    } else if (typeof data === "object" && data !== null) {
      for (const key in data) {
        data[key] = cleanXSS(data[key]);
      }
    }
    return data;
  }

  if (req.body) cleanXSS(req.body);
  if (req.query) cleanXSS(req.query);
  if (req.params) cleanXSS(req.params);
  next();
});

// d. Chống ô nhiễm tham số (HPP)
app.use(hpp());

// e. CORS
app.use(cors());

// ============================================================
// 🛣️ ROUTES
// ============================================================
app.use("/taikhoan", require("./routes/taikhoanRoutes"));
app.use("/sanpham", require("./routes/sanphamRoutes"));
app.use("/nhomsanpham", require("./routes/nhomsanphamRoutes"));
app.use("/chitietdathang", require("./routes/chitietdathangRoutes"));
app.use("/dathang", require("./routes/dathangRoutes"));
app.use("/donhang", require("./routes/donhangRoutes"));
app.use("/danhgia", require("./routes/danhgiaRoutes"));
app.use("/thongke", require("./routes/thongkeRoutes"));
app.use("/diachi", require("./routes/diachiRoutes"));

app.get("/", (req, res) => {
  res.send("✅ API PHONE_APP đang chạy ổn định & Bảo mật!");
});

// ============================================================
// 🚀 KHỞI CHẠY SERVER (HTTP + HTTPS)
// ============================================================
const PORT = process.env.PORT || 3000;

// 1. HTTP Server (Port 3000) -> Dành cho App Android
app.listen(PORT, () => {
  console.log(`-----------------------------------------------`);
  console.log(`🚀 HTTP Server (Thường): http://localhost:${PORT}`);
});

// 2. HTTPS Server (Port 3443) -> Dành cho Demo Bảo mật (Mục 4)
try {
  const httpsOptions = {
    key: fs.readFileSync(path.join(__dirname, "key.pem")), // Chìa khóa riêng
    cert: fs.readFileSync(path.join(__dirname, "cert.pem")), // Chứng chỉ công khai
  };

  https.createServer(httpsOptions, app).listen(3443, () => {
    console.log(`🔒 HTTPS Server (Bảo mật): https://localhost:3443`);
    console.log(`🛡️  Hệ thống bảo mật: ĐÃ KÍCH HOẠT (Injection, XSS, HTTPS)`);
    console.log(`-----------------------------------------------`);
  });
} catch (error) {
  console.log("⚠️ Cảnh báo: Không tìm thấy file key.pem hoặc cert.pem.");
  console.log(
    "👉 Chỉ chạy HTTP thường. Hãy tạo chứng chỉ SSL nếu muốn test Mục 4."
  );
}
