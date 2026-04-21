const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const fs = require("fs"); // 🛠️ Thêm thư viện xử lý File
const path = require("path"); // 🛠️ Thêm thư viện xử lý đường dẫn
const { verifyToken, isAdmin } = require("../middleware/auth");

// 1. Định nghĩa Schema cho Nhóm Sản Phẩm
const NhomSPSchema = new mongoose.Schema(
  {
    tennsp: { type: String, required: true },
    anh: { type: String, required: true },
  },
  { collection: "nhomsanpham", timestamps: true }
);

// 2. 🛡️ KHỞI TẠO MODEL AN TOÀN
const NhomSP =
  mongoose.models.NhomSanPham || mongoose.model("NhomSanPham", NhomSPSchema);

// =================================================================
// 🛠️ HÀM PHỤ TRỢ: CHUYỂN ĐỔI BASE64 THÀNH FILE ẢNH
// =================================================================
const processBase64Image = (base64String) => {
  if (!base64String || !base64String.startsWith("data:image")) {
    return base64String;
  }

  try {
    const matches = base64String.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return base64String;
    }

    const extension = matches[1];
    const imageData = matches[2];
    const imageBuffer = Buffer.from(imageData, "base64");

    // Tạo tên file riêng cho nhóm sản phẩm (vd: nhom_1712345678.jpg)
    const fileName = `nhom_${Date.now()}_${Math.floor(Math.random() * 1000)}.${extension}`;
    const uploadDir = path.join(__dirname, "../uploads");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, imageBuffer);

    return fileName;
  } catch (error) {
    console.error("❌ Lỗi khi giải mã ảnh Nhóm SP:", error);
    return base64String;
  }
};

// --- CÔNG KHAI (Không cần Token để Android load trang chủ) ---

// Route: /nhomsanpham/random
router.get("/random", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
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
    // 🚀 Dịch mã Base64 thành file trước khi lưu
    if (req.body.anh && req.body.anh.startsWith("data:image")) {
      req.body.anh = processBase64Image(req.body.anh);
    }

    const newNSP = new NhomSP(req.body);
    await newNSP.save();
    res.status(201).json({ success: true, message: "Thêm nhóm sản phẩm thành công" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Route: /nhomsanpham/update/:id
router.put("/update/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    // 🚀 Dịch mã Base64 nếu admin chọn ảnh mới khi cập nhật
    if (req.body.anh && req.body.anh.startsWith("data:image")) {
      req.body.anh = processBase64Image(req.body.anh);
    }

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