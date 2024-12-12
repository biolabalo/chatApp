import { NextApiRequest, NextApiResponse } from "next";
import { Server } from "socket.io";
import type { User, Room, Message } from "@/interfaces";

const rooms = new Map<string, Room>();

export const getRandomColor = () => {
  const colors = ["red", "blue", "green", "purple", "orange", "teal"];
  return colors[Math.floor(Math.random() * colors.length)];
};

export const getRandomAvatar = () => {
  return `https://api.dicebear.com/6.x/avataaars/svg?seed=${Math.random()}`;
};

const handleRoomOperation = (
  socket: any,
  io: Server,
  {
    username,
    roomId,
    operation,
  }: {
    username: string;
    roomId: string;
    operation: "create" | "join";
  },
  callback: (response: any) => void
) => {
  const room = rooms.get(roomId);

  if (operation === "create" && room) {
    return callback({ error: "Room already exists" });
  } else if (operation === "join" && !room) {
    return callback({ error: "Room does not exist" });
  }

  const user = {
    id: Math.random().toString(),
    username,
    avatar: getRandomAvatar(),
    color: getRandomColor(),
  };

  let updatedRoom;
  if (operation === "create") {
    updatedRoom = {
      id: roomId,
      name: `Room ${roomId}`,
      ownerId: user.id,
      users: [user],
      createdAt: new Date(),
      lastActivity: new Date(),
    };
    rooms.set(roomId, updatedRoom);
  } else {
    room?.users.push(user);
    updatedRoom = room;
  }

  socket.join(roomId);



  console.log("11111");
  socket.to(roomId).emit("room-state", updatedRoom);
  // socket.emit("room-state", updatedRoom);
  console.log("Emitted room-state event1"); // Debug log socket.emit("room-state", updatedRoom);
  console.log("Emitted room-state event2"); // Debug log

  // Notify room members
  io.to(roomId).emit("user-joined", {
    type: "notification",
    content: `${username} ${operation === "create" ? "created" : "joined"} the room`,
    username: "System",
    timestamp: new Date(),
    roomId,
  });


  callback({ success: true, user });
};

const SocketHandler = (req: NextApiRequest, res: NextApiResponse) => {
  if (res.socket?.server?.io) {
    return res.end();
  }

  const io = new Server(res.socket?.server, {
    path: "/api/socket",
  });
  res.socket.server.io = io;

  io.on("connection", (socket) => {
    socket.on("create-room", ({ username, roomId }, callback) => {
      handleRoomOperation(socket, io, { username, roomId, operation: "create" }, callback);
    });

    socket.on("join-room", ({ username, roomId }, callback) => {
      handleRoomOperation(socket, io, { username, roomId, operation: "join" }, callback);
    });

    socket.on("leave-room", (roomId: string, user: User) => {
      const room = rooms.get(roomId);
      if (room) {
        // Remove user from room
        room.users = room.users.filter((u) => u.id !== user.id);
        
        // Notify remaining users
        io.to(roomId).emit("user-left", {
          type: "notification",
          content: `${user.username} left the room`,
          username: "System",
          timestamp: new Date(),
          roomId,
        });

        // Handle room lifecycle
        if (room.users.length === 0) {
          rooms.delete(roomId);
          io.to(roomId).emit("room-deleted");
        } else if (room.ownerId === user.id) {
          // Transfer ownership to the next user
          room.ownerId = room.users[0].id;
          io.to(roomId).emit("owner-changed", room.ownerId);
        }

        socket.leave(roomId);
      }
    });

    socket.on("kick-user", (roomId: string, userId: string, ownerId: string) => {
      const room = rooms.get(roomId);
      if (room && room.ownerId === ownerId) {
        const user = room.users.find((u) => u.id === userId);
        if (user) {
          room.users = room.users.filter((u) => u.id !== userId);
          io.to(roomId).emit("user-kicked", userId);
          socket.to(roomId).emit("user-left", {
            type: "notification",
            content: `${user.username} was removed from the room`,
            username: "System",
            timestamp: new Date(),
            roomId,
          });
        }
      }
    });

    socket.on("update-room", (roomId: string, updates: Partial<Room>) => {
      const room = rooms.get(roomId);
      if (room) {
        Object.assign(room, updates);
        io.to(roomId).emit("room-updated", room);
      }
    });

    socket.on("delete-room", (roomId: string) => {
      if (rooms.has(roomId)) {
        rooms.delete(roomId);
        io.to(roomId).emit("room-deleted");
      }
    });

    socket.on("user-typing", (roomId: string, user: User, isTyping: boolean) => {
      socket.to(roomId).emit("typing-update", user.username, isTyping);
    });

    socket.on("send-message", (roomId: string, message: Message) => {
      const room = rooms.get(roomId);
      if (room) {
        room.lastActivity = new Date();
        io.to(roomId).emit("receive-message", message);
      }
    });
  });

  res.end();
};

export default SocketHandler;