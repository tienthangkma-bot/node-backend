const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const fs = require("fs"); // 🛠️ Thêm thư viện xử lý File
const path = require("path"); // 🛠️ Thêm thư viện xử lý đường dẫn
const { verifyToken, isAdmin } = require("../middleware/auth");

// 1. Định nghĩa Schema
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

// 2. Kiểm tra tồn tại Model
const SanPham =
  mongoose.models.SanPham || mongoose.model("SanPham", SanPhamSchema);

// =================================================================
// 🛠️ HÀM PHỤ TRỢ: CHUYỂN ĐỔI BASE64 THÀNH FILE ẢNH
// =================================================================
const processBase64Image = (base64String) => {
  // Nếu không có ảnh hoặc không phải là chuỗi Base64 (vd: link http thường) thì trả về nguyên gốc
  if (!base64String || !base64String.startsWith("data:image")) {
    return base64String;
  }

  try {
    // 1. Tách lấy phần đuôi mở rộng (jpeg, png) và phần dữ liệu thực sự
    const matches = base64String.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return base64String;
    }

    const extension = matches[1];
    const imageData = matches[2];

    // 2. Tạo mảng Byte từ chuỗi Base64
    const imageBuffer = Buffer.from(imageData, "base64");

    // 3. Tạo tên file ngẫu nhiên để không bị trùng (vd: sp_1712345678.jpg)
    const fileName = `sp_${Date.now()}_${Math.floor(Math.random() * 1000)}.${extension}`;

    // 4. Đường dẫn tới thư mục uploads (nằm ở thư mục gốc của dự án Node.js)
    const uploadDir = path.join(__dirname, "../uploads");

    // 5. Nếu thư mục uploads chưa có thì tự động tạo mới
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // 6. Ghi file ảnh vào ổ cứng máy tính
    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, imageBuffer);

    // 7. TRẢ VỀ CHỈ MỖI TÊN FILE (Để lưu vào MongoDB cho nhẹ)
    return fileName;
  } catch (error) {
    console.error("❌ Lỗi khi giải mã và lưu ảnh Base64:", error);
    return base64String; // Nếu lỗi thì cứ trả về cái cũ
  }
};

// --- CÔNG KHAI (Không cần verifyToken) ---

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
    let {
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

    let imageInput = anh || picurl;
    
    // 🚀 BƯỚC NGOẶT: Giải mã ảnh Base64 thành file thật, lấy lại tên file
    let finalImageName = processBase64Image(imageInput);

    const newProduct = new SanPham({
      tensp,
      mota,
      ghichu,
      dongia,
      soluongkho,
      mansp: mansp || maso,
      anh: finalImageName, // Chỉ lưu mỗi tên file (vd: sp_123.jpg) vào DB
    });

    await newProduct.save();
    res.json({ success: true, message: "Thêm sản phẩm và lưu ảnh thành công" });
  } catch (err) {
    console.error("Lỗi add:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Cập nhật sản phẩm
router.put("/update/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    // 🚀 Nếu admin có cập nhật ảnh mới, cũng phải dịch mã nó
    if (req.body.anh && req.body.anh.startsWith("data:image")) {
      req.body.anh = processBase64Image(req.body.anh);
    } else if (req.body.picurl && req.body.picurl.startsWith("data:image")) {
      req.body.picurl = processBase64Image(req.body.picurl);
    }

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