const { Server } = require('socket.io');

let io;
const userSockets = new Map(); // Map to store userId -> socketId

module.exports = {
    init: (httpServer) => {
        io = new Server(httpServer, {
            cors: {
                origin: '*', // Adjust to your allowed origins
                methods: ['GET', 'POST']
            }
        });

        io.on('connection', (socket) => {
            console.log('Client connected:', socket.id);

            // A client authenticates or joins their room
            socket.on('join', (userId) => {
                socket.join(`user_${userId}`);
                userSockets.set(userId, socket.id);
                console.log(`User ${userId} joined room user_${userId}`);
            });

            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
                // Remove from map
                for (const [userId, id] of userSockets.entries()) {
                    if (id === socket.id) {
                        userSockets.delete(userId);
                        break;
                    }
                }
            });
        });

        return io;
    },
    getIo: () => {
        if (!io) {
            throw new Error('Socket.io not initialized!');
        }
        return io;
    }
};
