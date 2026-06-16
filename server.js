const express = require("express");
const app = express();
const cors = require("cors");
const path = require("path");

app.use(cors());
app.use(express.json());

const frontendPath = path.join(__dirname, '../frontend');
console.log('📁 Путь к фронтенду:', frontendPath);

app.use(express.static(frontendPath));
app.use('/uploads', express.static(path.join(frontendPath, 'uploads')));

// Подключаем маршруты
app.use("/auth", require("./routes/auth"));
app.use("/categories", require("./routes/categories"));
app.use("/products", require("./routes/products"));
app.use("/cart", require("./routes/cart"));
app.use("/orders", require("./routes/orders"));

// Для всех остальных страниц
app.get("*", (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(3000, () => {
    console.log("=".repeat(60));
    console.log("✅ Сервер запущен на http://localhost:3000");
    console.log("📁 Статика из:", frontendPath);
    console.log("🌐 Откройте в браузере:");
    console.log("   📄 Главная: http://localhost:3000");
    console.log("   🛒 Каталог: http://localhost:3000/catalog.html");
    console.log("   🛒 Корзина: http://localhost:3000/cart.html");
    console.log("   🔐 Логин: http://localhost:3000/login.html");
    console.log("   📝 Оформление: http://localhost:3000/checkout.html");
    console.log("   👤 Профиль: http://localhost:3000/profile.html");
    console.log("📸 Картинки: http://localhost:3000/uploads/products/");
    console.log("=".repeat(60));
});