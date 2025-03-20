const express = require('express');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const http = require('http'); 
const { Server } = require('socket.io'); 
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
console.log("SUPABASE_URL:", process.env.SUPABASE_URL);
console.log("SUPABASE_KEY:", process.env.SUPABASE_KEY ? "✅ Terbaca" : "❌ Tidak Terbaca");

const app = express();
const port = 3000;

app.use(cors({
    origin: 'https://couple-production.up.railway.app/', // Sesuaikan dengan alamat frontend
    credentials: true // 🔹 Mengizinkan cookie session dikirim
}));

app.use(express.json());

const chatRoutes = require('./routes/chatRoutes');
app.use('/api', chatRoutes);

const server = http.createServer(app);
const io = new Server(server);

// Middleware lainnya
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(session({
    secret: 'yattajh',  // Gunakan string yang lebih kompleks untuk keamanan
    resave: false,
    saveUninitialized: false,  // Ubah ke `false` agar sesi tidak dibuat tanpa autentikasi
    cookie: { 
        secure: false, // Gunakan `true` jika server sudah pakai HTTPS
        httpOnly: true,  // Mencegah akses JS ke cookie
        maxAge: 24 * 60 * 60 * 1000  // Sesi berlaku 1 hari
    }
}));
app.use((req, res, next) => {
    console.log("📌 Debug Session:", req.session);
    next();
});

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
            const { data, error } = await supabase
            .from('messages')
            .insert([{ sender, receiver, message }])
            .select();
          
          if (error) throw error;
          const messageId = data[0].id;          
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


// Simpan lokasi pengguna
app.post('/api/location', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: "Unauthorized! Silakan login dulu." });
    }

    const user_id = req.session.user.id;  // 🔹 Perbaikan akses session
    let { latitude, longitude } = req.body;

    console.log(`📌 User ${user_id} mengirim lokasi: ${latitude}, ${longitude}`);

    if (!latitude || !longitude) {
        return res.status(400).json({ message: "Data tidak lengkap!" });
    }

    latitude = Number(latitude);
    longitude = Number(longitude);

    if (isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({ message: "Format data tidak valid!" });
    }

    try {
        const { error } = await supabase
            .from('user_locations')
            .upsert([{ 
                user_id,  // 🔹 Ambil dari session
                latitude, 
                longitude, 
                updated_at: new Date().toISOString() 
            }]);

        if (error) throw error;
        res.json({ success: true, message: "Lokasi diperbarui!" });
    } catch (err) {
        console.error("❌ Gagal menyimpan lokasi:", err);
        res.status(500).json({ success: false, message: "Kesalahan server." });
    }
});



// Ambil semua lokasi pengguna
app.get("/api/locations", async (req, res) => {
    try {
        const { data, error } = await supabase.from("user_locations").select("*");

        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error("Gagal mengambil lokasi:", err);
        res.status(500).json({ message: "Kesalahan server." });
    }
});




app.put('/api/chat/delete-for-me/:messageId/:userId', async (req, res) => { // Tambahkan async
    const { messageId, userId } = req.params;

    try {
        const { data: message, error } = await supabase
            .from('messages')
            .select('deleted_for')
            .eq('id', messageId)
            .single();

        if (error || !message) {
            return res.status(404).json({ success: false, message: "Pesan tidak ditemukan." });
        }

        let deletedFor = message.deleted_for ? JSON.parse(message.deleted_for) : [];
        if (!deletedFor.includes(userId)) deletedFor.push(userId);

        const { error: updateError } = await supabase
            .from('messages')
            .update({ deleted_for: JSON.stringify(deletedFor) })
            .eq('id', messageId);

        if (updateError) throw updateError;

        res.json({ success: true });
    } catch (err) {
        console.error("Error deleting message for user:", err);
        res.status(500).json({ success: false, message: "Kesalahan server." });
    }
});


app.delete("/api/chat/delete-for-me/:messageId", async (req, res) => {
    const { messageId } = req.params;

    try {
        console.log(`🔍 Mencoba menghapus pesan ${messageId} untuk user tertentu`);

        // Pastikan messageId adalah angka
        if (isNaN(messageId)) {
            console.error("❌ ID pesan tidak valid:", messageId);
            return res.status(400).json({ error: "ID pesan tidak valid" });
        }

        // Update pesan di Supabase
        const { data, error } = await supabase
            .from("messages")
            .update({ deleted_for_user: true }) // Pastikan kolom ini ada di database
            .eq("id", messageId)
            .select();

        if (error) {
            throw error;
        }

        if (!data || data.length === 0) {
            console.error(`❌ Pesan ${messageId} tidak ditemukan dalam database.`);
            return res.status(404).json({ error: "Pesan tidak ditemukan atau sudah dihapus" });
        }

        console.log(`✅ Pesan ${messageId} berhasil ditandai sebagai dihapus untuk user`);
        res.status(200).json({ message: "Pesan dihapus untuk saya" });

    } catch (error) {
        console.error("❌ ERROR saat menghapus pesan:", error.message);
        res.status(500).json({ error: "Gagal menghapus pesan", detail: error.message });
    }
});




app.delete('/api/chat/delete-for-everyone/:messageId', async (req, res) => { // Tambahkan async
    const { messageId } = req.params;

    try {
        const { error } = await supabase
            .from('messages')
            .delete()
            .eq('id', messageId);

        if (error) throw error; // Jika ada error, lempar ke catch

        res.json({ success: true });
    } catch (err) {
        console.error("Error deleting message:", err);
        res.status(500).json({ success: false, message: "Error deleting message." });
    }
});


// ====================
// == AUTHENTICATION ==
// ====================

app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ message: "Semua field harus diisi!" });
    }

    try {
        const hashedPassword = bcrypt.hashSync(password, 10);
        const { data, error } = await supabase
            .from('users')
            .insert([{ username, email, password: hashedPassword }])
            .select('id');

        if (error) throw error;
        res.json({ message: "Registrasi berhasil!", userId: data[0].id });
    } catch (err) {
        console.error("Kesalahan server:", err);
        res.status(500).json({ success: false, message: "Kesalahan server." });
    }
});

// Login User
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log("📌 Menerima permintaan login:", { email });

    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email dan password harus diisi." });
    }

    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .ilike('email', email.toLowerCase());

        if (error) throw error;
        if (!users || users.length === 0) {
            console.log("❌ User tidak ditemukan!");
            return res.status(404).json({ success: false, message: "User tidak ditemukan." });
        }

        const user = users[0];
        const isValidPassword = bcrypt.compareSync(password, user.password);
        if (!isValidPassword) {
            console.log("❌ Password salah.");
            return res.status(401).json({ success: false, message: "Password salah." });
        }

        // 🔹 Simpan sesi yang benar
        req.session.user = { id: user.id, username: user.username, email: user.email };
        console.log("✅ Sesi login berhasil:", req.session);

        req.session.save(err => {
            if (err) {
                console.error("❌ Gagal menyimpan sesi:", err);
                return res.status(500).json({ success: false, message: "Kesalahan server." });
            }
            res.json({ success: true, message: "Login berhasil!", username: user.username, redirect: "/users.html" });
        });

    } catch (err) {
        console.error("❌ Kesalahan server saat login:", err);
        res.status(500).json({ success: false, message: "Kesalahan server." });
    }
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
app.get('/api/users', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users') // Sesuaikan dengan nama tabel di Supabase
            .select('id, username');

        if (error) throw error;

        res.json(data);
    } catch (err) {
        console.error("Database Error:", err.message);
        res.status(500).json({ message: "Gagal mengambil data pengguna." });
    }
});

// ====================
// == CHAT ENDPOINTS ==
// ====================
app.use("/api/chat", chatRoutes);

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

console.log("DATABASE_URL:", process.env.DATABASE_URL);

// ==================
// == START SERVER ==
// ==================

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server berjalan di port ${PORT}`);
});
