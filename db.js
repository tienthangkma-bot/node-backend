// db.js

const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    user: 'postgres',     // 👈 tên user PostgreSQL (mặc định là 'postgres')
    password: '123',      // 👈 mật khẩu PostgreSQL
    database: 'API_phone_app',    // 👈 tên database (thay theo DB của bạn)
    port: 5432,           // 👈 cổng mặc định của PostgreSQL
});

pool.connect()
  .then(() => console.log('✅ Kết nối PostgreSQL thành công'))
  .catch(err => console.error('❌ Lỗi kết nối PostgreSQL:', err.stack));

// Helper: convert MySQL-style ? placeholders to Postgres $1, $2, ...
function replaceQuestionMarks(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => {
    i += 1;
    return `$${i}`;
  });
}

// query wrapper that mimics mysql callback behavior used across the codebase
// - For SELECT: callback(null, rowsArray)
// - For INSERT/UPDATE/DELETE: callback(null, { affectedRows, rowCount, rows, insertId })
// Supports both signatures: query(text, params, cb) and query(text, cb)
function query(text, params, cb) {
  if (typeof params === 'function') {
    cb = params;
    params = [];
  }

  const sql = replaceQuestionMarks(text);

  pool.query(sql, params, (err, res) => {
    if (err) return cb(err);

    // SELECT-like commands -> return rows array for compatibility with existing code
    if (res.command === 'SELECT') {
      return cb(null, res.rows);
    }

    // Non-select -> construct mysql-like result object
    const result = {
      affectedRows: res.rowCount,
      rowCount: res.rowCount,
      rows: res.rows,
      insertId: null,
    };

    // If INSERT used RETURNING id, try to pick it
    if (res.rows && res.rows[0]) {
      const first = res.rows[0];
      // common names: id, insertId
      result.insertId = first.id || first.insertid || first.insert_id || null;
    }

    return cb(null, result);
  });
}

module.exports = {
  query,
  pool,
};
