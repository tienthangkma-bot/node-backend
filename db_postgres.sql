-- PostgreSQL schema for the phone_app API
-- Run with: psql -U user -d dbname -f db_postgres.sql

DROP TABLE IF EXISTS danhgia CASCADE;
DROP TABLE IF EXISTS chitietdonhang CASCADE;
DROP TABLE IF EXISTS dathang CASCADE;
DROP TABLE IF EXISTS sanpham CASCADE;
DROP TABLE IF EXISTS nhomsanpham CASCADE;
DROP TABLE IF EXISTS taikhoan CASCADE;

CREATE TABLE taikhoan (
  id SERIAL PRIMARY KEY,
  tendn VARCHAR(100) NOT NULL UNIQUE,
  matkhau VARCHAR(255) NOT NULL,
  hoten VARCHAR(255),
  email VARCHAR(255),
  sdt VARCHAR(50),
  diachi TEXT,
  quyen VARCHAR(50) DEFAULT 'user',
  trangthai SMALLINT DEFAULT 1,
  ngaytao TIMESTAMP DEFAULT now()
);

CREATE TABLE nhomsanpham (
  maso SERIAL PRIMARY KEY,
  tennsp VARCHAR(255) NOT NULL,
  anh BYTEA
);

CREATE TABLE sanpham (
  masp SERIAL PRIMARY KEY,
  tensp VARCHAR(255) NOT NULL,
  mota TEXT,
  ghichu TEXT,
  dongia NUMERIC(15,2) DEFAULT 0,
  soluongkho INT DEFAULT 0,
  maso INT REFERENCES nhomsanpham(maso) ON DELETE SET NULL,
  anh BYTEA
);

CREATE TABLE dathang (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES taikhoan(id) ON DELETE CASCADE,
  tenkh VARCHAR(255),
  diachi TEXT,
  sdt VARCHAR(50),
  tongthanhtoan NUMERIC(15,2) DEFAULT 0,
  ngaydathang TIMESTAMP DEFAULT now()
);

CREATE TABLE chitietdonhang (
  id_chitiet SERIAL PRIMARY KEY,
  id_dathang INT NOT NULL REFERENCES dathang(id) ON DELETE CASCADE,
  masp INT NOT NULL REFERENCES sanpham(masp) ON DELETE RESTRICT,
  soluong INT DEFAULT 1,
  dongia NUMERIC(15,2) DEFAULT 0,
  anh BYTEA
);

CREATE TABLE danhgia (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES taikhoan(id) ON DELETE CASCADE,
  masp INT NOT NULL REFERENCES sanpham(masp) ON DELETE CASCADE,
  id_chitietdonhang INT REFERENCES chitietdonhang(id_chitiet) ON DELETE SET NULL,
  rating INT CHECK (rating >= 0 AND rating <= 5),
  comment TEXT,
  ngay_danhgia TIMESTAMP DEFAULT now()
);

-- Index to speed up product name search
CREATE INDEX idx_sanpham_tensp ON sanpham USING btree (tensp);

-- NOTE: The application expects password values hashed with bcrypt. Do not insert plaintext passwords.
