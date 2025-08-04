import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Send, X, MessageCircle, Minimize2, Maximize2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import ReactMarkdown from 'react-markdown';
import { cn } from "@/lib/utils";
import { useChatContext } from "@/contexts/chat-context";

interface ChatPopupProps {
  conversationId?: string;
  context?: {
    page: string;
    quoteId?: string;
    bookingId?: string;
    currentStep?: string;
  };
  initialMessage?: string;
}

export function ChatPopup({ conversationId: propsConversationId, context, initialMessage }: ChatPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { conversationId: contextConversationId, setConversationId } = useChatContext();
  
  // Use conversation ID from props, context, or state
  const currentConversationId = propsConversationId || contextConversationId;

  // Get conversation history
  const { data: messages = [], isLoading } = useQuery<any[]>({
    queryKey: [`/api/chat/conversations/${currentConversationId}/messages`],
    enabled: !!currentConversationId,
  });

  // Create new conversation if needed
  useEffect(() => {
    if (!currentConversationId && isOpen) {
      apiRequest("POST", "/api/chat/conversations", {})
        .then(res => res.json())
        .then(data => setConversationId(data.id));
    }
  }, [currentConversationId, isOpen, setConversationId]);

  // Show initial message if provided
  useEffect(() => {
    if (initialMessage && isOpen && !messages.length) {
      sendMessage(initialMessage);
    }
  }, [initialMessage, isOpen, messages.length]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      const response = await apiRequest("POST", "/api/chat", {
        message: messageText,
        conversationId: currentConversationId,
        context: context
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/chat/conversations/${currentConversationId}/messages`] 
      });
      setMessage("");
    }
  });

  const sendMessage = (text: string) => {
    if (!text.trim() || !currentConversationId) return;
    sendMessageMutation.mutate(text);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(message);
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Show notification dot when there are unread messages
  const hasUnreadMessages = messages.some((msg: any) => 
    msg.role === 'assistant' && !msg.read
  );

  return (
    <>
      {/* Floating chat button */}
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg z-40",
          "bg-primary-600 hover:bg-primary-700 text-white",
          "transition-all duration-300 hover:scale-110"
        )}
        style={{ display: isOpen ? 'none' : 'flex' }}
      >
        <MessageCircle className="h-6 w-6" />
        {hasUnreadMessages && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        )}
      </Button>

      {/* Chat popup */}
      {isOpen && (
        <Card className={cn(
          "fixed z-50 shadow-2xl transition-all duration-300",
          isMinimized ? "bottom-6 right-6 w-80 h-14" : "bottom-6 right-6 w-96 h-[600px]",
          "flex flex-col"
        )}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-primary-600 text-white rounded-t-lg">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5" />
              <span className="font-semibold">Shipping Assistant</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-white hover:bg-primary-700 p-1"
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-primary-700 p-1"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Context indicator */}
              {context && (
                <div className="bg-blue-50 px-4 py-2 text-sm text-blue-700 border-b">
                  📍 {context.page === 'quote' && 'Viewing your quote details'}
                  {context.page === 'booking' && `Booking step: ${context.currentStep || 'Details'}`}
                  {context.page === 'tracking' && 'Tracking your shipment'}
                </div>
              )}

              {/* Messages */}
              <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
                {isLoading && (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                )}
                
                {messages.map((msg: any, index: number) => (
                  <div
                    key={msg.id || index}
                    className={cn(
                      "mb-4",
                      msg.role === 'user' ? 'text-right' : 'text-left'
                    )}
                  >
                    <div
                      className={cn(
                        "inline-block max-w-[85%] rounded-lg px-4 py-2",
                        msg.role === 'user'
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      )}
                    >
                      {msg.role === 'assistant' ? (
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm">{msg.content}</p>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                ))}

                {sendMessageMutation.isPending && (
                  <div className="text-left mb-4">
                    <div className="inline-block bg-gray-100 rounded-lg px-4 py-2">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </ScrollArea>

              {/* Input form */}
              <form onSubmit={handleSubmit} className="p-4 border-t">
                <div className="flex space-x-2">
                  <Input
                    ref={inputRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ask about your shipment..."
                    className="flex-1"
                    disabled={sendMessageMutation.isPending}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!message.trim() || sendMessageMutation.isPending}
                    className="bg-primary-600 hover:bg-primary-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </>
          )}
        </Card>
      )}
    </>
  );
}