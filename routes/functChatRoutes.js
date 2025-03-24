const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// Hapus pesan hanya untuk user tertentu
router.put('/chat/delete-for-me/:messageId/:userId', async (req, res) => {
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

// Hapus pesan untuk user tertentu
router.delete("/chat/delete-for-me/:messageId", async (req, res) => {
    const { messageId } = req.params;

    try {
        console.log(`🔍 Mencoba menghapus pesan ${messageId} untuk user tertentu`);

        if (isNaN(messageId)) {
            console.error("❌ ID pesan tidak valid:", messageId);
            return res.status(400).json({ error: "ID pesan tidak valid" });
        }

        const { data, error } = await supabase
            .from("messages")
            .update({ deleted_for_user: true })
            .eq("id", messageId)
            .select();

        if (error) throw error;
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

// Hapus pesan untuk semua user
router.delete('/chat/delete-for-everyone/:messageId', async (req, res) => {
    const { messageId } = req.params;

    try {
        const { error } = await supabase
            .from('messages')
            .delete()
            .eq('id', messageId);

        if (error) throw error;

        res.json({ success: true });
    } catch (err) {
        console.error("Error deleting message:", err);
        res.status(500).json({ success: false, message: "Error deleting message." });
    }
});

module.exports = router;
