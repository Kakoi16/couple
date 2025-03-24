const http = require('http');
const { Server } = require('socket.io');
const sessionMiddleware = require('./config/session');

const express = require('express');
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'https://couple-production.up.railway.app',
        credentials: true
    }
});

io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
});

io.on("connection", (socket) => {
    console.log("✅ User connected:", socket.id);
    
    socket.on("disconnect", () => {
        console.log("❌ User disconnected:", socket.id);
    });
});

module.exports = { server, io };
