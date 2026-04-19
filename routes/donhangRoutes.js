const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { verifyToken, isAdmin } = require("../middleware/auth");

const DatHang =
  mongoose.models.DatHang ||
  mongoose.model(
    "DatHang",
    new mongoose.Schema(
      {
        tendn: String,
        tenkh: String,
        diachi: String,
        sdt: String,
        tongthanhtoan: Number,
        phuongthuc: String,
        trangthai: { type: String, default: "Chờ duyệt" },
        items: Array,
        ngaydathang: { type: Date, default: Date.now },
      },
      { collection: "dathang" }
    )
  );

/**
 * --- API 1: LẤY TẤT CẢ ĐƠN HÀNG (DÀNH CHO ADMIN) ---
 * Endpoint: GET http://192.168.110.220:3000/donhang/all
 */
router.get("/all", verifyToken, isAdmin, async (req, res) => {
  try {
    let query = {};
    // Kiểm tra nếu có tham số lọc trạng thái từ Android gửi lên (?trangthai=...)
    if (req.query.trangthai) {
      query.trangthai = req.query.trangthai;
    }

    const orders = await DatHang.find(query).sort({ ngaydathang: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * --- API 2: TẠO ĐƠN HÀNG MỚI ---
 */
router.post("/", verifyToken, async (req, res) => {
  try {
    const newOrder = new DatHang(req.body);
    const savedOrder = await newOrder.save();
    res.status(201).json({
      success: true,
      message: "Đặt hàng thành công",
      orderId: savedOrder._id,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * --- API 3: LẤY ĐƠN HÀNG CỦA USER ---
 */
router.get("/user/:tendn", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.username !== req.params.tendn) {
      return res
        .status(403)
        .json({ success: false, message: "Không có quyền truy cập" });
    }
    const orders = await DatHang.find({ tendn: req.params.tendn }).sort({
      ngaydathang: -1,
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * --- API 4: LẤY CHI TIẾT 1 ĐƠN HÀNG ---
 */
router.get("/detail/:id", verifyToken, async (req, res) => {
  try {
    const order = await DatHang.findById(req.params.id);
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy đơn hàng" });
    if (req.user.role !== "admin" && req.user.username !== order.tendn) {
      return res
        .status(403)
        .json({ success: false, message: "Không có quyền xem" });
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * --- API 5: CẬP NHẬT TRẠNG THÁI (ADMIN) ---
 */
router.put("/update-status", verifyToken, isAdmin, async (req, res) => {
  try {
    const { id, trangthai } = req.body;
    const updatedOrder = await DatHang.findByIdAndUpdate(
      id,
      { trangthai: trangthai },
      { new: true }
    );
    res.json({ success: true, data: updatedOrder });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
