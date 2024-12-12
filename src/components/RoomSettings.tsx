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
  import { User, Room } from '@/interfaces';
  import { Socket } from 'socket.io-client';
  import { useState } from 'react';
  
  interface RoomSettingsProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    room: Room | undefined;
    currentUser: User | null;
    socket: Socket;
  }
  
  export function RoomSettings({
    open,
    onOpenChange,
    room,
    currentUser,
    socket,
  }: RoomSettingsProps) {
    const [roomName, setRoomName] = useState(room?.name || '');
  
    const handleSave = () => {
      if (room && currentUser?.id === room.ownerId) {
        socket.emit('update-room', room.id, { name: roomName });
        onOpenChange(false);
      }
    };
  
    const handleDeleteRoom = () => {
      if (room && currentUser?.id === room.ownerId) {
        socket.emit('delete-room', room.id);
        onOpenChange(false);
      }
    };
  
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Room Settings</DialogTitle>
            <DialogDescription>
              Configure room settings and manage users
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="roomName">Room Name</Label>
              <Input
                id="roomName"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Enter room name"
              />
            </div>
          </div>
  
          <DialogFooter className="space-x-2">
            <Button variant="destructive" onClick={handleDeleteRoom}>
              Delete Room
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }