const jwt = require("jsonwebtoken");
// 🛡️ Nạp cấu hình từ .env để dùng chung Secret Key
require("dotenv").config();

// Lấy SECRET_KEY từ file .env. Nếu không thấy sẽ dùng tạm chuỗi dự phòng (nhưng nên có trong .env)
const SECRET_KEY = process.env.JWT_SECRET || "123456";

/**
 * Middleware để xác thực mã Token (JWT)
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    console.error("❌ Xác thực thất bại: Không tìm thấy Token.");
    return res.status(401).json({
      success: false,
      message: "Truy cập bị từ chối. Vui lòng đăng nhập!",
    });
  }

  // 🛡️ Sử dụng SECRET_KEY thống nhất để giải mã
  jwt.verify(token, SECRET_KEY, (err, decodedUser) => {
    if (err) {
      console.error("❌ Lỗi chữ ký Token:", err.message);
      return res.status(403).json({
        success: false,
        message: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.",
      });
    }

    req.user = decodedUser;
    console.log(`✅ Token hợp lệ - User: ${decodedUser.username || "Admin"}`);
    next();
  });
};

/**
 * Middleware kiểm tra quyền Admin
 */
const isAdmin = (req, res, next) => {
  // Kiểm tra role từ dữ liệu đã giải mã trong verifyToken
  if (req.user && (req.user.role === "admin" || req.user.quyen === "admin")) {
    next();
  } else {
    console.warn(
      `⚠️ Cảnh báo: User ${req.user.username} thử truy cập quyền Admin!`
    );
    return res.status(403).json({
      success: false,
      message: "Bạn không có quyền truy cập chức năng này!",
    });
  }
};

module.exports = { verifyToken, isAdmin };
