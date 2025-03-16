const express = require('express');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const http = require('http'); 
const { Server } = require('socket.io'); 

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const chatRoutes = require('./routes/chatRoutes');
app.use('/api', chatRoutes);
const server = http.createServer(app); 
const io = new Server(server); 
const db = new Database('./database.db');


// ====================
// == MIDDLEWARES ==
// ====================
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.get("/socket.io/socket.io.js", (req, res) => {
    res.sendFile(require.resolve("socket.io/client-dist/socket.io.js"));
});


app.use(session({
    secret: 'yattajh',  // Gantilah dengan string acak yang lebih kuat
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set `true` jika menggunakan HTTPS
}));

// ====================
// == DATABASE SETUP ==
// ====================

// Buat tabel `users` jika belum ada
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
)`);

// Buat tabel `messages` jika belum ada
db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender TEXT NOT NULL,
    receiver TEXT NOT NULL,
    message TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

console.log("Database & tabel siap");
// =======================
// == SETUP WEBSOCKET ==
// =======================
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on("sendMessage", async (data) => {
        const { sender, receiver, message } = data;
        
        try {
            const db = await openDb();
            const result = await db.run(
                "INSERT INTO messages (sender, receiver, message) VALUES (?, ?, ?)", 
                [sender, receiver, message]
            );
    
            const messageId = result.lastID; // Ambil ID dari pesan yang baru saja disimpan
    
            const savedMessage = {
                id: messageId,
                sender,
                receiver,
                message
            };
    
            // Kirim kembali ke pengirim agar tampilan diperbarui dengan ID
            socket.emit("messageSaved", savedMessage);
    
            // Kirim ke penerima agar pesan muncul otomatis
            socket.to(receiver).emit("newMessage", savedMessage);
    
        } catch (error) {
            console.error("Gagal menyimpan pesan:", error);
        }
    });
    
    socket.on("deleteMessage", (data) => {
        io.emit("deleteMessage", { messageId: data.messageId });
    });
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// **Hapus Pesan untuk Saya Sendiri**
app.put('/api/chat/delete-for-me/:messageId/:userId', (req, res) => {
    const { messageId, userId } = req.params;

    db.get("SELECT deletedFor FROM messages WHERE id = ?", [messageId], (err, row) => {
        if (err) return res.status(500).json({ success: false, message: "Error fetching message." });

        let deletedFor = row.deletedFor ? JSON.parse(row.deletedFor) : [];
        if (!deletedFor.includes(userId)) deletedFor.push(userId);

        db.run("UPDATE messages SET deletedFor = ? WHERE id = ?", [JSON.stringify(deletedFor), messageId], (err) => {
            if (err) return res.status(500).json({ success: false, message: "Error deleting message for user." });
            res.json({ success: true });
        });
    });
});


// **Hapus Pesan untuk Semua**
app.delete('/api/chat/delete-for-everyone/:messageId', (req, res) => {
    const { messageId } = req.params;

    db.run("DELETE FROM messages WHERE id = ?", [messageId], (err) => {
        if (err) return res.status(500).json({ success: false, message: "Error deleting message." });
        res.json({ success: true });
    });
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
    db.run(`INSERT INTO users (username, email, password) VALUES (?, ?, ?)`,
        [username, email, hashedPassword],
        function (err) {
            if (err) {
                return res.status(400).json({ message: "User sudah ada atau terjadi kesalahan." });
            }
            res.json({ message: "Registrasi berhasil!", userId: this.lastID });
        }
    );
});

// **Login User**
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email dan password harus diisi." });
    }

    db.get(`SELECT * FROM users WHERE LOWER(email) = LOWER(?)`, [email], (err, user) => {
        if (err) return res.status(500).json({ success: false, message: "Kesalahan server." });
        if (!user) return res.status(404).json({ success: false, message: "User tidak ditemukan." });

        const isValidPassword = bcrypt.compareSync(password, user.password);
        if (isValidPassword) {
            req.session.user = { id: user.id, username: user.username, email: user.email };
            res.json({ success: true, message: "Login berhasil!", username: user.username, redirect: "/users" });
        } else {
            res.status(401).json({ success: false, message: "Password salah." });
        }
    });
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
    db.all(`SELECT id, username FROM users`, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: "Gagal mengambil data pengguna." });
        }
        res.json(rows);
    });
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

// ==================
// == START SERVER ==
// ==================

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server berjalan di http://localhost:${PORT}`));

