const express = require('express');
const router = express.Router();
const db = require('../db'); // Kết nối MySQL

router.post("/", (req, res) => {
  const { id_dathang, masp, soluong, dongia, anh } = req.body;

  // 🧩 Nếu FE gửi Base64 ảnh, decode về Buffer
  const anhBuffer = anh ? Buffer.from(anh, "base64") : null;

  const sql = `
    INSERT INTO chitietdonhang (id_dathang, masp, soluong, dongia, anh)
    VALUES ($1, $2, $3, $4, $5)
  `;

  db.query(sql, [id_dathang, masp, soluong, dongia, anhBuffer], (err) => {
    if (err) {
      console.error("❌ Lỗi khi thêm chi tiết:", err);
      return res.status(500).json({ message: "Lỗi server" });
    }
    res.json({ message: "✅ Thêm chi tiết thành công" });
  });
});

router.get("/:id", (req, res) => {
  const id = req.params.id;
  const sql = `
    SELECT id_chitiet, masp, soluong, dongia, anh
    FROM chitietdonhang
    WHERE id_dathang = $1
  `;

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error("❌ Lỗi khi truy vấn chi tiết:", err);
      return res.status(500).json({ message: "Lỗi server" });
    }

    const rows = results.rows || results;

    // 🔥 Chuyển buffer → base64 string trước khi gửi
    const encoded = rows.map(item => ({
      ...item,
      anh: item.anh ? Buffer.from(item.anh).toString("base64") : null
    }));

    res.json(encoded);
  });
});

module.exports = router;
