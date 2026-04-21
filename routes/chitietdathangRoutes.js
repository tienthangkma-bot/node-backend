//chitietdathangRoutes.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// Định nghĩa cấu trúc Chi tiết đơn hàng
const ChiTietSchema = new mongoose.Schema({
  id_dathang: { type: String, required: true }, // ID từ bảng DatHang
  masp: String,
  tensp: String,
  soluong: Number,
  dongia: Number,
  anh: String, // Lưu link ảnh (URL String)
});

const ChiTiet =
  mongoose.models.ChiTietDonHang ||
  mongoose.model("ChiTietDonHang", ChiTietSchema); //nếu model có rồi dùng lại không thì tạo mới

// API thêm chi tiết đơn hàng (Dùng khi Checkout trên Android)
router.post("/", async (req, res) => {
  try {
    const newDetail = new ChiTiet(req.body);
    await newDetail.save();
    res.json({ success: true, message: "✅ Thêm chi tiết thành công" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// API lấy chi tiết theo ID đơn hàng (Dùng cho trang ChiTietDonHang_Admin)
router.get("/:id", async (req, res) => {
  try {
    const results = await ChiTiet.find({ id_dathang: req.params.id });
    res.json(results);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
