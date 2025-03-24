const { Server } = require('socket.io');
const { createServer } = require('http');
const sessionMiddleware = require('./session');
const supabase = require('../config/supabase');

function setupWebSocket(app) {
    const server = createServer(app);
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

        socket.on("sendMessage", async (data) => {
            const { sender, receiver, message } = data;
            try {
                const { data: savedData, error } = await supabase
                    .from('messages')
                    .insert([{ sender, receiver, message }])
                    .select();

                if (error) throw error;

                const messageId = savedData[0].id;
                const savedMessage = { id: messageId, sender, receiver, message };

                socket.emit("messageSaved", savedMessage);
                socket.to(receiver).emit("newMessage", savedMessage);
            } catch (error) {
                console.error("❌ Gagal menyimpan pesan:", error);
            }
        });

        socket.on("disconnect", () => {
            console.log("❌ User disconnected:", socket.id);
        });
    });

    return { server, io };
}

module.exports = setupWebSocket;
