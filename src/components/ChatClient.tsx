"use client";

import { io, Socket } from "socket.io-client";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  LogOut,
  Send,
  Copy,
  Plus,
  MessageSquare,
  Users,
  Settings,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useChatStore } from "@/store/chatStore";
import { UserList } from "@/components/UserList";
import { RoomSettings } from "@/components/RoomSettings";
import { JoinRoomModal } from "@/components/JoinRoomModal";
import { Message, User, Room } from "@/interfaces";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSocket } from "@/contexts/SocketContext";

export default function ChatClient() {
  const { socket, isConnected } = useSocket();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [showJoinRoom, setShowJoinRoom] = useState(false);

  const roomId = params.roomId as string;

  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    currentUser,
    rooms,
    activeRoomId,
    messages,
    typingUsers,
    unreadCounts,
    setActiveRoom,
    addMessage,
    setUserTyping,
    addRoom,
    removeRoom,
  } = useChatStore();

  const [message, setMessage] = useState("");

  const [showUserList, setShowUserList] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (!roomId || !currentUser) {
      router.push("/");
      return;
    }
  }, [roomId, currentUser]);

  // In ChatClient.tsx
  useEffect(() => {
    if (!socket || !isConnected) return;

    const cleanup = () => {
      socket.off("room-state");
      socket.off("receive-message");
      socket.off("typing-update");
      socket.off("user-joined");
      socket.off("user-left");
      socket.off("room-deleted");
      socket.off("user-kicked");
    };

 

    // Setup listeners
    const setupListeners = () => {
      socket.on("room-state", (room: Room) => {
        console.log("Room state received:", room); // Debug log
        addRoom(room);
        setActiveRoom(room.id);
      });

      socket.on("receive-message", (msg: Message) => addMessage(roomId, msg));
      socket.on("typing-update", (username: string, isTyping: boolean) => {
        setUserTyping(roomId, username, isTyping);
      });
      socket.on("user-joined", (msg: Message) => addMessage(roomId, msg));
      socket.on("user-left", (msg: Message) => addMessage(roomId, msg));
      socket.on("room-deleted", () => {
        removeRoom(roomId);
        router.push("/");
      });
      socket.on("user-kicked", (userId: string) => {
        if (currentUser?.id === userId) router.push("/");
      });
    };

    setupListeners();

    return () => {
      cleanup();
    };
  }, [socket, isConnected]); // Only depend on socket and connection status

  let typingTimeout: NodeJS.Timeout;
  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);

    // Clear any existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    if (socket && currentUser && isConnected) {
      socket.emit("user-typing", roomId, currentUser, message.length > 0);

      // Automatically clear typing status after 2 seconds of no changes
      typingTimeout = setTimeout(() => {
        socket.emit("user-typing", roomId, currentUser, false);
      }, 2000);
    }
  };

  const sendMessage = () => {
    if (!message.trim() || !currentUser) return;

    const newMessage: Message = {
      id: Math.random().toString(),
      type: "chat",
      content: message,
      username: currentUser.username,
      timestamp: new Date(),
      roomId,
    };

    socket.emit("send-message", roomId, newMessage);
    setMessage("");
  };

  const leaveRoom = () => {
    if (socket && currentUser) {
      socket.emit("leave-room", roomId, currentUser);
    }
    router.push("/");
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    toast({
      title: "Room ID copied!",
      description: "Share this with others to join the chat.",
    });
  };

  const currentRoom = rooms.get(roomId);
  const roomMessages = messages.get(roomId) || [];
  const currentTypingUsers = Array.from(typingUsers.get(roomId) || []).filter(
    (username) => username !== currentUser?.username
  );

  console.log(Array.from(rooms.values()), ".......", rooms);
  return (
    <div className="h-[calc(100vh)]">
      <div className="grid grid-cols-12 h-full">
        {/* Sidebar */}
        <Card className="col-span-3 flex flex-col h-full rounded-none">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-lg mb-4">Your Chats</h2>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => setShowJoinRoom(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Join New Room
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2">
              {Array.from(rooms.values()).map((room) => (
                <div key={room?.id}>
                  <Button
                    variant={room?.id === activeRoomId ? "secondary" : "ghost"}
                    className="w-full justify-start mb-1"
                    onClick={() => router.push(`/chat/${room?.id}`)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    <span className="flex-1 text-left">{room?.name}</span>
                    {unreadCounts.get(room?.id) ? (
                      <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                        {unreadCounts.get(room?.id)}
                      </span>
                    ) : null}
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
          <Separator />
          <div className="p-4">
            <div className="flex items-center space-x-2">
              <div className="flex-1">
                <p className="text-sm font-medium">Logged in as:</p>
                <p className="text-sm text-muted-foreground">
                  {currentUser?.username}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={leaveRoom}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Main Chat Area */}
        <Card className="col-span-9 flex flex-col h-full rounded-none">
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h2 className="text-2xl font-bold">
                  {currentRoom?.name || "Chat Room"}
                </h2>
                <div className="flex items-center space-x-2">
                  <code className="text-sm text-muted-foreground">
                    {roomId}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={copyRoomId}
                    className="h-8 w-8"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowUserList(true)}
              >
                <Users className="h-5 w-5" />
              </Button>
              {currentRoom?.ownerId === currentUser?.id && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSettings(true)}
                >
                  <Settings className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>

          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {roomMessages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col ${
                    msg.username === currentUser?.username
                      ? "items-end"
                      : "items-start"
                  }`}
                >
                  {msg.type === "notification" ? (
                    <div className="bg-muted px-3 py-2 rounded-md text-sm text-muted-foreground">
                      {msg.content}
                    </div>
                  ) : (
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.username === currentUser?.username
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <p className="font-semibold text-sm">
                          {msg.username === currentUser?.username
                            ? "You"
                            : msg.username}
                        </p>
                        <span className="text-xs opacity-70">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="mt-1">{msg.content}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Typing Indicator */}
            <AnimatePresence>
              {currentTypingUsers.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="text-sm text-muted-foreground mt-2"
                >
                  {currentTypingUsers.join(", ")}{" "}
                  {currentTypingUsers.length === 1 ? "is" : "are"} typing...
                </motion.div>
              )}
            </AnimatePresence>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <Input
                value={message}
                onChange={handleMessageChange}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type your message..."
                className="flex-1 h-14"
              />
              <Button onClick={sendMessage} className="h-14">
                <Send className="h-4 w-4 mr-2" />
                Send
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Modals */}
      <UserList
        open={showUserList}
        onOpenChange={setShowUserList}
        room={currentRoom}
        currentUser={currentUser}
        socket={socket}
      />

      <RoomSettings
        open={showSettings}
        onOpenChange={setShowSettings}
        room={currentRoom}
        currentUser={currentUser}
        socket={socket}
      />

      <JoinRoomModal
        open={showJoinRoom}
        onOpenChange={setShowJoinRoom}
        onRoomJoined={(roomId) => {
          router.push(`/chat/${roomId}`);
          setShowJoinRoom(false);
        }}
      />
    </div>
  );
}
