const express = require('express');
const router = express.Router();
const db = require('../db'); // file kết nối MySQL
const Buffer = require('buffer').Buffer;
router.post("/",(req,res)=>{
   
    const {tensp, mota, ghichu, dongia, soluong, maso, anh} = req.body;
    //  console.log(tensp);
    if(!tensp || !mota || !ghichu|| !dongia || !soluong || !maso || !anh)//thiếu dữ liệu
    {
        return res.status(400).json({error: "thiếu dữ liệu"});
    }
    const imageBuffer = Buffer.from(anh, "base64");
    const sql = "INSERT INTO sanpham (tensp, mota, ghichu, dongia, soluongkho, maso, anh) VALUES (?, ?, ?, ?, ?, ?, ?)";
    db.query(sql, [tensp, mota, ghichu, dongia, soluong, maso, imageBuffer], (err,result)=>{
            if (err) {
      console.error("Lỗi thêm nhóm sản phẩm:", err);
      return res.status(500).json({ error: "Lỗi server" });
    }
    res.json({ success: true });
    })
})
// Lấy tất cả sản phẩm
router.get('/all', (req, res) => {
    db.query('SELECT * FROM sanpham', (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Lỗi máy chủ' });
        }

        const converted = results.map(row => ({
            masp: row.masp, // bạn quên không trả masp
            tensp: row.tensp,
            mota: row.mota,
            ghichu: row.ghichu,
            dongia: row.dongia,
            soluongkho: row.soluongkho,
            maso: row.maso,
            anh: row.anh ? Buffer.from(row.anh).toString('base64') : "" // tránh null
        }));

        res.json(converted);
    });
});
router.get('/search', (req, res) => {
    const keyword = req.query.name;
    if (!keyword) {
        return res.status(400).json({ success: false, message: "Thiếu từ khoá tìm kiếm" });
    }

    const sql = "SELECT * FROM sanpham WHERE tensp LIKE ?";
    db.query(sql, [`%${keyword}%`], (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err });

        const data = results.map(row => {
            return {
                ...row,
                anh: row.anh ? Buffer.from(row.anh).toString('base64') : null
            };
        });

        res.json({
            success: true,
            data: data
        });
    });
});
// Lấy sản phẩm theo mã nhóm
router.get('/group/:maso', (req, res) => {
    const maso = req.params.maso;
    const sql = "SELECT * FROM sanpham WHERE maso = ?";
    db.query(sql, [maso], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err });
        res.json(result);
    });
});
// GET /sanpham/random?limit=8
router.get("/random", (req, res) => {
  const limit = parseInt(req.query.limit) || 8;
  const sql = "SELECT * FROM sanpham ORDER BY RANDOM() LIMIT ?";

  db.query(sql, [limit], (err, results) => {
    if (err) {
      console.error("Lỗi khi truy vấn sản phẩm:", err);
      return res.status(500).json({ error: "Lỗi server" });
    }

    const encoded = results.map(item => ({
      ...item,
      anh: item.anh ? Buffer.from(item.anh).toString("base64") : null
    }));

    res.json(encoded);
  });
});
// Lấy tên sản phẩm theo mã
router.get('/:masp', (req, res) => {
    const masp = req.params.masp;
    db.query("SELECT tensp FROM sanpham WHERE masp = ?", [masp], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err });
        if (result.length > 0) {
            res.json({ tensp: result[0].tensp });
        } else {
            res.status(404).json({ message: "Không tìm thấy sản phẩm" });
        }
    });
});
router.delete("/:masp", (req, res) => {
    const masp = req.params.masp;
    const sql = "DELETE FROM sanpham WHERE masp = ?";
    db.query(sql, [masp], (err, result) => {
        if (err) {
            console.error("Lỗi xóa sản phẩm:", err);
            return res.status(500).json({ error: "Lỗi server" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Không tìm thấy sản phẩm để xóa" });
        }

        res.json({ message: "Đã xóa sản phẩm thành công" });
    });
});
//Sửa sản phẩm 
router.put("/:masp", (req, res) => {
    const masp = req.params.masp;
    const { tensp, dongia, mota, ghichu, soluongkho, maso, anh } = req.body;

    const fields = [tensp, dongia, mota, ghichu, soluongkho, maso];
    let sql = "UPDATE sanpham SET tensp = ?, dongia = ?, mota = ?, ghichu = ?, soluongkho = ?, maso = ?";
    if (anh && anh.trim() !== "") {
        sql += ", anh = ?";
        fields.push(Buffer.from(anh, "base64"));
    }
    sql += " WHERE masp = ?";
    fields.push(masp);

    db.query(sql, fields, (err, result) => {
        if (err) {
            console.error("Lỗi cập nhật:", err);
            return res.status(500).json({ error: "Lỗi server" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Không tìm thấy sản phẩm" });
        }

        res.json({ message: "Cập nhật thành công" });
    });
});
// lấy sản phẩm theo nhóm 
router.get('/nhom/:maso', (req, res) => {
    const maso = req.params.maso;
    const sql = "SELECT * FROM sanpham WHERE maso = ?";
    db.query(sql, [maso], (err, results) => {
        if (err) {
            console.error("Lỗi truy vấn sản phẩm:", err);
            return res.status(500).json({ error: "Lỗi server" });
        }
        const data = results.map(row => ({
            masp: row.masp,
            tensp: row.tensp,
            dongia: row.dongia,
            mota: row.mota,
            ghichu: row.ghichu,
            soluongkho: row.soluongkho,
            maso: row.maso,
            anh: row.anh ? Buffer.from(row.anh).toString("base64") : null
        }));
        res.json({ success: true, data });
    });
});
//lấy tên sản phẩm từ mã 
router.get('/tensp/:masp', (req, res) => {
    const masp = req.params.masp;
    const sql = "SELECT tensp FROM sanpham WHERE masp = ?";

    db.query(sql, [masp], (err, results) => {
        if (err) {
            console.error("Lỗi truy vấn:", err);
            return res.status(500).json({ message: "Lỗi server" });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
        }

        res.json({ tensp: results[0].tensp });
    });
});
router.get("/pic/:masp", (req, res) => {
  const masp = req.params.masp;
  const sql = "SELECT anh FROM sanpham WHERE masp = $1";

  db.query(sql, [masp], (err, results) => {
    if (err) {
      console.error("❌ Lỗi truy vấn ảnh:", err);
      return res.status(500).json({ message: "Lỗi server" });
    }

    const rows = results.rows || results;

    if (rows.length === 0 || !rows[0].anh) {
      return res.status(404).json({ message: "Không tìm thấy ảnh cho mã sản phẩm " + masp });
    }

    // ✅ Convert từ Buffer sang Base64
    const base64Image = Buffer.from(rows[0].anh).toString("base64");

    res.json({ anh: base64Image });
  });
});


module.exports = router;

