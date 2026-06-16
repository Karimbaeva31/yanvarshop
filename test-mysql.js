const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: "cfif31.ru",
  user: "ISPr25-24_KarimbaevaZZ",
  password: "ISPr25-24_KarimbaevaZZ",
  database: "ISPr25-24_KarimbaevaZZ_yanvar",
  port: 3306,
  connectTimeout: 10000
});

connection.connect((err) => {
  if (err) {
    console.error("❌ Ошибка подключения:");
    console.error("Код:", err.code);
    console.error("Сообщение:", err.message);
    console.error("Полная ошибка:", err);
  } else {
    console.log("✅ Подключение к MySQL успешно!");
    connection.query("SELECT 1 as test", (err, result) => {
      if (err) console.error("Ошибка запроса:", err);
      else console.log("✅ Запрос выполнен:", result);
      connection.end();
    });
  }
});