const session = require('express-session');

const sessionMiddleware = session({
    secret: 'niga', // Ganti dengan key yang lebih aman
    resave: true,
    saveUninitialized: true,
    cookie: {
        secure: false, // Ubah ke `true` jika pakai HTTPS
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000
    }
});

module.exports = sessionMiddleware;
