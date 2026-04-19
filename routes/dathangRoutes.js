const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// 1. Định nghĩa Schema đầy đủ để khớp với dữ liệu từ Android gửi lên
const DatHangSchema = new mongoose.Schema(
  {
    tendn: { type: String, required: true }, // Tên đăng nhập người đặt
    tenkh: { type: String, required: true }, // Tên khách hàng nhận
    diachi: { type: String, required: true },
    sdt: { type: String, required: true },
    tongthanhtoan: { type: Number, required: true },
    phuongthuc: { type: String, default: "COD" },
    trangthai: { type: String, default: "Chờ duyệt" },
    ngaydathang: { type: Date, default: Date.now },
    // ✅ QUAN TRỌNG: Phải có items để lưu danh sách sản phẩm mua
    items: [
      {
        masp: String,
        tensp: String,
        soluong: Number,
        dongia: Number,
        anh: String,
      },
    ],
  },
  { collection: "dathang" }
);

const DatHang =
  mongoose.models.DatHang || mongoose.model("DatHang", DatHangSchema);

/**
 * --- API: THÊM ĐƠN HÀNG MỚI ---
 * Endpoint: POST http://192.168.110.220:3000/dathang
 */
router.post("/", async (req, res) => {
  try {
    console.log("Dữ liệu đơn hàng nhận được:", req.body); // Để bạn debug trong terminal
    const newOrder = new DatHang(req.body);
    const savedOrder = await newOrder.save();
    res.status(201).json({
      success: true,
      message: "Đặt hàng thành công",
      id: savedOrder._id,
    });
  } catch (err) {
    console.error("Lỗi lưu đơn hàng:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * --- API: LẤY ĐƠN HÀNG CỦA 1 USER ---
 * Endpoint: GET http://192.168.110.220:3000/dathang/user/:tendn
 */
router.get("/user/:tendn", async (req, res) => {
  try {
    const results = await DatHang.find({ tendn: req.params.tendn }).sort({
      ngaydathang: -1,
    });
    res.json(results);
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

/**
 * --- API: LẤY TẤT CẢ ĐƠN HÀNG (DÀNH CHO ADMIN) ---
 * Endpoint: GET http://192.168.110.220:3000/dathang/all
 */
router.get("/all", async (req, res) => {
  try {
    const results = await DatHang.find().sort({ ngaydathang: -1 });
    res.json(results);
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

module.exports = router;
