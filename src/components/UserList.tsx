import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User, Room } from '@/interfaces';
import { Socket } from 'socket.io-client';
import { X } from 'lucide-react';

interface UserListProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: Room | undefined;
  currentUser: User | null;
  socket: Socket;
}

export function UserList({
  open,
  onOpenChange,
  room,
  currentUser,
  socket,
}: UserListProps) {
  const isOwner = currentUser?.id === room?.ownerId;

  const handleKickUser = (userId: string) => {
    if (room && isOwner) {
      socket.emit('kick-user', room.id, userId, currentUser?.id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Users in Room</DialogTitle>
          <DialogDescription>
            {room?.users.length} users currently in the room
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {room?.users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-2 rounded-lg bg-muted"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-primary" />
                  <div>
                    <p className="font-medium">
                      {user.username}
                      {user.id === room.ownerId && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (Owner)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                {isOwner && user.id !== currentUser?.id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleKickUser(user.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}