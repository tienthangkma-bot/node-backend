-- MySQL schema for the phone_app API
-- Run with: mysql -u user -p < db_mysql.sql

DROP TABLE IF EXISTS danhgia;
DROP TABLE IF EXISTS chitietdonhang;
DROP TABLE IF EXISTS dathang;
DROP TABLE IF EXISTS sanpham;
DROP TABLE IF EXISTS nhomsanpham;
DROP TABLE IF EXISTS taikhoan;

CREATE TABLE taikhoan (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tendn VARCHAR(100) NOT NULL UNIQUE,
  matkhau VARCHAR(255) NOT NULL,
  hoten VARCHAR(255),
  email VARCHAR(255),
  sdt VARCHAR(50),
  diachi TEXT,
  quyen VARCHAR(50) DEFAULT 'user',
  trangthai TINYINT DEFAULT 1,
  ngaytao DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE nhomsanpham (
  maso INT AUTO_INCREMENT PRIMARY KEY,
  tennsp VARCHAR(255) NOT NULL,
  anh LONGBLOB
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE sanpham (
  masp INT AUTO_INCREMENT PRIMARY KEY,
  tensp VARCHAR(255) NOT NULL,
  mota TEXT,
  ghichu TEXT,
  dongia DECIMAL(15,2) DEFAULT 0,
  soluongkho INT DEFAULT 0,
  maso INT,
  anh LONGBLOB,
  FOREIGN KEY (maso) REFERENCES nhomsanpham(maso) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE dathang (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  tenkh VARCHAR(255),
  diachi TEXT,
  sdt VARCHAR(50),
  tongthanhtoan DECIMAL(15,2) DEFAULT 0,
  ngaydathang DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES taikhoan(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE chitietdonhang (
  id_chitiet INT AUTO_INCREMENT PRIMARY KEY,
  id_dathang INT NOT NULL,
  masp INT NOT NULL,
  soluong INT DEFAULT 1,
  dongia DECIMAL(15,2) DEFAULT 0,
  anh LONGBLOB,
  FOREIGN KEY (id_dathang) REFERENCES dathang(id) ON DELETE CASCADE,
  FOREIGN KEY (masp) REFERENCES sanpham(masp) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE danhgia (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  masp INT NOT NULL,
  id_chitietdonhang INT,
  rating INT CHECK (rating >= 0 AND rating <= 5),
  comment TEXT,
  ngay_danhgia DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES taikhoan(id) ON DELETE CASCADE,
  FOREIGN KEY (masp) REFERENCES sanpham(masp) ON DELETE CASCADE,
  FOREIGN KEY (id_chitietdonhang) REFERENCES chitietdonhang(id_chitiet) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Example: create an index on sanpham.tensp for faster search
CREATE INDEX idx_sanpham_tensp ON sanpham(tensp(100));

-- NOTE: The application expects password values hashed with bcrypt. Do not insert plaintext passwords.
