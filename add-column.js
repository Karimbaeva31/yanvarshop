const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: "cfif31.ru",
  user: "ISPr25-24_KarimbaevaZZ",
  password: "ISPr25-24_KarimbaevaZZ",
  database: "ISPr25-24_KarimbaevaZZ_yanvar",
  port: 3306
});

connection.connect((err) => {
  if (err) {
    console.error('❌ Ошибка подключения:', err);
    return;
  }
  
  console.log('✅ Подключено к БД');
  
  
  connection.query("SHOW COLUMNS FROM products LIKE 'image'", (err, result) => {
    if (err) {
      console.error('❌ Ошибка проверки:', err);
      connection.end();
      return;
    }
    
    if (result.length > 0) {
      console.log('✅ Поле "image" уже существует в таблице');
      connection.end();
      return;
    }
    
    
    const sql = "ALTER TABLE products ADD COLUMN image VARCHAR(255) DEFAULT 'default.jpg'";
    
    connection.query(sql, (err, result) => {
      if (err) {
        console.error('❌ Ошибка добавления поля:', err.message);
      } else {
        console.log('✅ Поле "image" успешно добавлено!');
        console.log('📊 Результат:', result);
      }
      
      connection.end();
    });
  });
});