import Anthropic from '@anthropic-ai/sdk';
import { storage } from './storage';

/**
 * AI Service for EasyShip AI Chat Interface
 * Provides conversational AI assistance for shipping, customs, and Incoterms
 */

// Use the latest Claude model for best performance
const DEFAULT_MODEL_STR = "claude-sonnet-4-20250514";

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatContext {
  page?: string;
  userType?: 'first_time' | 'experienced' | 'business';
  currentQuote?: any;
  recentBookings?: any[];
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * System prompt optimized for first-time shipping users
 */
const SYSTEM_PROMPT = `You are EasyShip AI, a friendly and knowledgeable assistant helping people ship containers to South Africa. Your role is to make international shipping simple and understandable for first-time importers.

CORE PERSONALITY:
- Speak in simple, everyday language - avoid technical jargon
- Be patient and encouraging - many users are new to shipping
- Provide step-by-step guidance when possible
- Use real examples to explain concepts
- Focus on South African import requirements (SARS compliance)

EXPERTISE AREAS:
1. INCOTERMS - Explain FOB, CIF, EXW, DDP in plain language with cost implications
2. CUSTOMS PROCESS - South African customs (SARS) procedures, duties, VAT, documentation
3. SHIPPING BASICS - Container types, transit times, carrier selection, booking process
4. DOCUMENTATION - Commercial invoices, bills of lading, import permits, certificates of origin
5. COSTS - Breakdown shipping quotes, explain hidden fees, duty calculations

COMMUNICATION STYLE:
- Always explain WHY something matters to the user
- Give practical examples: "For example, if you're importing electronics from China..."
- Break complex topics into simple steps
- Offer to dive deeper: "Would you like me to explain customs duties in detail?"
- Reference the platform features: "You can use our calculator to estimate costs"

RESTRICTIONS:
- Never give specific tax or legal advice - always suggest consulting professionals
- Don't make promises about shipping times or costs - these can vary
- If you don't know something specific, admit it and suggest reliable sources
- Keep responses focused and actionable

Remember: Your goal is to make shipping feel less overwhelming and more accessible.`;

/**
 * Enhanced prompt for specific shipping contexts
 */
function createContextualPrompt(context: ChatContext, message: string): string {
  let contextualInfo = "";
  
  if (context.page === 'calculator') {
    contextualInfo += "\nCONTEXT: User is on the shipping calculator page. Help them understand quotes, costs, and next steps.";
  } else if (context.page === 'guides') {
    contextualInfo += "\nCONTEXT: User is browsing shipping guides. Provide detailed explanations and educational content.";
  } else if (context.page === 'tracking') {
    contextualInfo += "\nCONTEXT: User is tracking shipments. Help with shipment status, delays, and delivery expectations.";
  } else if (context.page === 'booking') {
    contextualInfo += "\nCONTEXT: User is in the booking process. Guide them through forms, documentation, and requirements.";
  }

  if (context.currentQuote) {
    contextualInfo += `\nCURRENT QUOTE: User has a quote for ${context.currentQuote.containerType} container from ${context.currentQuote.originPort} to ${context.currentQuote.destinationPort} with total cost R${context.currentQuote.totalCost?.toLocaleString()}`;
  }

  return SYSTEM_PROMPT + contextualInfo;
}

/**
 * Generate AI response for chat messages
 */
export async function generateChatResponse(
  message: string,
  conversationHistory: ChatMessage[] = [],
  context: ChatContext = {}
): Promise<string> {
  try {
    // Prepare conversation context
    const messages = [
      ...conversationHistory.slice(-10), // Include last 10 messages for context
      { role: 'user' as const, content: message }
    ];

    const response = await anthropic.messages.create({
      model: DEFAULT_MODEL_STR,
      max_tokens: 1000,
      system: createContextualPrompt(context, message),
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    });

    // Extract text content from response
    const textContent = response.content
      .filter(content => content.type === 'text')
      .map(content => content.text)
      .join('');

    return textContent || "I'm having trouble generating a response right now. Please try asking your question again, or feel free to explore our shipping calculator!";

  } catch (error) {
    console.error('AI Service Error:', error);
    
    // Provide helpful fallback responses based on message content
    return await generateFallbackResponse(message, context);
  }
}

/**
 * Generate helpful fallback responses when AI service is unavailable
 */
async function generateFallbackResponse(message: string, context: ChatContext): Promise<string> {
  const lowerMessage = message.toLowerCase();
  
  // Check if user is asking for a shipping quote
  if (isQuoteRequest(lowerMessage)) {
    return await generateQuoteResponse(message, context, []);
  }
  
  // Incoterms questions
  if (lowerMessage.includes('fob') || lowerMessage.includes('cif') || lowerMessage.includes('incoterm')) {
    return `Great question about Incoterms! These determine who pays for what:

**💰 Cost Impact Example (Shanghai → Durban):**

**FOB**: ~R118,000 total *(You arrange shipping)*
• You pay: Sea freight + insurance + customs + trucking
• Supplier pays: Factory to port in China

**CIF**: ~R69,000 total *(Saves R49,000!)*  
• Supplier pays: Factory to Durban port + shipping + insurance
• You pay: Customs duties + trucking to final destination

**EXW**: ~R123,000 total *(Most expensive)*
• You arrange everything from supplier's factory

**DDP**: ~R68,000 total *(Supplier handles all)*
• Supplier pays everything including SA customs duties

**🎯 Recommendation**: CIF or DDP usually saves money for first-time importers!

Want me to explain how these affect your specific shipment?`;
  }
  
  // Customs questions
  if (lowerMessage.includes('customs') || lowerMessage.includes('duty') || lowerMessage.includes('sars')) {
    return `For South African imports, SARS (tax authority) calculates duties based on:

1. **FOB Value**: The value excluding shipping costs
2. **Import Duty**: Based on your product type (varies by HS code)
3. **VAT**: 15% on FOB value + duties
4. **Processing Fees**: Additional handling charges

Required documents include commercial invoice, bill of lading, and packing list. Our calculator provides SARS-compliant estimates!

Need help with specific duty rates for your products?`;
  }
  
  // Shipping time questions
  if (lowerMessage.includes('how long') || lowerMessage.includes('time') || lowerMessage.includes('days')) {
    return `Typical shipping times to South Africa:

🚢 **From China**: 25-35 days (Shanghai to Durban)
🚢 **From Europe**: 15-25 days (Hamburg to Cape Town)
🚢 **From India**: 10-15 days (Mumbai to Durban)

Plus 2-5 days for customs clearance and 1-3 days for final delivery.

These are estimates - actual times depend on carrier, route, and customs processing. Would you like specific transit information for your route?`;
  }
  
  // Documentation questions
  if (lowerMessage.includes('document') || lowerMessage.includes('paperwork') || lowerMessage.includes('invoice')) {
    return `Essential shipping documents for South Africa:

✅ **Commercial Invoice** - Shows what you bought and its value
✅ **Bill of Lading** - Shipping receipt from the carrier
✅ **Packing List** - Detailed contents breakdown
📋 **Import Permit** - For restricted goods (electronics, food, etc.)
📋 **Certificate of Origin** - For trade agreement benefits

Pro tip: Ensure all documents have matching information to avoid customs delays!

Need help with any specific document?`;
  }

  // Default helpful response
  return `I'm currently experiencing connectivity issues, but I'm here to help with shipping questions!

Common topics I can assist with:
• Incoterms (FOB, CIF, EXW, DDP)
• South African customs and SARS procedures  
• Shipping documentation requirements
• Transit times and carrier selection
• Cost breakdowns and duties

Feel free to explore our shipping calculator for instant quotes, or browse our guides for detailed explanations. What specific shipping question can I help you with?`;
}

/**
 * Check if the message is requesting a shipping quote
 */
function isQuoteRequest(message: string): boolean {
  const quoteKeywords = [
    'quote', 'cost', 'price', 'ship', 'shipping', 'container', 'from', 'to',
    'how much', 'calculate', 'estimate'
  ];
  
  return quoteKeywords.some(keyword => message.includes(keyword)) && 
         (message.includes('from') || message.includes('to'));
}

/**
 * Generate a shipping quote response for intelligent fallback
 */
async function generateQuoteResponse(message: string, context: ChatContext, conversationHistory: ChatMessage[] = []): Promise<string> {
  try {
    // Extract locations and cargo info from the message
    const locations = extractLocations(message);
    const cargoInfo = extractCargoInfo(message);
    
    // Check what information we're missing for a complete quote
    const missingInfo = [];
    if (!locations.origin) missingInfo.push('origin');
    if (!locations.destination) missingInfo.push('destination');
    if (!cargoInfo.value) missingInfo.push('cargo_value');
    if (!cargoInfo.type) missingInfo.push('cargo_type');
    if (!cargoInfo.containerType) missingInfo.push('container_type');
    
    // If we're missing basic info, ask for it conversationally
    if (!locations.origin || !locations.destination) {
      return generateBasicInfoRequest(locations, missingInfo);
    }

    // If we have locations but missing cargo details, ask for those
    if (missingInfo.length > 0) {
      return generateCargoInfoRequest(locations, cargoInfo, missingInfo);
    }

    // Try to find matching ports
    const originPorts = await storage.getOriginPorts();
    const destinationPorts = await storage.getDestinationPorts();
    
    const originPort = findMatchingPort(originPorts, locations.origin);
    const destinationPort = findMatchingPort(destinationPorts, locations.destination);
    
    if (!originPort || !destinationPort) {
      return `I can help with a quote for shipping ${locations.cargo || 'cargo'} from ${locations.origin} to ${locations.destination}!

For the most accurate quote, I'll need to know:
• **Container type**: 20ft container, 40ft container, or partial shipment?
• **Cargo value**: Approximate value in USD (for customs calculations)
• **Cargo type**: Electronics, textiles, machinery, etc.

Use our shipping calculator for instant quotes with SARS-compliant customs calculations. The calculator covers major routes and provides detailed cost breakdowns including duties and VAT.`;
    }

    // Generate a detailed quote response with conversational tone
    const cargoDescription = locations.cargo || 'cargo';
    return `Perfect! Here's your estimated quote for shipping ${cargoDescription}:

🚢 **${originPort.name} → ${destinationPort.name}**

**💰 Cost Breakdown:**
• **20ft Container**: ~R53,000 total
  - Sea freight: R45,000 - R55,000
  - Trucking: R8,000 - R12,000
  - Customs duties: Varies by product
  - VAT (15%): On FOB value + duties

• **40ft Container**: ~R70,000 total
  - Sea freight: R60,000 - R75,000  
  - Trucking: R10,000 - R15,000
  - Customs duties: Varies by product

**⏱️ Timeline**: 25-35 days port-to-port + 2-5 days customs

**💡 Next Steps:**
To get exact pricing with customs calculations, I'll need:
• **Cargo value** (in USD) - determines your duties
• **Product type** - affects duty rates (0% to 45%)
• **Preferred Incoterm** - FOB saves ~R20,000 vs CIF

Want me to walk you through these details for a precise quote?`;

  } catch (error) {
    console.error('Error generating quote response:', error);
    return `I'd love to help with your shipping quote! For the most accurate pricing from ${extractBasicLocation(message)}, please use our shipping calculator where you can:

• Select exact origin and destination ports
• Choose container type (20ft/40ft/partial)
• Get SARS-compliant customs duty calculations
• Compare different Incoterms (FOB, CIF, etc.)

The calculator provides instant quotes with full cost breakdowns including sea freight, trucking, duties, and VAT!`;
  }
}

/**
 * Generate basic info request when missing origin/destination
 */
function generateBasicInfoRequest(locations: any, missingInfo: string[]): string {
  let response = "I'd love to help you get a shipping quote! ";
  
  if (!locations.origin && !locations.destination) {
    response += "To get you an accurate quote, I need to know:\n\n";
    response += "📍 **Where are you shipping from?** (e.g., Shanghai, China or New York, USA)\n";
    response += "📍 **Where in South Africa?** (Johannesburg, Cape Town, or Durban)\n\n";
    response += "Once I have these details, I can provide specific port-to-port pricing!";
  } else if (!locations.origin) {
    response += `Great! I see you want to ship to ${locations.destination}. \n\n`;
    response += "📍 **Where are you shipping from?** (city and country)\n\n";
    response += "This helps me find the best shipping routes and carriers for you.";
  } else if (!locations.destination) {
    response += `Perfect! Shipping from ${locations.origin}. \n\n`;
    response += "📍 **Where in South Africa?** (Johannesburg, Cape Town, or Durban are our main ports)\n\n";
    response += "Each port has different trucking costs to final destinations.";
  }
  
  return response;
}

/**
 * Generate cargo info request when missing details for customs calculation
 */
function generateCargoInfoRequest(locations: any, cargoInfo: any, missingInfo: string[]): string {
  let response = `Great! Shipping from ${locations.origin} to ${locations.destination}. `;
  
  if (cargoInfo.type) {
    response += `I see you're shipping ${cargoInfo.type}. `;
  }
  
  response += "To calculate your customs duties and get an exact quote, I need a few more details:\n\n";
  
  if (missingInfo.includes('cargo_value')) {
    response += "💰 **What's the approximate value of your goods?** (in USD)\n";
    response += "   This determines your customs duties and VAT calculations\n\n";
  }
  
  if (missingInfo.includes('container_type')) {
    response += "📦 **Container size?**\n";
    response += "   • 20ft container (small loads, ~28 tons max)\n";
    response += "   • 40ft container (larger loads, ~26 tons max)\n";
    response += "   • Partial shipment (share space, cheaper for small loads)\n\n";
  }
  
  if (missingInfo.includes('cargo_type') && !cargoInfo.type) {
    response += "📋 **What type of goods?** (electronics, textiles, machinery, etc.)\n";
    response += "   Different products have different duty rates\n\n";
  }
  
  response += "These details help me calculate your exact costs including SARS duties and VAT!";
  return response;
}

/**
 * Extract cargo information from message
 */
function extractCargoInfo(message: string): { 
  type?: string; 
  value?: string; 
  containerType?: string;
  weight?: string;
} {
  const lowerMessage = message.toLowerCase();
  
  // Extract cargo type
  const cargoPatterns = [
    /(?:container of|shipping)\s+([^,\s]+(?:\s+[^,\s]+)*?)(?:\s+from|\s+to|$)/,
    /(?:import|importing)\s+([^,\s]+(?:\s+[^,\s]+)*?)(?:\s+from|\s+to|$)/,
    /(electronics|textiles|machinery|furniture|clothes|shoes|toys|books|food)/
  ];
  
  let cargoType;
  for (const pattern of cargoPatterns) {
    const match = lowerMessage.match(pattern);
    if (match) {
      cargoType = match[1]?.trim();
      break;
    }
  }
  
  // Extract value
  const valueMatch = lowerMessage.match(/(?:worth|value|cost)\s*[\$]?([0-9,]+)/);
  const value = valueMatch?.[1];
  
  // Extract container type
  let containerType;
  if (lowerMessage.includes('20ft') || lowerMessage.includes('20 ft')) {
    containerType = '20ft';
  } else if (lowerMessage.includes('40ft') || lowerMessage.includes('40 ft')) {
    containerType = '40ft';
  } else if (lowerMessage.includes('partial') || lowerMessage.includes('lcl') || lowerMessage.includes('shared')) {
    containerType = 'partial';
  }
  
  // Extract weight
  const weightMatch = lowerMessage.match(/([0-9,]+)\s*(?:kg|kilos|tons?|tonnes?)/);
  const weight = weightMatch?.[1];
  
  return {
    type: cargoType,
    value: value,
    containerType: containerType,
    weight: weight
  };
}

/**
 * Extract origin and destination locations from message
 */
function extractLocations(message: string): { origin?: string; destination?: string; cargo?: string } {
  const lowerMessage = message.toLowerCase();
  
  // Common patterns for locations
  const fromMatch = lowerMessage.match(/from\s+([^,\s]+(?:\s+[^,\s]+)*?)(?:\s+to|\s*,|$)/);
  const toMatch = lowerMessage.match(/to\s+([^,\s]+(?:\s+[^,\s]+)*?)(?:\s*,|$)/);
  
  // Extract cargo type
  const cargoMatch = lowerMessage.match(/(?:container of|shipping)\s+([^,\s]+(?:\s+[^,\s]+)*?)(?:\s+from|\s+to|$)/);
  
  return {
    origin: fromMatch?.[1]?.trim(),
    destination: toMatch?.[1]?.trim(),
    cargo: cargoMatch?.[1]?.trim()
  };
}

/**
 * Find matching port from list based on location string
 */
function findMatchingPort(ports: any[], location: string): any {
  if (!location) return null;
  
  const lowerLocation = location.toLowerCase();
  
  // Direct name matches
  for (const port of ports) {
    if (port.name.toLowerCase().includes(lowerLocation) || 
        lowerLocation.includes(port.name.toLowerCase())) {
      return port;
    }
  }
  
  // Country/region matches
  const locationMappings: Record<string, string[]> = {
    'china': ['shanghai', 'ningbo', 'qingdao', 'tianjin'],
    'usa': ['new york', 'los angeles', 'long beach'],
    'europe': ['hamburg', 'rotterdam', 'antwerp'],
    'india': ['mumbai', 'chennai', 'kolkata'],
    'cape town': ['cape town'],
    'johannesburg': ['johannesburg'],
    'durban': ['durban']
  };
  
  for (const [region, cities] of Object.entries(locationMappings)) {
    if (lowerLocation.includes(region)) {
      for (const city of cities) {
        const port = ports.find(p => p.name.toLowerCase().includes(city));
        if (port) return port;
      }
    }
  }
  
  return null;
}

/**
 * Extract basic location info when detailed extraction fails
 */
function extractBasicLocation(message: string): string {
  const fromMatch = message.match(/from\s+([^,\s]+)/i);
  const toMatch = message.match(/to\s+([^,\s]+)/i);
  
  if (fromMatch && toMatch) {
    return `${fromMatch[1]} to ${toMatch[1]}`;
  }
  return 'your origin to South Africa';
}

/**
 * Analyze message intent for routing and context
 */
export function analyzeMessageIntent(message: string): {
  category: 'incoterms' | 'customs' | 'documentation' | 'pricing' | 'timing' | 'general';
  confidence: number;
  suggestedActions: string[];
} {
  const lowerMessage = message.toLowerCase();
  
  // Incoterms detection
  if (lowerMessage.match(/\b(fob|cif|exw|ddp|incoterm)/)) {
    return {
      category: 'incoterms',
      confidence: 0.9,
      suggestedActions: ['Visit our Incoterms guide', 'Use the calculator with different Incoterms']
    };
  }
  
  // Customs detection
  if (lowerMessage.match(/\b(customs?|duty|duties|sars|vat|tax)/)) {
    return {
      category: 'customs',
      confidence: 0.85,
      suggestedActions: ['Check our customs guide', 'Use the calculator for duty estimates']
    };
  }
  
  // Documentation detection
  if (lowerMessage.match(/\b(document|invoice|bill of lading|permit|certificate)/)) {
    return {
      category: 'documentation',
      confidence: 0.8,
      suggestedActions: ['Review our documentation checklist', 'Download document templates']
    };
  }
  
  // Pricing detection
  if (lowerMessage.match(/\b(cost|price|expensive|cheap|quote|rate)/)) {
    return {
      category: 'pricing',
      confidence: 0.75,
      suggestedActions: ['Get a quote with our calculator', 'Compare carrier rates']
    };
  }
  
  // Timing detection
  if (lowerMessage.match(/\b(time|long|fast|slow|days|weeks|transit)/)) {
    return {
      category: 'timing',
      confidence: 0.7,
      suggestedActions: ['Check transit times in calculator', 'Track existing shipments']
    };
  }
  
  return {
    category: 'general',
    confidence: 0.5,
    suggestedActions: ['Try our shipping calculator', 'Browse our guides section']
  };
}