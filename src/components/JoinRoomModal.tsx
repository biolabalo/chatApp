import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSocket } from '@/contexts/SocketContext';
import { useChatStore } from '@/store/chatStore';
import { CreateRoomResponse } from '@/interfaces';

interface JoinRoomModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRoomJoined: (roomId: string) => void;
}

export function JoinRoomModal({ open, onOpenChange, onRoomJoined }: JoinRoomModalProps) {
  const { socket, isConnected } = useSocket();
  const currentUser = useChatStore((state) => state.currentUser);
  const [roomId, setRoomId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRoomAction = async (action: 'create-room' | 'join-room') => {
    if (!roomId.trim() || !/^[a-zA-Z0-9-]+$/.test(roomId)) {
      setError('Room ID must contain only letters, numbers, and hyphens');
      return;
    }

    if (!socket || !isConnected || !currentUser) {
      setError('Connection not available');
      return;
    }

    setIsLoading(true);
    setError('');

    socket.emit(
      action,
      { username: currentUser.username, roomId },
      (response: CreateRoomResponse) => {
        setIsLoading(false);
        if (response.error) {
          setError(response.error);
        } else {
          onOpenChange(false);
          onRoomJoined(roomId);
          setRoomId('');
        }
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join or Create Room</DialogTitle>
          <DialogDescription>
            Enter a room ID to join an existing room or create a new one
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="roomId">Room ID</Label>
            <Input
              id="roomId"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Enter room ID"
              disabled={isLoading}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            onClick={() => handleRoomAction('create-room')}
            disabled={isLoading}
          >
            Create New Room
          </Button>
          <Button
            onClick={() => handleRoomAction('join-room')}
            variant="secondary"
            disabled={isLoading}
          >
            Join Existing Room
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}