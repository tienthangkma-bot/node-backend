const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { verifyToken, isAdmin } = require("../middleware/auth");

// 1. Định nghĩa Schema cho Nhóm Sản Phẩm
const NhomSPSchema = new mongoose.Schema(
  {
    tennsp: { type: String, required: true },
    anh: { type: String, required: true },
  },
  { collection: "nhomsanpham", timestamps: true }
);

// 2. 🛡️ KHỞI TẠO MODEL AN TOÀN (Sửa lỗi định nghĩa sai tên biến)
const NhomSP =
  mongoose.models.NhomSanPham || mongoose.model("NhomSanPham", NhomSPSchema);

// --- CÔNG KHAI (Không cần Token để Android load trang chủ) ---

// Route: /nhomsanpham/random
router.get("/random", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    // Sử dụng đúng biến NhomSP đã khai báo ở trên
    const results = await NhomSP.aggregate([{ $sample: { size: limit } }]);
    res.json(results);
  } catch (err) {
    console.error("Lỗi lấy random nhóm SP:", err);
    res.status(500).json({ success: false, message: "Lỗi Server" });
  }
});

// Route: /nhomsanpham/
router.get("/", async (req, res) => {
  try {
    const results = await NhomSP.find().sort({ createdAt: -1 });
    res.json(results);
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// --- BẢO MẬT (Chỉ Admin mới được thao tác) ---

// Route: /nhomsanpham/add
router.post("/add", verifyToken, isAdmin, async (req, res) => {
  try {
    const newNSP = new NhomSP(req.body);
    await newNSP.save();
    res.status(201).json({ success: true, message: "Thêm thành công" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Route: /nhomsanpham/update/:id
router.put("/update/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    await NhomSP.findByIdAndUpdate(req.params.id, req.body);
    res.json({ success: true, message: "Cập nhật thành công" });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// Route: /nhomsanpham/delete/:id
router.delete("/delete/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    await NhomSP.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Xóa thành công" });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

module.exports = router;
