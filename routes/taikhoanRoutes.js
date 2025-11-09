// File: routes/taikhoanRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../db.js'); // Module db.js chứa connection đến MySQL
const jwt = require('jsonwebtoken');
const { verifyToken } = require('../middleware/auth');
const SECRET_KEY = '123456'; 
const bcrypt = require('bcrypt');
const saltRounds = 10;
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    const sql = 'SELECT * FROM taikhoan WHERE tendn = ?';

    db.query(sql, [username], async (err, result) => {
        if (err) return res.status(500).json({ success: false, message: 'Lỗi server' });

        if (result.length === 0) {
            return res.json({ success: false, message: 'Sai tên đăng nhập hoặc mật khẩu' });
        }

        const user = result[0];

        if (user.trangthai === 0) {
            return res.json({ success: false, message: 'Tài khoản đã bị khóa, vui lòng liên hệ Admin' });
        }

        const passwordMatch = await bcrypt.compare(password, user.matkhau);
        if (!passwordMatch) {
            return res.json({ success: false, message: 'Sai tên đăng nhập hoặc mật khẩu' });
        }

        const token = jwt.sign(
            { user_id: user.id, username: user.tendn, role: user.quyen },
            SECRET_KEY,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: 'Đăng nhập thành công',
            token,
            user_id: user.id,
            username: user.tendn,
            role: user.quyen
        });
    });
});
router.get('/userinfo', verifyToken, (req, res) => {
    res.json({
        success: true,
        message: 'Lấy thông tin thành công',
        user: req.user // user_id, username, role
    });
});
router.post('/register', async (req, res) => {
    const { username, password} = req.body;
    if (!username || !password) return res.status(400).json({ success: false, message: 'Thiếu thông tin' });

    const checkSql = 'SELECT * FROM taikhoan WHERE tendn = ?';
    db.query(checkSql, [username], async (err, result) => {
        if (err) return res.status(500).json({ success: false });

        if (result.length > 0) {
            return res.json({ success: false, message: 'Tài khoản đã tồn tại' });
        }

        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const insertSql = 'INSERT INTO taikhoan (tendn, matkhau, quyen) VALUES (?, ?, ?)';
        db.query(insertSql, [username, hashedPassword, 'user'], (err2) => {
            if (err2) return res.status(500).json({ success: false });
            res.json({ success: true, message: 'Đăng ký thành công' });
        });
    });
});
router.get('/all', (req, res) => {
    db.query('SELECT * FROM taikhoan', (err, result) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true, data: result });
    });
});
router.post('/delete', (req, res) => {
    const { username } = req.body;
    db.query('DELETE FROM taikhoan WHERE tendn = ?', [username], (err, result) => {
        if (err) return res.status(500).json({ success: false });
        if (result.affectedRows === 0) return res.json({ success: false, message: 'Khong tim thay tai khoan' });
        res.json({ success: true });
    });
});
router.post('/update', (req, res) => {
    const { username, password, role } = req.body;
    db.query('UPDATE taikhoan SET matkhau = ?, quyen = ? WHERE tendn = ?', [password, role, username], (err, result) => {
        if (err) return res.status(500).json({ success: false });
        if (result.affectedRows === 0) return res.json({ success: false, message: 'Khong tim thay tai khoan' });
        res.json({ success: true });
    });
});
router.delete("/:tdn", (req, res) => {
    const tdn = req.params.tdn;

    const sql = "DELETE FROM taikhoan WHERE tendn = ?";
    db.query(sql, [tdn], (err, result) => {
        if (err) {
            console.error("Lỗi xóa tài khoản:", err);
            return res.status(500).json({ error: "Lỗi server" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Không tìm thấy tài khoản" });
        }

        res.json({ message: "Xóa tài khoản thành công" });
    });
});
router.put('/:tdn', (req, res) => {
    const oldTdn = req.params.tdn;
    const { quyen } = req.body;

    const sql = "UPDATE taikhoan SET quyen = ? WHERE tendn = ?";
    db.query(sql, [ quyen, oldTdn], (err, result) => {
        if (err) {
            console.error("Lỗi cập nhật tài khoản:", err);
            return res.status(500).json({ error: "Lỗi server" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Không tìm thấy tài khoản" });
        }

        res.json({ message: "Cập nhật tài khoản thành công" });
    });
});
router.post("/", async (req, res) => {
    const { tendn, matkhau, quyen } = req.body;
    const hashedPassword = await bcrypt.hash(matkhau, saltRounds);

    const sql = "INSERT INTO taikhoan (tendn, matkhau, quyen) VALUES (?, ?, ?)";
    db.query(sql, [tendn, hashedPassword, quyen], (err, result) => {
        if (err) {
            console.error("Lỗi thêm tài khoản:", err);
            return res.status(500).json({ error: "Lỗi server" });
        }
        res.json({ success: true, message: "Thêm tài khoản thành công!" });
    });
});
router.get('/thongtin', (req, res) => {
    const id = req.query.id;
    if (!id) {
        return res.status(400).json({ success: false, message: 'Thiếu tên đăng nhập' });
    }

    const sql = "SELECT tendn, hoten, email, sdt, diachi, quyen, ngaytao FROM taikhoan WHERE id = ?";
    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Lỗi truy vấn' });
        if (results.length === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' });
        return res.json({ success: true, user: results[0] });
    });
});
router.post('/doimatkhau', (req, res) => {
    const { id, matkhau_cu, matkhau_moi } = req.body;
    if (!id || !matkhau_cu || !matkhau_moi) {
        return res.json({ success: false, message: 'Thiếu thông tin' });
    }

    const sqlCheck = "SELECT matkhau FROM taikhoan WHERE id = ?";
    db.query(sqlCheck, [id], async (err, results) => {
        if (err || results.length === 0) {
            return res.json({ success: false, message: 'Không tìm thấy tài khoản' });
        }

        const mkHienTai = results[0].matkhau;
        const match = await bcrypt.compare(matkhau_cu, mkHienTai);
        if (!match) {
            return res.json({ success: false, message: 'Mật khẩu cũ không đúng' });
        }

        const hashedNewPass = await bcrypt.hash(matkhau_moi, saltRounds);
        const sqlUpdate = "UPDATE taikhoan SET matkhau = ? WHERE id = ?";
        db.query(sqlUpdate, [hashedNewPass, id], (err2) => {
            if (err2) return res.json({ success: false, message: 'Lỗi cập nhật' });
            return res.json({ success: true });
        });
    });
});
router.post('/capnhat', (req, res) => {
    const { id, hoten, email, sdt, diachi } = req.body;
    if (!id) return res.json({ success: false, message: 'Thiếu ID người dùng' });

    const sql = "UPDATE taikhoan SET hoten = ?, email = ?, sdt = ?, diachi = ? WHERE id = ?";
    db.query(sql, [hoten, email, sdt, diachi, id], (err) => {
        if (err) return res.json({ success: false, message: 'Lỗi cập nhật CSDL' });
        return res.json({ success: true, message: 'Cập nhật thành công' });
    });
});
router.post('/khoataikhoan', (req, res) => {
    const { id, newStatus } = req.body;
    const sql = "UPDATE taikhoan SET trangthai = ? WHERE id = ?";
    db.query(sql, [newStatus, id], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: "Lỗi server" });
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Không tìm thấy tài khoản" });
        res.json({ success: true, message: "Cập nhật trạng thái thành công" });
    });
});
module.exports = router;
