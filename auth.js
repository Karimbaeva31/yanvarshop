const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
        return res.status(401).json({ message: "Токен не предоставлен" });
    }
    
    try {
        const decoded = jwt.verify(token, "SECRET_KEY");
        req.user = decoded;
        console.log("🔐 Декодированный пользователь:", decoded);
        next();
    } catch (err) {
        console.error("❌ Ошибка токена:", err);
        return res.status(401).json({ message: "Неверный токен" });
    }
};

const isAdmin = (req, res, next) => {
    console.log("👑 Проверка админских прав, roleid:", req.user?.roleid);
    
    if (!req.user) {
        return res.status(401).json({ message: "Пользователь не авторизован" });
    }
    
    if (req.user.roleid !== 1) {
        console.log("⛔ Доступ запрещен: roleid =", req.user.roleid);
        return res.status(403).json({ 
            message: "Требуются права администратора",
            your_role: req.user.roleid,
            required_role: 1
        });
    }
    
    console.log("✅ Доступ разрешен - администратор");
    next();
};

module.exports = { verifyToken, isAdmin };