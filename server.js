const express = require('express');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const http = require('http'); 
const { Server } = require('socket.io'); 
const { createClient } = require('@supabase/supabase-js');
const locationRoutes = require('./routes/locationRoutes');
const chatRoutes = require('./routes/chatRoutes');
require('dotenv').config();
const supabase = require('./config/supabase');
const functChatRoutes = require('./routes/functChatRoutes');


const app = express();
const port = 3000;
app.use(cookieParser());
app.use(cors({
    origin: 'https://couple-production.up.railway.app', // Sesuaikan dengan alamat frontend
    credentials: true // 🔹 HARUS TRUE agar cookie dikirim
}));


app.use(express.json());


const server = http.createServer(app);
const io = new Server(server);

// Middleware lainnya
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));
const sessionMiddleware = session({
    secret: 'niga', // Ganti dengan key yang lebih aman
    resave: true,  // Ubah ke `true` agar session tetap disimpan meskipun tidak ada perubahan
    saveUninitialized: true,  // Ubah ke `true` agar session tetap dibuat untuk user baru
    cookie: {
        secure: false, // Ubah ke `true` jika pakai HTTPS
        httpOnly: true,
        sameSite: 'lax', // Pastikan cookie bisa dikirim dengan `credentials: true`
        maxAge: 24 * 60 * 60 * 1000 // 1 hari
    }
});

app.use(sessionMiddleware);


app.use((req, res, next) => {
    console.log("📌 Debug Session:", req.session);
    next();
});
console.log("Database PostgreSQL siap!");


console.log("Database & tabel siap");

const sharedSession = require("express-socket.io-session");

io.use(sharedSession(sessionMiddleware, {
    autoSave: true // Pastikan session tetap tersimpan
}));


// =======================
// == SETUP WEBSOCKET ==
// =======================
// WebSocket
io.on("connection", (socket) => {
    console.log("✅ User connected:", socket.id);

    // 🔍 Debug: Cek session saat koneksi WebSocket
    console.log("📌 WebSocket Session:", socket.handshake.session);

    socket.on("sendMessage", async (data) => {
        const { sender, receiver, message } = data;
        try {
            const { data: savedData, error } = await supabase
                .from('messages')
                .insert([{ sender, receiver, message }])
                .select();

            if (error) throw error;

            const messageId = savedData[0].id;
            const savedMessage = { id: messageId, sender, receiver, message };

            // Kirim pesan ke pengirim dan penerima
            socket.emit("messageSaved", savedMessage);
            socket.to(receiver).emit("newMessage", savedMessage);
        } catch (error) {
            console.error("❌ Gagal menyimpan pesan:", error);
        }
    });

    socket.on("disconnect", () => {
        console.log("❌ User disconnected:", socket.id);
    });
});


// ====================
// == LOCATIONS ==
// ====================

app.use('/api', locationRoutes);

// ====================
// == AUTHENTICATION ==
// ====================

const authRoutes = require('./routes/authRoutes');
app.use(authRoutes);

// ====================
// == CHAT ENDPOINTS ==
// ====================
app.use("/api/chat", chatRoutes);
app.use('/api', functChatRoutes);
app.use('/api', chatRoutes);

// ==========================
// == SERVE STATIC FILES ==
// ==========================

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});
app.get("/maps", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "maps.html"));
});

app.get("/registered", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "register.html"));
});

app.get("/users", (req, res) => {
    console.log("Session di halaman users:", req.session.user);
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: "Silakan login terlebih dahulu." });
    }
    res.sendFile(path.join(__dirname, "public", "users.html"));
});
// ==================
// == START SERVER ==
// ==================

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server berjalan di port ${PORT}`);
});
