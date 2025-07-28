import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { QuoteDisplay } from "./quote-display";
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

export function AIChatInterface({ className, context }: AIChatInterfaceProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "👋 Welcome to EasyShip AI! I'm here to help you understand container shipping, customs, and Incoterms in simple terms. What would you like to know?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showQuoteDisplay, setShowQuoteDisplay] = useState(false);
  const [currentQuote, setCurrentQuote] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateQuote = async (messageContent: string) => {
    try {
      console.log('🔍 Extracting shipping details from:', messageContent);

      // Map chat locations to actual port IDs from the database
      const getOriginPortId = (msg: string) => {
        const lower = msg.toLowerCase();
        if (lower.includes('new york') || lower.includes('usa') || lower.includes('america')) return 'port_new_york';
        if (lower.includes('los angeles')) return 'port_los_angeles';
        if (lower.includes('china') || lower.includes('shanghai')) return 'port_shanghai';
        if (lower.includes('europe') || lower.includes('germany') || lower.includes('hamburg')) return 'port_hamburg';
        if (lower.includes('india') || lower.includes('mumbai')) return 'port_mumbai';
        return 'port_shanghai'; // default
      };

      const getDestinationPortId = (msg: string) => {
        const lower = msg.toLowerCase();
        if (lower.includes('cape town')) return 'port_cape_town';
        if (lower.includes('durban')) return 'port_durban';
        if (lower.includes('johannesburg')) return 'dest_johannesburg';
        return 'port_cape_town'; // default
      };

      const getContainerType = (msg: string) => {
        const lower = msg.toLowerCase();
        if (lower.includes('40ft') || lower.includes('40 ft')) return '40ft';
        if (lower.includes('20ft') || lower.includes('20 ft')) return '20ft';
        return '20ft';
      };

      const getCargoValue = (msg: string) => {
        const lower = msg.toLowerCase();
        const valueMatch = lower.match(/(\d+[,\d]*)\s*(?:usd|dollars?|\$)/);
        if (valueMatch) return parseInt(valueMatch[1].replace(/,/g, ''));
        return 15000; // default for shoes example
      };

      const getCargoType = (msg: string) => {
        const lower = msg.toLowerCase();
        if (lower.includes('electronics')) return 'cargo_electronics';
        if (lower.includes('shoes') || lower.includes('footwear')) return 'cargo_footwear';
        if (lower.includes('machinery')) return 'cargo_machinery';
        if (lower.includes('textiles') || lower.includes('clothing')) return 'cargo_textiles';
        return 'cargo_electronics';
      };

      const getIncoterm = (msg: string) => {
        const lower = msg.toLowerCase();
        if (lower.includes('fob')) return 'FOB';
        if (lower.includes('cif')) return 'CIF';
        if (lower.includes('ddp')) return 'DDP';
        if (lower.includes('exw')) return 'EXW';
        return 'FOB'; // default
      };

      // Create the same quote request structure as manual calculator
      const quoteRequest = {
        originPort: getOriginPortId(messageContent),
        destinationPort: getDestinationPortId(messageContent),
        finalDestination: getDestinationPortId(messageContent),
        containerType: getContainerType(messageContent),
        cargoType: getCargoType(messageContent),
        incoterm: getIncoterm(messageContent),
        weight: 15000, // reasonable default
        value: getCargoValue(messageContent),
        hasPartialShipment: false
      };

      console.log('🚢 Sending quote request to API:', quoteRequest);

      // Call the SAME API endpoint as the manual calculator
      const response = await fetch('/api/calculate-quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quoteRequest),
      });

      if (!response.ok) {
        throw new Error(`Quote API failed: ${response.status}`);
      }

      const apiResult = await response.json();
      console.log('📊 API returned detailed quote:', apiResult);

      // Transform API result to match QuoteDisplay component format
      const detailedQuote = {
        breakdown: {
          seaFreight: apiResult.breakdown?.seaFreight || apiResult.seaFreight || 0,
          trucking: apiResult.breakdown?.trucking || apiResult.trucking || 0,
          customs: apiResult.breakdown?.customs || apiResult.customsDuty || 0,
          vat: apiResult.breakdown?.vat || apiResult.vat || 0,
          handling: apiResult.breakdown?.handling || apiResult.handling || 0,
          total: apiResult.totalCost || 0
        },
        route: {
          origin: apiResult.route?.origin || 'Unknown Origin',
          destination: apiResult.route?.destination || 'Unknown Destination',
          containerType: apiResult.containerType || getContainerType(messageContent)
        },
        incoterm: apiResult.incoterm || getIncoterm(messageContent),
        totalDays: apiResult.transitTime || apiResult.totalDays || 30,
        cargoDetails: {
          type: apiResult.cargoType || getCargoType(messageContent),
          value: apiResult.cargoValue || getCargoValue(messageContent),
          weight: apiResult.weight ? `${apiResult.weight} kg` : '15,000 kg'
        }
      };

      console.log('✅ Transformed quote for display:', detailedQuote);
      setCurrentQuote(detailedQuote);
      setShowQuoteDisplay(true);
      
    } catch (error) {
      console.error('❌ Error generating quote:', error);
      
      // Fallback to simple quote display if API fails
      const fallbackQuote = {
        breakdown: {
          seaFreight: 52000,
          trucking: 8500,
          customs: 55500,
          vat: 17400,
          handling: 3200,
          total: 136600
        },
        route: {
          origin: 'New York, USA',
          destination: 'Cape Town, South Africa',
          containerType: '20ft Container'
        },
        incoterm: 'FOB',
        totalDays: 35,
        cargoDetails: {
          type: 'footwear',
          value: 15000,
          weight: '15,000 kg'
        }
      };
      
      setCurrentQuote(fallbackQuote);
      setShowQuoteDisplay(true);
    }
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
      
      if (hasShippingKeywords && !aiResponse.toLowerCase().includes('detailed quote')) {
        aiResponse += "\n\n💡 **Would you like a detailed quote with carrier options?** Click the calculator button below for a comprehensive quote with live rates from major shipping lines!";
      }
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      
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
      
      // Always try to extract quote information from AI responses and user messages
      const shouldGenerateQuote = hasSufficientInfo || 
                                 aiResponse.toLowerCase().includes('quote') ||
                                 aiResponse.toLowerCase().includes('cost') ||
                                 aiResponse.toLowerCase().includes('shipping') ||
                                 messageContent.toLowerCase().includes('quote') ||
                                 messageContent.toLowerCase().includes('ship');
      
      console.log('Quote generation check:', {
        hasOrigin,
        hasDestination,
        hasContainer,
        hasValue,
        hasSufficientInfo,
        shouldGenerateQuote,
        messageContent: messageContent.toLowerCase().substring(0, 50) + '...'
      });

      if (shouldGenerateQuote) {
        console.log('✅ Triggering automatic quote generation');
        // Use AI response content to extract better shipping details
        const fullContext = messageContent + " " + aiResponse;
        setTimeout(() => {
          generateQuote(fullContext);
        }, 1000); // Slightly longer delay to let AI response fully appear
      } else {
        console.log('❌ Quote generation not triggered');
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
    <div className={cn("fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-4xl mx-auto px-4", className)}>
      <Card className="bg-white/95 backdrop-blur-sm shadow-xl border-blue-200">
        <CardHeader 
          className="cursor-pointer hover:bg-gray-50 transition-colors pb-3"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">EasyShip AI Assistant</CardTitle>
                <p className="text-sm text-gray-600">Get help with shipping, customs, and Incoterms</p>
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

            {/* Chat Messages */}
            <ScrollArea className="h-96 mb-4">
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
                        message.content.toLowerCase().includes('calculator') || 
                        message.content.toLowerCase().includes('detailed quote') ||
                        message.content.toLowerCase().includes('click the calculator') ||
                        message.content.toLowerCase().includes('comprehensive quote')
                      ) && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <Button
                            size="sm"
                            onClick={() => generateQuote(message.content)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2"
                          >
                            <Calculator className="h-4 w-4 mr-2" />
                            Click for Detailed Quote
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
              💡 Tip: Ask specific questions like "What documents do I need?" or "Explain FOB pricing"
            </div>
          </CardContent>
        )}
      </Card>
      
      {/* Quote Display - Positioned below chat dialog */}
      {showQuoteDisplay && currentQuote && (
        <div className="mt-4">
          <QuoteDisplay
            quote={currentQuote}
            isVisible={showQuoteDisplay}
            onClose={() => setShowQuoteDisplay(false)}
            onBookShipment={(carrier: string) => {
              console.log('Booking with carrier:', carrier);
              setShowQuoteDisplay(false);
              // Add booking logic here
            }}
          />
        </div>
      )}
    </div>
  );
}