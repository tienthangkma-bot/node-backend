const express = require('express');
const router = express.Router();
const db = require('../db'); // Kết nối MySQL
router.get("/check", (req, res) => {
    const { user_id, masp, id_chitietdonhang } = req.query;

    const sql = `
        SELECT 1 FROM danhgia 
        WHERE user_id = ? AND masp = ? AND id_chitietdonhang = ?
        LIMIT 1
    `;

    db.query(sql, [user_id, masp, id_chitietdonhang], (err, result) => {
        if (err) {
            console.error("Lỗi khi kiểm tra đánh giá:", err);
            return res.status(500).json({ success: false, error: "Lỗi server" });
        }

        if (result.length > 0) {
            res.json({ success: true, exists: true });
        } else {
            res.json({ success: true, exists: false });
        }
    });
});
router.post("/", (req, res) => {
    const { user_id, masp, id_chitietdonhang, rating, comment, ngay } = req.body;

    const sql = `
        INSERT INTO danhgia (user_id, masp, id_chitietdonhang, rating, comment, ngay_danhgia	)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [user_id, masp, id_chitietdonhang, rating, comment, ngay], (err, result) => {
        if (err) {
            console.error("Lỗi thêm đánh giá:", err);
            return res.status(500).json({ success: false, message: "Lỗi server" });
        }

        res.json({ success: true, message: "Thêm đánh giá thành công" });
    });
});
// xem đánh giá 
router.get("/lay", (req, res) => {
    const { user_id, masp, id_chitietdonhang } = req.query;

    const sql = `
        SELECT * FROM danhgia 
        WHERE id_chitietdonhang = ?
    `;

    db.query(sql, [id_chitietdonhang], (err, result) => {
        if (err) {
            console.error("Lỗi lấy đánh giá:", err);
            return res.status(500).json({ success: false, message: "Lỗi server" });
        }

        if (result.length > 0) {
            res.json({ success: true, data: result[0] });
        } else {
            res.json({ success: false, message: "Chưa có đánh giá" });
        }
    });
});
// GET /danhgia/sanpham/:masp - Lấy tất cả đánh giá theo mã sản phẩm
router.get('/sanpham/:masp', (req, res) => {
    const masp = req.params.masp;
    const sql = 'SELECT * FROM danhgia WHERE masp = ? ORDER BY ngay_danhgia DESC';

    db.query(sql, [masp], (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, data: results });
    });
});
router.get('/trungbinh', (req, res) => {
    const masp = req.query.masp;
    if (!masp) {
        return res.status(400).json({ success: false, message: "Thiếu mã sản phẩm" });
    }

    const sql = "SELECT AVG(rating) AS avgRating FROM danhgia WHERE masp = ?";
    db.query(sql, [masp], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err });

        const avg = result[0].avgRating || 0;
        res.json({ success: true, avgRating: avg });
    });
});

module.exports = router;