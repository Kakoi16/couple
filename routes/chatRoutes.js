const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();


// Inisialisasi Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// **Endpoint untuk mengirim pesan**
router.post("/send", async (req, res) => {
    const { sender, receiver, message } = req.body;

    if (!sender || !receiver || !message) {
        return res.status(400).json({ success: false, message: "Semua field harus diisi!" });
    }

    try {
        const { data, error } = await supabase
            .from("messages")
            .insert([{ sender, receiver, message, deleted_for: [] }]);

        if (error) throw error;

        res.json({ success: true, message: "Pesan berhasil dikirim!", data });
    } catch (error) {
        console.error("Gagal menyimpan pesan:", error);
        res.status(500).json({ success: false, message: "Gagal menyimpan pesan." });
    }
});

// Ambil pesan antara dua pengguna
router.get('/chat/messages/:sender/:receiver', async (req, res) => {
    const { sender, receiver } = req.params;

    console.log(`Mencari pesan antara ${sender} dan ${receiver}`);

    if (!sender || !receiver) {
        return res.status(400).json({ success: false, message: "Sender atau receiver tidak valid." });
    }

    try {
        const { data, error } = await supabase
    .from("messages")
    .select("*")
    .or(`and(sender.eq.${sender},receiver.eq.${receiver}),and(sender.eq.${receiver},receiver.eq.${sender})`)
    .order("created_at", { ascending: true });
    if (error) {
        console.error("❌ ERROR: Gagal mengambil pesan dari database!", error);
        return res.status(500).json({ success: false, message: "Gagal mengambil pesan.", error: error.message });
    }
    

        res.json(data);
    } catch (err) {
        console.error("Server error:", err);
        res.status(500).json({ success: false, message: "Terjadi kesalahan server." });
    }
});



// **Hapus Pesan untuk Saya Sendiri**
router.put("/delete-for-me/:messageId/:userId", async (req, res) => {
    const { messageId, userId } = req.params;

    try {
        // Ambil pesan untuk mendapatkan daftar `deleted_for`
        const { data: message, error: fetchError } = await supabase
            .from("messages")
            .select("deleted_for")
            .eq("id", messageId)
            .single();

        if (fetchError) throw fetchError;

        let deletedFor = message.deleted_for || [];
        if (!deletedFor.includes(userId)) deletedFor.push(userId);

        // Update pesan dengan daftar `deleted_for` yang baru
        const { error: updateError } = await supabase
            .from("messages")
            .update({ deleted_for: deletedFor })
            .eq("id", messageId);

        if (updateError) throw updateError;

        res.json({ success: true });
    } catch (error) {
        console.error("Error deleting message for user:", error);
        res.status(500).json({ success: false, message: "Error deleting message for user." });
    }
});

// **Hapus Pesan untuk Semua**
router.delete("/delete-for-everyone/:messageId", async (req, res) => {
    const { messageId } = req.params;

    try {
        const { error } = await supabase
            .from("messages")
            .delete()
            .eq("id", messageId);

        if (error) throw error;

        res.json({ success: true });
    } catch (error) {
        console.error("Error deleting message:", error);
        res.status(500).json({ success: false, message: "Error deleting message." });
    }
});
// **Hapus semua pesan antara dua pengguna**
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


module.exports = router;
