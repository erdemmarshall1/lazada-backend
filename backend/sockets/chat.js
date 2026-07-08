const Message = require('../models/Message');

module.exports = (server) => {
  const { Server } = require('socket.io');
  const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  const userSockets = new Map();

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join', (data) => {
      const { userId, shopId } = data;
      if (userId) {
        userSockets.set(userId.toString(), socket.id);
        socket.join(`user_${userId}`);
      }
      if (shopId) {
        socket.join(`shop_${shopId}`);
      }
      socket.join(`all`);
    });

    socket.on('sendMessage', async (data) => {
      try {
        const { fromUserId, toUserId, shopId, content, type, sessionId } = data;
        const msg = await Message.create({
          fromUserId, toUserId, shopId,
          content, type: type || 'text', sessionId,
        });
        const populatedMsg = await Message.findById(msg._id).populate('fromUserId', 'username avatar');
        if (toUserId) {
          io.to(`user_${toUserId}`).emit('newMessage', populatedMsg);
        }
        if (shopId) {
          io.to(`shop_${shopId}`).emit('newMessage', populatedMsg);
        }
        io.to(`user_${fromUserId}`).emit('newMessage', populatedMsg);
        socket.emit('messageSent', populatedMsg);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('markRead', async (data) => {
      try {
        const { sessionId, userId } = data;
        await Message.updateMany(
          { sessionId, toUserId: userId, isRead: false },
          { isRead: true, readAt: new Date() }
        );
        io.to(`user_${userId}`).emit('messagesRead', { sessionId });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('typing', (data) => {
      const { toUserId, shopId } = data;
      if (toUserId) {
        io.to(`user_${toUserId}`).emit('userTyping', { userId: data.fromUserId });
      }
      if (shopId) {
        io.to(`shop_${shopId}`).emit('userTyping', { userId: data.fromUserId });
      }
    });

    socket.on('disconnect', () => {
      for (const [userId, socketId] of userSockets.entries()) {
        if (socketId === socket.id) {
          userSockets.delete(userId);
          break;
        }
      }
      console.log('User disconnected:', socket.id);
    });
  });

  io.sendNotification = (userId, notification) => {
    io.to(`user_${userId}`).emit('notification', notification);
  };

  return io;
};
