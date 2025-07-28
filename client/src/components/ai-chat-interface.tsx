import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";

import { 
  MessageSquare, 
  Send, 
  ChevronDown, 
  ChevronUp, 
  Bot, 
  User, 
  Loader2,
  Ship,
  FileText,
  HelpCircle,
  BookOpen,
  Calculator
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatInterfaceProps {
  className?: string;
  context?: string; // Current page context for better AI responses
  onExtractedData?: (data: Partial<any>) => void; // Callback for extracted shipping data
}

// Predefined quick questions for first-time users
const QUICK_QUESTIONS = [
  {
    icon: Ship,
    question: "What is the difference between FOB and CIF?",
    category: "Incoterms"
  },
  {
    icon: FileText,
    question: "What documents do I need for customs clearance?",
    category: "Documentation"
  },
  {
    icon: HelpCircle,
    question: "How long does sea freight from China take?",
    category: "Shipping"
  },
  {
    icon: BookOpen,
    question: "Explain customs duties and VAT for imports",
    category: "Customs"
  }
];

export function AIChatInterface({ className, context, onExtractedData }: AIChatInterfaceProps) {
  const [isExpanded, setIsExpanded] = useState(true); // Always expanded on calculator page
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: context === "calculator" 
        ? "👋 Hi! I'm your shipping assistant. Tell me about your shipment (like 'I need to ship shoes from New York to Cape Town') and I'll automatically fill in the calculator form below for you!"
        : "👋 Welcome to EasyShip AI! I'm here to help you understand container shipping, customs, and Incoterms in simple terms. What would you like to know?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Extract helper functions
  const getOriginPortCode = (msg: string) => {
    const lower = msg.toLowerCase();
    if (lower.includes('new york') || lower.includes('usa') || lower.includes('america')) return 'USNYC'; // New York, USA
    if (lower.includes('los angeles')) return 'USLAX'; // Los Angeles, USA  
    if (lower.includes('china') || lower.includes('shanghai')) return 'CNSHA'; // Shanghai, China
    if (lower.includes('europe') || lower.includes('germany') || lower.includes('hamburg')) return 'DEHAM'; // Hamburg, Germany
    if (lower.includes('india') || lower.includes('mumbai')) return 'INMUN'; // Mumbai, India
    return ''; // no default
  };

  const getDestinationPortCode = (msg: string) => {
    const lower = msg.toLowerCase();
    if (lower.includes('cape town')) return 'ZACPT'; // Cape Town
    if (lower.includes('durban')) return 'ZADUR'; // Durban
    if (lower.includes('port elizabeth') || lower.includes('gqeberha')) return 'ZAPEZ'; // Port Elizabeth
    return ''; // no default
  };

  const getFinalDestinationName = (msg: string) => {
    const lower = msg.toLowerCase();
    if (lower.includes('cape town')) return 'Cape Town, Western Cape';
    if (lower.includes('durban')) return 'Durban, KwaZulu-Natal';
    if (lower.includes('johannesburg')) return 'Johannesburg, Gauteng';
    if (lower.includes('pretoria')) return 'Pretoria, Gauteng';
    return ''; // no default
  };

  const getContainerType = (msg: string) => {
    const lower = msg.toLowerCase();
    if (lower.includes('40ft') || lower.includes('40 ft')) return '40ft';
    if (lower.includes('20ft') || lower.includes('20 ft')) return '20ft';
    return ''; // no default
  };

  const getCargoValue = (msg: string) => {
    const lower = msg.toLowerCase();
    const valueMatch = lower.match(/(\d+[,\d]*)\s*(?:usd|dollars?|\$)/);
    if (valueMatch) return parseInt(valueMatch[1].replace(/,/g, ''));
    return 0; // no default
  };

  const getCargoType = (msg: string) => {
    const lower = msg.toLowerCase();
    if (lower.includes('electronics')) return 'Electronics';
    if (lower.includes('shoes') || lower.includes('footwear')) return 'Textiles & Clothing';
    if (lower.includes('machinery')) return 'General Cargo';
    if (lower.includes('textiles') || lower.includes('clothing')) return 'Textiles & Clothing';
    return ''; // no default
  };

  const getIncoterm = (msg: string) => {
    const lower = msg.toLowerCase();
    if (lower.includes('fob')) return 'FOB';
    if (lower.includes('cif')) return 'CIF';
    if (lower.includes('ddp')) return 'DDP';
    if (lower.includes('exw')) return 'EXW';
    return ''; // no default
  };



  const sendMessage = async (messageContent: string) => {
    if (!messageContent.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageContent,
          context: context,
          conversationHistory: messages.slice(-5) // Send last 5 messages for context
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      
      // Add calculator suggestion for relevant shipping queries
      let aiResponse = data.response;
      
      // Check if AI has enough information to auto-generate detailed quote
      const hasOrigin = messageContent.toLowerCase().includes('from') || 
                       messageContent.toLowerCase().includes('china') || 
                       messageContent.toLowerCase().includes('europe') || 
                       messageContent.toLowerCase().includes('usa') || 
                       messageContent.toLowerCase().includes('new york') ||
                       messageContent.toLowerCase().includes('shanghai') ||
                       messageContent.toLowerCase().includes('hamburg');
      
      const hasDestination = messageContent.toLowerCase().includes('to') || 
                            messageContent.toLowerCase().includes('cape town') || 
                            messageContent.toLowerCase().includes('durban') || 
                            messageContent.toLowerCase().includes('south africa');
      
      const hasContainer = messageContent.toLowerCase().includes('container') || 
                          messageContent.toLowerCase().includes('20ft') || 
                          messageContent.toLowerCase().includes('40ft') ||
                          messageContent.toLowerCase().includes('20 ft') || 
                          messageContent.toLowerCase().includes('40 ft') ||
                          messageContent.toLowerCase().includes('ship');
      
      const hasValue = messageContent.toLowerCase().includes('value') || 
                      messageContent.toLowerCase().includes('usd') || 
                      messageContent.toLowerCase().includes('$') ||
                      messageContent.toLowerCase().includes('fob');
      
      // Auto-generate detailed quote if AI has sufficient shipping information
      const hasSufficientInfo = (hasOrigin && hasDestination && hasContainer) || 
                               (hasOrigin && hasContainer && hasValue) ||
                               messageContent.toLowerCase().includes('detailed quote') ||
                               messageContent.toLowerCase().includes('calculate quote');
      
      // Check if message looks like a complete shipping request
      const isCompleteShippingRequest = hasOrigin && hasDestination && 
                                       (hasContainer || messageContent.toLowerCase().includes('ship'));

      // Add detailed quote offer for shipping-related messages
      const hasShippingKeywords = messageContent.toLowerCase().includes('ship') ||
                                 messageContent.toLowerCase().includes('container') ||
                                 messageContent.toLowerCase().includes('freight') ||
                                 messageContent.toLowerCase().includes('quote') ||
                                 messageContent.toLowerCase().includes('cost') ||
                                 messageContent.toLowerCase().includes('price') ||
                                 messageContent.toLowerCase().includes('from') ||
                                 messageContent.toLowerCase().includes('china') ||
                                 messageContent.toLowerCase().includes('europe') ||
                                 messageContent.toLowerCase().includes('usa');
      
      // Add note about detailed quote for complete requests
      if (isCompleteShippingRequest || hasSufficientInfo) {
        aiResponse += "\n\n📊 **Generating your detailed quote now...** It will appear below with full cost breakdown and carrier options.";
      } else if (hasShippingKeywords && !aiResponse.toLowerCase().includes('detailed quote')) {
        aiResponse += "\n\n💡 **Need a detailed quote?** Provide your origin, destination, and container type, and I'll generate a comprehensive quote with live rates!";
      }
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      console.log('Quote generation check:', {
        hasOrigin,
        hasDestination,
        hasContainer,
        hasValue,
        hasSufficientInfo,
        isCompleteShippingRequest,
        messageContent: messageContent.toLowerCase().substring(0, 50) + '...'
      });

      // Extract shipping data and pass to calculator form
      if (onExtractedData && hasShippingKeywords) {
        const extractedData: Partial<any> = {};
        
        // Extract origin port
        if (hasOrigin) {
          extractedData.originPort = getOriginPortCode(messageContent);
        }
        
        // Extract destination
        if (hasDestination) {
          extractedData.destinationPort = getDestinationPortCode(messageContent);
          extractedData.finalDestination = getFinalDestinationName(messageContent);
        }
        
        // Extract container type
        if (hasContainer) {
          extractedData.containerType = getContainerType(messageContent);
        }
        
        // Extract cargo value
        if (hasValue) {
          extractedData.value = getCargoValue(messageContent);
        }
        
        // Extract incoterm
        const incotermValue = getIncoterm(messageContent);
        if (incotermValue) {
          extractedData.incoterm = incotermValue;
        }
        
        // Extract cargo type if mentioned
        const cargoTypeValue = getCargoType(messageContent);
        if (cargoTypeValue && cargoTypeValue !== 'General Cargo') {
          extractedData.cargoType = cargoTypeValue;
        }
        
        console.log('🔄 Passing extracted data to calculator form:', extractedData);
        onExtractedData(extractedData);
        
        // Add message about auto-population
        if (Object.keys(extractedData).length > 0) {
          setTimeout(() => {
            const autoFillMessage: ChatMessage = {
              id: (Date.now() + 2).toString(),
              role: 'assistant',
              content: "✅ I've auto-filled the calculator form with the information you provided. Please review and complete any missing fields to get your detailed quote!",
              timestamp: new Date()
            };
            setMessages(prev => [...prev, autoFillMessage]);
          }, 1500);
        }
      }
      
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment, or feel free to explore the shipping calculator below!",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Listen for quick chat messages from homepage
  useEffect(() => {
    const handleQuickMessage = (event: CustomEvent) => {
      const message = event.detail?.message;
      if (message) {
        setIsExpanded(true);
        setTimeout(() => {
          sendMessage(message);
        }, 300); // Small delay to allow expansion animation
      }
    };

    window.addEventListener('openChatWithMessage', handleQuickMessage as EventListener);
    
    return () => {
      window.removeEventListener('openChatWithMessage', handleQuickMessage as EventListener);
    };
  }, [sendMessage]);

  const handleQuickQuestion = (question: string) => {
    sendMessage(question);
    if (!isExpanded) {
      setIsExpanded(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputMessage);
  };

  return (
    <div className={cn("relative w-full mx-auto mb-6", className)}>
      <Card className="bg-white/95 backdrop-blur-sm shadow-xl border-blue-200">
        <CardHeader 
          className={cn(
            "transition-colors pb-3",
            context === "calculator" ? "" : "cursor-pointer hover:bg-gray-50"
          )}
          onClick={() => context !== "calculator" && setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">EasyShip AI Assistant</CardTitle>
                <p className="text-sm text-gray-600">
                  {context === "calculator" 
                    ? "Chat with me and I'll auto-fill the calculator form below" 
                    : "Get help with shipping, customs, and Incoterms"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <div className="w-2 h-2 bg-green-600 rounded-full mr-1"></div>
                Online
              </Badge>
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </div>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="pt-0">
            <Separator className="mb-4" />
            
            {/* Quick Questions */}
            {messages.length <= 1 && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-3">Quick questions to get started:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {QUICK_QUESTIONS.map((item, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="justify-start h-auto p-3 text-left hover:bg-blue-50 hover:border-blue-300"
                      onClick={() => handleQuickQuestion(item.question)}
                    >
                      <item.icon className="h-4 w-4 mr-2 text-blue-600 flex-shrink-0" />
                      <div>
                        <div className="font-medium text-sm">{item.question}</div>
                        <div className="text-xs text-gray-500">{item.category}</div>
                      </div>
                    </Button>
                  ))}
                </div>
                <Separator className="my-4" />
              </div>
            )}

            {/* Chat Messages - Shorter height on calculator page */}
            <ScrollArea className={cn(
              "mb-4",
              context === "calculator" ? "h-64" : "h-96"
            )}>
              <div className="space-y-4 px-2">
                {messages.map((message) => (
                  <div key={message.id} className={cn(
                    "flex gap-3",
                    message.role === 'user' ? "justify-end" : "justify-start"
                  )}>
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-blue-600" />
                      </div>
                    )}
                    <div className={cn(
                      "max-w-[85%] p-5 rounded-lg",
                      message.role === 'user' 
                        ? "bg-blue-600 text-white" 
                        : "bg-gray-100 text-gray-900"
                    )}>
                      <p className="text-base whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      {message.role === 'assistant' && (
                        message.content.toLowerCase().includes('shipping') || 
                        message.content.toLowerCase().includes('quote') ||
                        message.content.toLowerCase().includes('container') ||
                        message.content.toLowerCase().includes('cost') ||
                        message.content.toLowerCase().includes('price')
                      ) && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <Button
                            size="sm"
                            onClick={() => {
                              // Extract and send data to form
                              const allMessages = messages.map(m => m.content).join(' ');
                              const extractedData: Partial<any> = {};
                              
                              // Extract all available information
                              const originCode = getOriginPortCode(allMessages);
                              if (originCode) extractedData.originPort = originCode;
                              
                              const destCode = getDestinationPortCode(allMessages);
                              if (destCode) {
                                extractedData.destinationPort = destCode;
                                extractedData.finalDestination = getFinalDestinationName(allMessages);
                              }
                              
                              const container = getContainerType(allMessages);
                              if (container) extractedData.containerType = container;
                              
                              const value = getCargoValue(allMessages);
                              if (value > 0) extractedData.value = value;
                              
                              const incoterm = getIncoterm(allMessages);
                              if (incoterm) extractedData.incoterm = incoterm;
                              
                              const cargoType = getCargoType(allMessages);
                              if (cargoType) extractedData.cargoType = cargoType;
                              
                              if (onExtractedData && Object.keys(extractedData).length > 0) {
                                onExtractedData(extractedData);
                              }
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2"
                          >
                            <Calculator className="h-4 w-4 mr-2" />
                            Get Detailed Quote
                          </Button>
                        </div>
                      )}
                      <p className={cn(
                        "text-xs mt-2 opacity-70",
                        message.role === 'user' ? "text-blue-100" : "text-gray-500"
                      )}>
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                    {message.role === 'user' && (
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-gray-600" />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Bot className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="bg-gray-100 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        <span className="text-sm text-gray-600">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div ref={messagesEndRef} />
            </ScrollArea>

            {/* Message Input */}
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask me about shipping, customs, or Incoterms..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button 
                type="submit" 
                disabled={!inputMessage.trim() || isLoading}
                size="icon"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>

            <div className="mt-3 text-xs text-gray-500 text-center">
              {context === "calculator" 
                ? "💡 Tip: Tell me your shipping details like 'ship electronics from China to Cape Town' and I'll auto-fill the form"
                : "💡 Tip: Ask specific questions like 'What documents do I need?' or 'Explain FOB pricing'"}
            </div>
          </CardContent>
        )}
      </Card>
      

    </div>
  );
}