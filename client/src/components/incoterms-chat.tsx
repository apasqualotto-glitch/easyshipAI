import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import { Send, Bot, User, HelpCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { type Incoterm } from "@shared/schema";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
}

interface IncotermsChat {
  selectedIncoterm?: string;
}

export default function IncotermsChat({ selectedIncoterm }: IncotermsChat) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hi! I'm your Incoterms assistant. I can help explain shipping terms and responsibilities. What would you like to know?",
      sender: "ai",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");

  const { data: incoterms } = useQuery<Incoterm[]>({
    queryKey: ["/api/incoterms"],
  });

  const quickQuestions = [
    "What's the difference between FOB and CIF?",
    "Who pays for shipping insurance?",
    "What are my responsibilities as a buyer?",
    "Which Incoterm is best for beginners?",
    "How do Incoterms affect customs duties?"
  ];

  const getIncotermExplanation = (question: string): string => {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes("fob") && lowerQuestion.includes("cif")) {
      return `Great question! Here's the key difference:

**FOB (Free On Board):**
- Seller delivers goods to the ship
- Buyer pays for sea freight and insurance
- Buyer takes risk once goods are on the ship
- Generally cheaper upfront for the buyer

**CIF (Cost, Insurance & Freight):**
- Seller pays for shipping and basic insurance
- Seller arranges and pays for sea freight
- Risk transfers to buyer once goods are shipped
- More convenient but usually more expensive

For first-time importers, CIF is often easier because the seller handles shipping arrangements, but you'll pay more for this convenience.`;
    }
    
    if (lowerQuestion.includes("insurance")) {
      return `Insurance responsibility depends on your Incoterm:

**Buyer pays insurance:** EXW, FOB, CFR
**Seller provides insurance:** CIF, DDP

Under CIF, the seller must provide minimum insurance (110% of goods value). However, this basic coverage might not be enough - you may want additional insurance for better protection.

Pro tip: Even if seller provides insurance under CIF, consider getting your own comprehensive coverage for peace of mind!`;
    }
    
    if (lowerQuestion.includes("responsibilities") || lowerQuestion.includes("buyer")) {
      return `Your responsibilities as a buyer vary by Incoterm:

**EXW (Ex Works) - Most buyer responsibility:**
- Arrange pickup from seller's premises
- Handle all shipping, insurance, customs
- Bear all risks from pickup

**FOB (Free On Board) - Moderate responsibility:**
- Arrange sea freight and insurance
- Handle import customs clearance
- Risk starts when goods are on ship

**CIF (Cost, Insurance, Freight) - Less responsibility:**
- Seller handles shipping and basic insurance
- You handle import customs and duties
- Risk transfers when goods are shipped

**DDP (Delivered Duty Paid) - Least responsibility:**
- Seller handles everything including import duties
- You just receive goods at your location
- Most expensive but most convenient`;
    }
    
    if (lowerQuestion.includes("beginner") || lowerQuestion.includes("best")) {
      return `For first-time importers, I recommend **CIF (Cost, Insurance, Freight)**:

**Why CIF is beginner-friendly:**
✓ Seller arranges shipping - less for you to coordinate
✓ Basic insurance included
✓ Clear handover point (port of destination)
✓ You only handle local customs and delivery

**Avoid EXW as a beginner** - it puts all responsibility on you from the seller's door.

**Consider DDP if budget allows** - seller handles everything including customs, but it's the most expensive option.

Start with CIF, then move to FOB once you're comfortable with the import process!`;
    }
    
    if (lowerQuestion.includes("customs") || lowerQuestion.includes("duties")) {
      return `Incoterms affect who pays customs duties and handles clearance:

**Import Duties & Customs:**
- **EXW, FOB, CIF, CFR:** Buyer pays all import duties and handles customs clearance
- **DDP:** Seller pays import duties and handles customs clearance

**Important for South Africa:**
- Import duties are based on HS codes and product value
- VAT (15%) applies to (product value + duties + shipping)
- Additional fees: customs handling, terminal handling charges

**Customs clearance responsibilities:**
- **Most Incoterms:** You need a customs broker or clearing agent
- **DDP:** Seller arranges everything (but you pay via higher product price)

Even under DDP, you should understand the duties to verify fair pricing!`;
    }
    
    return `I'd be happy to help explain that! Incoterms define who is responsible for costs, risks, and logistics at each stage of shipping.

The main Incoterms for ocean freight are:
- **EXW**: You handle everything from seller's location
- **FOB**: Seller delivers to ship, you handle sea freight
- **CIF**: Seller pays shipping + basic insurance
- **DDP**: Seller handles everything including import duties

What specific aspect would you like me to explain more?`;
  };

  const handleSendMessage = (text: string = inputValue) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: "user",
      timestamp: new Date()
    };

    const aiResponse: Message = {
      id: (Date.now() + 1).toString(),
      text: getIncotermExplanation(text.trim()),
      sender: "ai",
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage, aiResponse]);
    setInputValue("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-blue-600" />
          Incoterms Assistant
        </CardTitle>
        {selectedIncoterm && (
          <Badge variant="secondary" className="w-fit">
            Currently selected: {selectedIncoterm}
          </Badge>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4 pb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div className={`flex gap-2 max-w-[80%] ${
                  message.sender === "user" ? "flex-row-reverse" : "flex-row"
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.sender === "user" 
                      ? "bg-blue-600 text-white" 
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    {message.sender === "user" ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                  <div className={`rounded-lg px-3 py-2 ${
                    message.sender === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}>
                    <div className="whitespace-pre-line text-sm leading-relaxed">
                      {message.text}
                    </div>
                    <div className={`text-xs mt-1 ${
                      message.sender === "user" ? "text-blue-100" : "text-gray-500"
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Quick Questions */}
        <div className="px-4 py-2 border-t">
          <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
            <HelpCircle className="h-3 w-3" />
            Quick questions:
          </div>
          <div className="flex flex-wrap gap-1">
            {quickQuestions.map((question, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => handleSendMessage(question)}
              >
                {question}
              </Button>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about Incoterms, customs duties, or shipping responsibilities..."
              className="flex-1"
            />
            <Button 
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim()}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}