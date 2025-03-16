const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const router = express.Router();

// Gunakan database yang sama
const db = new sqlite3.Database('./database.db');

// **Endpoint untuk menyimpan pesan**
router.post('/send', (req, res) => {
    const { sender, receiver, message } = req.body;

    if (!sender || !receiver || !message) {
        return res.status(400).json({ success: false, message: "Semua field harus diisi!" });
    }

    db.run(
        `INSERT INTO messages (sender, receiver, message, deletedFor) VALUES (?, ?, ?, ?)`,
        [sender, receiver, message, null],
        function (err) {
            if (err) {
                return res.status(500).json({ success: false, message: "Gagal menyimpan pesan." });
            }
            res.json({ success: true, message: "Pesan berhasil dikirim!" });
        }
    );
});

// **Endpoint untuk mengambil pesan antara dua pengguna**
router.get('/messages/:sender/:receiver', (req, res) => {
    const { sender, receiver } = req.params;

    db.all(
        `SELECT id, sender, message, timestamp FROM messages 
        WHERE ((sender = ? AND receiver = ?) OR (sender = ? AND receiver = ?))
        AND (deletedFor IS NULL OR NOT instr(deletedFor, ?))
        ORDER BY timestamp ASC`,
        [sender, receiver, receiver, sender, sender],
        (err, rows) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ success: false, message: "Gagal mengambil pesan." });
            }

            if (!Array.isArray(rows)) {
                console.error("Invalid data format:", rows);
                return res.status(500).json({ success: false, message: "Data tidak valid." });
            }

            res.json(rows);
        }
    );
});

// **Hapus Pesan untuk Saya Sendiri**
router.put('/delete-for-me/:messageId/:userId', (req, res) => {
    const { messageId, userId } = req.params;

    db.get("SELECT deletedFor FROM messages WHERE id = ?", [messageId], (err, row) => {
        if (err) return res.status(500).json({ success: false, message: "Error fetching message." });

        let deletedFor = row?.deletedFor ? JSON.parse(row.deletedFor) : [];
        if (!deletedFor.includes(userId)) deletedFor.push(userId);

        db.run("UPDATE messages SET deletedFor = ? WHERE id = ?", [JSON.stringify(deletedFor), messageId], (err) => {
            if (err) return res.status(500).json({ success: false, message: "Error deleting message for user." });
            res.json({ success: true });
        });
    });
});

// **Hapus Pesan untuk Semua**
router.delete('/delete-for-everyone/:messageId', (req, res) => {
    const { messageId } = req.params;

    db.run("DELETE FROM messages WHERE id = ?", [messageId], (err) => {
        if (err) return res.status(500).json({ success: false, message: "Error deleting message." });
        res.json({ success: true });
    });
});

module.exports = router;
