const express = require('express');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const http = require('http'); 
const { Server } = require('socket.io'); 
const { Pool } = require('pg');

const app = express();
const port = 3000;

// **📌 Pastikan deklarasi `pool` dilakukan sebelum `pool.connect()`**
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://user:Nurwanto18@couple-production.up.railway.app:5432/chatdb',
    ssl: { rejectUnauthorized: false } // **📌 Diperlukan jika PostgreSQL di Railway**
});

// **📌 Pastikan koneksi ke database**
pool.connect()
    .then(() => console.log("✅ Database connected!"))
    .catch(err => console.error("❌ Database connection error:", err));

app.use(cors());
app.use(express.json());

const chatRoutes = require('./routes/chatRoutes');
app.use('/api', chatRoutes);

const server = http.createServer(app);
const io = new Server(server);

// **📌 Pastikan tabel dibuat hanya sekali**
(async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                sender VARCHAR(255) NOT NULL,
                receiver VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                deleted_for_user TEXT DEFAULT NULL,
                deleted_for TEXT
            );
        `);
        console.log("✅ Database PostgreSQL siap!");
    } catch (error) {
        console.error("❌ Gagal membuat tabel:", error);
    }
})();

// Middleware lainnya
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(session({
    secret: 'yattajh',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

console.log("Database PostgreSQL siap!");


console.log("Database & tabel siap");
// =======================
// == SETUP WEBSOCKET ==
// =======================
// WebSocket
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on("sendMessage", async (data) => {
        const { sender, receiver, message } = data;
        try {
            const result = await pool.query(
                "INSERT INTO messages (sender, receiver, message) VALUES ($1, $2, $3) RETURNING id",
                [sender, receiver, message]
            );
            const messageId = result.rows[0].id;
            const savedMessage = { id: messageId, sender, receiver, message };
            socket.emit("messageSaved", savedMessage);
            socket.to(receiver).emit("newMessage", savedMessage);
        } catch (error) {
            console.error("Gagal menyimpan pesan:", error);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// **Hapus Pesan untuk Saya Sendiri**
app.put('/api/chat/delete-for-me/:messageId/:userId', (req, res) => {
    const { messageId, userId } = req.params;

    pool.query("SELECT deleted_for FROM messages WHERE id = $1", [messageId])
    .then(result => {
        let deletedFor = result.rows[0]?.deleted_for ? JSON.parse(result.rows[0].deleted_for) : [];
        if (!deletedFor.includes(userId)) deletedFor.push(userId);

        return pool.query("UPDATE messages SET deleted_for = $1 WHERE id = $2", [JSON.stringify(deletedFor), messageId]);
    })
    .then(() => res.json({ success: true }))
    .catch(err => res.status(500).json({ success: false, message: "Error deleting message for user." }));

});


// **Hapus Pesan untuk Semua**
app.delete('/api/chat/delete-for-everyone/:messageId', (req, res) => {
    const { messageId } = req.params;

    pool.query("DELETE FROM messages WHERE id = $1", [messageId])
    .then(() => res.json({ success: true }))
    .catch(err => res.status(500).json({ success: false, message: "Error deleting message." }));

});


// ====================
// == AUTHENTICATION ==
// ====================

// **Registrasi User**
app.post('/register', (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ message: "Semua field harus diisi!" });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    pool.query(
        `INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id`,
        [username, email, hashedPassword]
    ).then(result => {
        res.json({ message: "Registrasi berhasil!", userId: result.rows[0].id });
    }).catch(err => {
        res.status(400).json({ message: "User sudah ada atau terjadi kesalahan." });
    });
    
});

// Login User
// **Login User**
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email dan password harus diisi." });
    }

    pool.query(`SELECT * FROM users WHERE LOWER(email) = LOWER($1)`, [email])
    .then(result => {
        const user = result.rows[0];
        if (!user) return res.status(404).json({ success: false, message: "User tidak ditemukan." });

        const isValidPassword = bcrypt.compareSync(password, user.password);
        if (isValidPassword) {
            req.session.user = { id: user.id, username: user.username, email: user.email };
            res.json({ success: true, message: "Login berhasil!", username: user.username, redirect: "/users" });
        } else {
            res.status(401).json({ success: false, message: "Password salah." });
        }
    })
    .catch(err => res.status(500).json({ success: false, message: "Kesalahan server." }));

});

// **Cek Autentikasi**
app.get('/api/auth/check', (req, res) => {
    if (req.session.user) {
        res.json({ authenticated: true, user: req.session.user });
    } else {
        res.json({ authenticated: false });
    }
});

// **Logout User**
app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ message: "Gagal logout." });
        res.json({ success: true, message: "Logout berhasil!" });
    });
});

// **Ambil Semua Pengguna**
app.get('/api/users', (req, res) => {
    pool.query("SELECT id, username FROM users")
    .then(result => res.json(result.rows))
    .catch(err => res.status(500).json({ message: "Gagal mengambil data pengguna." }));

});

// ====================
// == CHAT ENDPOINTS ==
// ====================
app.use('/api/chat', chatRoutes); // Menggunakan routes dari chatRoutes.js

// ==========================
// == SERVE STATIC FILES ==
// ==========================

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/registered", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "register.html"));
});

app.get("/users", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "users.html"));
});
console.log("DATABASE_URL:", process.env.DATABASE_URL);

// ==================
// == START SERVER ==
// ==================

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server berjalan di port ${PORT}`);
});


