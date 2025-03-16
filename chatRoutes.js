const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const router = express.Router();

// Koneksi ke database
const db = new sqlite3.Database('./chat.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err) console.error(err.message);
    else console.log("Connected to SQLite database.");
});

// API untuk mengambil chat antara dua pengguna
router.get('/messages/:sender/:receiver', (req, res) => {
    const { sender, receiver } = req.params;
    const sql = `SELECT * FROM messages 
                 WHERE (sender = ? AND receiver = ?) 
                    OR (sender = ? AND receiver = ?) 
                 ORDER BY timestamp ASC`;

    db.all(sql, [sender, receiver, receiver, sender], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});
router.delete("/delete/:sender/:receiver", async (req, res) => {  
    const { sender, receiver } = req.params;
    console.log(`DELETE request received for sender: ${sender}, receiver: ${receiver}`);

    if (!sender || !receiver) {
        return res.status(400).json({ success: false, message: "Sender atau receiver tidak valid." });
    }

    try {
        const { error } = await supabase
            .from("messages")
            .delete()
            .or(`and(sender.eq.${sender},receiver.eq.${receiver}),and(sender.eq.${receiver},receiver.eq.${sender})`);

        if (error) throw error;

        res.json({ success: true, message: "Chat berhasil dihapus." });
    } catch (error) {
        console.error("Error deleting chat:", error);
        res.status(500).json({ success: false, message: "Gagal menghapus chat.", error: error.message });
    }
});

// API untuk mengirim pesan
router.post('/messages', (req, res) => {
    const { sender, receiver, message } = req.body;

    if (!sender || !receiver || !message) {
        return res.status(400).json({ error: "All fields are required" });
    }

    const sql = `INSERT INTO messages (sender, receiver, message) VALUES (?, ?, ?)`;
    db.run(sql, [sender, receiver, message], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ id: this.lastID, sender, receiver, message, timestamp: new Date() });
    });
});

module.exports = router;
