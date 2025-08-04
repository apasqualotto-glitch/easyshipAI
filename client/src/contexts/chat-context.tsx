import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ChatContextType {
  conversationId: string | null;
  setConversationId: (id: string | null) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [conversationId, setConversationId] = useState<string | null>(null);

  return (
    <ChatContext.Provider value={{ conversationId, setConversationId }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}