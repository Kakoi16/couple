module.exports = (io) => {
    io.on("connection", (socket) => {
        console.log("✅ User connected:", socket.id);

        socket.on("sendMessage", async (data) => {
            const { sender, receiver, message } = data;
            try {
                const { data: savedData, error } = await supabase.from('messages').insert([{ sender, receiver, message }]).select();
                if (error) throw error;
                const savedMessage = { id: savedData[0].id, sender, receiver, message };
                socket.emit("messageSaved", savedMessage);
                socket.to(receiver).emit("newMessage", savedMessage);
            } catch (error) {
                console.error("❌ Gagal menyimpan pesan:", error);
            }
        });

        socket.on("disconnect", () => console.log("❌ User disconnected:", socket.id));
    });
};
