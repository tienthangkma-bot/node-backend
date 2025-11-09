const express = require('express');
const router = express.Router();
const db = require('../db'); // Kết nối MySQL
// POST /nhomsanpham
router.post("/", (req, res) => {
  const { tennsp, anh } = req.body;
  if (!tennsp || !anh) {
    return res.status(400).json({ error: "Thiếu dữ liệu" });
  }

  const imageBuffer = Buffer.from(anh, "base64");
  const sql = "INSERT INTO nhomsanpham (tennsp, anh) VALUES (?, ?)";

  db.query(sql, [tennsp, imageBuffer], (err, result) => {
    if (err) {
      console.error("Lỗi thêm nhóm sản phẩm:", err);
      return res.status(500).json({ error: "Lỗi server" });
    }
    res.json({ success: true });
  });
});
// Lấy tất cả nhóm sản phẩm
router.get('/all', (req, res) => {
    db.query('SELECT * FROM nhomsanpham', (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Lỗi máy chủ' });
        }

        const result = results.map(row => ({
            maso: row.maso,
            tennsp: row.tennsp,
            anh: row.anh ? Buffer.from(row.anh).toString('base64') : null
        }));

        res.json(result);
    });
});
router.get("/random", (req, res) => {
  const limit = parseInt(req.query.limit) || 8;
  const sql = "SELECT * FROM nhomsanpham ORDER BY RANDOM() LIMIT ?";

  db.query(sql, [limit], (err, results) => {
    if (err) {
      console.error("Lỗi khi truy vấn nhóm sản phẩm:", err);
      return res.status(500).json({ error: "Lỗi server" });
    }

    const encoded = results.map(item => ({
      ...item,
      anh: item.anh ? Buffer.from(item.anh).toString("base64") : null
    }));

    res.json(encoded);
  });
});
router.get("/", (req, res) => {
  const sql = "SELECT * FROM nhomsanpham";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Lỗi khi truy vấn nhóm sản phẩm:", err);
      return res.status(500).json({ error: "Lỗi server" });
    }
    res.json(results); // <-- Trả dữ liệu JSON về client
  });
});
// XÓA SẢN PHẨM
router.delete("/:maso", (req, res) => {
  const maso = req.params.maso;

  // Kiểm tra sản phẩm còn tham chiếu
  const checkSql = "SELECT COUNT(*) AS count FROM sanpham WHERE maso = ?";
  db.query(checkSql, [maso], (err, results) => {
    if (err) return res.status(500).json({ error: "Lỗi truy vấn" });

    if (results[0].count > 0) {
      return res.status(400).json({ error: "Không thể xóa. Vẫn còn sản phẩm thuộc nhóm này." });
    }

    // Nếu không có sản phẩm, cho phép xóa
    const deleteSql = "DELETE FROM nhomsanpham WHERE maso = ?";
    db.query(deleteSql, [maso], (err2, result) => {
      if (err2) return res.status(500).json({ error: "Lỗi khi xóa nhóm" });
      res.json({ message: "Đã xóa nhóm sản phẩm thành công" });
    });
  });
});
//  sửa nhóm sản phẩm 
router.put("/:maso", (req, res) => {
    const maso = req.params.maso;
    const { tennsp, anh } = req.body;

    // Cấu trúc SQL động: nếu có ảnh thì thêm cập nhật cột ảnh
    let sql = "UPDATE nhomsanpham SET tennsp = ?";
    const values = [tennsp];

    if (anh && anh.trim() !== "") {
        sql += ", anh = ?";
        values.push(Buffer.from(anh, 'base64'));
    }

    sql += " WHERE maso = ?";
    values.push(maso);

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Lỗi cập nhật:", err);
            return res.status(500).json({ error: "Lỗi server" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Không tìm thấy nhóm sản phẩm" });
        }

        res.json({ message: "Cập nhật nhóm sản phẩm thành công" });
    });
});
module.exports = router;
