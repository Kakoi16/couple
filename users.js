const sqlite3 = require('sqlite3').verbose();

// Buat atau buka database 'users.db'
const db = new sqlite3.Database('./chat.db', (err) => {
    if (err) {
        console.error("Gagal membuka database:", err.message);
    } else {
        console.log("Terhubung ke database SQLite.");
    }
});

// Buat tabel 'users' jika belum ada
db.serialize(() => {
    db.run(`-- Buat tabel untuk menyimpan pesan chat
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender TEXT NOT NULL,
    receiver TEXT NOT NULL,
    message TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

    )`, (err) => {
        if (err) {
            console.error("Gagal membuat tabel:", err.message);
        } else {
            console.log("Tabel users telah dibuat atau sudah ada.");
        }
    });
});

// Tutup koneksi database setelah selesai
db.close((err) => {
    if (err) {
        console.error("Gagal menutup database:", err.message);
    } else {
        console.log("Koneksi database ditutup.");
    }
});
