const express = require('express');

const bodyParser = require('body-parser');
const cors = require('cors');
const taikhoanRoutes = require('./routes/taikhoanRoutes');
const danhgiaRoutes = require('./routes/danhgiaRoutes')
const sanphamRoutes = require('./routes/sanphamRoutes');
const chitietdathangRoutes = require('./routes/chitietdathangRoutes');
const dathangRoutes = require('./routes/dathangRoutes.js');
const db = require('./db.js'); // Module db.js chứa connection đến MySQL
const nhomsanphamRoutes = require('./routes/nhomsanphamRoutes');

const app = express();
// app.use(cors());
// app.use(bodyParser.urlencoded({ extended: false })); // 👉 THÊM DÒNG NÀY
// app.use(bodyParser.json());

// Cho phép CORS
app.use(cors());

// Tăng giới hạn kích thước lên 10MB
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

app.get('/', (req, res) => {
    res.send('API đang chạy!');
});
app.use('/taikhoan', taikhoanRoutes);
app.use('/sanpham', sanphamRoutes);
app.use('/nhomsanpham', nhomsanphamRoutes);
app.use('/chitietdathang',chitietdathangRoutes);
app.use('/dathang',dathangRoutes);
app.use('/danhgia',danhgiaRoutes);


app.listen(3000, () => {
    console.log('Server chạy tại http://localhost:3000');
});
