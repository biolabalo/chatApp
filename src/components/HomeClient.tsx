"use client";
import { useSocket } from "@/contexts/SocketContext";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { MessageSquarePlus, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CreateRoomResponse } from "@/interfaces";
import { useChatStore } from "@/store/chatStore"; // Add this import
import { useEffect } from "react";

export default function HomeClient() {
  const { socket, isConnected } = useSocket();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const setCurrentUser = useChatStore((state) => state?.setCurrentUser);

  const handleError = (error: string) => {
    setIsLoading(false);
    alert(error);
  };

  const validateInputs = (checkRoom = false) => {
    if (!username.trim() || username.length > 50) {
      handleError("Username must be between 1 and 50 characters");
      return false;
    }

    if (checkRoom && (!roomId.trim() || !/^[a-zA-Z0-9-]+$/.test(roomId))) {
      handleError("Room ID must contain only letters, numbers, and hyphens");
      return false;
    }

    return true;
  };

  const handleRoomAction = async (action: "create-room" | "join-room") => {
    if (!validateInputs(true) || !socket || !isConnected) return;

    setIsLoading(true);
    socket.emit(
      action,
      { username, roomId },
      (response: CreateRoomResponse) => {
        if (response.error) {
          handleError(response.error);
        } else if (response.user) {
          // Add check for user in response
          setCurrentUser(response.user); // Set the current user
          setIsLoading(false);
          router.push(`/chat/${roomId}`);
        } else {
          handleError("Failed to create user");
        }
      }
    );
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">
            Welcome to JoyRoom
          </CardTitle>
          <CardDescription>
            Create a new room or join an existing one to start chatting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={50}
              className="w-full"
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="roomId">Room ID</Label>
            <Input
              id="roomId"
              placeholder="Enter room ID to join"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full"
              disabled={isLoading}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          {isConnected ? (
            <>
              <Button
                onClick={() => handleRoomAction("create-room")}
                className="w-full"
                variant="default"
                size="lg"
                disabled={isLoading}
              >
                <MessageSquarePlus className="mr-2 h-5 w-5" />
                {isLoading ? "Creating..." : "Create New Room"}
              </Button>
              <Button
                onClick={() => handleRoomAction("join-room")}
                className="w-full"
                variant="secondary"
                size="lg"
                disabled={isLoading}
              >
                <LogIn className="mr-2 h-5 w-5" />
                {isLoading ? "Joining..." : "Join Existing Room"}
              </Button>
            </>
          ) : (
            <p>Establishing socket connection.....</p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
