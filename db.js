const mysql = require("mysql2");

const dbConfig = {
  host: "cfif31.ru",
  user: "ISPr25-24_KarimbaevaZZ",
  password: "ISPr25-24_KarimbaevaZZ",
  database: "ISPr25-24_KarimbaevaZZ_yanvar",
  port: 3306,
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
};

const pool = mysql.createPool(dbConfig);
const db = pool;
pool.on('connection', (connection) => {
  console.log('✅ Новое подключение к БД');
});

pool.on('error', (err) => {
  console.error('❌ Ошибка БД:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('🔄 Потеряно соединение, переподключаемся...');
  }
});

db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Ошибка подключения к БД:", err);
    return;
  }
  console.log("✅ Подключено к MySQL (удалённый сервер)");
  connection.release();
});

module.exports = db;