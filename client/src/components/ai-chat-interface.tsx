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
  Calculator,
  RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatContext } from "@/contexts/chat-context";

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
  onReset?: () => void; // Callback for reset functionality
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

export function AIChatInterface({ className, context, onExtractedData, onReset }: AIChatInterfaceProps) {
  const { conversationId, setConversationId } = useChatContext();
  const [isExpanded, setIsExpanded] = useState(true); // Always expanded on calculator page
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: context === "homepage" || context === "calculator" 
        ? "👋 Hi! I'm your shipping assistant. Tell me about your shipment and I'll provide a comprehensive quote with full customs and VAT breakdown, then automatically fill in the calculator form below for more detailed quotes!"
        : "👋 Welcome to EasyShip AI! I'm here to help you understand container shipping, customs, and Incoterms in simple terms. What would you like to know?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // Removed messagesEndRef to prevent auto-scrolling

  // Remove auto-scroll to prevent page jumping
  // Users can manually scroll if needed

  // Reset function to clear chat conversation
  const resetChat = () => {
    setMessages([{
      id: '1',
      role: 'assistant',
      content: context === "homepage" || context === "calculator" 
        ? "👋 Hi! I'm your shipping assistant. Tell me about your shipment and I'll provide a comprehensive quote with full customs and VAT breakdown, then automatically fill in the calculator form below for more detailed quotes!"
        : "👋 Welcome to EasyShip AI! I'm here to help you understand container shipping, customs, and Incoterms in simple terms. What would you like to know?",
      timestamp: new Date()
    }]);
    setInputMessage("");
    setIsLoading(false);
    
    // Call parent reset callback if provided
    if (onReset) {
      onReset();
    }
  };

  // Port code to ID mapping based on database
  const portCodeToId: Record<string, string> = {
    'CNSHA': '1',   // Shanghai
    'CNNGB': '2',   // Ningbo
    'CNTXG': '3',   // Tianjin
    'CNSZX': '16',  // Shenzhen
    'CNQIN': '17',  // Qingdao
    'DEHAM': '4',   // Hamburg
    'NLRTM': '5',   // Rotterdam
    'GBFXT': '6',   // Felixstowe
    'BEANR': '20',  // Antwerp
    'INMUN': '7',   // Mumbai
    'SGSIN': '8',   // Singapore
    'USLAX': '32',  // Los Angeles
    'USNYC': '34',  // New York
    'ZACPT': '10',  // Cape Town
    'ZADUR': '9',   // Durban
    'ZAPEZ': '11',  // Port Elizabeth
  };

  // Extract helper functions
  const getOriginPortId = (msg: string) => {
    const lower = msg.toLowerCase();
    console.log(`🔍 Extracting origin from: "${lower}"`);
    
    // Check if this is an export FROM SA
    const isExport = lower.includes('export') || lower.includes('from south africa') || 
                    lower.includes('from sa') || lower.includes('from cape town') || 
                    lower.includes('from durban');
    
    console.log(`📦 Is export: ${isExport}`);
    
    if (isExport) {
      // For exports, origin is SA ports
      if (lower.includes('cape town') || lower.includes('cpt')) return '10';
      if (lower.includes('durban') || lower.includes('dbn')) return '9';
      if (lower.includes('port elizabeth') || lower.includes('gqeberha') || lower.includes('pe')) return '11';
      if (lower.includes('richards bay')) return '12';
      if (lower.includes('east london')) return '13';
      // Default to Cape Town for exports
      if (lower.includes('south africa') || lower.includes('from sa')) return '10';
    } else {
      // For imports, origin is international ports
      // Major Chinese ports (check first to prioritize specific matches)
      if (lower.includes('shanghai')) {
        console.log(`✅ Found Shanghai, returning ID: 1`);
        return '1';
      }
      if (lower.includes('shenzhen') || lower.includes('yantian')) return '16';
      if (lower.includes('ningbo')) return '2';
      if (lower.includes('qingdao')) return '17';
      if (lower.includes('tianjin')) return '3';
      if (lower.includes('china') && !lower.includes('specific')) return '1'; // Default to Shanghai for China
      
      // Major US ports
      if (lower.includes('houston') || lower.includes('hou')) return '40'; // Houston
      if (lower.includes('new york') || lower.includes('ny')) return '34';
      if (lower.includes('los angeles') || lower.includes('la')) {
        console.log(`⚠️ Found Los Angeles, returning ID: 32`);
        return '32';
      }
      if (lower.includes('miami')) return '35';
      if (lower.includes('usa') || lower.includes('america')) return '34'; // Default to New York for USA
      
      // European ports
      if (lower.includes('hamburg') || lower.includes('germany')) return '4';
      if (lower.includes('rotterdam') || lower.includes('netherlands')) return '5';
      if (lower.includes('antwerp') || lower.includes('belgium')) return '20';
      if (lower.includes('felixstowe') || lower.includes('uk') || lower.includes('england')) return '6';
      if (lower.includes('europe') && !lower.includes('specific')) return '4'; // Default to Hamburg for Europe
      
      // Other major ports
      if (lower.includes('singapore')) return '8';
      if (lower.includes('mumbai') || lower.includes('india')) return '7';
      if (lower.includes('jebel ali') || lower.includes('dubai') || lower.includes('uae')) return '38';
    }
    
    return '';
  };

  const getDestinationPortId = (msg: string) => {
    const lower = msg.toLowerCase();
    
    // Check if this is an export (FROM SA) or import (TO SA) based on context
    const isExport = lower.includes('export') || lower.includes('from south africa') || 
                    lower.includes('from sa') || lower.includes('from cape town') || 
                    lower.includes('from durban') || lower.includes('from johannesburg');
    
    if (isExport) {
      // For exports, destination can be international ports
      // US destinations
      if (lower.includes('houston') || lower.includes('hou')) return '40'; // Houston
      if (lower.includes('new york') || lower.includes('ny')) return '34';
      if (lower.includes('los angeles') || lower.includes('la')) return '32';
      if (lower.includes('miami')) return '35';
      
      // Chinese destinations
      if (lower.includes('shanghai')) return '1';
      if (lower.includes('shenzhen')) return '16';
      if (lower.includes('ningbo')) return '2';
      if (lower.includes('qingdao')) return '17';
      
      // European destinations
      if (lower.includes('hamburg') || lower.includes('germany')) return '4';
      if (lower.includes('rotterdam') || lower.includes('netherlands')) return '5';
      if (lower.includes('antwerp') || lower.includes('belgium')) return '20';
      if (lower.includes('felixstowe') || lower.includes('uk')) return '6';
      
      // Other destinations
      if (lower.includes('singapore')) return '8';
      if (lower.includes('mumbai') || lower.includes('india')) return '7';
      if (lower.includes('jebel ali') || lower.includes('dubai') || lower.includes('uae')) return '38';
    } else {
      // For imports, destination is SA ports
      if (lower.includes('cape town') || lower.includes('cpt')) return '10';
      if (lower.includes('durban') || lower.includes('dbn')) return '9';
      if (lower.includes('port elizabeth') || lower.includes('gqeberha') || lower.includes('pe')) return '11';
      if (lower.includes('richards bay')) return '12';
      if (lower.includes('east london')) return '13';
      // Default to Durban if South Africa is mentioned but no specific port
      if (lower.includes('south africa') || lower.includes(' sa')) return '9';
    }
    
    return '';
  };

  const getFinalDestinationName = (msg: string) => {
    const lower = msg.toLowerCase();
    if (lower.includes('cape town') || lower.includes('cpt')) return 'Cape Town, Western Cape';
    if (lower.includes('durban') || lower.includes('dbn')) return 'Durban, KwaZulu-Natal';
    if (lower.includes('johannesburg') || lower.includes('joburg') || lower.includes('jozi')) return 'Johannesburg, Gauteng';
    if (lower.includes('pretoria') || lower.includes('pta')) return 'Pretoria, Gauteng';
    if (lower.includes('port elizabeth') || lower.includes('gqeberha') || lower.includes('pe')) return 'Port Elizabeth, Eastern Cape';
    if (lower.includes('bloemfontein')) return 'Bloemfontein, Free State';
    if (lower.includes('east london')) return 'East London, Eastern Cape';
    if (lower.includes('polokwane')) return 'Polokwane, Limpopo';
    if (lower.includes('nelspruit') || lower.includes('mbombela')) return 'Nelspruit, Mpumalanga';
    if (lower.includes('kimberley')) return 'Kimberley, Northern Cape';
    if (lower.includes('mafikeng')) return 'Mafikeng, North West';
    if (lower.includes('pietermaritzburg')) return 'Pietermaritzburg, KwaZulu-Natal';
    return '';
  };

  const getContainerType = (msg: string) => {
    const lower = msg.toLowerCase();
    // Container size variations
    if (lower.includes('40ft') || lower.includes('40 ft') || lower.includes('forty foot') || lower.includes('40-foot')) return '40ft';
    if (lower.includes('40ft-hc') || lower.includes('40 hc') || lower.includes('high cube') || lower.includes('hc')) return '40ft-hc';
    if (lower.includes('20ft') || lower.includes('20 ft') || lower.includes('twenty foot') || lower.includes('20-foot')) return '20ft';
    if (lower.includes('partial') || lower.includes('shared') || lower.includes('lcl') || lower.includes('less than container')) return 'partial';
    
    // Default based on context clues
    if (lower.includes('large') || lower.includes('big')) return '40ft';
    if (lower.includes('small') || lower.includes('few items')) return '20ft';
    
    return '';
  };

  const getCargoValue = (msg: string) => {
    const lower = msg.toLowerCase();
    
    // USD formats
    const usdMatch = lower.match(/\$(\d+[,\d]*)|(\d+[,\d]*)\s*(?:usd|dollars?)/);
    if (usdMatch) {
      const value = usdMatch[1] || usdMatch[2];
      return parseInt(value.replace(/,/g, ''));
    }
    
    // Rand formats (convert to USD approximation)
    const randMatch = lower.match(/r(\d+[,\d]*)|(\d+[,\d]*)\s*(?:rand|zar)/);
    if (randMatch) {
      const value = randMatch[1] || randMatch[2];
      const randValue = parseInt(value.replace(/,/g, ''));
      return Math.round(randValue / 18); // Approximate USD conversion
    }
    
    // General number patterns for value
    const valueMatch = lower.match(/(?:worth|value|cost)\s*(?:of\s*)?(?:\$|r)?(\d+[,\d]*)/);
    if (valueMatch) return parseInt(valueMatch[1].replace(/,/g, ''));
    
    // Common value ranges mentioned
    if (lower.includes('thousand')) {
      const numMatch = lower.match(/(\d+)\s*thousand/);
      if (numMatch) return parseInt(numMatch[1]) * 1000;
    }
    
    return 0;
  };

  const getWeight = (msg: string) => {
    const lower = msg.toLowerCase();
    
    // Weight patterns in kg
    const kgMatch = lower.match(/(\d+[,\d]*)\s*(?:kg|kilograms?)/);
    if (kgMatch) {
      const weight = parseInt(kgMatch[1].replace(/,/g, ''));
      console.log(`🏋️ Extracted weight: ${weight} kg from "${kgMatch[0]}"`);
      return weight;
    }
    
    // Weight patterns in tons (convert to kg)
    const tonMatch = lower.match(/(\d+[,\d]*)\s*(?:tons?|tonnes?)/);
    if (tonMatch) {
      const tons = parseInt(tonMatch[1].replace(/,/g, ''));
      const weightInKg = tons * 1000;
      console.log(`🏋️ Extracted weight: ${tons} tons = ${weightInKg} kg from "${tonMatch[0]}"`);
      return weightInKg;
    }
    
    // Weight patterns in pounds (convert to kg)
    const lbMatch = lower.match(/(\d+[,\d]*)\s*(?:lbs?|pounds?)/);
    if (lbMatch) {
      const pounds = parseInt(lbMatch[1].replace(/,/g, ''));
      const weightInKg = Math.round(pounds * 0.453592);
      console.log(`🏋️ Extracted weight: ${pounds} lbs = ${weightInKg} kg from "${lbMatch[0]}"`);
      return weightInKg;
    }
    
    return 0;
  };

  const getCargoType = (msg: string) => {
    const lower = msg.toLowerCase();
    
    // Electronics & Technology
    if (lower.includes('electronics') || lower.includes('phones') || lower.includes('computers') || 
        lower.includes('laptops') || lower.includes('tablets') || lower.includes('gadgets')) return 'electronics';
    
    // Textiles & Clothing
    if (lower.includes('shoes') || lower.includes('footwear') || lower.includes('clothing') || 
        lower.includes('textiles') || lower.includes('apparel') || lower.includes('garments') ||
        lower.includes('fashion') || lower.includes('shirts') || lower.includes('pants')) return 'textiles';
    
    // Machinery & Equipment
    if (lower.includes('machinery') || lower.includes('equipment') || lower.includes('tools') || 
        lower.includes('industrial') || lower.includes('motor') || lower.includes('engine')) return 'machinery';
    
    // Food & Agricultural
    if (lower.includes('food') || lower.includes('agricultural') || lower.includes('grain') || 
        lower.includes('coffee') || lower.includes('tea') || lower.includes('spices')) return 'food';
    
    // Medical & Healthcare
    if (lower.includes('medical') || lower.includes('pharmaceutical') || lower.includes('healthcare') || 
        lower.includes('medicine') || lower.includes('drugs')) return 'medical';
    
    // Automotive
    if (lower.includes('automotive') || lower.includes('car parts') || lower.includes('vehicle') || 
        lower.includes('auto')) return 'automotive';
    
    // Furniture & Home
    if (lower.includes('furniture') || lower.includes('home goods') || lower.includes('appliances')) return 'furniture';
    
    // Default to general cargo
    return 'general';
  };

  const getIncoterm = (msg: string) => {
    const lower = msg.toLowerCase();
    
    // Exact matches
    if (lower.includes('fob') || lower.includes('free on board')) return 'FOB';
    if (lower.includes('cif') || lower.includes('cost insurance freight')) return 'CIF';
    if (lower.includes('ddp') || lower.includes('delivered duty paid')) return 'DDP';
    if (lower.includes('exw') || lower.includes('ex works')) return 'EXW';
    
    // Context-based detection
    if (lower.includes('seller pays shipping') || lower.includes('door to door')) return 'DDP';
    if (lower.includes('buyer arranges shipping') || lower.includes('pick up from factory')) return 'EXW';
    if (lower.includes('insurance included') && lower.includes('freight')) return 'CIF';
    if (lower.includes('free on board') || lower.includes('buyer pays from port')) return 'FOB';
    
    return '';
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
          conversationHistory: messages.slice(-5), // Send last 5 messages for context
          conversationId: conversationId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      
      // Save conversation ID if returned
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
      }
      
      // Enhanced shipping detection and estimation
      const fullConversation = messages.map(m => m.content).concat(messageContent).join(' ');
      
      const hasOrigin = getOriginPortId(fullConversation) !== '';
      const hasDestination = getDestinationPortId(fullConversation) !== '';
      const hasContainer = getContainerType(fullConversation) !== '';
      const hasValue = getCargoValue(fullConversation) > 0;
      const hasCargo = getCargoType(fullConversation) !== '' && getCargoType(fullConversation) !== 'general';
      
      const hasSufficientInfo = hasOrigin && hasDestination;
      const isCompleteShippingRequest = hasSufficientInfo && (hasContainer || hasValue);
      
      // Only generate estimate if we have ALL required information from user
      let estimateText = "";
      const missingInfo = [];
      
      if (hasOrigin && hasDestination) {
        const originId = getOriginPortId(fullConversation);
        const destId = getDestinationPortId(fullConversation);
        const containerType = getContainerType(fullConversation);
        const cargoValue = getCargoValue(fullConversation);
        const cargoType = getCargoType(fullConversation);
        
        const weight = getWeight(fullConversation);
        
        // Check for missing required information
        if (!containerType) missingInfo.push("container size (20ft, 40ft, or 40ft-hc)");
        if (cargoValue === 0) missingInfo.push("cargo value in USD");
        if (weight === 0) missingInfo.push("cargo weight (kg or tons)");
        
        // Only generate estimate if we have all required info
        if (missingInfo.length === 0) {
          // Quick calculation based on common routes - using only user-provided data
          const routeEstimates: Record<string, Record<string, number>> = {
            '1': { '9': 48500, '10': 51000, '11': 49500 }, // Shanghai
            '4': { '9': 42000, '10': 40000, '11': 43000 }, // Hamburg  
            '34': { '9': 40000, '10': 43000, '11': 41000 }, // New York
            '40': { '9': 39000, '10': 42000, '11': 40000 }, // Houston
          };
          
          const seaFreight = routeEstimates[originId]?.[destId] || 45000;
          const containerMultiplier = containerType === '40ft' ? 1.3 : containerType === '40ft-hc' ? 1.35 : 1;
          const adjustedSeaFreight = Math.round(seaFreight * containerMultiplier);
          
          const trucking = destId === '10' ? 1000 : destId === '9' ? 1000 : 6000; // Cape Town/Durban vs inland
          const customsDuty = Math.round(cargoValue * (cargoType === 'textiles' ? 0.45 : cargoType === 'electronics' ? 0.20 : 0.15));
          const vat = Math.round((cargoValue + customsDuty) * 0.15);
          const handling = 3500;
          
          const total = adjustedSeaFreight + trucking + customsDuty + vat + handling;
          
          estimateText = `\n\n💰 **Quick Estimate**: R${total.toLocaleString()} total\n• Sea freight (${containerType}): R${adjustedSeaFreight.toLocaleString()}\n• Trucking: R${trucking.toLocaleString()}\n• Customs & VAT: R${(customsDuty + vat).toLocaleString()}\n• Handling: R${handling.toLocaleString()}`;
        } else {
          // Ask for missing information
          estimateText = `\n\n❓ **To provide an accurate quote, I need:**\n• ${missingInfo.join('\n• ')}\n\nPlease provide this information and I'll calculate your exact shipping cost.`;
        }
      }

      // Add calculator suggestion for relevant shipping queries
      let aiResponse = data.response + estimateText;

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
      
      // Trigger actual quote calculation for complete requests
      if (isCompleteShippingRequest && missingInfo.length === 0) {
        aiResponse += "\n\n📊 **Generating your detailed quote now...** You'll be redirected to the full quote page in a moment.";
        
        // Trigger actual quote calculation after a short delay
        setTimeout(async () => {
          try {
            const quoteRequest = {
              originPort: getOriginPortId(fullConversation),
              destinationPort: getDestinationPortId(fullConversation),
              deliveryAddress: getFinalDestinationName(fullConversation) || "Cape Town, Western Cape",
              containerType: getContainerType(fullConversation),
              cargoType: getCargoType(fullConversation) || "general",
              incoterm: getIncoterm(fullConversation) || "FOB",
              weight: getWeight(fullConversation),
              value: getCargoValue(fullConversation),
            };

            const response = await fetch("/api/calculate-quote-with-live", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(quoteRequest),
            });

            if (response.ok) {
              const quoteResult = await response.json();
              
              // Store quote and navigate to results page
              sessionStorage.setItem('latestQuote', JSON.stringify(quoteResult));
              window.location.href = '/quote/latest';
            }
          } catch (error) {
            console.error("Failed to generate quote:", error);
          }
        }, 2000);
      } else if (hasSufficientInfo) {
        aiResponse += "\n\n📊 **Almost ready for your detailed quote!** I'll generate it once you provide all the required information.";
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
        // Extract from the entire conversation context for better accuracy
        const fullConversation = messages.map(m => m.content).concat(messageContent).join(' ');
        const extractedData: Partial<any> = {};
        
        const originId = getOriginPortId(fullConversation);
        if (originId) extractedData.originPort = originId;
        
        const destId = getDestinationPortId(fullConversation);
        if (destId) {
          extractedData.destinationPort = destId;
          const finalDest = getFinalDestinationName(fullConversation);
          if (finalDest) extractedData.finalDestination = finalDest;
        }
        
        const container = getContainerType(fullConversation);
        if (container) extractedData.containerType = container;
        
        const value = getCargoValue(fullConversation);
        if (value > 0) extractedData.value = value;
        
        const weight = getWeight(fullConversation);
        if (weight > 0) extractedData.weight = weight;
        
        const incoterm = getIncoterm(fullConversation);
        if (incoterm) extractedData.incoterm = incoterm;
        
        const cargoType = getCargoType(fullConversation);
        if (cargoType) {
          extractedData.cargoType = cargoType;
          
          // Add a message to help with HS code selection
          setTimeout(() => {
            const hsCodeHelpMessage: ChatMessage = {
              id: (Date.now() + 3).toString(),
              role: 'assistant',
              content: `📦 **I noticed you're shipping ${cargoType}.** To get the most accurate customs calculation:\n\n• Use the cargo search field to find your specific product's HS code\n• Type keywords like "${cargoType === 'textiles' ? 'running shoes' : cargoType === 'electronics' ? 'smartphones' : cargoType}" to see options\n• The HS code determines your exact duty rate (varies from 0% to 45%)\n\nWould you like me to help you find the right HS code for your specific items?`,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, hsCodeHelpMessage]);
          }, 2000);
        }
        
        console.log('🔍 Extracted data from conversation:', extractedData);
        
        if (Object.keys(extractedData).length > 0) {
          onExtractedData(extractedData);
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
            context === "calculator" || context === "homepage" ? "" : "cursor-pointer hover:bg-gray-50"
          )}
          onClick={() => context !== "calculator" && context !== "homepage" && setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">EasyShip AI Assistant</CardTitle>
                <p className="text-sm text-gray-600">
                  {context === "homepage" || context === "calculator" 
                    ? "Chat with me and I'll auto-fill the calculator form below" 
                    : "Get help with shipping, customs, and Incoterms"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={resetChat}
                className="text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                title="Reset conversation and form"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <div className="w-2 h-2 bg-green-600 rounded-full mr-1"></div>
                Online
              </Badge>
              {context !== "calculator" && context !== "homepage" && (
                isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )
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
                      className="justify-start h-auto p-2 text-left hover:bg-blue-50 hover:border-blue-300"
                      onClick={() => handleQuickQuestion(item.question)}
                    >
                      <item.icon className="h-3 w-3 mr-2 text-blue-600 flex-shrink-0" />
                      <div>
                        <div className="font-medium text-xs">{item.question}</div>
                        <div className="text-xs text-gray-500">{item.category}</div>
                      </div>
                    </Button>
                  ))}
                </div>
                <Separator className="my-4" />
              </div>
            )}

            {/* Chat Messages - Shorter height on calculator/homepage */}
            <ScrollArea className={cn(
              "mb-4",
              context === "calculator" || context === "homepage" ? "h-64" : "h-96"
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
                      "max-w-[95%] p-5 rounded-lg",
                      message.role === 'user' 
                        ? "bg-blue-600 text-white" 
                        : "bg-gray-100 text-gray-900"
                    )}>
                      <p className="text-base whitespace-pre-wrap leading-relaxed">{message.content}</p>

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
              {/* Removed auto-scroll reference */}
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
              {context === "homepage" || context === "calculator" 
                ? "💡 Tip: Tell me your shipping details like 'ship electronics from China to Cape Town' and I'll provide a comprehensive quote and auto-fill the form"
                : "💡 Tip: Ask specific questions like 'What documents do I need?' or 'Explain FOB pricing'"}
            </div>
          </CardContent>
        )}
      </Card>
      

    </div>
  );
}