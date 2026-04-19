require("dotenv").config();
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const { verifyToken, isAdmin } = require("../middleware/auth");

// Lấy Secret Key từ biến môi trường để bảo mật phiên làm việc
const SECRET_KEY = process.env.JWT_SECRET;

// --- CẤU HÌNH SCHEMA ---
const TaiKhoanSchema = new mongoose.Schema(
  {
    tendn: { type: String, required: true, unique: true },
    matkhau: { type: String, required: true },
    email: { type: String },
    quyen: { type: String, default: "user" },
    trangthai: { type: Number, default: 1 },
  },
  { versionKey: false }
);

const TaiKhoan =
  mongoose.models.TaiKhoan || mongoose.model("TaiKhoan", TaiKhoanSchema);

// --- CẤU HÌNH MAIL OTP ---
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

let otpStore = {};

// --- 1. GỬI OTP ---
router.post("/send-otp", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.json({ success: false, message: "Thiếu Email" });
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[email] = { otp, expires: Date.now() + 300000 };

  const mailOptions = {
    from: `"Thang Store Security" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Mã xác thực đăng ký tài khoản",
    text: `Mã OTP của bạn là: ${otp}.`,
  };

  transporter.sendMail(mailOptions, (err) => {
    if (err) return res.json({ success: false, message: "Lỗi gửi mail" });
    res.json({ success: true, message: "Mã OTP đã gửi về Email" });
  });
});

// --- 2. ĐĂNG KÝ USER (Mã hóa lưu trữ) ---
router.post("/register-verify", async (req, res) => {
  const { username, password, email, otp } = req.body;
  const stored = otpStore[email];

  if (!stored || stored.otp !== otp || Date.now() > stored.expires) {
    return res.json({ success: false, message: "OTP sai hoặc hết hạn" });
  }

  try {
    // Mã hóa mật khẩu trước khi lưu xuống Database
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new TaiKhoan({
      tendn: username,
      matkhau: hashedPassword,
      email: email,
    });

    await newUser.save();
    delete otpStore[email];
    res.json({ success: true, message: "Đăng ký thành công!" });
  } catch (err) {
    res.json({ success: false, message: "Tên đăng nhập đã tồn tại" });
  }
});

// --- 3. ĐĂNG NHẬP (Bảo mật phiên JWT) ---
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await TaiKhoan.findOne({
      $or: [{ tendn: username }, { email: username }],
    });

    if (!user)
      return res.json({ success: false, message: "Tài khoản không tồn tại" });

    // Kiểm tra mật khẩu bằng Bcrypt
    const isMatch = await bcrypt.compare(password, user.matkhau);
    if (!isMatch)
      return res.json({ success: false, message: "Mật khẩu không chính xác" });

    // Tạo JWT Token có chữ ký bảo mật và thời hạn
    const token = jwt.sign(
      { user_id: user._id, username: user.tendn, role: user.quyen },
      SECRET_KEY,
      { expiresIn: "24h" }
    );

    res.json({
      success: true,
      user_id: user._id,
      username: user.tendn,
      role: user.quyen,
      token: token,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

// --- 4. LẤY DANH SÁCH (Admin) ---
router.get("/", verifyToken, isAdmin, async (req, res) => {
  try {
    const users = await TaiKhoan.find({}, "-matkhau"); // Chặn rò rỉ mật khẩu đã mã hóa
    res.json(users);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- 5. CÁC API QUẢN TRỊ (Mã hóa mật khẩu khi add/update) ---
router.post("/add", verifyToken, isAdmin, async (req, res) => {
  try {
    const { tendn, matkhau, quyen } = req.body;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(matkhau, salt);

    const newUser = new TaiKhoan({ tendn, matkhau: hashedPassword, quyen });
    await newUser.save();
    res.status(201).json({ success: true, message: "Thêm thành công" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

router.put("/update/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const { quyen, password } = req.body;
    let updateData = { quyen: quyen };

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.matkhau = await bcrypt.hash(password, salt);
    }

    const user = await TaiKhoan.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete("/delete/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    await TaiKhoan.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Xóa thành công" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
