const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { verifyToken, isAdmin } = require("../middleware/auth");

// 1. Định nghĩa Schema (Giữ nguyên cấu trúc của bạn)
const SanPhamSchema = new mongoose.Schema(
  {
    tensp: { type: String, required: true },
    mota: String,
    ghichu: String,
    dongia: { type: Number, default: 0 },
    soluongkho: { type: Number, default: 0 },
    mansp: String,
    anh: String,
  },
  { versionKey: false }
);

// 2. 🛡️ CÁCH KHỞI TẠO CHỐNG LỖI OVERWRITE (CỰC KỲ QUAN TRỌNG)
// Kiểm tra xem model đã tồn tại trong mongoose.models chưa, nếu chưa mới tạo mới
const SanPham =
  mongoose.models.SanPham || mongoose.model("SanPham", SanPhamSchema);

// --- CÔNG KHAI (Không cần verifyToken) ---
// Giúp Android load trang chủ nhanh, không bị văng khi chưa đăng nhập

// Lấy tất cả sản phẩm
router.get("/all", async (req, res) => {
  try {
    const products = await SanPham.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi Server" });
  }
});

// Tìm kiếm sản phẩm
router.get("/search", async (req, res) => {
  const keyword = req.query.name || req.query.q;
  if (!keyword) return res.json([]);
  try {
    const results = await SanPham.find({
      tensp: { $regex: keyword, $options: "i" },
    });
    res.json(results);
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// Lấy sản phẩm theo nhóm (hãng)
router.get("/nhom/:idnhom", async (req, res) => {
  try {
    const results = await SanPham.find({ mansp: req.params.idnhom });
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: "Lỗi lấy sản phẩm theo nhóm" });
  }
});

// Lấy ngẫu nhiên sản phẩm (Gợi ý)
router.get("/random", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    const results = await SanPham.aggregate([{ $sample: { size: limit } }]);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: "Lỗi lấy sản phẩm ngẫu nhiên" });
  }
});

// --- BẢO MẬT (Chỉ Admin mới có quyền POST, PUT, DELETE) ---

// Thêm sản phẩm mới
router.post("/add", verifyToken, isAdmin, async (req, res) => {
  try {
    const {
      tensp,
      mota,
      ghichu,
      dongia,
      soluongkho,
      mansp,
      maso,
      anh,
      picurl,
    } = req.body;

    const newProduct = new SanPham({
      tensp,
      mota,
      ghichu,
      dongia,
      soluongkho,
      mansp: mansp || maso,
      anh: anh || picurl,
    });

    await newProduct.save();
    res.json({ success: true, message: "Thêm sản phẩm thành công" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Cập nhật sản phẩm
router.put("/update/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const updatedProduct = await SanPham.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json({ success: true, data: updatedProduct });
  } catch (err) {
    res.status(500).json({ success: false, error: "Không thể cập nhật" });
  }
});

// Xóa sản phẩm
router.delete("/delete/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    await SanPham.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Đã xóa sản phẩm thành công" });
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi xóa sản phẩm" });
  }
});

module.exports = router;
