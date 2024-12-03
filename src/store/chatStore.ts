import { create } from 'zustand';

interface Message {
  message: string;
  username: string;
  timestamp: Date;
}

interface ChatStore {
  username: string;
  messages: Message[];
  setUsername: (username: string) => void;
  addMessage: (message: Message) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  username: '',
  messages: [],
  setUsername: (username) => set({ username }),
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  clearMessages: () => set({ messages: [] }),
}));
