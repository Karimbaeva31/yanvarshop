const db = require('./db');

db.query("SELECT 1 as test", (err, result) => {
  if (err) {
    console.error("❌ БД не отвечает:", err);
  } else {
    console.log("✅ БД работает:", result);
  }
  process.exit();
});