//danhgiaRoutes.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const DanhGiaSchema = new mongoose.Schema({
  tendn: String, // Tên đăng nhập người dùng
  masp: String,
  diem: Number, // Số sao (rating)
  noidung: String, // Nội dung review
  ngay: { type: Date, default: Date.now },
});

const DanhGia =
  mongoose.models.DanhGia || mongoose.model("DanhGia", DanhGiaSchema);

// --- API MỚI: Thêm đánh giá (Dùng cho WriteReview_Activity) ---
router.post("/add", async (req, res) => {
  try {
    const newReview = new DanhGia(req.body);
    await newReview.save();
    res.status(201).json({ success: true, message: "Success" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- API CŨ: Lấy đánh giá của một sản phẩm (Dùng cho ChiTietSanPham_Activity) ---
router.get("/sanpham/:masp", async (req, res) => {
  try {
    const results = await DanhGia.find({ masp: req.params.masp }).sort({
      ngay: -1,
    });
    res.json({ success: true, data: results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- API CŨ: Tính điểm trung bình ---
router.get("/trungbinh", async (req, res) => {
  const masp = req.query.masp;
  try {
    const stats = await DanhGia.aggregate([
      { $match: { masp: masp } },
      { $group: { _id: "$masp", avgRating: { $avg: "$diem" } } },
    ]);
    const avg = stats.length > 0 ? stats[0].avgRating : 0;
    res.json({ success: true, avgRating: parseFloat(avg.toFixed(1)) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
