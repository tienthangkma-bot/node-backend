const jwt = require('jsonwebtoken');
const SECRET_KEY = '123456'; // Nên dùng biến môi trường trong thực tế

function verifyToken(req, res, next) {
    console.log('Authorization Header:', req.headers['authorization']);
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

    if (!token) {
        return res.status(401).json({ success: false, message: 'Không có token' });
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'Token không hợp lệ' });
        }
        req.user = user; // Gán user vào request để dùng ở route
        next();
    });
}

module.exports = { verifyToken };
