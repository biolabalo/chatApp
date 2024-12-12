import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Room, Message } from '@/interfaces';

// Helper function to convert Map entries back to Map
const hydrateMap = (entries: [string, any][] = []): Map<string, any> => {
  return new Map(entries);
};

export const useChatStore = create(
  persist(
    (set, get) => ({
      currentUser: null as User | null,
      setCurrentUser: (user: User | null) => set({ currentUser: user }),
      
      rooms: new Map<string, Room>(),
      activeRoomId: null as string | null,
      setActiveRoom: (roomId: string) => {
        set({ activeRoomId: roomId });
        get().clearUnread(roomId);
      },
      addRoom: (room: Room) => set((state) =>  {
         console.log(' i am being called')
        return ({
          rooms: new Map(state.rooms).set(room.id, room)
        })
      }),
      removeRoom: (roomId: string) => set((state) => {
        const newRooms = new Map(state.rooms);
        newRooms.delete(roomId);
        return { rooms: newRooms };
      }),
      
      messages: new Map<string, Message[]>(),
      addMessage: (roomId: string, message: Message) => set((state) => {
        const roomMessages = state.messages.get(roomId) || [];
        const newMessages = new Map(state.messages);
        newMessages.set(roomId, [...roomMessages, message]);
        
        if (roomId !== state.activeRoomId) {
          get().incrementUnread(roomId);
        }
        
        return { messages: newMessages };
      }),
      
      typingUsers: new Map<string, Set<string>>(),
      setUserTyping: (roomId: string, username: string, isTyping: boolean) => set((state) => {
        const roomTyping = new Set(state.typingUsers.get(roomId) || []);
        if (isTyping) {
          roomTyping.add(username);
        } else {
          roomTyping.delete(username);
        }
        return {
          typingUsers: new Map(state.typingUsers).set(roomId, roomTyping)
        };
      }),
      
      unreadCounts: new Map<string, number>(),
      incrementUnread: (roomId: string) => set((state) => ({
        unreadCounts: new Map(state.unreadCounts).set(roomId, 
          (state.unreadCounts.get(roomId) || 0) + 1)
      })),
      clearUnread: (roomId: string) => set((state) => {
        const newCounts = new Map(state.unreadCounts);
        newCounts.delete(roomId);
        return { unreadCounts: newCounts };
      }),
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({ 
        currentUser: state.currentUser,
        rooms: Array.from(state.rooms.entries()),
        messages: Array.from(state.messages.entries()),
        unreadCounts: Array.from(state.unreadCounts.entries()),
      }),
      // Add hydration step
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        
        // Convert serialized arrays back to Maps
        state.rooms = hydrateMap(state.rooms);
        state.messages = hydrateMap(state.messages);
        state.unreadCounts = hydrateMap(state.unreadCounts);
        state.typingUsers = new Map(); // Reset typing users on reload
      },
    }
  )
);