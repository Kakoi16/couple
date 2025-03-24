const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Simpan lokasi pengguna
router.post('/locations', async (req, res) => {
    console.log("\ud83d\udccc Menerima request POST ke /api/locations");
    console.log("\ud83d\udd0d Header:", req.headers);
    console.log("\ud83d\udd0d Body:", req.body);
    console.log("\ud83d\udd0d Session:", req.session);

    if (!req.session || !req.session.user) {
        console.log("\u274c Unauthorized: Session tidak ditemukan");
        return res.status(401).json({ message: "Unauthorized! Silakan login dulu." });
    }

    const user_id = req.session.user.id;
    let { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
        return res.status(400).json({ message: "Latitude dan Longitude diperlukan!" });
    }

    latitude = Number(latitude);
    longitude = Number(longitude);

    if (isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({ message: "Latitude dan Longitude harus berupa angka!" });
    }

    try {
        const { error } = await supabase
            .from("user_locations")
            .upsert([
                {
                    user_id,
                    latitude,
                    longitude,
                    updated_at: new Date().toISOString(),
                },
            ]);

        if (error) throw error;

        console.log("\u2705 Lokasi pengguna diperbarui!");
        res.status(200).json({ success: true, message: "Lokasi berhasil diperbarui!" });
    } catch (err) {
        console.error("\u274c Gagal menyimpan lokasi:", err);
        res.status(500).json({ success: false, message: "Kesalahan server." });
    }
});

// Ambil semua lokasi pengguna
router.get('/locations', async (req, res) => {
    console.log("\ud83d\udccc Menerima request GET ke /api/locations");

    try {
        const { data, error } = await supabase
            .from("user_locations")
            .select("user_id, latitude, longitude");

        if (error) throw error;

        console.log("\u2705 Data lokasi pengguna:", data);
        res.status(200).json(data);
    } catch (err) {
        console.error("\u274c Gagal mengambil lokasi pengguna:", err);
        res.status(500).json({ message: "Kesalahan server." });
    }
});

module.exports = router;
