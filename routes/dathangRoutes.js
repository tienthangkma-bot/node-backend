const express = require('express');
const router = express.Router();
const db = require('../db'); // Kết nối MySQL
// POST /dathang
router.post('/', (req, res) => {
    const { user_id, tenkh, diachi, sdt, tongthanhtoan } = req.body;
    const sql = `
        INSERT INTO dathang (user_id, tenkh, diachi, sdt, tongthanhtoan, ngaydathang)
        VALUES (?, ?, ?, ?, ?, NOW()) RETURNING id`;
    db.query(sql, [user_id, tenkh, diachi, sdt, tongthanhtoan], (err, result) => {
        if (err) {
            console.error("Lỗi thêm đơn hàng:", err);
            return res.status(500).json({ error: "Lỗi server" });
        }
        // our db wrapper will set insertId when RETURNING id is present
        res.json({ success: true, id: result.insertId });
    });
});
router.get('/user/:userId', (req, res) => {
    const userId = req.params.userId;
    const sql = "SELECT * FROM dathang WHERE user_id = ?";
    db.query(sql, [userId], (err, results) => {
        if (err) return res.status(500).json({ message: "Lỗi server" });
        res.json(results);
    });
});
router.get('/all', (req, res) => {
    const userId = req.params.userId;
    const sql = "SELECT * FROM dathang";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: "Lỗi server" });
        res.json(results);
    });
});
// GET /dathang/user/:id_donhang
router.get('/user/:id_donhang', (req, res) => {
    const id = req.params.id_donhang;
    const sql = `SELECT user_id FROM dathang WHERE id = ?`;

    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err });
        if (result.length > 0) {
            res.json({ success: true, user_id: result[0].user_id });
        } else {
            res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
        }
    });
});

module.exports = router;
