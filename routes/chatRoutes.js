const express = require('express');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { require: true, rejectUnauthorized: false },
  });
const router = express.Router();

// **Endpoint untuk menyimpan pesan**
router.post('/send', async (req, res) => {
    const { sender, receiver, message } = req.body;

    if (!sender || !receiver || !message) {
        return res.status(400).json({ success: false, message: "Semua field harus diisi!" });
    }

    try {
        await pool.query(
            `INSERT INTO messages (sender, receiver, message, deleted_for) VALUES ($1, $2, $3, $4)`,
            [sender, receiver, message, null]
        );
        res.json({ success: true, message: "Pesan berhasil dikirim!" });
    } catch (error) {
        console.error("Gagal menyimpan pesan:", error);
        res.status(500).json({ success: false, message: "Gagal menyimpan pesan." });
    }
});

// **Endpoint untuk mengambil pesan antara dua pengguna**
router.get('/messages/:sender/:receiver', async (req, res) => {
    const { sender, receiver } = req.params;

    try {
        const result = await pool.query(
            `SELECT id, sender, receiver, message, timestamp 
             FROM messages 
             WHERE ((sender = $1 AND receiver = $2) OR (sender = $2 AND receiver = $1))
             AND NOT COALESCE(deleted_for, '{}') @> ARRAY[$1]
             ORDER BY timestamp ASC`,
            [sender, receiver]
        );
        res.json(result.rows);
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ success: false, message: "Gagal mengambil pesan." });
    }
});


// **Hapus Pesan untuk Saya Sendiri**
router.put('/delete-for-me/:messageId/:userId', async (req, res) => {
    const { messageId, userId } = req.params;

    try {
        const result = await pool.query("SELECT deleted_for FROM messages WHERE id = $1", [messageId]);
        let deletedFor = result.rows[0]?.deleted_for || [];
        if (!deletedFor.includes(userId)) deletedFor.push(userId);

        await pool.query("UPDATE messages SET deleted_for = $1 WHERE id = $2", [deletedFor, messageId]);
        res.json({ success: true });
    } catch (error) {
        console.error("Error deleting message for user:", error);
        res.status(500).json({ success: false, message: "Error deleting message for user." });
    }
});

// **Hapus Pesan untuk Semua**
router.delete('/delete-for-everyone/:messageId', async (req, res) => {
    const { messageId } = req.params;

    try {
        await pool.query("DELETE FROM messages WHERE id = $1", [messageId]);
        res.json({ success: true });
    } catch (error) {
        console.error("Error deleting message:", error);
        res.status(500).json({ success: false, message: "Error deleting message." });
    }
});

module.exports = router;
