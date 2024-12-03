import { NextApiRequest, NextApiResponse } from 'next';
import { Server } from 'socket.io';

const SocketHandler = (req: NextApiRequest, res: NextApiResponse) => {
  if (res.socket?.server?.io) {
    return res.end();
  }

  const io = new Server(res.socket?.server, {
    path: '/api/socket',
  });
  res.socket.server.io = io;

  io.on('connection', (socket) => {
    socket.on('join-room', (roomId, username) => {
      socket.join(roomId);
      socket.to(roomId).emit('user-joined', username);
    });

    socket.on('send-message', (roomId, message, username) => {
      io.to(roomId).emit('receive-message', {
        message,
        username,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('leave-room', (roomId) => {
      socket.leave(roomId);
    });
  });

  res.end();
};

export default SocketHandler;
