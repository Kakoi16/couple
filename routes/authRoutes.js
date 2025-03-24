const express = require('express');
const bcrypt = require('bcryptjs');
const supabase = require('../config/supabase'); // Tanpa `{}`!


const router = express.Router();

// Register User
router.post('/register', async (req, res) => {
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
router.post('/login', async (req, res) => {
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

// Cek Autentikasi
router.get('/api/auth/check', (req, res) => {
    if (req.session.user) {
        res.json({ authenticated: true, user: req.session.user });
    } else {
        res.json({ authenticated: false });
    }
});

// Logout User
router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ message: "Gagal logout." });
        res.json({ success: true, message: "Logout berhasil!" });
    });
});

// Ambil Semua Pengguna
router.get('/api/users', async (req, res) => {
    try {
        let { data, error } = await supabase.from("users").select("id, username");
        
        if (error) throw error;
        
        res.json(data);
    } catch (err) {
        console.error("❌ Error mengambil pengguna:", err);
        res.status(500).json({ message: "Gagal mengambil pengguna" });
    }
});

module.exports = router;
