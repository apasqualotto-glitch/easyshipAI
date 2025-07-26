import Anthropic from '@anthropic-ai/sdk';

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
    return generateFallbackResponse(message, context);
  }
}

/**
 * Generate helpful fallback responses when AI service is unavailable
 */
function generateFallbackResponse(message: string, context: ChatContext): string {
  const lowerMessage = message.toLowerCase();
  
  // Incoterms questions
  if (lowerMessage.includes('fob') || lowerMessage.includes('cif') || lowerMessage.includes('incoterm')) {
    return `Great question about Incoterms! Here's a quick overview:

**FOB (Free on Board)**: You pay for shipping from the port. The supplier covers costs to get goods to their local port, then you handle the rest.

**CIF (Cost, Insurance, Freight)**: The supplier pays for shipping and insurance to your destination port. You handle customs and final delivery.

**EXW (Ex Works)**: You arrange everything from the supplier's location.

**DDP (Delivered Duty Paid)**: Supplier handles everything including customs duties.

For detailed explanations with examples, check out our Guides section! Would you like me to explain any specific Incoterm?`;
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