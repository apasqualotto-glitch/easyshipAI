import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

import { 
  Ship,
  Calculator,
  FileText,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Globe,
  Shield,
  Clock,
  Users,
  BookOpen,
  MessageSquare,
  Send,
  Sparkles,
  X
} from "lucide-react";

const FEATURES = [
  {
    icon: Calculator,
    title: "Smart Quote Calculator",
    description: "Get instant shipping quotes with SARS-compliant customs calculations",
    link: "/calculator"
  },
  {
    icon: Ship,
    title: "Live Carrier Rates",
    description: "Compare real-time rates from Maersk, MSC, CMA CGM and more",
    link: "/calculator"
  },
  {
    icon: FileText,
    title: "Customs & Incoterms Guide",
    description: "Learn FOB, CIF, DDP with plain language explanations",
    link: "/guides"
  },
  {
    icon: TrendingUp,
    title: "Shipment Tracking",
    description: "Real-time tracking from port to your door",
    link: "/tracking"
  }
];

const BENEFITS = [
  {
    icon: CheckCircle,
    title: "First-Time Friendly",
    text: "Designed for people new to international shipping"
  },
  {
    icon: Globe,
    title: "South Africa Focused",
    text: "SARS compliant with local customs regulations"
  },
  {
    icon: Shield,
    title: "Secure & Reliable",
    text: "Direct API connections to major shipping lines"
  },
  {
    icon: Clock,
    title: "Save Time",
    text: "Get quotes in minutes, not hours or days"
  }
];

const STATS = [
  { number: "50+", label: "Origin Ports", subtext: "Worldwide coverage" },
  { number: "12", label: "SA Destinations", subtext: "Door-to-door delivery" },
  { number: "15+", label: "Cargo Types", subtext: "Comprehensive classification" },
  { number: "24/7", label: "AI Support", subtext: "Always here to help" }
];

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function Homepage() {
  const [activeFeature, setActiveFeature] = useState<number | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages]);



  const handleQuickChat = async () => {
    if (!chatMessage.trim() || isLoading) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatMessage,
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setChatMessage("");
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: chatMessage,
          context: { page: 'homepage' },
          conversationHistory: chatMessages.slice(-5).map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, assistantMessage]);
      } else {
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "Sorry, I'm having trouble connecting right now. Please try the manual calculator below for instant quotes.",
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting right now. Please try the manual calculator below for instant quotes.",
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleQuickChat();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      
      {/* Prominent Chat Dialog Box - Mobile Optimized */}
      <section className="pt-16 sm:pt-24 pb-6 sm:pb-8 px-3 sm:px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-white shadow-xl border-0 mb-6 sm:mb-8">
              <CardHeader className="text-center pb-2 sm:pb-3 px-4 sm:px-6">
                <div className="flex justify-center mb-2">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                    <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                </div>
                <CardTitle className="text-lg sm:text-xl text-gray-900 mb-1">EasyShip AI Assistant</CardTitle>
                <CardDescription className="text-xs sm:text-sm text-gray-600">
                  Your personal guide for container shipping to South Africa
                </CardDescription>
              </CardHeader>
            <CardContent className="pt-0 px-3 sm:px-6">
              
              {/* Chat Messages - Mobile Optimized Dialog */}
              <div 
                ref={chatMessagesRef}
                className="mb-3 sm:mb-4 border rounded-lg bg-gray-50 min-h-[250px] sm:min-h-[300px] max-h-72 sm:max-h-80 overflow-y-auto"
              >
                <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                  {chatMessages.length === 0 ? (
                    <div className="flex justify-start">
                      <div className="bg-white border border-gray-200 px-3 sm:px-4 py-2 sm:py-3 rounded-2xl rounded-bl-md shadow-sm max-w-full sm:max-w-md">
                        <div className="text-xs sm:text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
                          👋 **Welcome to EasyShip AI!** I'm your personal shipping assistant for container imports to South Africa.

**I can help you with:**
• Instant shipping quotes with accurate costs
• Customs duties and SARS compliance  
• Documentation requirements
• Incoterms explanations (FOB, CIF, etc.)
• Carrier selection and booking guidance

**Try asking:** "Get a quote from Shanghai to Johannesburg" or use the buttons below!
                        </div>
                      </div>
                    </div>
                  ) : (
                    chatMessages.map((msg, index) => (
                      <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] sm:max-w-xs lg:max-w-md px-3 sm:px-4 py-2 sm:py-3 rounded-2xl shadow-sm ${
                          msg.role === 'user' 
                            ? 'bg-blue-600 text-white rounded-br-md' 
                            : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md'
                        }`}>
                          <div className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                          
                          {/* Quick Action Buttons for AI responses - Mobile Optimized */}
                          {msg.role === 'assistant' && index === chatMessages.length - 1 && (
                            <div className="mt-2 sm:mt-3 flex flex-wrap gap-1 sm:gap-2">
                              {msg.content.includes('quote') && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-5 sm:h-6 px-1.5 sm:px-2 text-[10px] sm:text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                                  onClick={() => setChatMessage("Use the calculator for detailed quote")}
                                >
                                  📊 Calculator
                                </Button>
                              )}
                              {msg.content.includes('shipping') && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-5 sm:h-6 px-1.5 sm:px-2 text-[10px] sm:text-xs bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                                  onClick={() => setChatMessage("What documents do I need?")}
                                >
                                  📋 Documents
                                </Button>
                              )}
                              {(msg.content.includes('customs') || msg.content.includes('duties')) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-5 sm:h-6 px-1.5 sm:px-2 text-[10px] sm:text-xs bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                                  onClick={() => setChatMessage("Explain customs duties in detail")}
                                >
                                  🛃 Duties
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-5 sm:h-6 px-1.5 sm:px-2 text-[10px] sm:text-xs bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                                onClick={() => setChatMessage("What else can you help me with?")}
                              >
                                💡 Help
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-gray-200 px-4 py-3 rounded-lg shadow-sm">
                        <div className="flex items-center space-x-3">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                          </div>
                          <span className="text-sm text-gray-600 font-medium">EasyShip AI is typing...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Chat Input - Mobile Optimized */}
              <div className="relative mb-3 sm:mb-4">
                <Input
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="pr-10 sm:pr-12 h-10 sm:h-12 text-sm sm:text-base bg-white border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleQuickChat}
                  disabled={!chatMessage.trim() || isLoading}
                  className="absolute right-1.5 sm:right-2 top-1.5 sm:top-2 h-7 w-7 sm:h-8 sm:w-8 bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <Send className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  )}
                </Button>
              </div>
              
              {/* Quick Suggestions - Mobile Optimized */}
              <div className="border-t pt-2 sm:pt-3">
                <div className="text-[10px] sm:text-xs text-gray-600 text-center mb-2 sm:mb-3">Try asking:</div>
                <div className="flex flex-wrap gap-1 sm:gap-1.5 justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 sm:h-7 px-1.5 sm:px-2 text-[10px] sm:text-xs text-blue-700 hover:bg-blue-50 border border-blue-200"
                    onClick={() => setChatMessage("Get a shipping quote from China to South Africa")}
                  >
                    📦 Quote
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 sm:h-7 px-1.5 sm:px-2 text-[10px] sm:text-xs text-green-700 hover:bg-green-50 border border-green-200"
                    onClick={() => setChatMessage("Estimate customs duties for electronics")}
                  >
                    🛃 Customs
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 sm:h-7 px-1.5 sm:px-2 text-[10px] sm:text-xs text-purple-700 hover:bg-purple-50 border border-purple-200"
                    onClick={() => setChatMessage("What documents do I need?")}
                  >
                    📋 Documents
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 sm:h-7 px-1.5 sm:px-2 text-[10px] sm:text-xs text-orange-700 hover:bg-orange-50 border border-orange-200"
                    onClick={() => setChatMessage("Explain FOB vs CIF")}
                  >
                    💰 FOB vs CIF
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 sm:h-7 px-1.5 sm:px-2 text-[10px] sm:text-xs text-teal-700 hover:bg-teal-50 border border-teal-200"
                    onClick={() => setChatMessage("How long does shipping take?")}
                  >
                    ⏱️ Transit
                  </Button>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>
      </section>

      {/* Alternative: Manual Calculator Section - Mobile Optimized */}
      <section className="pb-8 sm:pb-12 px-3 sm:px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center mb-4 sm:mb-6">
            <div className="h-px bg-gray-300 flex-1"></div>
            <span className="px-2 sm:px-4 text-gray-500 text-xs sm:text-sm font-medium">OR USE MANUAL CALCULATOR</span>
            <div className="h-px bg-gray-300 flex-1"></div>
          </div>
          
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
            Get Instant Shipping Quotes
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
            Use our step-by-step calculator for detailed freight cost estimates including customs, duties, and door-to-door delivery.
          </p>
          
          <Link href="/calculator">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 lg:px-8 py-3 sm:py-4 text-sm sm:text-base lg:text-lg">
              <Calculator className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Start Manual Calculator
            </Button>
          </Link>
        </div>
      </section>
      
      {/* Features Section - Mobile Optimized */}
      <section className="pb-12 sm:pb-16 px-3 sm:px-4">
        <div className="max-w-6xl mx-auto text-center">
          <Badge className="mb-4 sm:mb-6 bg-blue-100 text-blue-800 border-blue-200 text-xs sm:text-sm px-2 sm:px-3 py-1">
            Complete Shipping Platform
          </Badge>
          
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight px-2">
            Everything You Need to
            <span className="block text-blue-600">Ship to South Africa</span>
          </h2>
          
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed px-2">
            From AI-powered quotes to carrier booking, customs guidance, and door-to-door tracking - 
            we make international shipping simple for first-time importers.
          </p>

          {/* Trust Indicators - Mobile Optimized */}
          <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 lg:gap-8 text-gray-500 mb-8 sm:mb-16 px-2">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-xs sm:text-sm">SARS Compliant</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Ship className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-xs sm:text-sm">Major Carriers</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Users className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-xs sm:text-sm">Beginner Friendly</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Mobile Optimized */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-6xl mx-auto px-3 sm:px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {STATS.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-600 mb-1 sm:mb-2">
                  {stat.number}
                </div>
                <div className="font-semibold text-gray-900 mb-0.5 sm:mb-1 text-sm sm:text-base">
                  {stat.label}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">
                  {stat.subtext}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed Features Section - Mobile Optimized */}
      <section className="py-12 sm:py-16 lg:py-20 px-3 sm:px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
              Everything You Need to Ship Smart
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto px-2">
              From instant quotes to customs guidance, we've simplified every step of the shipping process
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {FEATURES.map((feature, index) => (
              <Link key={index} href={feature.link}>
                <Card 
                  className="h-full hover:shadow-lg transition-all duration-300 cursor-pointer group border-gray-200 hover:border-blue-300"
                  onMouseEnter={() => setActiveFeature(index)}
                  onMouseLeave={() => setActiveFeature(null)}
                >
                  <CardHeader className="p-4 sm:p-6">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-3 sm:mb-4 transition-colors duration-300 ${
                      activeFeature === index 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-blue-100 text-blue-600'
                    }`}>
                      <feature.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <CardTitle className="text-base sm:text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    <CardDescription className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">
                      {feature.description}
                    </CardDescription>
                    <div className="flex items-center text-blue-600 font-medium group-hover:translate-x-1 transition-transform text-sm sm:text-base">
                      Learn more <ArrowRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section - Mobile Optimized */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-3 sm:px-4">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
              Why Choose EasyShip AI?
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 px-2">
              Built specifically for South African importers and first-time shippers
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {BENEFITS.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <benefit.icon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-blue-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                  {benefit.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  {benefit.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Ship in 3 Simple Steps
            </h2>
            <p className="text-xl text-gray-600">
              Our AI assistant guides you through every step
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Get Your Quote
              </h3>
              <p className="text-gray-600 mb-4">
                Enter your shipping details and get instant SARS-compliant quotes with customs duties and VAT calculated
              </p>
              <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50">
                <Calculator className="mr-2 h-4 w-4" />
                Try Calculator
              </Button>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Compare & Book
              </h3>
              <p className="text-gray-600 mb-4">
                Compare live rates from major carriers and book directly with our integrated booking system
              </p>
              <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50">
                <Ship className="mr-2 h-4 w-4" />
                View Carriers
              </Button>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Track & Receive
              </h3>
              <p className="text-gray-600 mb-4">
                Monitor your shipment in real-time from origin port to your doorstep with automatic notifications
              </p>
              <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50">
                <TrendingUp className="mr-2 h-4 w-4" />
                Track Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Start Shipping?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Get your first quote in under 2 minutes with our AI-powered calculator
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/calculator">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg">
                <Calculator className="mr-2 h-5 w-5" />
                Calculate Shipping Cost
              </Button>
            </Link>
            <Link href="/guides">
              <Button 
                variant="outline" 
                size="lg" 
                className="border-blue-300 text-white hover:bg-blue-700 px-8 py-4 text-lg"
              >
                <BookOpen className="mr-2 h-5 w-5" />
                Learn About Shipping
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}