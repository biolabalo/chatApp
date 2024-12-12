export interface User {
    id: string;
    username: string;
    avatar: string;
    color: string;
  }
  
  export interface Room {
    id: string;
    name: string;
    ownerId: string;
    users: User[];
    createdAt: Date;
    lastActivity: Date;
  }
  
  export interface Message {
    id: string;
    type: 'chat' | 'system' | 'notification';
    content: string;
    username: string;
    timestamp: Date;
    roomId: string;
  }
  
  export interface ChatStore {
    // User state
    currentUser: User | null;
    setCurrentUser: (user: User) => void;
    
    // Rooms state
    rooms: Map<string, Room>;
    activeRoomId: string | null;
    setActiveRoom: (roomId: string) => void;
    addRoom: (room: Room) => void;
    removeRoom: (roomId: string) => void;
    
    // Messages state
    messages: Map<string, Message[]>;
    addMessage: (roomId: string, message: Message) => void;
    clearMessages: (roomId: string) => void;
    
    // Typing indicator state
    typingUsers: Map<string, Set<string>>;
    setUserTyping: (roomId: string, username: string, isTyping: boolean) => void;
    
    // Unread counts
    unreadCounts: Map<string, number>;
    incrementUnread: (roomId: string) => void;
    clearUnread: (roomId: string) => void;
  }
  

  export interface CreateRoomResponse {
    error?: string; 
    success?: boolean; 
    user?: User; 
  }