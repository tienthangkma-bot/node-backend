const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// 1. Định nghĩa Schema cho Địa chỉ
const DiaChiSchema = new mongoose.Schema(
  {
    tendn: { type: String, required: true }, // Liên kết với tài khoản người dùng
    tenNguoiNhan: { type: String, required: true },
    sdt: { type: String, required: true },
    chiTietDiaChi: { type: String, required: true },
    isDefault: { type: Boolean, default: false }, // Đánh dấu địa chỉ mặc định
  },
  {
    collection: "diachi",
    timestamps: true,
  }
);

const DiaChi = mongoose.models.DiaChi || mongoose.model("DiaChi", DiaChiSchema);

/**
 * --- API: THÊM ĐỊA CHỈ MỚI ---
 * Hỗ trợ logic tự động reset các địa chỉ cũ nếu địa chỉ mới là mặc định
 * Endpoint: POST http://192.168.110.220:3000/diachi/add
 */
router.post("/add", async (req, res) => {
  try {
    const { tendn, isDefault } = req.body;

    if (isDefault) {
      // Nếu địa chỉ mới là mặc định, reset tất cả địa chỉ khác của user này thành false
      await DiaChi.updateMany({ tendn: tendn }, { isDefault: false });
    }

    const newAddress = new DiaChi(req.body);
    await newAddress.save();
    res.status(201).json({ success: true, message: "Thêm địa chỉ thành công" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * --- API: LẤY DANH SÁCH ĐỊA CHỈ CỦA USER ---
 * Endpoint: GET http://192.168.110.220:3000/diachi/user/:tendn
 */
router.get("/user/:tendn", async (req, res) => {
  try {
    const results = await DiaChi.find({ tendn: req.params.tendn }).sort({
      isDefault: -1,
      createdAt: -1,
    });
    res.json(results);
  } catch (err) {
    res
      .status(500)
      .json({ success: false, error: "Lỗi khi lấy danh sách địa chỉ" });
  }
});

/**
 * --- API: THIẾT LẬP ĐỊA CHỈ MẶC ĐỊNH ---
 * Cập nhật một địa chỉ làm mặc định và hủy mặc định các cái còn lại
 * Endpoint: PUT http://192.168.110.220:3000/diachi/set-default/:id
 */
router.put("/set-default/:id", async (req, res) => {
  try {
    const address = await DiaChi.findById(req.params.id);
    if (!address)
      return res.status(404).json({ message: "Không tìm thấy địa chỉ" });

    // Reset tất cả về false cho user này
    await DiaChi.updateMany({ tendn: address.tendn }, { isDefault: false });

    // Set địa chỉ hiện tại thành true
    address.isDefault = true;
    await address.save();

    res.json({ success: true, message: "Đã thiết lập địa chỉ mặc định" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * --- API: XÓA ĐỊA CHỈ ---
 * Endpoint: DELETE http://192.168.110.220:3000/diachi/:id
 */
router.delete("/:id", async (req, res) => {
  try {
    await DiaChi.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Đã xóa địa chỉ thành công" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
