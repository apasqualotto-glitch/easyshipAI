import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import {
  Send,
  Bot,
  User,
  Loader2,
  MapPin,
  BarChart3,
  FileChecklist,
  ChevronRight,
  RefreshCw,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AgentMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  mode?: "guide" | "analyzer" | "documentor";
}

interface ShippingDetails {
  origin?: string;
  destination?: string;
  containerType?: string;
  cargoType?: string;
  value?: number;
  weight?: number;
  urgency?: "standard" | "fast" | "flexible";
}

interface ShippingAgentInterfaceProps {
  className?: string;
  onExtractedData?: (data: ShippingDetails) => void;
}

export function ShippingAgentInterface({
  className,
  onExtractedData,
}: ShippingAgentInterfaceProps) {
  const [messages, setMessages] = useState<AgentMessage[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "🚀 Hi! I'm your personal Shipping Agent. I can help you in three ways:\n\n**1. 📋 Guide Mode** - I'll walk you step-by-step through your entire shipping journey\n**2. 📊 Analyzer Mode** - I'll analyze your shipment and recommend the best Incoterms, carriers, and routes\n**3. 📄 Documentor Mode** - I'll tell you exactly what documents you need with costs\n\nWhat would help you most?",
      timestamp: new Date(),
    },
  ]);

  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeMode, setActiveMode] = useState<
    "guide" | "analyzer" | "documentor" | null
  >(null);
  const [shippingDetails, setShippingDetails] = useState<ShippingDetails>({});
  const [conversationTurns, setConversationTurns] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleModeSelection = async (
    mode: "guide" | "analyzer" | "documentor"
  ) => {
    setActiveMode(mode);
    setConversationTurns(0);

    const modeMessages: Record<string, string> = {
      guide: "Perfect! I'll guide you step-by-step through the shipping process. Let's start.\n\nFirst question: What country will you be shipping **from**? (e.g., China, USA, Germany, or are you exporting FROM South Africa?)",
      analyzer:
        "Great! To analyze your shipment and provide recommendations, I need your shipping details. Could you tell me:\n\n1. **Where from?** (e.g., Shanghai, Hamburg, USA)\n2. **Where in South Africa?** (e.g., Johannesburg, Cape Town, Durban)\n3. **What container size?** (20ft or 40ft?)",
      documentor:
        "Excellent! I'll help you determine exactly which documents you need.\n\nTo provide the right checklist, please tell me:\n1. **What are you shipping?** (e.g., electronics, textiles, machinery)\n2. **Container size?** (20ft, 40ft, or partial shipment?)\n3. **From which country?**",
    };

    const newMessage: AgentMessage = {
      id: Date.now().toString(),
      role: "assistant",
      content: modeMessages[mode],
      timestamp: new Date(),
      mode: mode,
    };

    setMessages((prev) => [...prev, newMessage]);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !activeMode) return;

    // Add user message
    const userMessage: AgentMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);
    setConversationTurns((prev) => prev + 1);

    try {
      // Call the appropriate agent endpoint
      const response = await fetch(`/api/shipping-agent/${activeMode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: inputMessage,
          shippingDetails,
          conversationTurns,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get agent response");
      }

      const data = await response.json();

      // Add agent response
      const assistantMessage: AgentMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
        mode: activeMode,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Extract and update shipping details from conversation
      extractShippingDetails(inputMessage);

      // Call callback if data extracted
      if (onExtractedData && Object.keys(shippingDetails).length > 0) {
        onExtractedData(shippingDetails);
      }
    } catch (error) {
      console.error("Agent error:", error);

      const errorMessage: AgentMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content:
          "I encountered an issue processing your request. Please try again or contact support.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const extractShippingDetails = (message: string) => {
    const lower = message.toLowerCase();
    const newDetails = { ...shippingDetails };

    // Extract origin
    const origins: Record<string, string> = {
      china: "China",
      shanghai: "China",
      ningbo: "China",
      usa: "USA",
      germany: "Germany",
      hamburg: "Germany",
      europe: "Europe",
      uk: "UK",
      india: "India",
      southeast: "Southeast Asia",
    };

    for (const [key, value] of Object.entries(origins)) {
      if (lower.includes(key)) {
        newDetails.origin = value;
        break;
      }
    }

    // Extract destination
    const destinations: Record<string, string> = {
      johannesburg: "Johannesburg",
      cape: "Cape Town",
      durban: "Durban",
      pretoria: "Pretoria",
      port: "Port Elizabeth",
      "south africa": "South Africa",
    };

    for (const [key, value] of Object.entries(destinations)) {
      if (lower.includes(key)) {
        newDetails.destination = value;
        break;
      }
    }

    // Extract container type
    if (lower.includes("20ft") || lower.includes("20 foot")) {
      newDetails.containerType = "20ft";
    } else if (lower.includes("40ft") || lower.includes("40 foot")) {
      newDetails.containerType = "40ft";
    } else if (lower.includes("hc") || lower.includes("high")) {
      newDetails.containerType = "40ft-HC";
    }

    // Extract cargo type
    const cargoTypes: Record<string, string> = {
      electronic: "Electronics",
      textile: "Textiles",
      machinery: "Machinery",
      food: "Food",
      chemical: "Chemicals",
      general: "General Cargo",
    };

    for (const [key, value] of Object.entries(cargoTypes)) {
      if (lower.includes(key)) {
        newDetails.cargoType = value;
        break;
      }
    }

    // Extract urgency
    if (lower.includes("urgent") || lower.includes("fast")) {
      newDetails.urgency = "fast";
    } else if (lower.includes("flexible") || lower.includes("anytime")) {
      newDetails.urgency = "flexible";
    }

    // Extract value if present (simple pattern)
    const valueMatch = message.match(/\$?([\d,]+)/);
    if (valueMatch) {
      newDetails.value = parseInt(valueMatch[1].replace(/,/g, ""));
    }

    setShippingDetails(newDetails);
  };

  const resetAgent = () => {
    setMessages([
      {
        id: "1",
        role: "assistant",
        content:
          "🚀 Hi! I'm your personal Shipping Agent. I can help you in three ways:\n\n**1. 📋 Guide Mode** - I'll walk you step-by-step through your entire shipping journey\n**2. 📊 Analyzer Mode** - I'll analyze your shipment and recommend the best Incoterms, carriers, and routes\n**3. 📄 Documentor Mode** - I'll tell you exactly what documents you need with costs\n\nWhat would help you most?",
        timestamp: new Date(),
      },
    ]);
    setActiveMode(null);
    setShippingDetails({});
    setConversationTurns(0);
    setInputMessage("");
  };

  const modeConfig = {
    guide: {
      icon: MapPin,
      label: "Guide Mode",
      color: "bg-blue-100 text-blue-700",
      description: "Step-by-step walkthrough",
    },
    analyzer: {
      icon: BarChart3,
      label: "Analyzer Mode",
      color: "bg-purple-100 text-purple-700",
      description: "Recommendations & optimization",
    },
    documentor: {
      icon: FileChecklist,
      label: "Documentor Mode",
      color: "bg-green-100 text-green-700",
      description: "Documentation checklist",
    },
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            <CardTitle>Shipping Agent</CardTitle>
          </div>
          {activeMode && (
            <Badge className={modeConfig[activeMode].color}>
              {modeConfig[activeMode].label}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0 flex flex-col h-[600px]">
        <ScrollArea className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-4">
            {/* Mode Selection Grid (shown when no mode selected) */}
            {!activeMode && messages.length === 1 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-6">
                  {(
                    ["guide", "analyzer", "documentor"] as const
                  ).map((mode) => {
                    const config = modeConfig[mode];
                    const Icon = config.icon;
                    return (
                      <button
                        key={mode}
                        onClick={() => handleModeSelection(mode)}
                        className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-left"
                      >
                        <div className="flex items-start gap-3">
                          <Icon className="h-5 w-5 mt-1 flex-shrink-0" />
                          <div className="flex-1">
                            <h3 className="font-semibold text-sm">
                              {config.label}
                            </h3>
                            <p className="text-xs text-gray-600">
                              {config.description}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </div>
                      </button>
                    );
                  })}
                </div>

                <Separator />

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex gap-2">
                    <Lightbulb className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-blue-800">
                      <p className="font-semibold mb-1">💡 Quick Tip:</p>
                      <p>
                        Each mode specializes in different aspects of shipping.
                        Mix and match modes as you learn more!
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Chat Messages */}
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn("flex gap-3", {
                  "justify-end": message.role === "user",
                })}
              >
                {message.role === "assistant" && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                )}

                <div
                  className={cn("max-w-md rounded-lg px-4 py-3", {
                    "bg-primary text-primary-foreground":
                      message.role === "user",
                    "bg-gray-100 text-gray-900":
                      message.role === "assistant",
                  })}
                >
                  <p className="text-sm whitespace-pre-wrap">
                    {message.content}
                  </p>
                  <p
                    className={cn("text-xs mt-1", {
                      "text-primary-foreground/70":
                        message.role === "user",
                      "text-gray-600": message.role === "assistant",
                    })}
                  >
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>

                {message.role === "user" && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-700" />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <div className="bg-gray-100 rounded-lg px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    />
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <Separator />

        {/* Shipping Details Summary (if any extracted) */}
        {activeMode && Object.keys(shippingDetails).length > 0 && (
          <div className="px-4 py-2 bg-gray-50 border-t text-xs">
            <div className="flex gap-2 flex-wrap">
              {shippingDetails.origin && (
                <Badge variant="outline">{shippingDetails.origin}</Badge>
              )}
              {shippingDetails.destination && (
                <Badge variant="outline">{shippingDetails.destination}</Badge>
              )}
              {shippingDetails.containerType && (
                <Badge variant="outline">{shippingDetails.containerType}</Badge>
              )}
              {shippingDetails.cargoType && (
                <Badge variant="outline">{shippingDetails.cargoType}</Badge>
              )}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder={
                activeMode
                  ? "Type your response..."
                  : "Select a mode to start..."
              }
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !isLoading && activeMode) {
                  handleSendMessage();
                }
              }}
              disabled={!activeMode || isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading || !activeMode}
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
            {activeMode && (
              <Button
                onClick={resetAgent}
                variant="outline"
                size="icon"
                title="Reset agent"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
