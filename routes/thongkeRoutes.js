const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { verifyToken, isAdmin } = require("../middleware/auth");

// ============================================================
// 1. KHAI BÁO MODEL (Tránh lỗi OverwriteModelError)
// ============================================================

// 🛒 Model Đơn Hàng: Trỏ vào bảng "dathang" (Bảng chứa dữ liệu thật của bạn)
const OrderSchema = new mongoose.Schema(
  {},
  { strict: false, collection: "dathang" }
);
const Order = mongoose.models.Order || mongoose.model("Order", OrderSchema);

// 📱 Model Sản Phẩm: Trỏ vào bảng "sanphams"
const ProductSchema = new mongoose.Schema(
  {},
  { strict: false, collection: "sanphams" }
);
const Product =
  mongoose.models.Product || mongoose.model("Product", ProductSchema);

// 👥 Model Người Dùng: Trỏ vào bảng "taikhoans"
const UserSchema = new mongoose.Schema(
  {},
  { strict: false, collection: "taikhoans" }
);
const User = mongoose.models.User || mongoose.model("User", UserSchema);

// ============================================================
// 2. API DASHBOARD (Cho Trang Chủ Admin)
// URL: http://.../thongke/dashboard
// ============================================================
router.get("/dashboard", verifyToken, isAdmin, async (req, res) => {
  try {
    console.log("🔍 [Dashboard] Đang tải dữ liệu tổng quan...");

    // 1. Tổng số đơn hàng
    const totalOrders = await Order.countDocuments();

    // 2. Đơn hàng đang chờ duyệt
    // ⚠️ Lưu ý: Kiểm tra xem trong DB bạn lưu là "Chờ xác nhận" hay "Chờ xử lý" để sửa lại dòng dưới
    const pendingOrders = await Order.countDocuments({
      $or: [{ trangthai: "Chờ xác nhận" }, { trangthai: "Chờ xử lý" }],
    });

    // 3. Tổng số sản phẩm
    const totalProducts = await Product.countDocuments();

    // 4. Tổng số người dùng (Không tính Admin)
    const totalUsers = await User.countDocuments({ role: { $ne: "admin" } });

    // 5. Tổng doanh thu toàn thời gian
    const revenueStats = await Order.aggregate([
      {
        $group: {
          _id: null,
          // Ép kiểu sang số (Double) để cộng, tránh lỗi nếu lưu dạng String
          totalRevenue: { $sum: { $toDouble: "$tongthanhtoan" } },
        },
      },
    ]);
    const totalRevenue =
      revenueStats.length > 0 ? revenueStats[0].totalRevenue : 0;

    const result = {
      success: true,
      totalOrders,
      pendingOrders, // Trường này quan trọng cho App
      totalProducts,
      totalUsers,
      totalRevenue,
    };

    console.log("✅ [Dashboard] Kết quả:", result);
    res.json(result);
  } catch (err) {
    console.error("❌ [Dashboard] Lỗi:", err);
    res
      .status(500)
      .json({ success: false, message: "Lỗi lấy dữ liệu dashboard" });
  }
});

// ============================================================
// 3. API DOANH THU CHI TIẾT (Cho trang Thống kê)
// URL: http://.../thongke/doanhthu?type=...&value=...
// ============================================================
router.get("/doanhthu", verifyToken, isAdmin, async (req, res) => {
  try {
    let { type, value, year } = req.query;

    // Logic an toàn: Nếu Android gửi thiếu year thì lấy từ value
    const targetYear = parseInt(year) || parseInt(value);
    const targetValue = parseInt(value);

    console.log(
      `🔍 [ChiTiet] Loại: ${type} | Năm: ${targetYear} | Giá trị: ${value}`
    );

    let startDate, endDate;

    // --- TÍNH TOÁN NGÀY THÁNG (Theo chuẩn UTC để khớp DB) ---
    if (type === "nam") {
      // Cả năm: 01/01 00:00 -> 31/12 23:59
      startDate = new Date(Date.UTC(targetYear, 0, 1, 0, 0, 0));
      endDate = new Date(Date.UTC(targetYear, 11, 31, 23, 59, 59));
    } else if (type === "quy") {
      const startMonth = (targetValue - 1) * 3;
      startDate = new Date(Date.UTC(targetYear, startMonth, 1, 0, 0, 0));
      endDate = new Date(Date.UTC(targetYear, startMonth + 3, 0, 23, 59, 59));
    } else if (type === "thang") {
      startDate = new Date(Date.UTC(targetYear, targetValue - 1, 1, 0, 0, 0));
      endDate = new Date(Date.UTC(targetYear, targetValue, 0, 23, 59, 59));
    } else if (type === "ngay") {
      // value = "2025-12-26"
      startDate = new Date(`${value}T00:00:00.000Z`);
      endDate = new Date(`${value}T23:59:59.999Z`);
    }

    // --- TRUY VẤN AGGREGATE ---
    const stats = await Order.aggregate([
      {
        $addFields: {
          // 🛡️ QUAN TRỌNG: Chuyển 'ngaydathang' thành Date Object chuẩn
          // Lệnh này chấp hết: dù DB lưu String hay Date đều convert được
          realDate: { $toDate: "$ngaydathang" },
        },
      },
      {
        $match: {
          // So sánh ngày đã chuẩn hóa
          realDate: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: null,
          // Cộng tiền: Ép kiểu sang số trước khi cộng
          revenue: { $sum: { $toDouble: "$tongthanhtoan" } },
          count: { $sum: 1 },
        },
      },
    ]);

    const result = stats[0] || { revenue: 0, count: 0 };
    console.log("💰 [ChiTiet] Kết quả:", result);

    res.json({ success: true, revenue: result.revenue, count: result.count });
  } catch (err) {
    console.error("❌ [ChiTiet] Lỗi:", err);
    res.status(500).json({ success: false, revenue: 0, count: 0 });
  }
});

module.exports = router;
