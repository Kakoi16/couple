const express = require('express');
const path = require('path');
const router = express.Router();

router.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../public", "index.html"));
});

router.get("/maps", (req, res) => {
    res.sendFile(path.join(__dirname, "../public", "maps.html"));
});

router.get("/registered", (req, res) => {
    res.sendFile(path.join(__dirname, "../public", "register.html"));
});

router.get("/users", (req, res) => {
    console.log("Session di halaman users:", req.session.user);
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: "Silakan login terlebih dahulu." });
    }
    res.sendFile(path.join(__dirname, "../public", "users.html"));
});

module.exports = router;
